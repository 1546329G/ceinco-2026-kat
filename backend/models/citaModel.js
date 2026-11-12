const pool = require('../config/database');

const citaModel = {
    // Crear cita
    async create(data, idUsuario) {
        const { dni, fecha, hora, servicio } = data;

        // Obtener ID del paciente
        const [paciente] = await pool.query(
            'SELECT ID_FICHA_CLINICA FROM FICHA_CLINICA WHERE DNI = ?',
            [dni]
        );

        if (paciente.length === 0) {
            throw new Error('PACIENTE_NO_ENCONTRADO');
        }

        // Verificar disponibilidad
        const [existe] = await pool.query(
            `SELECT ID_CITAS FROM CITAS 
             WHERE FECHA = ? AND HORA = ? AND ESTADO != 'cancelada'`,
            [fecha, hora]
        );

        if (existe.length > 0) {
            throw new Error('HORA_NO_DISPONIBLE');
        }

        const [result] = await pool.query(
            `INSERT INTO CITAS 
             (ID_FICHA_CLINICA, ID_USUARIO, SERVICIO, FECHA, HORA, ESTADO)
             VALUES (?, ?, ?, ?, ?, 'programada')`,
            [paciente[0].ID_FICHA_CLINICA, idUsuario, servicio, fecha, hora]
        );

        return result.insertId;
    },

    // Obtener citas del día
    async getToday() {
        const [rows] = await pool.query(
            `SELECT c.*, ${pool.dateOnly('c.FECHA')} AS FECHA, 
                    fc.DNI, fc.NOMBRE_APELLIDO as paciente_nombre, fc.TELEFONO,
                    u.NOMBRE as doctor_nombre, u.APELLIDO as doctor_apellido
             FROM CITAS c
             JOIN FICHA_CLINICA fc ON c.ID_FICHA_CLINICA = fc.ID_FICHA_CLINICA
             LEFT JOIN USUARIOS u ON c.ID_USUARIO = u.ID_USUARIO
             WHERE DATE(c.FECHA) = CURRENT_DATE
             ORDER BY c.HORA ASC`,
            []
        );
        return rows;
    },

    // Una cita con su paciente y doctor (para iniciar la consulta desde Citas)
    async getById(idCita) {
        const [rows] = await pool.query(
            `SELECT c.*, ${pool.dateOnly('c.FECHA')} AS FECHA,
                    fc.DNI, fc.NOMBRE_APELLIDO as paciente_nombre, fc.TELEFONO,
                    u.NOMBRE as doctor_nombre, u.APELLIDO as doctor_apellido
             FROM CITAS c
             JOIN FICHA_CLINICA fc ON c.ID_FICHA_CLINICA = fc.ID_FICHA_CLINICA
             LEFT JOIN USUARIOS u ON c.ID_USUARIO = u.ID_USUARIO
             WHERE c.ID_CITAS = ?`,
            [idCita]
        );
        return rows[0];
    },

    // Buscar citas
    async search(filtros) {
        let query = `
            SELECT c.*, ${pool.dateOnly('c.FECHA')} AS FECHA, 
                   fc.DNI, fc.NOMBRE_APELLIDO as paciente_nombre,
                   u.NOMBRE as doctor_nombre, u.APELLIDO as doctor_apellido
            FROM CITAS c
            JOIN FICHA_CLINICA fc ON c.ID_FICHA_CLINICA = fc.ID_FICHA_CLINICA
            LEFT JOIN USUARIOS u ON c.ID_USUARIO = u.ID_USUARIO
            WHERE 1=1
        `;
        const params = [];

        if (filtros.fecha) {
            query += ` AND DATE(c.FECHA) = ?`;
            params.push(filtros.fecha);
        }

        if (filtros.dni) {
            query += ` AND fc.DNI = ?`;
            params.push(filtros.dni);
        }

        if (filtros.estado) {
            query += ` AND c.ESTADO = ?`;
            params.push(filtros.estado);
        }

        query += ` ORDER BY c.FECHA DESC, c.HORA ASC`;

        const [rows] = await pool.query(query, params);
        return rows;
    },

    async update(id, { fecha, hora, servicio, id_doctor }) {
        if (pool.isPostgres) {
            const [result] = await pool.query(
                `UPDATE CITAS c SET FECHA = ?, HORA = ?, SERVICIO = ?, ID_USUARIO = u.ID_USUARIO
                 FROM USUARIOS u
                 WHERE c.ID_CITAS = ? AND c.ESTADO = 'programada'
                   AND u.ID_USUARIO = ? AND u.CARGO = 'doctor' AND u.ESTADO = 1
                   AND NOT EXISTS (SELECT 1 FROM CITAS ocupada WHERE ocupada.FECHA = ? AND ocupada.HORA = ?
                                   AND ocupada.ESTADO <> 'cancelada' AND ocupada.ID_CITAS <> c.ID_CITAS)`,
                [fecha, hora, servicio, id, id_doctor, fecha, hora]
            );
            return result.affectedRows > 0;
        }
        const [result] = await pool.query(
            `UPDATE CITAS c
             LEFT JOIN CITAS ocupada ON ocupada.FECHA = ? AND ocupada.HORA = ?
                AND ocupada.ESTADO <> 'cancelada' AND ocupada.ID_CITAS <> c.ID_CITAS
             JOIN USUARIOS u ON u.ID_USUARIO = ? AND u.CARGO = 'doctor' AND u.ESTADO = 1
             SET c.FECHA = ?, c.HORA = ?, c.SERVICIO = ?, c.ID_USUARIO = u.ID_USUARIO
             WHERE c.ID_CITAS = ? AND c.ESTADO = 'programada' AND ocupada.ID_CITAS IS NULL`,
            [fecha, hora, id_doctor, fecha, hora, servicio, id]
        );
        return result.affectedRows > 0;
    },

    async atender(id) {
        const [result] = await pool.query(
            "UPDATE CITAS SET ESTADO = 'atendida' WHERE ID_CITAS = ? AND ESTADO = 'programada'", [id]
        );
        return result.affectedRows > 0;
    },

    async eliminarCancelada(id) {
        const [result] = await pool.query(
            "DELETE FROM CITAS WHERE ID_CITAS = ? AND ESTADO = 'cancelada'", [id]
        );
        return result.affectedRows > 0;
    },

    // Cancelar cita
    async cancelar(idCita) {
        const [result] = await pool.query(
            `UPDATE CITAS SET ESTADO = 'cancelada' WHERE ID_CITAS = ? AND ESTADO = 'programada'`,
            [idCita]
        );
        return result.affectedRows > 0;
    }
};

module.exports = citaModel;