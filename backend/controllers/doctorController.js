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

exports.getDoctorById = async (req, res) => {
    const pool = getPool();
    const { idDoctor } = req.params;

    if (isNaN(parseInt(idDoctor))) {
        return res.status(400).json({ error: "ID de Doctor inválido." });
    }

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
             WHERE ID_USUARIO = ? AND CARGO = 'doctor'`,
            [idDoctor]
        );

        if (rows.length === 0) {
            return res.status(404).json({ 
                error: "Doctor no encontrado o el ID no corresponde a un doctor." 
            });
        }

        const doctor = rows[0];
        const doctorInfo = {
            ...doctor,
            ESTADO_DISPLAY: doctor.ESTADO === 1 ? 'Activo' : 'Inactivo',
            NOMBRE_COMPLETO: `${doctor.NOMBRE} ${doctor.APELLIDO}`
        };

        await logActivity(
            req.user.dni,
            'DOCTOR_DETAIL_ACCESSED',
            { doctorId: idDoctor, doctorName: doctorInfo.NOMBRE_COMPLETO }
        );

        res.json({
            message: "Detalle del doctor recuperado con éxito.",
            data: doctorInfo
        });
    } catch (error) {
        console.error("Error al obtener detalle del doctor:", error);
        res.status(500).json({ error: "Error interno del servidor." });
    }
};
