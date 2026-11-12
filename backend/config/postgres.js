const { Pool, types } = require('pg');

const ids = {
    antecedentes: 'id_antecedentes',
    catalogo_cie10: 'id_cie_10',
    citas: 'id_citas',
    consulta: 'id_consulta',
    diagnosticos_consulta: 'id_diagnostico',
    examen_clinico: 'id_examen_clinico',
    examenes_auxiliares: 'id_examenesaux',
    ficha_clinica: 'id_ficha_clinica',
    log: 'id_log',
    medicamentos: 'id_medicamento',
    receta_detalle: 'id_detalle',
    recetas: 'id_receta',
    signos_vitales_preconsulta: 'id_signos',
    usuarios: 'id_usuario'
};

function formatQuery(sql) {
    let index = 0;
    return sql.replace(/'(?:''|[^'])*'|"(?:""|[^"])*"|\?/g, token =>
        token === '?' ? '$' + ++index : token
    );
}

async function query(target, sql, values = []) {
    const aliases = new Map(Array.from(
        sql.matchAll(/\bAS\s+([a-z_][a-z0-9_]*)\b/gi),
        ([, name]) => [name.toLowerCase(), name]
    ));
    const table = sql.match(/^\s*INSERT\s+INTO\s+([a-z_0-9]+)/i)?.[1]?.toLowerCase();
    const id = ids[table];
    const statement = id ? sql.trimEnd().replace(/;$/, '') + ' RETURNING ' + id : sql;
    const result = await target.query(formatQuery(statement), values.map(value => value ?? null));
    if (result.command === 'SELECT') {
        return [result.rows.map(row => Object.fromEntries(
            Object.entries(row).map(([name, value]) => [aliases.get(name) ?? name.toUpperCase(), value])
        ))];
    }
    return [{ affectedRows: result.rowCount, insertId: id ? result.rows[0]?.[id] : undefined }];
}

function createPostgresPool() {
    const pool = new Pool({
        host: process.env.PGHOST,
        database: process.env.PGDATABASE,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        port: Number(process.env.PGPORT || 5432),
        ssl: { rejectUnauthorized: true },
        enableChannelBinding: true,
        options: '-c TimeZone=America/Lima',
        connectionTimeoutMillis: 12000,
        types: {
            getTypeParser(oid, format) {
                if ([114, 1082, 3802].includes(oid)) return value => value;
                if (oid === 1114) return value => value.replace(' ', 'T');
                if (oid === 20) return value => Number(value);
                return types.getTypeParser(oid, format);
            }
        }
    });
    pool.on('error', error => console.error('Error en conexión inactiva de PostgreSQL:', error.code ?? error.name));
    return {
        query: (sql, values) => query(pool, sql, values),
        execute: (sql, values) => query(pool, sql, values),
        end: () => pool.end(),
        async getConnection() {
            const client = await pool.connect();
            return {
                query: (sql, values) => query(client, sql, values),
                beginTransaction: () => client.query('BEGIN'),
                commit: () => client.query('COMMIT'),
                rollback: () => client.query('ROLLBACK'),
                release: () => client.release()
            };
        }
    };
}

module.exports = { createPostgresPool, formatQuery };
