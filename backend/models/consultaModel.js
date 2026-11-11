const pool = require('../config/database');

async function guardarReceta(connection, consultaId, idFichaClinica, idUsuario, receta) {
    const [recetaResult] = await connection.query(
        `INSERT INTO RECETAS 
         (ID_CONSULTA, ID_FICHA_CLINICA, ID_USUARIO, INDICACIONES_GENERALES, FECHA_EMISION)
         VALUES (?, ?, ?, ?, NOW())`,
        [consultaId, idFichaClinica, idUsuario, receta.indicaciones || null]
    );

    for (let med of receta.medicamentos) {
        await connection.query(
            `INSERT INTO RECETA_DETALLE 
             (ID_RECETA, ID_MEDICAMENTO, DOSIS, FRECUENCIA, DURACION)
             VALUES (?, ?, ?, ?, ?)`,
            [recetaResult.insertId, med.id_medicamento, med.dosis ?? null, med.frecuencia ?? null, med.duracion ?? null]
        );
    }

    await connection.query(
        `UPDATE CONSULTA SET ID_RECETA = ? WHERE ID_CONSULTA = ?`,
        [recetaResult.insertId, consultaId]
    );
    return recetaResult.insertId;
}

const consultaModel = {
    async registrarReceta(consultaId, idUsuario, receta) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const [[consulta]] = await connection.query(
                'SELECT ID_FICHA_CLINICA FROM CONSULTA WHERE ID_CONSULTA = ? FOR UPDATE', [consultaId]
            );
            if (!consulta) {
                await connection.rollback();
                return null;
            }
            const id = await guardarReceta(connection, consultaId, consulta.ID_FICHA_CLINICA, idUsuario, receta);
            await connection.commit();
            return id;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // Registrar consulta completa
    async registrarConsultaCompleta(data, idUsuario) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const {
                idCita,
                idConsulta,
                dniPaciente,
                relato,
                examen_fisico,
                plan_trabajo,
                idFichaClinica: fichaSolicitada,
                idExamenClinico,
                examenFisicoDetallado,
                diagnosticosSecundarios,
                diagnosticos,
                receta,
                examenes_auxiliares
            } = data;

            let signos_vitales = data.signos_vitales;
            let idFichaClinica;
            let consultaId = idConsulta;

            // Si no hay idConsulta, crear nueva
            if (!consultaId) {
                if (idExamenClinico) {
                    const [[signos]] = await connection.query(
                        `SELECT ID_FICHA_CLINICA, ID_CONSULTA, DATOS FROM SIGNOS_VITALES_PRECONSULTA
                         WHERE ID_SIGNOS = ? FOR UPDATE`, [idExamenClinico]
                    );
                    if (!signos || signos.ID_FICHA_CLINICA !== Number(fichaSolicitada)) {
                        throw Object.assign(new Error('Los signos vitales no corresponden al paciente'), { status: 400 });
                    }
                    if (signos.ID_CONSULTA) {
                        await connection.commit();
                        return signos.ID_CONSULTA;
                    }
                    idFichaClinica = signos.ID_FICHA_CLINICA;
                    signos_vitales = JSON.parse(signos.DATOS);
                } else if (idCita) {
                    const [cita] = await connection.query(
                        `SELECT ID_FICHA_CLINICA FROM CITAS WHERE ID_CITAS = ?`,
                        [idCita]
                    );
                    idFichaClinica = cita[0]?.ID_FICHA_CLINICA;
                } else if (dniPaciente) {
                    const [paciente] = await connection.query(
                        `SELECT ID_FICHA_CLINICA FROM FICHA_CLINICA WHERE DNI = ?`,
                        [dniPaciente]
                    );
                    idFichaClinica = paciente[0]?.ID_FICHA_CLINICA;
                }

                if (!idFichaClinica) {
                    throw new Error('No se pudo identificar al paciente');
                }

                // Verificar si es primera consulta
                const [consultasPrevias] = await connection.query(
                    `SELECT COUNT(*) as total FROM CONSULTA WHERE ID_FICHA_CLINICA = ? AND ESTADO = 'completada'`,
                    [idFichaClinica]
                );
                const esPrimeraConsulta = Number(consultasPrevias[0].total) === 0;

                // Crear consulta
                const [result] = await connection.query(
                    `INSERT INTO CONSULTA 
                     (ID_FICHA_CLINICA, ID_USUARIO, ES_PRIMERA_CONSULTA, FECHA, 
                      RELATO, EXAMEN_FISICO_SIMPLIFICADO, PLAN_TRABAJO, ESTADO)
                     VALUES (?, ?, ?, NOW(), ?, ?, ?, 'completada')`,
                    [idFichaClinica, idUsuario, Number(esPrimeraConsulta), 
                     relato ?? null, examen_fisico ?? null, plan_trabajo ?? null]
                );
                consultaId = result.insertId;
                if (idExamenClinico) {
                    await connection.query(
                        'UPDATE SIGNOS_VITALES_PRECONSULTA SET ID_CONSULTA = ? WHERE ID_SIGNOS = ?',
                        [consultaId, idExamenClinico]
                    );
                }

                // Actualizar cita si existe
                if (idCita) {
                    await connection.query(
                        `UPDATE CITAS SET ESTADO = 'atendida' WHERE ID_CITAS = ?`,
                        [idCita]
                    );
                }
            } else {
                // Actualizar consulta existente
                const [consulta] = await connection.query(
                    `SELECT ID_FICHA_CLINICA FROM CONSULTA WHERE ID_CONSULTA = ?`,
                    [consultaId]
                );
                idFichaClinica = consulta[0]?.ID_FICHA_CLINICA;

                await connection.query(
                    `UPDATE CONSULTA 
                     SET RELATO = ?, EXAMEN_FISICO_SIMPLIFICADO = ?, 
                         PLAN_TRABAJO = ?, UPDATED_AT = NOW()
                     WHERE ID_CONSULTA = ?`,
                    [relato ?? null, examen_fisico ?? null, plan_trabajo ?? null, consultaId]
                );
            }

            if (examenFisicoDetallado) {
                await connection.query(
                    'UPDATE CONSULTA SET EXAMEN_FISICO_DETALLADO = ? WHERE ID_CONSULTA = ?',
                    [JSON.stringify(examenFisicoDetallado), consultaId]
                );
            }

            for (const codigo of new Set(diagnosticosSecundarios ?? [])) {
                const [result] = await connection.query(
                    `INSERT INTO DIAGNOSTICOS_CONSULTA (ID_CONSULTA, ID_CIE_10, TIPO)
                     SELECT ?, ID_CIE_10, 'secundario' FROM CATALOGO_CIE10 WHERE CODIGO = ? AND ACTIVO = 1`,
                    [consultaId, codigo]
                );
                if (!result.affectedRows) {
                    throw Object.assign(new Error('Código CIE-10 no disponible: ' + codigo), { status: 400 });
                }
            }

            // Registrar signos vitales
            if (signos_vitales) {
                // Eliminar signos anteriores si existen
                await connection.query(
                    `DELETE FROM EXAMEN_CLINICO WHERE ID_CONSULTA = ?`,
                    [consultaId]
                );

                // Calcular IMC si hay peso y talla
                let imc = null;
                if (signos_vitales.peso && signos_vitales.talla && signos_vitales.talla > 0) {
                    imc = (signos_vitales.peso / (signos_vitales.talla * signos_vitales.talla)).toFixed(2);
                }

                await connection.query(
                    `INSERT INTO EXAMEN_CLINICO 
                     (ID_CONSULTA, ID_FICHA_CLINICA, PA, PULSO, SAO2, FR, 
                      PESO, TALLA, TEMPERATURA, IMC)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [consultaId, idFichaClinica, 
                     signos_vitales.pa, signos_vitales.pulso, signos_vitales.sao2,
                     signos_vitales.fr, signos_vitales.peso, signos_vitales.talla,
                     signos_vitales.temperatura, imc]
                );
            }

            // Registrar diagnósticos
            if (diagnosticos && diagnosticos.length > 0) {
                // Eliminar diagnósticos anteriores
                await connection.query(
                    `DELETE FROM DIAGNOSTICOS_CONSULTA WHERE ID_CONSULTA = ?`,
                    [consultaId]
                );

                for (let diag of diagnosticos) {
                    await connection.query(
                        `INSERT INTO DIAGNOSTICOS_CONSULTA 
                         (ID_CONSULTA, ID_CIE_10, TIPO, OBSERVACIONES)
                         VALUES (?, ?, ?, ?)`,
                        [consultaId, diag.id_cie10, diag.tipo, diag.observaciones]
                    );
                }
            }

            // Registrar receta
            if (receta && receta.medicamentos && receta.medicamentos.length > 0) {
                await guardarReceta(connection, consultaId, idFichaClinica, idUsuario, receta);
            }

            // Registrar exámenes auxiliares
            if (examenes_auxiliares && examenes_auxiliares.length > 0) {
                for (let exam of examenes_auxiliares) {
                    await connection.query(
                        `INSERT INTO EXAMENES_AUXILIARES 
                         (ID_CONSULTA, ID_FICHA_CLINICA, TIPO_EXAMEN, NOMBRE_EXAMEN,
                          DESCRIPCION, FECHA_SOLICITUD, REGISTRADO_POR, ESTADO)
                         VALUES (?, ?, ?, ?, ?, NOW(), ?, 'solicitado')`,
                        [consultaId, idFichaClinica, exam.tipo, exam.nombre,
                         exam.descripcion, idUsuario]
                    );
                }
            }

            await connection.commit();
            return consultaId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // Obtener consulta por ID
    async getById(idConsulta) {
        const [consulta] = await pool.query(
            `SELECT c.*, 
                    u.NOMBRE as doctor_nombre, u.APELLIDO as doctor_apellido,
                    fc.DNI, fc.NOMBRE_APELLIDO as paciente_nombre
             FROM CONSULTA c
             JOIN USUARIOS u ON c.ID_USUARIO = u.ID_USUARIO
             JOIN FICHA_CLINICA fc ON c.ID_FICHA_CLINICA = fc.ID_FICHA_CLINICA
             WHERE c.ID_CONSULTA = ?`,
            [idConsulta]
        );

        if (consulta.length === 0) return null;

        const result = consulta[0];

        // Signos vitales
        const [signos] = await pool.query(
            `SELECT * FROM EXAMEN_CLINICO WHERE ID_CONSULTA = ?`,
            [idConsulta]
        );
        result.signos_vitales = signos[0] || null;

        // Diagnósticos
        const [diagnosticos] = await pool.query(
            `SELECT dc.*, cc.CODIGO, cc.DESCRIPCION
             FROM DIAGNOSTICOS_CONSULTA dc
             JOIN CATALOGO_CIE10 cc ON dc.ID_CIE_10 = cc.ID_CIE_10
             WHERE dc.ID_CONSULTA = ?`,
            [idConsulta]
        );
        result.diagnosticos = diagnosticos;

        // Receta
        if (result.ID_RECETA) {
            const [receta] = await pool.query(
                `SELECT r.*, rd.*, m.NOMBRE as medicamento_nombre, m.CONCENTRACION
                 FROM RECETAS r
                 LEFT JOIN RECETA_DETALLE rd ON r.ID_RECETA = rd.ID_RECETA
                 LEFT JOIN MEDICAMENTOS m ON rd.ID_MEDICAMENTO = m.ID_MEDICAMENTO
                 WHERE r.ID_RECETA = ?`,
                [result.ID_RECETA]
            );
            
            if (receta.length > 0) {
                result.receta = {
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
            }
        }

        // Exámenes auxiliares
        const [examenes] = await pool.query(
            `SELECT * FROM EXAMENES_AUXILIARES WHERE ID_CONSULTA = ?`,
            [idConsulta]
        );
        result.examenes_auxiliares = examenes;

        return result;
    },

    // Obtener consultas por paciente
    async getByPaciente(dni) {
        const [rows] = await pool.query(
            `SELECT c.*, 
                    u.NOMBRE as doctor_nombre, u.APELLIDO as doctor_apellido
             FROM CONSULTA c
             JOIN FICHA_CLINICA fc ON c.ID_FICHA_CLINICA = fc.ID_FICHA_CLINICA
             LEFT JOIN USUARIOS u ON c.ID_USUARIO = u.ID_USUARIO
             WHERE fc.DNI = ?
             ORDER BY c.FECHA DESC`,
            [dni]
        );
        return rows;
    }
};

module.exports = consultaModel;