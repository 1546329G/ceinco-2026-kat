const pool = require('../config/database');

const catalogoModel = {
    // Obtener todos los sexos
    async getSexos() {
        const [rows] = await pool.query(
            'SELECT ID_SEXO, DESCRIPCION FROM CATALOGO_SEXOS ORDER BY ID_SEXO'
        );
        return rows;
    },

    // Obtener todos los medicamentos activos
    async getMedicamentos() {
        const [rows] = await pool.query(
            `SELECT ID_MEDICAMENTO, NOMBRE, CONCENTRACION, FORMA_FARMACEUTICA 
             FROM MEDICAMENTOS 
             WHERE ACTIVO = 1 
             ORDER BY NOMBRE`
        );
        return rows;
    },

    // Buscar CIE10
    async searchCIE10(termino) {
        const searchTerm = `%${termino}%`;
        const [rows] = await pool.query(
            `SELECT ID_CIE_10, CODIGO, DESCRIPCION, CAPITULO
             FROM CATALOGO_CIE10 
             WHERE ACTIVO = 1 AND (LOWER(CODIGO) LIKE LOWER(?) OR LOWER(DESCRIPCION) LIKE LOWER(?))
             ORDER BY 
                 CASE 
                     WHEN CODIGO = ? THEN 1
                     WHEN LOWER(CODIGO) LIKE LOWER(?) THEN 2
                     ELSE 3
                 END,
                 CODIGO
             LIMIT 30`,
            [searchTerm, searchTerm, termino, `${termino}%`]
        );
        return rows;
    },

    // Obtener CIE10 por código
    async getCIE10ByCodigo(codigo) {
        const [rows] = await pool.query(
            `SELECT ID_CIE_10, CODIGO, DESCRIPCION, CAPITULO
             FROM CATALOGO_CIE10 
             WHERE CODIGO = ? AND ACTIVO = 1`,
            [codigo]
        );
        return rows[0];
    }
};

module.exports = catalogoModel;