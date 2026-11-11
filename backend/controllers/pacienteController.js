const { presentarAntecedentes } = require('../utils/datosClinicos');
const db = require('../config/database');
const pacienteModel = require('../models/pacienteModel');
const consultaModel = require('../models/consultaModel');
const { crearHistoriaClinicaPdf } = require('../utils/historiaClinicaPdf');
const { logActivity } = require('../middleware/logActivity');

const pacienteController = {
    async getAll(req, res) {
        const data = await pacienteModel.getAll();
        res.json({ data, total: data.length });
    },
    // Crear nuevo paciente
    async create(req, res) {
        try {
            const pacienteData = req.body;
            
            // Validaciones básicas
            if (!pacienteData.dni || !pacienteData.nombre_apellido || !pacienteData.fecha_nacimiento) {
                return res.status(400).json({ 
                    error: 'DNI, nombre y fecha de nacimiento son requeridos' 
                });
            }

            const id = await pacienteModel.create(pacienteData);
            
            await logActivity(req.user.dni, 'PACIENTE_CREADO', {
                dni_paciente: pacienteData.dni,
                nombre: pacienteData.nombre_apellido
            });

            res.status(201).json({ 
                message: 'Paciente registrado exitosamente',
                id_ficha: id,
                dni: pacienteData.dni
            });

        } catch (error) {
            if (error.message === 'PACIENTE_YA_EXISTE') {
                return res.status(400).json({ error: 'Ya existe un paciente con este DNI' });
            }
            console.error('Error al crear paciente:', error);
            res.status(500).json({ error: 'Error al registrar paciente' });
        }
    },

    // Búsqueda de pacientes
    async search(req, res) {
        try {
            const { termino } = req.params;
            
            if (!termino || termino.length < 2) {
                return res.status(400).json({ error: 'Ingrese al menos 2 caracteres para buscar' });
            }

            const resultados = await pacienteModel.search(termino);
            res.json(resultados);

        } catch (error) {
            console.error('Error en búsqueda:', error);
            res.status(500).json({ error: 'Error en la búsqueda' });
        }
    },

    // Obtener paciente por DNI
    async getByDni(req, res) {
        try {
            const { dni } = req.params;
            const paciente = await pacienteModel.findByDni(dni);
            
            if (!paciente) {
                return res.status(404).json({ error: 'Paciente no encontrado' });
            }

            res.json(paciente);

        } catch (error) {
            console.error('Error al obtener paciente:', error);
            res.status(500).json({ error: 'Error al obtener paciente' });
        }
    },

    // Obtener historia clínica completa
    async getHistoriaCompleta(req, res) {
        try {
            const { dni } = req.params;
            const historia = await pacienteModel.getHistoriaCompleta(dni);
            
            if (!historia) {
                return res.status(404).json({ error: 'Paciente no encontrado' });
            }

            await logActivity(req.user.dni, 'HISTORIA_VISUALIZADA', {
                dni_paciente: dni
            });

            res.json(historia);

        } catch (error) {
            console.error('Error al obtener historia:', error);
            res.status(500).json({ error: 'Error al obtener historia clínica' });
        }
    },

    // Actualizar paciente
    async update(req, res) {
        try {
            const { dni } = req.params;
            const pacienteData = req.body;

            const existe = await pacienteModel.exists(dni);
            if (!existe) {
                return res.status(404).json({ error: 'Paciente no encontrado' });
            }

            await pacienteModel.update(dni, pacienteData);
            
            await logActivity(req.user.dni, 'PACIENTE_ACTUALIZADO', {
                dni_paciente: dni
            });

            res.json({ message: 'Paciente actualizado exitosamente' });

        } catch (error) {
            console.error('Error al actualizar paciente:', error);
            res.status(500).json({ error: 'Error al actualizar paciente' });
        }
    },

    // Generar PDF de historia clínica
    async getAntecedentes(req, res) {
        const [[row]] = await db.query(
            `SELECT a.* FROM FICHA_CLINICA f LEFT JOIN ANTECEDENTES a
              ON a.ID_FICHA_CLINICA = f.ID_FICHA_CLINICA WHERE f.DNI = ?`, [req.params.dni]
        );
        if (!row) return res.status(404).json({ error: 'Paciente no encontrado' });
        res.json({ campos: presentarAntecedentes(row) });
    },

    async generatePDF(req, res) {
        try {
            const { dni } = req.params;
            const soloAntecedentes = req.query.seccion === 'antecedentes';
            const historia = await pacienteModel.getHistoriaCompleta(dni, soloAntecedentes);
            
            if (!historia) {
                return res.status(404).json({ error: 'Paciente no encontrado' });
            }

            const doc = crearHistoriaClinicaPdf(historia, soloAntecedentes);
            res.setHeader('Content-Type', 'application/pdf');
            res.attachment(`${soloAntecedentes ? 'antecedentes' : 'historia'}-${encodeURIComponent(dni)}.pdf`);
            doc.pipe(res);
            doc.end();

            await logActivity(req.user.dni, 'PDF_GENERADO', {
                dni_paciente: dni
            });

        } catch (error) {
            console.error('Error al generar PDF:', error);
            res.status(500).json({ error: 'Error al generar PDF' });
        }
    },

    // Obtener consultas del paciente
    async getConsultas(req, res) {
        try {
            const { dni } = req.params;
            const consultas = await consultaModel.getByPaciente(dni);
            res.json(consultas);
        } catch (error) {
            console.error('Error al obtener consultas:', error);
            res.status(500).json({ error: 'Error al obtener consultas' });
        }
    }
};

module.exports = pacienteController;