const pool = require('../config/database');
const PDFDocument = require('pdfkit');
const { logActivity } = require('../middleware/logActivity');

const reporteController = {
    async resumenDiagnostico(req, res) {
        const { fechaInicio, fechaFin, codigoCIE } = req.query;
        const parseFecha = value => {
            if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
            const date = new Date(value + 'T00:00:00Z');
            return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
        };
        const inicio = parseFecha(fechaInicio);
        const fin = parseFecha(fechaFin);
        if (!inicio || !fin || fin < inicio || typeof codigoCIE !== 'string' || !codigoCIE.trim()) {
            return res.status(400).json({ error: 'Ingrese fechas válidas y un diagnóstico CIE-10' });
        }

        const [[cie]] = await pool.query(
            'SELECT ID_CIE_10, CODIGO, DESCRIPCION FROM CATALOGO_CIE10 WHERE CODIGO = ?',
            [codigoCIE]
        );
        if (!cie) return res.status(404).json({ error: 'Código CIE-10 no encontrado' });

        const finExclusivo = new Date(fin.getTime() + 86400000).toISOString().slice(0, 10);
        const [[totales]] = await pool.query(
            `SELECT COUNT(*) AS consultas, COUNT(DISTINCT ID_FICHA_CLINICA) AS pacientes
             FROM CONSULTA WHERE ESTADO = 'completada' AND FECHA >= ? AND FECHA < ?`,
            [fechaInicio, finExclusivo]
        );
        const [lista] = await pool.query(
            `WITH coincidencias AS (
                SELECT c.ID_FICHA_CLINICA, c.ID_USUARIO, c.FECHA,
                    ROW_NUMBER() OVER (PARTITION BY c.ID_FICHA_CLINICA ORDER BY c.FECHA DESC, c.ID_CONSULTA DESC) AS posicion
                FROM CONSULTA c
                WHERE c.ESTADO = 'completada' AND c.FECHA >= ? AND c.FECHA < ?
                    AND EXISTS (SELECT 1 FROM DIAGNOSTICOS_CONSULTA d
                                WHERE d.ID_CONSULTA = c.ID_CONSULTA AND d.ID_CIE_10 = ?)
             )
             SELECT f.DNI, f.NOMBRE_APELLIDO, ${pool.ageYears('f.FECHA_NACIMIENTO', 'c.FECHA')} AS EDAD,
                    COALESCE(NULLIF(f.SEXO, ''), 'Sin registrar') AS SEXO, c.FECHA,
                    u.NOMBRE AS DOCTOR_NOMBRE, u.APELLIDO AS DOCTOR_APELLIDO
             FROM coincidencias c JOIN FICHA_CLINICA f USING (ID_FICHA_CLINICA)
             JOIN USUARIOS u USING (ID_USUARIO)
             WHERE c.posicion = 1 ORDER BY c.FECHA DESC, f.DNI`, [fechaInicio, finExclusivo, cie.ID_CIE_10]
        );
        const porSexo = new Map();
        for (const paciente of lista) porSexo.set(paciente.SEXO, (porSexo.get(paciente.SEXO) ?? 0) + 1);
        const now = new Date();
        await logActivity(req.user.dni, 'REPORTE_GENERADO', { codigoCIE, fechaInicio, fechaFin });
        res.json({
            message: 'Reporte generado',
            parametros: {
                diagnostico: cie.CODIGO, descripcion: cie.DESCRIPCION,
                rangoFechas: fechaInicio + ' al ' + fechaFin, periodoDias: (fin - inicio) / 86400000 + 1
            },
            resultados: {
                totalConsultasAtendidas: Number(totales.consultas), pacientesConDiagnostico: lista.length,
                porcentaje: (totales.pacientes ? lista.length * 100 / Number(totales.pacientes) : 0).toFixed(2) + '%',
                estadisticasSexo: Array.from(porSexo, ([SEXO, cantidad]) => ({ SEXO, cantidad }))
            },
            detallePacientes: { total: lista.length, lista },
            metadatos: {
                generadoPor: req.user.nombre,
                fechaGeneracion: now.toLocaleDateString('es-PE'), horaGeneracion: now.toLocaleTimeString('es-PE')
            }
        });
    },

    // Reporte de diagnósticos por período
    async generateDiagnosticoReporte(req, res) {
        try {
            const { fecha_inicio, fecha_fin, tipo } = req.query;

            let query = `
                SELECT 
                    cc.CODIGO,
                    cc.DESCRIPCION,
                    dc.TIPO,
                    COUNT(*) as total,
                    COUNT(DISTINCT c.ID_FICHA_CLINICA) as pacientes_unicos
                FROM DIAGNOSTICOS_CONSULTA dc
                JOIN CATALOGO_CIE10 cc ON dc.ID_CIE_10 = cc.ID_CIE_10
                JOIN CONSULTA c ON dc.ID_CONSULTA = c.ID_CONSULTA
                WHERE 1=1
            `;
            const params = [];

            if (fecha_inicio && fecha_fin) {
                query += ` AND DATE(c.FECHA) BETWEEN ? AND ?`;
                params.push(fecha_inicio, fecha_fin);
            }

            if (tipo) {
                query += ` AND dc.TIPO = ?`;
                params.push(tipo);
            }

            query += ` GROUP BY cc.ID_CIE_10, dc.TIPO ORDER BY total DESC LIMIT 50`;

            const [rows] = await pool.query(query, params);

            // Generar PDF
            const doc = new PDFDocument();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=reporte-diagnosticos.pdf');
            
            doc.pipe(res);

            // Título
            doc.fontSize(20).text('REPORTE DE DIAGNÓSTICOS', { align: 'center' });
            doc.moveDown();
            
            if (fecha_inicio && fecha_fin) {
                doc.fontSize(12).text(`Período: ${fecha_inicio} al ${fecha_fin}`, { align: 'center' });
            }
            doc.moveDown(2);

            // Tabla
            let y = doc.y;
            doc.fontSize(10);
            
            rows.forEach((row, index) => {
                if (y > 700) {
                    doc.addPage();
                    y = 50;
                }
                
                doc.text(`${index + 1}. ${row.CODIGO} - ${row.DESCRIPCION.substring(0, 50)}...`);
                doc.text(`   Tipo: ${row.TIPO} | Total: ${row.total} | Pacientes: ${row.pacientes_unicos}`);
                doc.moveDown(0.5);
                y = doc.y;
            });

            doc.end();

            await logActivity(req.user.dni, 'REPORTE_GENERADO', {
                tipo: 'diagnosticos',
                fecha_inicio,
                fecha_fin
            });

        } catch (error) {
            console.error('Error al generar reporte:', error);
            res.status(500).json({ error: 'Error al generar reporte' });
        }
    },

    // Reporte de citas por período
    async generateCitasReporte(req, res) {
        try {
            const { fecha_inicio, fecha_fin } = req.query;

            const [rows] = await pool.query(`
                SELECT 
                    DATE(FECHA) as fecha,
                    ESTADO,
                    COUNT(*) as total,
                    COUNT(DISTINCT ID_USUARIO) as doctores
                FROM CITAS
                WHERE DATE(FECHA) BETWEEN ? AND ?
                GROUP BY DATE(FECHA), ESTADO
                ORDER BY fecha DESC
            `, [fecha_inicio, fecha_fin]);

            // Resumen
            const [resumen] = await pool.query(`
                SELECT 
                    COUNT(*) as total_citas,
                    SUM(CASE WHEN ESTADO = 'programada' THEN 1 ELSE 0 END) as programadas,
                    SUM(CASE WHEN ESTADO = 'atendida' THEN 1 ELSE 0 END) as atendidas,
                    SUM(CASE WHEN ESTADO = 'cancelada' THEN 1 ELSE 0 END) as canceladas
                FROM CITAS
                WHERE DATE(FECHA) BETWEEN ? AND ?
            `, [fecha_inicio, fecha_fin]);

            res.json({
                resumen: resumen[0],
                detalle: rows
            });

        } catch (error) {
            console.error('Error al generar reporte de citas:', error);
            res.status(500).json({ error: 'Error al generar reporte' });
        }
    },

    // Reporte de actividad de usuarios
    async generateUserActivityReporte(req, res) {
        try {
            const { fecha_inicio, fecha_fin } = req.query;

            const [rows] = await pool.query(`
                SELECT 
                    u.DNI,
                    u.NOMBRE,
                    u.APELLIDO,
                    u.CARGO,
                    COUNT(DISTINCT c.ID_CONSULTA) as consultas_realizadas,
                    COUNT(DISTINCT ct.ID_CITAS) as citas_atendidas
                FROM USUARIOS u
                LEFT JOIN CONSULTA c ON u.ID_USUARIO = c.ID_USUARIO 
                    AND DATE(c.FECHA) BETWEEN ? AND ?
                LEFT JOIN CITAS ct ON u.ID_USUARIO = ct.ID_USUARIO
                    AND DATE(ct.FECHA) BETWEEN ? AND ?
                GROUP BY u.ID_USUARIO
                ORDER BY consultas_realizadas DESC
            `, [fecha_inicio, fecha_fin, fecha_inicio, fecha_fin]);

            res.json(rows);
        } catch (error) {
            console.error('Error al generar reporte de actividad:', error);
            res.status(500).json({ error: 'Error al generar reporte' });
        }
    }
};

module.exports = reporteController;