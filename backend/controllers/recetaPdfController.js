const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const consultaModel = require('../models/consultaModel');
const pacienteModel = require('../models/pacienteModel');
const { logActivity } = require('../middleware/logActivity');

const LOGO = path.join(__dirname, '../assets/logo.png');
const COLOR = { primario: '#1e40af', texto: '#0f172a', suave: '#64748b', borde: '#cbd5e1' };

const fechaLarga = valor => {
    if (!valor) return '';
    const [a, m, d] = String(valor).slice(0, 10).split('-').map(Number);
    return new Date(a, m - 1, d).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
};

// Receta médica en PDF (A5) para mostrarla dentro de la app, descargarla o imprimirla.
async function recetaPdf(req, res) {
    const idConsulta = Number(req.params.idConsulta);
    if (!Number.isInteger(idConsulta) || idConsulta < 1) return res.status(400).json({ error: 'Consulta no válida' });

    const consulta = await consultaModel.getById(idConsulta);
    if (!consulta) return res.status(404).json({ error: 'Consulta no encontrada' });
    const receta = consulta.receta;
    if (!receta || !receta.medicamentos?.length) return res.status(404).json({ error: 'La consulta no tiene receta registrada' });
    const paciente = await pacienteModel.findByDni(consulta.DNI);

    const doc = new PDFDocument({
        size: 'A5', margins: { top: 36, bottom: 36, left: 40, right: 40 },
        info: { Title: `Receta ${receta.ID_RECETA} - ${consulta.paciente_nombre}`, Author: 'CEINCO' }
    });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    const terminado = new Promise((resolve, reject) => { doc.on('end', resolve); doc.on('error', reject); });

    const izquierda = doc.page.margins.left;
    const ancho = doc.page.width - izquierda - doc.page.margins.right;
    const linea = (y, color = COLOR.borde, grosor = 0.6) =>
        doc.moveTo(izquierda, y).lineTo(izquierda + ancho, y).lineWidth(grosor).strokeColor(color).stroke();
    const titulo = texto => {
        doc.moveDown(0.6).font('Helvetica-Bold').fontSize(8.5).fillColor(COLOR.primario)
            .text(texto.toUpperCase(), izquierda, doc.y, { characterSpacing: 0.6 });
        doc.moveDown(0.25);
    };

    // Membrete
    const top = doc.y;
    if (fs.existsSync(LOGO)) doc.image(LOGO, izquierda, top, { fit: [34, 34] });
    doc.font('Helvetica-Bold').fontSize(15).fillColor(COLOR.texto).text('CEINCO', izquierda + 42, top + 2);
    doc.font('Helvetica').fontSize(8.5).fillColor(COLOR.suave).text('Receta médica', izquierda + 42, top + 20);
    doc.font('Helvetica').fontSize(8.5).fillColor(COLOR.suave)
        .text(`N.º ${receta.ID_RECETA}`, izquierda, top + 4, { width: ancho, align: 'right' })
        .text(fechaLarga(receta.FECHA_EMISION || consulta.FECHA), izquierda, top + 18, { width: ancho, align: 'right' });
    doc.y = top + 42;
    linea(doc.y, COLOR.primario, 1.4);

    // Paciente
    doc.y += 8;
    const filaY = doc.y;
    const datos = [
        ['Paciente', consulta.paciente_nombre, 0.55],
        ['DNI', consulta.DNI, 0.22],
        ['Edad', paciente?.EDAD != null ? `${paciente.EDAD} años` : '—', 0.23]
    ];
    let x = izquierda;
    for (const [etiqueta, valor, fraccion] of datos) {
        const w = ancho * fraccion;
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor(COLOR.suave).text(etiqueta, x, filaY, { width: w - 6 });
        doc.font('Helvetica-Bold').fontSize(10).fillColor(COLOR.texto).text(String(valor ?? ''), x, filaY + 10, { width: w - 6 });
        x += w;
    }
    doc.x = izquierda;
    doc.y = Math.max(doc.y, filaY + 26);
    linea(doc.y + 4);
    doc.y += 4;

    // Diagnóstico
    const diagnosticos = [...(consulta.diagnosticos ?? [])]
        .sort((a, b) => (a.TIPO === 'principal' ? -1 : b.TIPO === 'principal' ? 1 : 0));
    if (diagnosticos.length) {
        titulo('Diagnóstico');
        for (const d of diagnosticos) {
            doc.font('Helvetica-Bold').fontSize(9).fillColor(COLOR.texto).text(`${d.CODIGO}  `, izquierda, doc.y, { continued: true })
                .font('Helvetica').fillColor('#334155').text(d.DESCRIPCION);
        }
    }

    // Rp.
    doc.moveDown(0.7);
    doc.font('Helvetica-BoldOblique').fontSize(18).fillColor(COLOR.primario).text('Rp.', izquierda);
    doc.moveDown(0.2);
    receta.medicamentos.forEach((m, i) => {
        const nombre = [m.medicamento, m.concentracion].filter(Boolean).join(' ');
        doc.font('Helvetica-Bold').fontSize(10.5).fillColor(COLOR.texto)
            .text(`${i + 1}. ${nombre}`, izquierda + 8, doc.y, { continued: Boolean(m.forma_farmaceutica) });
        if (m.forma_farmaceutica) doc.font('Helvetica').fontSize(9).fillColor(COLOR.suave).text(`  ·  ${m.forma_farmaceutica}`);
        const pauta = [m.dosis, m.frecuencia, m.duracion && `por ${m.duracion}`].filter(Boolean).join('  ·  ');
        if (pauta) doc.font('Helvetica').fontSize(9.5).fillColor('#334155').text(pauta, izquierda + 22, doc.y, { width: ancho - 22 });
        doc.moveDown(0.5);
    });

    // Indicaciones
    if (receta.INDICACIONES_GENERALES) {
        titulo('Indicaciones');
        doc.font('Helvetica').fontSize(9.5).fillColor('#334155').text(receta.INDICACIONES_GENERALES, izquierda, doc.y, { width: ancho });
    }

    // Firma (al pie de la página si hay espacio)
    const doctor = [consulta.doctor_nombre, consulta.doctor_apellido].filter(Boolean).join(' ');
    const firmaY = Math.max(doc.y + 40, doc.page.height - doc.page.margins.bottom - 46);
    if (firmaY + 40 > doc.page.height - doc.page.margins.bottom) doc.addPage();
    const yFirma = Math.min(firmaY, doc.page.height - doc.page.margins.bottom - 46);
    const anchoFirma = 170;
    const xFirma = izquierda + ancho - anchoFirma;
    doc.moveTo(xFirma, yFirma).lineTo(xFirma + anchoFirma, yFirma).lineWidth(0.8).strokeColor('#334155').stroke();
    doc.font('Helvetica-Bold').fontSize(9).fillColor(COLOR.texto)
        .text(doctor ? `Dr(a). ${doctor}` : 'Médico tratante', xFirma, yFirma + 5, { width: anchoFirma, align: 'center' });
    doc.font('Helvetica').fontSize(7.5).fillColor(COLOR.suave).text('Firma y sello', xFirma, doc.y + 1, { width: anchoFirma, align: 'center' });

    doc.end();
    await terminado;
    const pdf = Buffer.concat(chunks);

    await logActivity(req.user.dni, 'RECETA_PDF', { id_consulta: idConsulta, id_receta: receta.ID_RECETA });
    res.set('Cache-Control', 'private, no-store');
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `inline; filename="receta-${receta.ID_RECETA}.pdf"`);
    res.send(pdf);
}

module.exports = { recetaPdf };
