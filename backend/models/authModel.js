const pool = require('../config/database');
const { hashDNI } = require('../middleware/logActivity');

const authModel = {
    // Buscar usuario por DNI
    async findByDni(dni) {
        const [rows] = await pool.query(
            `SELECT ID_USUARIO, DNI, EMAIL, NOMBRE, APELLIDO, CARGO, ESTADO, 
                    CONTRASENA, ULTIMA_SESION_TOKEN_ID, FECHA_CREACION
             FROM USUARIOS 
             WHERE DNI = ?`,
            [dni]
        );
        return rows[0];
    },

    // Buscar usuario por correo (sin distinguir mayúsculas)
    async findByEmail(email) {
        const [rows] = await pool.query(
            `SELECT ID_USUARIO, DNI, EMAIL, NOMBRE, APELLIDO, CARGO, ESTADO, 
                    CONTRASENA, ULTIMA_SESION_TOKEN_ID, FECHA_CREACION
             FROM USUARIOS 
             WHERE LOWER(EMAIL) = ?`,
            [email]
        );
        return rows[0];
    },

    // Asignar o cambiar el correo de un usuario
    async updateEmail(dni, email) {
        const [result] = await pool.query(
            `UPDATE USUARIOS SET EMAIL = ?, ULTIMA_SESION_TOKEN_ID = NULL WHERE DNI = ?`,
            [email, dni]
        );
        return result.affectedRows > 0;
    },

    // Actualizar token de sesión
    async updateSessionToken(dni, tokenId) {
        await pool.query(
            `UPDATE USUARIOS SET ULTIMA_SESION_TOKEN_ID = ? WHERE DNI = ?`,
            [tokenId, dni]
        );
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
            `SELECT ID_USUARIO, DNI, EMAIL, NOMBRE, APELLIDO, CARGO, ESTADO, FECHA_CREACION
             FROM USUARIOS
             ORDER BY FECHA_CREACION DESC`
        );
        return rows;
    },

    // Editar datos de un usuario; invalida la sesión si cambia el cargo o el correo
    async updateUser(dni, { nombre, apellido, cargo, email }) {
        const [result] = await pool.query(
            `UPDATE USUARIOS SET NOMBRE = ?, APELLIDO = ?, CARGO = ?, EMAIL = ?,
                    ULTIMA_SESION_TOKEN_ID = CASE WHEN CARGO <> ? OR COALESCE(LOWER(EMAIL), '') <> ?
                                                  THEN NULL ELSE ULTIMA_SESION_TOKEN_ID END
             WHERE DNI = ?`,
            [nombre, apellido, cargo, email, cargo, email, dni]
        );
        return result.affectedRows > 0;
    },

    // Administradores activos distintos del DNI indicado
    async countOtherActiveAdmins(dni) {
        const [[row]] = await pool.query(
            `SELECT COUNT(*) AS total FROM USUARIOS WHERE CARGO = 'administrador' AND ESTADO = 1 AND DNI <> ?`,
            [dni]
        );
        return Number(row.total);
    },

    // Eliminar usuario (falla con error de clave foránea si tiene registros clínicos)
    async deleteUser(dni) {
        const [result] = await pool.query('DELETE FROM USUARIOS WHERE DNI = ?', [dni]);
        return result.affectedRows > 0;
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