const { logActivity, hashDNI } = require('./logActivity');
const pool = require('../config/database');

const failedAttempts = new Map();
const MAX_ATTEMPTS = 3;
const BLOCK_MINUTES = 5;
const BLOCK_DURATION_MS = BLOCK_MINUTES * 60 * 1000;
const useSharedAttempts = process.env.CEINCO_VERCEL_RUNTIME === '1' || process.env.CEINCO_SHARED_LOGIN === '1';

async function checkBlock(dni) {
    const key = hashDNI(dni);
    if (useSharedAttempts) {
        const [[row]] = await pool.query(
            `SELECT CEIL(EXTRACT(EPOCH FROM (BLOQUEADO_HASTA - NOW())) / 60) AS minutos
             FROM INTENTOS_LOGIN WHERE DNI_HASH = ? AND BLOQUEADO_HASTA > NOW()`, [key]
        );
        return row ? { blocked: true, remainingTime: Number(row.minutos) } : { blocked: false };
    }

    const attempt = failedAttempts.get(key);
    const now = Date.now();
    if (attempt?.blockedUntil > now) {
        return { blocked: true, remainingTime: Math.ceil((attempt.blockedUntil - now) / 60000) };
    }
    if (attempt?.blockedUntil && attempt.blockedUntil <= now) failedAttempts.delete(key);
    return { blocked: false };
}

async function registerFailure(key) {
    if (useSharedAttempts) {
        const [[result]] = await pool.query(
            `WITH intento AS (
                INSERT INTO INTENTOS_LOGIN (DNI_HASH, INTENTOS, ACTUALIZADO)
                VALUES (?, 1, NOW())
                ON CONFLICT (DNI_HASH) DO UPDATE SET
                    INTENTOS = CASE
                        WHEN INTENTOS_LOGIN.BLOQUEADO_HASTA > NOW() THEN INTENTOS_LOGIN.INTENTOS
                        WHEN INTENTOS_LOGIN.ACTUALIZADO <= NOW() - INTERVAL '5 minutes'
                             OR INTENTOS_LOGIN.BLOQUEADO_HASTA <= NOW() THEN 1
                        ELSE INTENTOS_LOGIN.INTENTOS + 1 END,
                    BLOQUEADO_HASTA = CASE
                        WHEN INTENTOS_LOGIN.BLOQUEADO_HASTA > NOW() THEN INTENTOS_LOGIN.BLOQUEADO_HASTA
                        WHEN INTENTOS_LOGIN.BLOQUEADO_HASTA IS NULL
                             AND INTENTOS_LOGIN.ACTUALIZADO > NOW() - INTERVAL '5 minutes'
                             AND INTENTOS_LOGIN.INTENTOS + 1 >= ? THEN NOW() + INTERVAL '5 minutes'
                        ELSE NULL END,
                    ACTUALIZADO = NOW()
                RETURNING INTENTOS, BLOQUEADO_HASTA
            )
            SELECT INTENTOS AS count, BLOQUEADO_HASTA > NOW() AS blocked FROM intento`, [key, MAX_ATTEMPTS]
        );
        return result;
    }

    const previous = failedAttempts.get(key);
    const count = (previous?.count ?? 0) + 1;
    const blocked = count >= MAX_ATTEMPTS;
    failedAttempts.set(key, {
        count: blocked ? 0 : count,
        blockedUntil: blocked ? Date.now() + BLOCK_DURATION_MS : null
    });
    return { count, blocked };
}

async function handleFailedAttempt(dni, res) {
    const attempt = await registerFailure(hashDNI(dni));
    await logActivity(dni, 'LOGIN_FAILED', { intento: attempt.count });
    if (attempt.blocked) {
        await logActivity(dni, 'ACCOUNT_BLOCKED', { duration_min: BLOCK_MINUTES });
        return res.status(429).json({
            error: `Se ha superado el límite de ${MAX_ATTEMPTS} intentos fallidos. Inténtelo en ${BLOCK_MINUTES} minutos.`
        });
    }
    return res.status(401).json({
        error: `Credenciales inválidas. Le quedan ${MAX_ATTEMPTS - attempt.count} intentos antes de ser bloqueado.`
    });
}

async function clearAttempts(dni) {
    const key = hashDNI(dni);
    if (useSharedAttempts) await pool.query('DELETE FROM INTENTOS_LOGIN WHERE DNI_HASH = ?', [key]);
    else failedAttempts.delete(key);
}

module.exports = { checkBlock, handleFailedAttempt, clearAttempts };
