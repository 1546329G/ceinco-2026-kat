const pacienteModel = require('../models/pacienteModel');
const consultaModel = require('../models/consultaModel');
const PDFDocument = require('pdfkit');
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
    async generatePDF(req, res) {
        try {
            const { dni } = req.params;
            const historia = await pacienteModel.getHistoriaCompleta(dni);
            
            if (!historia) {
                return res.status(404).json({ error: 'Paciente no encontrado' });
            }

            // Crear PDF
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50,
                info: {
                    Title: `Historia Clínica - ${historia.NOMBRE_APELLIDO}`,
                    Author: 'Sistema CEINCO'
                }
            });

            // Configurar respuesta
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=historia-${dni}.pdf`);
            
            doc.pipe(res);

            // Estilos
            const colors = {
                primary: '#2563eb',
                secondary: '#4b5563',
                accent: '#059669'
            };

            // Encabezado
            doc.fontSize(20).fillColor(colors.primary).text('HISTORIA CLÍNICA', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).fillColor(colors.secondary).text(`Generado: ${new Date().toLocaleString()}`, { align: 'center' });
            doc.moveDown(2);

            // Datos del paciente
            doc.fontSize(14).fillColor(colors.accent).text('DATOS DEL PACIENTE');
            doc.moveDown(0.5);
            doc.fontSize(11).fillColor('black');
            
            const datos = [
                ['Nombre:', historia.NOMBRE_APELLIDO],
                ['DNI:', historia.DNI],
                ['Fecha Nacimiento:', new Date(historia.FECHA_NACIMIENTO).toLocaleDateString()],
                ['Edad:', `${historia.EDAD} años`],
                ['Sexo:', historia.sexo_desc || historia.SEXO],
                ['Estado Civil:', historia.estado_civil_desc || historia.ESTADO_CIVIL || 'No especificado'],
                ['Teléfono:', historia.TELEFONO || 'No registrado'],
                ['Email:', historia.EMAIL || 'No registrado'],
                ['Domicilio:', historia.DOMICILIO || 'No registrado'],
                ['Ocupación:', historia.OCUPACION || 'No registrado']
            ];

            datos.forEach(([label, value]) => {
                doc.text(`${label} ${value}`, { continued: false });
            });

            doc.moveDown();

            // Antecedentes
            if (historia.antecedentes) {
                doc.fontSize(14).fillColor(colors.accent).text('ANTECEDENTES');
                doc.moveDown(0.5);
                doc.fontSize(11).fillColor('black');

                const ant = historia.antecedentes;
                
                if (ant.EA_RELATO) {
                    doc.text('Enfermedad Actual:', { underline: true });
                    doc.text(ant.EA_RELATO);
                    doc.moveDown(0.5);
                }

                // Factores de riesgo
                const factores = [];
                if (ant.FR_TABAQUISMO) factores.push('Tabaquismo');
                if (ant.FR_HIPERTENSION) factores.push('Hipertensión');
                if (ant.FR_DIABETES) factores.push('Diabetes');
                if (ant.FR_DISLIPIDEMIA) factores.push('Dislipidemia');
                if (ant.FR_OBESIDAD) factores.push('Obesidad');

                if (factores.length > 0) {
                    doc.text('Factores de Riesgo: ' + factores.join(', '));
                }
                doc.moveDown();
            }

            // Consultas
            if (historia.consultas && historia.consultas.length > 0) {
                doc.fontSize(14).fillColor(colors.accent).text('CONSULTAS REALIZADAS');
                
                historia.consultas.forEach((consulta, index) => {
                    doc.moveDown(0.5);
                    doc.fontSize(12).fillColor(colors.primary).text(`Consulta #${index + 1} - ${new Date(consulta.FECHA).toLocaleString()}`);
                    doc.fontSize(11).fillColor('black');
                    
                    doc.text(`Doctor: ${consulta.doctor_nombre || ''} ${consulta.doctor_apellido || ''}`);
                    
                    if (consulta.RELATO) {
                        doc.text('Motivo:', { underline: true });
                        doc.text(consulta.RELATO);
                    }

                    if (consulta.signos_vitales) {
                        const sv = consulta.signos_vitales;
                        doc.text('Signos Vitales:', { underline: true });
                        doc.text(`PA: ${sv.PA || 'N/R'} | Pulso: ${sv.PULSO || 'N/R'} | Sat O2: ${sv.SAO2 || 'N/R'} | Temp: ${sv.TEMPERATURA || 'N/R'}°C`);
                    }

                    if (consulta.diagnosticos && consulta.diagnosticos.length > 0) {
                        doc.text('Diagnósticos:', { underline: true });
                        consulta.diagnosticos.forEach(d => {
                            doc.text(`  • ${d.CODIGO} - ${d.DIAGNOSTICO_DESC} (${d.TIPO})`);
                        });
                    }

                    doc.moveDown(0.5);
                });
            }

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