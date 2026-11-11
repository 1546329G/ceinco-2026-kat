const PDFDocument = require('pdfkit');
const path = require('path');

class PDFGenerator {
    constructor(options = {}) {
        this.doc = new PDFDocument({
            size: options.size || 'A4',
            margin: options.margin || 50,
            info: {
                Title: options.title || 'Documento',
                Author: 'Sistema CEINCO',
                ...options.info
            }
        });
        
        this.colors = {
            primary: '#2563eb',
            secondary: '#4b5563',
            accent: '#059669',
            danger: '#dc2626',
            warning: '#d97706',
            light: '#f3f4f6'
        };
    }

    // Encabezado del documento
    header(titulo, subtitulo = null) {
        this.doc.fontSize(20)
            .fillColor(this.colors.primary)
            .text(titulo, { align: 'center' });
        
        if (subtitulo) {
            this.doc.moveDown(0.5)
                .fontSize(12)
                .fillColor(this.colors.secondary)
                .text(subtitulo, { align: 'center' });
        }
        
        this.doc.moveDown(2);
        return this;
    }

    // Pie de página (se llama en cada página)
    footer(texto = null) {
        const pages = this.doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
            this.doc.switchToPage(i);
            
            // Número de página
            this.doc.fontSize(8)
                .fillColor(this.colors.secondary)
                .text(
                    `Página ${i + 1} de ${pages.count}`,
                    50,
                    this.doc.page.height - 50,
                    { align: 'center' }
                );
            
            // Texto de pie si se proporciona
            if (texto) {
                this.doc.text(
                    texto,
                    50,
                    this.doc.page.height - 65,
                    { align: 'center' }
                );
            }
            
            // Línea separadora
            this.doc.strokeColor(this.colors.light)
                .lineWidth(1)
                .moveTo(50, this.doc.page.height - 70)
                .lineTo(this.doc.page.width - 50, this.doc.page.height - 70)
                .stroke();
        }
        
        this.doc.switchToPage(this.doc.bufferedPageRange().count - 1);
        return this;
    }

    // Sección con título
    section(titulo) {
        this.doc.fontSize(14)
            .fillColor(this.colors.accent)
            .text(titulo);
        this.doc.moveDown(0.5);
        return this;
    }

    // Línea de datos (label: valor)
    field(label, valor, options = {}) {
        const { bold = false, color = 'black' } = options;
        
        this.doc.fontSize(11)
            .fillColor(color);
        
        if (bold) {
            this.doc.font('Helvetica-Bold').text(`${label}: `, { continued: true });
        } else {
            this.doc.font('Helvetica').text(`${label}: `, { continued: true });
        }
        
        this.doc.font('Helvetica')
            .fillColor(color)
            .text(valor || 'No registrado');
        
        return this;
    }

    // Tabla simple
    table(headers, data, options = {}) {
        const { 
            headerBg = this.colors.primary,
            alternateRows = true,
            startY = this.doc.y
        } = options;
        
        const cellPadding = 5;
        const cellWidth = (this.doc.page.width - 100) / headers.length;
        
        let y = startY;
        
        // Encabezados
        this.doc.font('Helvetica-Bold').fontSize(10);
        let x = 50;
        headers.forEach(header => {
            this.doc.fillColor('white')
                .rect(x, y, cellWidth, 20)
                .fill(headerBg);
            
            this.doc.fillColor('white')
                .text(header, x + cellPadding, y + 5, {
                    width: cellWidth - cellPadding * 2,
                    align: 'left'
                });
            
            x += cellWidth;
        });
        
        y += 20;
        
        // Datos
        this.doc.font('Helvetica').fontSize(9);
        data.forEach((row, rowIndex) => {
            x = 50;
            
            // Fondo alternado
            if (alternateRows && rowIndex % 2 === 0) {
                this.doc.fillColor(this.colors.light)
                    .rect(x, y, cellWidth * headers.length, 20)
                    .fill();
            }
            
            headers.forEach((header, colIndex) => {
                this.doc.fillColor('black')
                    .text(
                        row[header.toLowerCase()] || '',
                        x + cellPadding,
                        y + 5,
                        {
                            width: cellWidth - cellPadding * 2,
                            align: 'left'
                        }
                    );
                
                x += cellWidth;
            });
            
            y += 20;
            
            // Nueva página si es necesario
            if (y > this.doc.page.height - 100) {
                this.doc.addPage();
                y = 50;
            }
        });
        
        this.doc.y = y + 10;
        return this;
    }

    // Línea horizontal
    line() {
        this.doc.strokeColor(this.colors.light)
            .lineWidth(1)
            .moveTo(50, this.doc.y)
            .lineTo(this.doc.page.width - 50, this.doc.y)
            .stroke()
            .moveDown();
        return this;
    }

    // Espacio
    space(lines = 1) {
        this.doc.moveDown(lines);
        return this;
    }

    // Obtener el documento
    getDocument() {
        return this.doc;
    }
}

module.exports = PDFGenerator;