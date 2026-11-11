const mysql = require('mysql2/promise');
require('dotenv').config();

const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
};

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
};

const isPostgres = process.env.DB_ENGINE === 'postgres';
let pool;

async function connectToDatabase() {
    const connectionPool = getPool();
    await connectionPool.query('SELECT 1');
    console.log(`${colors.green}Conexión a ${isPostgres ? 'PostgreSQL' : 'MariaDB'} establecida exitosamente.${colors.reset}`);
    return connectionPool;
}

function getPool() {
    if (!pool) {
        pool = isPostgres ? require('./postgres').createPostgresPool() : mysql.createPool(dbConfig);
    }
    return pool;
}

module.exports = { connectToDatabase, getPool, isPostgres };
