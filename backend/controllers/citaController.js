const citaModel = require('../models/citaModel');
const { logActivity } = require('../middleware/logActivity');

const citaController = {
    // Crear cita
    async create(req, res) {
        try {
            const { dni, fecha, hora, servicio, id_doctor } = req.body;

            if (!dni || !fecha || !hora || !servicio) {
                return res.status(400).json({ 
                    error: 'DNI, fecha, hora y servicio son requeridos' 
                });
            }

            const idCita = await citaModel.create({
                dni, fecha, hora, servicio
            }, id_doctor ?? req.user.id);

            await logActivity(req.user.dni, 'CITA_CREADA', {
                id_cita: idCita,
                dni_paciente: dni,
                fecha,
                hora
            });

            res.status(201).json({
                message: 'Cita creada exitosamente',
                id_cita: idCita
            });

        } catch (error) {
            if (error.message === 'PACIENTE_NO_ENCONTRADO') {
                return res.status(404).json({ error: 'Paciente no encontrado' });
            }
            if (error.message === 'HORA_NO_DISPONIBLE') {
                return res.status(400).json({ error: 'Horario no disponible' });
            }
            console.error('Error al crear cita:', error);
            res.status(500).json({ error: 'Error al crear cita' });
        }
    },

    // Obtener citas del día
    async getToday(req, res) {
        try {
            const citas = await citaModel.getToday();
            res.json(citas);
        } catch (error) {
            console.error('Error al obtener citas del día:', error);
            res.status(500).json({ error: 'Error al obtener citas' });
        }
    },

    async getById(req, res) {
        const idCita = Number(req.params.idCita);
        if (!Number.isInteger(idCita) || idCita < 1) {
            return res.status(400).json({ error: 'ID de cita inválido' });
        }
        const cita = await citaModel.getById(idCita);
        if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });
        res.json(cita);
    },

    // Buscar citas
    async search(req, res) {
        try {
            const { fecha, dni, estado } = req.query;
            const citas = await citaModel.search({ fecha, dni, estado });
            res.json(citas);
        } catch (error) {
            console.error('Error al buscar citas:', error);
            res.status(500).json({ error: 'Error al buscar citas' });
        }
    },

    async update(req, res) {
        const { fecha, hora, servicio, id_doctor } = req.body;
        if (!fecha || !hora || !servicio || !id_doctor) {
            return res.status(400).json({ error: 'Fecha, hora, servicio y doctor son requeridos' });
        }
        if (!await citaModel.update(req.params.idCita, req.body)) {
            return res.status(409).json({ error: 'Cita, doctor u horario no disponible' });
        }
        res.json({ message: 'Cita actualizada' });
    },

    async atender(req, res) {
        if (!await citaModel.atender(req.params.idCita)) {
            return res.status(409).json({ error: 'La cita debe estar programada' });
        }
        res.json({ message: 'Cita marcada como atendida' });
    },

    async eliminarCancelada(req, res) {
        if (!await citaModel.eliminarCancelada(req.params.idCita)) {
            return res.status(409).json({ error: 'La cita debe estar cancelada' });
        }
        res.json({ message: 'Cita eliminada' });
    },

    // Cancelar cita
    async cancelar(req, res) {
        try {
            const { idCita } = req.params;

            const cancelada = await citaModel.cancelar(idCita);

            if (!cancelada) {
                return res.status(400).json({ 
                    error: 'No se pudo cancelar la cita. Verifique que existe y está programada.' 
                });
            }

            await logActivity(req.user.dni, 'CITA_CANCELADA', {
                id_cita: idCita
            });

            res.json({ message: 'Cita cancelada exitosamente' });

        } catch (error) {
            console.error('Error al cancelar cita:', error);
            res.status(500).json({ error: 'Error al cancelar cita' });
        }
    }
};

module.exports = citaController;