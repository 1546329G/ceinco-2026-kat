const pool = require('../config/database');
const bcrypt = require('bcrypt');

const usuarioModel = {
    // Obtener todos los usuarios
    async getAll(filtros = {}) {
        let query = `
            SELECT ID_USUARIO, DNI, NOMBRE, APELLIDO, CARGO, ESTADO, 
                   FECHA_CREACION, ULTIMA_SESION_TOKEN_ID
            FROM USUARIOS
            WHERE 1=1
        `;
        const params = [];

        if (filtros.cargo) {
            query += ` AND CARGO = ?`;
            params.push(filtros.cargo);
        }

        if (filtros.estado !== undefined) {
            query += ` AND ESTADO = ?`;
            params.push(filtros.estado);
        }

        if (filtros.search) {
            query += ` AND (DNI LIKE ? OR NOMBRE LIKE ? OR APELLIDO LIKE ?)`;
            const searchTerm = `%${filtros.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += ` ORDER BY FECHA_CREACION DESC`;

        const [rows] = await pool.query(query, params);
        return rows;
    },

    // Obtener usuario por ID
    async getById(id) {
        const [rows] = await pool.query(
            `SELECT ID_USUARIO, DNI, NOMBRE, APELLIDO, CARGO, ESTADO, FECHA_CREACION
             FROM USUARIOS 
             WHERE ID_USUARIO = ?`,
            [id]
        );
        return rows[0];
    },

    // Obtener usuario por DNI
    async getByDni(dni) {
        const [rows] = await pool.query(
            `SELECT ID_USUARIO, DNI, NOMBRE, APELLIDO, CARGO, ESTADO, 
                    CONTRASENA, FECHA_CREACION, ULTIMA_SESION_TOKEN_ID
             FROM USUARIOS 
             WHERE DNI = ?`,
            [dni]
        );
        return rows[0];
    },

    // Crear usuario
    async create(data) {
        const { dni, nombre, apellido, cargo, contrasena } = data;

        // Verificar si ya existe
        const existe = await this.getByDni(dni);
        if (existe) {
            throw new Error('USUARIO_YA_EXISTE');
        }

        // Hashear contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(contrasena, salt);

        const [result] = await pool.query(
            `INSERT INTO USUARIOS (DNI, NOMBRE, APELLIDO, CARGO, CONTRASENA)
             VALUES (?, ?, ?, ?, ?)`,
            [dni, nombre, apellido, cargo, hashedPassword]
        );

        return result.insertId;
    },

    // Actualizar usuario
    async update(id, data) {
        const { nombre, apellido, cargo, estado } = data;

        const [result] = await pool.query(
            `UPDATE USUARIOS 
             SET NOMBRE = ?, APELLIDO = ?, CARGO = ?, ESTADO = ?
             WHERE ID_USUARIO = ?`,
            [nombre, apellido, cargo, estado, id]
        );

        return result.affectedRows > 0;
    },

    // Cambiar contraseña
    async changePassword(id, nuevaContrasena) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(nuevaContrasena, salt);

        const [result] = await pool.query(
            `UPDATE USUARIOS SET CONTRASENA = ? WHERE ID_USUARIO = ?`,
            [hashedPassword, id]
        );

        // Invalidar sesión actual
        await pool.query(
            `UPDATE USUARIOS SET ULTIMA_SESION_TOKEN_ID = NULL WHERE ID_USUARIO = ?`,
            [id]
        );

        return result.affectedRows > 0;
    },

    // Cambiar estado
    async toggleStatus(id) {
        const [result] = await pool.query(
            `UPDATE USUARIOS SET ESTADO = CASE WHEN ESTADO = 1 THEN 0 ELSE 1 END WHERE ID_USUARIO = ?`,
            [id]
        );

        if (result.affectedRows > 0) {
            // Invalidar sesión si se deshabilita
            await pool.query(
                `UPDATE USUARIOS SET ULTIMA_SESION_TOKEN_ID = NULL WHERE ID_USUARIO = ?`,
                [id]
            );
        }

        return result.affectedRows > 0;
    },

    // Actualizar token de sesión
    async updateSessionToken(dni, tokenId) {
        await pool.query(
            `UPDATE USUARIOS SET ULTIMA_SESION_TOKEN_ID = ? WHERE DNI = ?`,
            [tokenId, dni]
        );
    },

    // Eliminar usuario (solo admin, lógico o físico?)
    async delete(id) {
        // Opción 1: Eliminación física
        const [result] = await pool.query(
            `DELETE FROM USUARIOS WHERE ID_USUARIO = ?`,
            [id]
        );
        return result.affectedRows > 0;

        // Opción 2: Eliminación lógica (deshabilitar)
        // return await this.toggleStatus(id);
    },

    // Estadísticas de usuarios
    async getStats() {
        const [rows] = await pool.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN ESTADO = 1 THEN 1 ELSE 0 END) as activos,
                SUM(CASE WHEN CARGO = 'administrador' THEN 1 ELSE 0 END) as admins,
                SUM(CASE WHEN CARGO = 'doctor' THEN 1 ELSE 0 END) as doctores,
                SUM(CASE WHEN CARGO = 'asistente' THEN 1 ELSE 0 END) as asistentes
            FROM USUARIOS
        `);
        return rows[0];
    }
};

module.exports = usuarioModel;