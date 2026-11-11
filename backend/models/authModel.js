const pool = require('../config/database');
const { hashDNI } = require('../middleware/logActivity');

const authModel = {
    // Buscar usuario por DNI
    async findByDni(dni) {
        const [rows] = await pool.query(
            `SELECT ID_USUARIO, DNI, NOMBRE, APELLIDO, CARGO, ESTADO, 
                    CONTRASENA, ULTIMA_SESION_TOKEN_ID, FECHA_CREACION
             FROM USUARIOS 
             WHERE DNI = ?`,
            [dni]
        );
        return rows[0];
    },

    // Actualizar token de sesión
    async updateSessionToken(dni, tokenId) {
        await pool.query(
            `UPDATE USUARIOS SET ULTIMA_SESION_TOKEN_ID = ? WHERE DNI = ?`,
            [tokenId, dni]
        );
    },

    // Registrar intento de login (usando tu sistema de logs)
    async registerLoginAttempt(dni, success) {
        // Esto se maneja en logActivity.js
    },

    // Cambiar contraseña
    async changePassword(dni, newPasswordHash) {
        const [result] = await pool.query(
            `UPDATE USUARIOS SET CONTRASENA = ? WHERE DNI = ?`,
            [newPasswordHash, dni]
        );
        return result.affectedRows > 0;
    },

    // Obtener todos los usuarios (para admin)
    async getAll() {
        const [rows] = await pool.query(
            `SELECT ID_USUARIO, DNI, NOMBRE, APELLIDO, CARGO, ESTADO, FECHA_CREACION
             FROM USUARIOS
             ORDER BY FECHA_CREACION DESC`
        );
        return rows;
    },

    // Cambiar estado de usuario
    async toggleStatus(dni) {
        const [result] = await pool.query(
            `UPDATE USUARIOS SET ESTADO = CASE WHEN ESTADO = 1 THEN 0 ELSE 1 END WHERE DNI = ?`,
            [dni]
        );
        return result.affectedRows > 0;
    }
};

module.exports = authModel;