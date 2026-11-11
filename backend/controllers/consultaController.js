const consultaModel = require('../models/consultaModel');
const { logActivity } = require('../middleware/logActivity');
const pool = require('../config/database');
const { randomUUID } = require('node:crypto');

const consultaController = {
    async registrarReceta(req, res) {
        const { indicaciones, medicamentos } = req.body;
        if (!Array.isArray(medicamentos) || !medicamentos.length ||
            medicamentos.some(med => !med || !Number.isInteger(med.id_medicamento) || med.id_medicamento < 1)) {
            return res.status(400).json({ error: 'Seleccione medicamentos del catálogo' });
        }
        try {
            const idReceta = await consultaModel.registrarReceta(req.params.idConsulta, req.user.id, { indicaciones, medicamentos });
            if (!idReceta) return res.status(404).json({ error: 'Consulta no encontrada' });
            await logActivity(req.user.dni, 'RECETA_REGISTRADA', { idReceta });
            res.status(201).json({ message: 'Receta registrada', idReceta });
        } catch (error) {
            if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === '23503') {
                return res.status(400).json({ error: 'Algún medicamento no existe en el catálogo' });
            }
            throw error;
        }
    },

    // Registrar consulta completa
    async registrarCompleta(req, res) {
        try {
            const consultaData = req.body;
            const idUsuario = req.user.id;

            // Validaciones básicas
            if (!consultaData.dniPaciente && !consultaData.idCita && !consultaData.idExamenClinico) {
                return res.status(400).json({ 
                    error: 'Debe proporcionar DNI del paciente o ID de cita' 
                });
            }

            const idConsulta = await consultaModel.registrarConsultaCompleta(consultaData, idUsuario);

            await logActivity(req.user.dni, 'CONSULTA_REGISTRADA', {
                id_consulta: idConsulta,
                paciente: consultaData.dniPaciente,
                via: consultaData.idCita ? 'desde_cita' : 'directa'
            });

            res.status(201).json({
                message: 'Consulta registrada exitosamente',
                id_consulta: idConsulta
            });

        } catch (error) {
            if (error.status === 400) return res.status(400).json({ error: error.message });
            console.error('Error al registrar consulta:', error);
            res.status(500).json({ error: 'Error al registrar consulta' });
        }
    },

    // Obtener consulta por ID
    async getById(req, res) {
        try {
            const { idConsulta } = req.params;
            const consulta = await consultaModel.getById(idConsulta);

            if (!consulta) {
                return res.status(404).json({ error: 'Consulta no encontrada' });
            }

            await logActivity(req.user.dni, 'CONSULTA_VISUALIZADA', {
                id_consulta: idConsulta
            });

            res.json(consulta);

        } catch (error) {
            console.error('Error al obtener consulta:', error);
            res.status(500).json({ error: 'Error al obtener consulta' });
        }
    },

    // Buscar CIE10
    async searchCIE10(req, res) {
        try {
            const { q } = req.query;
            
            if (!q || q.length < 2) {
                return res.status(400).json({ error: 'Ingrese al menos 2 caracteres' });
            }

            const [rows] = await pool.query(
                `SELECT ID_CIE_10, CODIGO, DESCRIPCION 
                 FROM CATALOGO_CIE10 
                 WHERE ACTIVO = 1 AND (LOWER(CODIGO) LIKE LOWER(?) OR LOWER(DESCRIPCION) LIKE LOWER(?))
                 ORDER BY 
                     CASE 
                         WHEN CODIGO = ? THEN 1
                         WHEN LOWER(CODIGO) LIKE LOWER(?) THEN 2
                         ELSE 3
                     END
                 LIMIT 20`,
                [`%${q}%`, `%${q}%`, q, `${q}%`]
            );

            res.json(rows);

        } catch (error) {
            console.error('Error al buscar CIE10:', error);
            res.status(500).json({ error: 'Error en la búsqueda' });
        }
    },

    // Editar consulta
    async edit(req, res) {
        try {
            const { idConsulta } = req.params;
            const { relato, examen_fisico, plan_trabajo } = req.body;

            await pool.query(
                `UPDATE CONSULTA 
                 SET RELATO = ?, EXAMEN_FISICO_SIMPLIFICADO = ?, 
                     PLAN_TRABAJO = ?, UPDATED_AT = NOW()
                 WHERE ID_CONSULTA = ?`,
                [relato ?? null, examen_fisico ?? null, plan_trabajo ?? null, idConsulta]
            );

            await logActivity(req.user.dni, 'CONSULTA_EDITADA', {
                id_consulta: idConsulta
            });

            res.json({ message: 'Consulta actualizada exitosamente' });

        } catch (error) {
            console.error('Error al editar consulta:', error);
            res.status(500).json({ error: 'Error al editar consulta' });
        }
    },

    // Obtener consultas por paciente
    async getByPaciente(req, res) {
        try {
            const { dni } = req.params;
            const consultas = await consultaModel.getByPaciente(dni);
            res.json(consultas);
        } catch (error) {
            console.error('Error al obtener consultas:', error);
            res.status(500).json({ error: 'Error al obtener consultas' });
        }
    },

    // Subir examen auxiliar
    async uploadExamen(req, res) {
        try {
            const { idConsulta } = req.params;
            const { tipo_examen, nombre_examen = tipo_examen, descripcion, resultados } = req.body;
            const archivo = req.file;

            if (!tipo_examen || !descripcion) {
                return res.status(400).json({ error: 'Tipo y descripción del examen son requeridos' });
            }

            // Obtener ID_FICHA_CLINICA
            const [consulta] = await pool.query(
                `SELECT ID_FICHA_CLINICA FROM CONSULTA WHERE ID_CONSULTA = ?`,
                [idConsulta]
            );

            if (consulta.length === 0) {
                return res.status(404).json({ error: 'Consulta no encontrada' });
            }

            const nombreArchivo = archivo?.buffer
                ? randomUUID() + '-' + archivo.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_').slice(-180)
                : archivo?.filename ?? null;
            const params = [idConsulta, consulta[0].ID_FICHA_CLINICA, tipo_examen, nombre_examen,
                descripcion, resultados || null, nombreArchivo, req.user.id];
            const insertarExamen = `INSERT INTO EXAMENES_AUXILIARES 
                 (ID_CONSULTA, ID_FICHA_CLINICA, TIPO_EXAMEN, NOMBRE_EXAMEN,
                  DESCRIPCION, RESULTADOS, IMAGEN_DOC, FECHA_REGISTRO, REGISTRADO_POR, ESTADO)
                 VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, 'completado')`;
            let result;
            if (archivo?.buffer) {
                const connection = await pool.getConnection();
                try {
                    await connection.beginTransaction();
                    [result] = await connection.query(insertarExamen, params);
                    await connection.query(
                        'INSERT INTO ADJUNTOS_EXAMEN (ID_EXAMENESAUX, NOMBRE, CONTENIDO) VALUES (?, ?, ?)',
                        [result.insertId, nombreArchivo, archivo.buffer]
                    );
                    await connection.commit();
                } catch (error) {
                    await connection.rollback();
                    throw error;
                } finally {
                    connection.release();
                }
            } else {
                [result] = await pool.query(insertarExamen, params);
            }

            await logActivity(req.user.dni, 'EXAMEN_SUBIDO', {
                id_consulta: idConsulta,
                archivo: archivo?.originalname
            });

            res.status(201).json({ message: 'Examen registrado', idExamenAuxiliar: result.insertId });

        } catch (error) {
            console.error('Error al subir examen:', error);
            res.status(500).json({ error: 'Error al subir examen' });
        }
    }
};

module.exports = consultaController;