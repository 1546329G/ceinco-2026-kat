const PDFDocument = require('pdfkit');
const { presentarAntecedentes, leerCampos } = require('./datosClinicos');

const color = {
    navy: '#122C3A', teal: '#176C68', mint: '#DDF4EE', pale: '#F1F7F6',
    muted: '#48616A', ink: '#18333D', rule: '#CEE0DE', white: '#FFFFFF'
};
const margin = 46;
const fecha = value => {
    const match = String(value ?? '').match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}:\d{2}))?/);
    return match ? `${match[3]}/${match[2]}/${match[1]}${match[4] ? ' | ' + match[4] : ''}` : 'Sin registrar';
};

function crearHistoriaClinicaPdf(historia, soloAntecedentes) {
    const title = soloAntecedentes ? 'Antecedentes clínicos' : 'Historia clínica';
    const doc = new PDFDocument({
        size: 'A4', margins: { top: 105, bottom: 58, left: margin, right: margin },
        autoFirstPage: false, bufferPages: true,
        info: { Title: title + ' - ' + historia.NOMBRE_APELLIDO, Author: 'CEINCO' }
    });
    const generated = new Intl.DateTimeFormat('es-PE', { dateStyle: 'short', timeZone: 'America/Lima' }).format(new Date());
    const width = () => doc.page.width - 2 * margin;

    const header = () => {
        doc.rect(0, 0, doc.page.width, 78).fill(color.navy);
        doc.rect(0, 78, doc.page.width, 4).fill(color.teal);
        doc.font('Helvetica-Bold').fontSize(11).fillColor(color.mint).text('CEINCO', margin, 16, { lineBreak: false });
        doc.fontSize(22).fillColor(color.white).text(title, margin, 36, { lineBreak: false });
        const fechaEmision = 'Emitido el ' + generated;
        doc.font('Helvetica').fontSize(9).fillColor(color.mint);
        doc.text(fechaEmision, doc.page.width - margin - doc.widthOfString(fechaEmision), 21, { lineBreak: false });
        doc.x = margin;
        doc.y = 104;
    };
    doc.on('pageAdded', header);
    doc.addPage();

    const espacio = height => {
        if (doc.y + height > doc.page.height - doc.page.margins.bottom) doc.addPage();
    };

    const seccion = titleText => {
        espacio(45);
        const y = doc.y;
        doc.roundedRect(margin, y, width(), 24, 4).fill(color.mint);
        doc.font('Helvetica-Bold').fontSize(10).fillColor(color.teal).text(titleText.toUpperCase(), margin + 10, y + 7, { lineBreak: false });
        doc.x = margin;
        doc.y = y + 32;
    };

    const campo = (label, value) => {
        if (value == null || value === '') return;
        espacio(32);
        doc.font('Helvetica-Bold').fontSize(9).fillColor(color.teal).text(label.replaceAll(' · ', ' / '), { width: width() });
        doc.font('Helvetica').fontSize(10).fillColor(color.ink).text(String(value), { width: width(), lineGap: 2 });
        doc.moveDown(0.5);
    };

    const campoBreve = ({ nombre, valor }) => {
        espacio(22);
        doc.font('Helvetica-Bold').fontSize(9).fillColor(color.teal)
            .text(nombre.replaceAll(' · ', ' / ') + ': ', { continued: true, width: width() });
        doc.font('Helvetica').fontSize(9).fillColor(color.ink).text(valor, { lineGap: 2 });
        doc.moveDown(0.6);
    };

    seccion('Datos del paciente');
    campo('Nombre completo', historia.NOMBRE_APELLIDO);
    const datos = [
        ['DNI', historia.DNI], ['Fecha de nacimiento', fecha(historia.FECHA_NACIMIENTO)],
        ['Edad', historia.EDAD == null ? null : historia.EDAD + ' años'], ['Sexo', historia.sexo_desc || historia.SEXO],
        ['Estado civil', historia.estado_civil_desc || historia.ESTADO_CIVIL], ['Ocupación', historia.OCUPACION],
        ['Teléfono', historia.TELEFONO], ['Correo', historia.EMAIL], ['Domicilio', historia.DOMICILIO],
        ['Procedencia', historia.PROCEDENCIA]
    ];
    const column = (width() - 30) / 2;
    for (let i = 0; i < datos.length; i += 2) {
        const row = datos.slice(i, i + 2);
        doc.font('Helvetica').fontSize(10);
        const height = 18 + Math.max(...row.map(([, value]) =>
            doc.heightOfString(String(value || 'Sin registrar'), { width: column })));
        espacio(height);
        const y = doc.y;
        row.forEach(([label, value], index) => {
            const x = margin + 9 + index * (column + 12);
            doc.font('Helvetica-Bold').fontSize(8).fillColor(color.muted).text(label, x, y, { width: column });
            doc.font('Helvetica').fontSize(10).fillColor(color.ink).text(String(value || 'Sin registrar'), x, y + 11, { width: column });
        });
        doc.x = margin;
        doc.y = y + height;
    }
    doc.moveDown(0.6);

    seccion('Antecedentes');
    const antecedentes = presentarAntecedentes(historia.antecedentes);
    if (!antecedentes.length) campo('Registro', 'Sin antecedentes registrados.');
    antecedentes.forEach(campoBreve);

    if (!soloAntecedentes) {
        seccion('Consultas registradas');
        if (!historia.consultas?.length) campo('Registro', 'Sin consultas registradas.');
        for (const [index, consulta] of (historia.consultas ?? []).entries()) {
            espacio(55);
            const y = doc.y;
            doc.roundedRect(margin, y, width(), 23, 4).fill(color.pale);
            doc.font('Helvetica-Bold').fontSize(10).fillColor(color.navy)
                .text(`Consulta ${index + 1}  |  ${fecha(consulta.FECHA)}`, margin + 9, y + 7, { lineBreak: false });
            doc.x = margin;
            doc.y = y + 30;
            campo('Profesional', [consulta.doctor_nombre, consulta.doctor_apellido].filter(Boolean).join(' '));
            campo('Relato', consulta.RELATO);
            campo('Examen físico', consulta.EXAMEN_FISICO_SIMPLIFICADO);
            leerCampos(consulta.EXAMEN_FISICO_DETALLADO).forEach(campoBreve);
            if (consulta.signos_vitales) {
                const sv = consulta.signos_vitales;
                campo('Signos vitales', [
                    sv.PA && 'PA ' + sv.PA, sv.PULSO && 'Pulso ' + sv.PULSO,
                    sv.SAO2 && 'SpO2 ' + sv.SAO2 + '%', sv.FR && 'FR ' + sv.FR,
                    sv.TEMPERATURA && 'Temperatura ' + sv.TEMPERATURA + ' °C',
                    sv.PESO && 'Peso ' + sv.PESO + ' kg', sv.TALLA && 'Talla ' + sv.TALLA + ' m',
                    sv.IMC && 'IMC ' + sv.IMC
                ].filter(Boolean).join('  |  '));
            }
            consulta.diagnosticos?.forEach(d => campo('Diagnóstico ' + d.TIPO, d.CODIGO + ' - ' + d.diagnostico_desc));
            campo('Plan de trabajo', consulta.PLAN_TRABAJO);
            campo('Indicaciones de receta', consulta.receta?.INDICACIONES_GENERALES);
            consulta.receta?.medicamentos?.forEach(m => campo('Medicamento',
                [m.medicamento, m.concentracion, m.dosis, m.frecuencia, m.duracion].filter(Boolean).join('  |  ')));
            consulta.examenes_auxiliares?.forEach(e => campo('Examen auxiliar',
                [e.NOMBRE_EXAMEN, e.DESCRIPCION, e.RESULTADOS].filter(Boolean).join('  |  ')));
            doc.moveDown(0.5);
        }
    }

    const pages = doc.bufferedPageRange();
    for (let index = pages.start; index < pages.start + pages.count; index++) {
        doc.switchToPage(index);
        const y = doc.page.height - 42;
        doc.moveTo(margin, y).lineTo(doc.page.width - margin, y).strokeColor(color.rule).stroke();
        doc.font('Helvetica').fontSize(8).fillColor(color.muted)
            .text('CEINCO  |  Documento clínico confidencial', margin, y + 9, { lineBreak: false });
        const pagination = `Página ${index - pages.start + 1} de ${pages.count}`;
        doc.text(pagination, doc.page.width - margin - doc.widthOfString(pagination), y + 9, { lineBreak: false });
    }
    return doc;
}

module.exports = { crearHistoriaClinicaPdf };
