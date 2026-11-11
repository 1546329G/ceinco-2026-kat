const pool = require('../config/database');

const catalogoModel = {
    // Obtener todos los sexos
    async getSexos() {
        const [rows] = await pool.query(
            'SELECT ID_SEXO, DESCRIPCION FROM CATALOGO_SEXOS ORDER BY ID_SEXO'
        );
        return rows;
    },

    // Obtener todos los estados civiles
    async getEstadosCivil() {
        const [rows] = await pool.query(
            'SELECT ID_ESTADO_CIVIL, DESCRIPCION FROM CATALOGO_ESTADOS_CIVIL ORDER BY ID_ESTADO_CIVIL'
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

    // Buscar medicamentos
    async searchMedicamentos(termino) {
        const searchTerm = `%${termino}%`;
        const [rows] = await pool.query(
            `SELECT ID_MEDICAMENTO, NOMBRE, CONCENTRACION, FORMA_FARMACEUTICA
             FROM MEDICAMENTOS 
             WHERE ACTIVO = 1 AND (LOWER(NOMBRE) LIKE LOWER(?) OR LOWER(CONCENTRACION) LIKE LOWER(?))
             ORDER BY NOMBRE
             LIMIT 20`,
            [searchTerm, searchTerm]
        );
        return rows;
    },

    // Crear medicamento
    async createMedicamento(data) {
        const { nombre, concentracion, forma_farmaceutica } = data;
        
        const [result] = await pool.query(
            `INSERT INTO MEDICAMENTOS (NOMBRE, CONCENTRACION, FORMA_FARMACEUTICA)
             VALUES (?, ?, ?)`,
            [nombre, concentracion, forma_farmaceutica]
        );
        
        return result.insertId;
    },

    // Actualizar medicamento
    async updateMedicamento(id, data) {
        const { nombre, concentracion, forma_farmaceutica, activo } = data;
        
        const [result] = await pool.query(
            `UPDATE MEDICAMENTOS 
             SET NOMBRE = ?, CONCENTRACION = ?, FORMA_FARMACEUTICA = ?, ACTIVO = ?
             WHERE ID_MEDICAMENTO = ?`,
            [nombre, concentracion, forma_farmaceutica, activo, id]
        );
        
        return result.affectedRows > 0;
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
    },

    // Obtener categorías CIE10 (capítulos)
    async getCategoriasCIE10() {
        const [rows] = await pool.query(
            `SELECT DISTINCT CAPITULO, COUNT(*) as total
             FROM CATALOGO_CIE10 
             WHERE ACTIVO = 1 AND CAPITULO IS NOT NULL
             GROUP BY CAPITULO
             ORDER BY CAPITULO`
        );
        return rows;
    },

    // Obtener todos los roles disponibles
    async getRoles() {
        // Como los roles están en el código, podemos devolverlos desde aquí
        return [
            { valor: 'administrador', descripcion: 'Administrador' },
            { valor: 'doctor', descripcion: 'Doctor' },
            { valor: 'asistente', descripcion: 'Asistente' }
        ];
    }
};

module.exports = catalogoModel;