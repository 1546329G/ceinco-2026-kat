const { getPool } = require('../config/db');
const { logActivity } = require('../middleware/logActivity');

exports.getAllDoctores = async (req, res) => {
    const pool = getPool();

    try {
        const [rows] = await pool.execute(
            `SELECT 
                ID_USUARIO, 
                DNI, 
                NOMBRE, 
                APELLIDO, 
                CARGO, 
                ESTADO,
                FECHA_CREACION,
                ULTIMA_SESION_TOKEN_ID
             FROM USUARIOS
             WHERE CARGO = 'doctor'
             ORDER BY APELLIDO, NOMBRE`
        );

        const doctores = rows.map(doctor => ({
            ...doctor,
            ESTADO_DISPLAY: doctor.ESTADO === 1 ? 'Activo' : 'Inactivo',
            NOMBRE_COMPLETO: `${doctor.NOMBRE} ${doctor.APELLIDO}`
        }));

        await logActivity(
            req.user.dni,
            'DOCTORS_LIST_ACCESSED',
            { total: doctores.length }
        );

        res.json({
            message: "Lista de doctores recuperada con éxito.",
            total: doctores.length,
            data: doctores
        });
    } catch (error) {
        console.error("Error al obtener la lista de doctores:", error);
        res.status(500).json({ error: "Error interno del servidor." });
    }
};
