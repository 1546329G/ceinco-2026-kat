const pool = require('../config/database');

const seccionesExamen = {
    examenGeneral: ['estadoGeneral', 'habitus', 'hidratacion', 'conciencia', 'orientacion'],
    examenRegional: ['cabeza', 'ojos', 'oidos', 'nariz', 'boca', 'cuello', 'torax', 'abdomen'],
    examenCardiovascular: ['ritmoCardiaco', 'ruidosCardiacos', 'soplos', 'frotes', 'pulsosPerifericos'],
    examenAbdominal: ['formaAbdomen', 'peristalsis', 'visceromegalias', 'dolorPalpacion', 'signosIrritacion'],
    examenExtremidades: ['extremidadesSuperiores', 'extremidadesInferiores', 'edema', 'pulsosExtremidades', 'temperaturaPiel'],
    examenNeurologico: ['motilidad', 'sensibilidad', 'reflejos', 'fuerzaMuscular', 'coordinacion']
};

async function cargarFicha(dni) {
    const [[ficha]] = await pool.query(
        `SELECT f.ID_FICHA_CLINICA, a.ID_ANTECEDENTES, a.DATOS_FORMULARIO,
                (SELECT COUNT(*) FROM CONSULTA c WHERE c.ID_FICHA_CLINICA = f.ID_FICHA_CLINICA
                    AND c.ESTADO = 'completada') AS totalConsultas
         FROM FICHA_CLINICA f LEFT JOIN ANTECEDENTES a USING (ID_FICHA_CLINICA)
         WHERE f.DNI = ?`, [dni]
    );
    return ficha;
}

module.exports = {
    async primeraConsulta(req, res) {
        const ficha = await cargarFicha(req.params.dni);
        if (!ficha) return res.status(404).json({ error: 'Paciente no encontrado' });
        const esPrimeraConsulta = Number(ficha.totalConsultas) === 0;
        res.json({
            idFichaClinica: ficha.ID_FICHA_CLINICA, esPrimeraConsulta,
            totalConsultas: Number(ficha.totalConsultas), tieneAntecedentes: Boolean(ficha.ID_ANTECEDENTES),
            mostrarAntecedentes: esPrimeraConsulta && !ficha.ID_ANTECEDENTES
        });
    },

    async guardarAntecedentes(req, res) {
        const ficha = await cargarFicha(req.params.dni);
        if (!ficha) return res.status(404).json({ error: 'Paciente no encontrado' });
        const [result] = await pool.query(
            `INSERT INTO ANTECEDENTES (ID_FICHA_CLINICA, DATOS_FORMULARIO) VALUES (?, ?)
             ${pool.isPostgres
                ? 'ON CONFLICT (ID_FICHA_CLINICA) DO UPDATE SET DATOS_FORMULARIO = EXCLUDED.DATOS_FORMULARIO'
                : 'ON DUPLICATE KEY UPDATE DATOS_FORMULARIO = VALUES(DATOS_FORMULARIO)'}`,
            [ficha.ID_FICHA_CLINICA, JSON.stringify(req.body)]
        );
        res.status(201).json({ message: 'Antecedentes guardados', idAntecedentes: ficha.ID_ANTECEDENTES || result.insertId });
    },

    async registrarSignos(req, res) {
        const { idFichaClinica, pa, pulso, tipoPulso, sao2, fr, peso, talla, temperatura } = req.body;
        const valores = { pa, pulso, tipoPulso, sao2, fr, peso, talla, temperatura };
        const numericos = [pulso, peso, talla, sao2, fr, temperatura].filter(value => value != null);
        if (!Number.isInteger(idFichaClinica) || typeof pa !== 'string' || !/^\d{2,3}\/\d{2,3}$/.test(pa)
            || !pulso || !peso || !talla || numericos.some(value => !Number.isFinite(value) || value <= 0)
            || (sao2 != null && sao2 > 100)) {
            return res.status(400).json({ error: 'Verifique la ficha y los valores de signos vitales' });
        }
        const [result] = await pool.query(
            `INSERT INTO SIGNOS_VITALES_PRECONSULTA (ID_FICHA_CLINICA, ID_USUARIO, DATOS)
             SELECT ID_FICHA_CLINICA, ?, ? FROM FICHA_CLINICA WHERE ID_FICHA_CLINICA = ?`,
            [req.user.id, JSON.stringify(valores), idFichaClinica]
        );
        if (!result.affectedRows) return res.status(404).json({ error: 'Ficha no encontrada' });
        res.status(201).json({ message: 'Signos vitales registrados', idExamenClinico: result.insertId });
    },

    async signosDeHoy(req, res) {
        const [[row]] = await pool.query(
            `SELECT ID_SIGNOS FROM SIGNOS_VITALES_PRECONSULTA
             WHERE ID_FICHA_CLINICA = ? AND FECHA_REGISTRO >= CURRENT_DATE AND ID_CONSULTA IS NULL
             ORDER BY FECHA_REGISTRO DESC, ID_SIGNOS DESC LIMIT 1`, [req.params.idFicha]
        );
        res.json({ tieneSignosVitalesHoy: Boolean(row), idExamenClinico: row?.ID_SIGNOS ?? null });
    },

    async obtenerExamenFisico(req, res) {
        const [[row]] = await pool.query(
            `SELECT c.ES_PRIMERA_CONSULTA, c.EXAMEN_FISICO_SIMPLIFICADO, c.EXAMEN_FISICO_DETALLADO,
                    f.DNI, f.NOMBRE_APELLIDO
             FROM CONSULTA c JOIN FICHA_CLINICA f USING (ID_FICHA_CLINICA) WHERE c.ID_CONSULTA = ?`, [req.params.idConsulta]
        );
        if (!row) return res.status(404).json({ error: 'Consulta no encontrada' });
        const examenDetallado = row.EXAMEN_FISICO_DETALLADO ? JSON.parse(row.EXAMEN_FISICO_DETALLADO) : null;
        res.json({ data: {
            tipoConsulta: row.ES_PRIMERA_CONSULTA ? 'primera' : 'control',
            paciente: { dni: row.DNI, nombre: row.NOMBRE_APELLIDO },
            examenDetallado, examenSimplificado: row.EXAMEN_FISICO_SIMPLIFICADO,
            observaciones: examenDetallado?.observaciones,
            metadata: {
                tieneExamenDetallado: Boolean(examenDetallado),
                tieneExamenSimplificado: Boolean(row.EXAMEN_FISICO_SIMPLIFICADO),
                tieneObservaciones: Boolean(examenDetallado?.observaciones)
            }
        } });
    },

    async guardarExamenFisico(req, res) {
        const examen = Object.fromEntries(Object.entries(seccionesExamen).map(([seccion, campos]) =>
            [seccion, Object.fromEntries(campos.map(campo => [campo, req.body[campo] ?? '']))]
        ));
        examen.observaciones = req.body.observaciones ?? '';
        const [result] = await pool.query(
            'UPDATE CONSULTA SET EXAMEN_FISICO_DETALLADO = ? WHERE ID_CONSULTA = ?',
            [JSON.stringify(examen), req.params.idConsulta]
        );
        if (!result.affectedRows) return res.status(404).json({ error: 'Consulta no encontrada' });
        res.json({ message: 'Examen físico guardado' });
    },

    async agregarDiagnostico(req, res) {
        const [result] = await pool.query(
            `INSERT INTO DIAGNOSTICOS_CONSULTA (ID_CONSULTA, ID_CIE_10, TIPO)
             SELECT c.ID_CONSULTA, cie.ID_CIE_10, 'secundario'
             FROM CONSULTA c CROSS JOIN CATALOGO_CIE10 cie
             WHERE c.ID_CONSULTA = ? AND cie.CODIGO = ? AND cie.ACTIVO = 1
               AND NOT EXISTS (SELECT 1 FROM DIAGNOSTICOS_CONSULTA d
                               WHERE d.ID_CONSULTA = c.ID_CONSULTA AND d.ID_CIE_10 = cie.ID_CIE_10)`,
            [req.params.idConsulta, req.body.codigoCIE]
        );
        if (!result.affectedRows) return res.status(409).json({ error: 'Diagnóstico duplicado, código inactivo o consulta inexistente' });
        res.status(201).json({ message: 'Diagnóstico agregado', id: result.insertId });
    },

    async eliminarDiagnostico(req, res) {
        const [result] = await pool.query(
            "DELETE FROM DIAGNOSTICOS_CONSULTA WHERE ID_CONSULTA = ? AND ID_DIAGNOSTICO = ? AND TIPO = 'secundario'",
            [req.params.idConsulta, req.params.idDiagnostico]
        );
        if (!result.affectedRows) return res.status(404).json({ error: 'Diagnóstico secundario no encontrado' });
        res.json({ message: 'Diagnóstico eliminado' });
    }
};
