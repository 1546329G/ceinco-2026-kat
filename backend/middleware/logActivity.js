const { getPool } = require('../config/db');
const colors = { red: "\x1b[31m", reset: "\x1b[0m" };
const crypto = require('crypto');

function hashDNI(dni) {
    if (!dni || typeof dni !== 'string') {
        throw new Error('DNI debe ser una cadena no vacía');
    }
    
    if (!process.env.HASH_SALT || process.env.HASH_SALT.length < 16) {
        throw new Error('HASH_SALT debe tener al menos 16 caracteres');
    }
    
    return crypto.createHash('sha256')
        .update(dni + process.env.HASH_SALT)
        .digest('hex');
}

async function logActivity(dni, eventType, details) {
    try {
        const pool = getPool();
        const hashedDNI = hashDNI(dni);
        
        await pool.execute(
            'INSERT INTO LOG (DNI_USUARIO, TIPO_EVENTO, DETALLE) VALUES (?, ?, ?)',
            [hashedDNI, eventType, JSON.stringify(details)]
        );
    } catch (dbError) {
        console.error(`${colors.red}Error al guardar el log en la base de datos:`, dbError.message, `${colors.reset}`);
    }
}

module.exports = { logActivity, hashDNI };