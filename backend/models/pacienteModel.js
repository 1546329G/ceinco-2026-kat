const pool = require('../config/database');

const pacienteModel = {
    async getAll() {
        const [rows] = await pool.query(
            `SELECT fc.*, ${pool.dateOnly('fc.FECHA_NACIMIENTO')} AS FECHA_NACIMIENTO, ${pool.ageYears('fc.FECHA_NACIMIENTO')} as EDAD
             FROM FICHA_CLINICA fc ORDER BY NOMBRE_APELLIDO`
        );
        return rows;
    },
    // Crear nuevo paciente
    async create(data) {
        const connection = await pool.getConnection();
        try {
            const {
                dni, nombre_apellido, fecha_nacimiento, sexo = null, raza = null,
                estado_civil = null, ocupacion = null, nacimiento = null, procedencia = null,
                domicilio = null, telefono = null, email = null, responsable = null, institucion = null
            } = data;

            // Verificar si ya existe
            const [existe] = await connection.query(
                'SELECT ID_FICHA_CLINICA FROM FICHA_CLINICA WHERE DNI = ?',
                [dni]
            );
            
            if (existe.length > 0) {
                throw new Error('PACIENTE_YA_EXISTE');
            }

            const [result] = await connection.query(
                `INSERT INTO FICHA_CLINICA 
                (DNI, NOMBRE_APELLIDO, FECHA_NACIMIENTO, SEXO, RAZA, 
                 ESTADO_CIVIL, OCUPACION, NACIMIENTO, PROCEDENCIA, 
                 DOMICILIO, TELEFONO, EMAIL, RESPONSABLE, INSTITUCION, FECHA)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE)`,
                [dni, nombre_apellido, fecha_nacimiento, sexo, raza,
                 estado_civil, ocupacion, nacimiento, procedencia,
                 domicilio, telefono, email, responsable, institucion]
            );
            
            return result.insertId;
        } finally {
            connection.release();
        }
    },

    // Buscar por DNI
    async findByDni(dni) {
        const [rows] = await pool.query(
            `SELECT fc.*, ${pool.dateOnly('fc.FECHA_NACIMIENTO')} AS FECHA_NACIMIENTO, ${pool.ageYears('fc.FECHA_NACIMIENTO')} as EDAD,
                    cs.DESCRIPCION as sexo_desc,
                    ec.DESCRIPCION as estado_civil_desc
             FROM FICHA_CLINICA fc
             LEFT JOIN CATALOGO_SEXOS cs ON fc.SEXO = cs.ID_SEXO
             LEFT JOIN CATALOGO_ESTADOS_CIVIL ec ON fc.ESTADO_CIVIL = ec.ID_ESTADO_CIVIL
             WHERE fc.DNI = ?`,
            [dni]
        );
        return rows[0];
    },

    // Búsqueda avanzada
    async search(termino) {
        const searchTerm = `%${termino}%`;
        const exactMatch = termino;
        
        const [rows] = await pool.query(
            `SELECT ID_FICHA_CLINICA, DNI, NOMBRE_APELLIDO, TELEFONO, FECHA_NACIMIENTO
             FROM FICHA_CLINICA 
             WHERE DNI LIKE ? OR LOWER(NOMBRE_APELLIDO) LIKE LOWER(?) OR TELEFONO LIKE ?
             ORDER BY 
                 CASE 
                     WHEN DNI = ? THEN 1
                     WHEN DNI LIKE ? THEN 2
                     WHEN LOWER(NOMBRE_APELLIDO) LIKE LOWER(?) THEN 3
                     ELSE 4
                 END,
                 NOMBRE_APELLIDO
             LIMIT 30`,
            [searchTerm, searchTerm, searchTerm, exactMatch, `${termino}%`, `${termino}%`]
        );
        return rows;
    },

    // Historia clínica completa
    async getHistoriaCompleta(dni) {
        const connection = await pool.getConnection();
        try {
            // Datos del paciente
            const [paciente] = await connection.query(
                `SELECT fc.*, ${pool.dateOnly('fc.FECHA_NACIMIENTO')} AS FECHA_NACIMIENTO, ${pool.ageYears('fc.FECHA_NACIMIENTO')} as EDAD,
                        cs.DESCRIPCION as sexo_desc,
                        ec.DESCRIPCION as estado_civil_desc
                 FROM FICHA_CLINICA fc
                 LEFT JOIN CATALOGO_SEXOS cs ON fc.SEXO = cs.ID_SEXO
                 LEFT JOIN CATALOGO_ESTADOS_CIVIL ec ON fc.ESTADO_CIVIL = ec.ID_ESTADO_CIVIL
                 WHERE fc.DNI = ?`,
                [dni]
            );

            if (paciente.length === 0) return null;

            const idFicha = paciente[0].ID_FICHA_CLINICA;

            // Antecedentes
            const [antecedentes] = await connection.query(
                `SELECT * FROM ANTECEDENTES WHERE ID_FICHA_CLINICA = ?`,
                [idFicha]
            );

            // Consultas con todos los detalles
            const [consultas] = await connection.query(
                `SELECT c.*, 
                        u.NOMBRE as doctor_nombre,
                        u.APELLIDO as doctor_apellido,
                        u.DNI as doctor_dni
                 FROM CONSULTA c
                 LEFT JOIN USUARIOS u ON c.ID_USUARIO = u.ID_USUARIO
                 WHERE c.ID_FICHA_CLINICA = ?
                 ORDER BY c.FECHA DESC`,
                [idFicha]
            );

            // Para cada consulta, obtener detalles completos
            for (let consulta of consultas) {
                // Diagnósticos
                const [diagnosticos] = await connection.query(
                    `SELECT dc.*, cc.CODIGO, cc.DESCRIPCION as diagnostico_desc
                     FROM DIAGNOSTICOS_CONSULTA dc
                     JOIN CATALOGO_CIE10 cc ON dc.ID_CIE_10 = cc.ID_CIE_10
                     WHERE dc.ID_CONSULTA = ?`,
                    [consulta.ID_CONSULTA]
                );
                consulta.diagnosticos = diagnosticos;

                // Signos vitales
                const [signos] = await connection.query(
                    `SELECT * FROM EXAMEN_CLINICO WHERE ID_CONSULTA = ?`,
                    [consulta.ID_CONSULTA]
                );
                consulta.signos_vitales = signos[0] || null;

                // Receta con detalles
                if (consulta.ID_RECETA) {
                    const [receta] = await connection.query(
                        `SELECT r.*, 
                                rd.ID_DETALLE, rd.DOSIS, rd.FRECUENCIA, rd.DURACION,
                                m.NOMBRE as medicamento_nombre, m.CONCENTRACION
                         FROM RECETAS r
                         LEFT JOIN RECETA_DETALLE rd ON r.ID_RECETA = rd.ID_RECETA
                         LEFT JOIN MEDICAMENTOS m ON rd.ID_MEDICAMENTO = m.ID_MEDICAMENTO
                         WHERE r.ID_RECETA = ?`,
                        [consulta.ID_RECETA]
                    );
                    
                    // Agrupar detalles por receta
                    const recetaAgrupada = {
                        ...receta[0],
                        medicamentos: receta.map(r => ({
                            id_detalle: r.ID_DETALLE,
                            medicamento: r.medicamento_nombre,
                            concentracion: r.CONCENTRACION,
                            dosis: r.DOSIS,
                            frecuencia: r.FRECUENCIA,
                            duracion: r.DURACION
                        })).filter(m => m.id_detalle)
                    };
                    consulta.receta = recetaAgrupada;
                }

                // Exámenes auxiliares
                const [examenes] = await connection.query(
                    `SELECT * FROM EXAMENES_AUXILIARES 
                     WHERE ID_CONSULTA = ? OR ID_FICHA_CLINICA = ?
                     ORDER BY FECHA_REGISTRO DESC`,
                    [consulta.ID_CONSULTA, idFicha]
                );
                consulta.examenes_auxiliares = examenes;
            }

            // Citas del paciente
            const [citas] = await connection.query(
                `SELECT c.*, u.NOMBRE as doctor_nombre, u.APELLIDO as doctor_apellido
                 FROM CITAS c
                 LEFT JOIN USUARIOS u ON c.ID_USUARIO = u.ID_USUARIO
                 WHERE c.ID_FICHA_CLINICA = ?
                 ORDER BY c.FECHA DESC, c.HORA DESC`,
                [idFicha]
            );

            return {
                ...paciente[0],
                antecedentes: antecedentes[0] || null,
                consultas,
                citas
            };
        } finally {
            connection.release();
        }
    },

    // Actualizar paciente
    async update(dni, data) {
        const {
            nombre_apellido, fecha_nacimiento = null, sexo = null, raza = null, estado_civil = null, ocupacion = null,
            procedencia = null, domicilio = null, telefono = null, email = null, responsable = null, institucion = null
        } = data;

        const [result] = await pool.query(
            `UPDATE FICHA_CLINICA 
             SET NOMBRE_APELLIDO = ?, FECHA_NACIMIENTO = COALESCE(?, FECHA_NACIMIENTO), SEXO = ?, RAZA = ?, 
                 ESTADO_CIVIL = ?, OCUPACION = ?, PROCEDENCIA = ?,
                 DOMICILIO = ?, TELEFONO = ?, EMAIL = ?, 
                 RESPONSABLE = ?, INSTITUCION = ?
             WHERE DNI = ?`,
            [nombre_apellido, fecha_nacimiento || null, sexo, raza, estado_civil, ocupacion,
             procedencia, domicilio, telefono, email, responsable, 
             institucion, dni]
        );
        
        return result.affectedRows > 0;
    },

    // Verificar si existe
    async exists(dni) {
        const [rows] = await pool.query(
            'SELECT ID_FICHA_CLINICA FROM FICHA_CLINICA WHERE DNI = ?',
            [dni]
        );
        return rows.length > 0;
    }
};

module.exports = pacienteModel;