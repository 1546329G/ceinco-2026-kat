const pool = require('../config/database');
const bcrypt = require('bcrypt');

const usuarioModel = {
    // Crear usuario
    async create(data) {
        const { dni, nombre, apellido, cargo, contrasena } = data;
        const email = data.email ? data.email.trim().toLowerCase() : null;

        // Hashear contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(contrasena, salt);

        const [result] = await pool.query(
            `INSERT INTO USUARIOS (DNI, EMAIL, NOMBRE, APELLIDO, CARGO, CONTRASENA)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [dni, email, nombre, apellido, cargo, hashedPassword]
        );

        return result.insertId;
    }
};

module.exports = usuarioModel;