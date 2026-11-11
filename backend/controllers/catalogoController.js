const catalogoModel = require('../models/catalogoModel');
const { logActivity } = require('../middleware/logActivity');

const catalogoController = {
    // Obtener todos los catálogos para formularios
    async getAllCatalogos(req, res) {
        try {
            const [sexos, estadosCivil, medicamentos, roles] = await Promise.all([
                catalogoModel.getSexos(),
                catalogoModel.getEstadosCivil(),
                catalogoModel.getMedicamentos(),
                catalogoModel.getRoles()
            ]);

            res.json({
                sexos,
                estados_civil: estadosCivil,
                medicamentos,
                roles
            });
        } catch (error) {
            console.error('Error al obtener catálogos:', error);
            res.status(500).json({ error: 'Error al obtener catálogos' });
        }
    },

    // Sexos
    async getSexos(req, res) {
        try {
            const sexos = await catalogoModel.getSexos();
            res.json(sexos);
        } catch (error) {
            console.error('Error al obtener sexos:', error);
            res.status(500).json({ error: 'Error al obtener sexos' });
        }
    },

    // Estados civiles
    async getEstadosCivil(req, res) {
        try {
            const estados = await catalogoModel.getEstadosCivil();
            res.json(estados);
        } catch (error) {
            console.error('Error al obtener estados civiles:', error);
            res.status(500).json({ error: 'Error al obtener estados civiles' });
        }
    },

    // Medicamentos
    async getMedicamentos(req, res) {
        try {
            const medicamentos = await catalogoModel.getMedicamentos();
            res.json(medicamentos);
        } catch (error) {
            console.error('Error al obtener medicamentos:', error);
            res.status(500).json({ error: 'Error al obtener medicamentos' });
        }
    },

    async searchMedicamentos(req, res) {
        try {
            const { termino } = req.params;
            if (!termino || termino.length < 2) {
                return res.status(400).json({ error: 'Ingrese al menos 2 caracteres' });
            }

            const medicamentos = await catalogoModel.searchMedicamentos(termino);
            res.json(medicamentos);
        } catch (error) {
            console.error('Error al buscar medicamentos:', error);
            res.status(500).json({ error: 'Error al buscar medicamentos' });
        }
    },

    async createMedicamento(req, res) {
        try {
            const { nombre, concentracion, forma_farmaceutica } = req.body;

            if (!nombre || !concentracion || !forma_farmaceutica) {
                return res.status(400).json({ error: 'Todos los campos son requeridos' });
            }

            const id = await catalogoModel.createMedicamento({
                nombre, concentracion, forma_farmaceutica
            });

            await logActivity(req.user.dni, 'MEDICAMENTO_CREADO', {
                id_medicamento: id,
                nombre
            });

            res.status(201).json({
                message: 'Medicamento creado exitosamente',
                id_medicamento: id
            });
        } catch (error) {
            console.error('Error al crear medicamento:', error);
            res.status(500).json({ error: 'Error al crear medicamento' });
        }
    },

    async updateMedicamento(req, res) {
        try {
            const { id } = req.params;
            const data = req.body;

            const actualizado = await catalogoModel.updateMedicamento(id, data);

            if (!actualizado) {
                return res.status(404).json({ error: 'Medicamento no encontrado' });
            }

            await logActivity(req.user.dni, 'MEDICAMENTO_ACTUALIZADO', {
                id_medicamento: id
            });

            res.json({ message: 'Medicamento actualizado exitosamente' });
        } catch (error) {
            console.error('Error al actualizar medicamento:', error);
            res.status(500).json({ error: 'Error al actualizar medicamento' });
        }
    },

    // CIE10
    async searchCIE10(req, res) {
        try {
            const { termino } = req.params;
            if (!termino || termino.length < 2) {
                return res.status(400).json({ error: 'Ingrese al menos 2 caracteres' });
            }

            const resultados = await catalogoModel.searchCIE10(termino);
            res.json(resultados);
        } catch (error) {
            console.error('Error al buscar CIE10:', error);
            res.status(500).json({ error: 'Error al buscar CIE10' });
        }
    },

    async getCIE10ByCodigo(req, res) {
        try {
            const { codigo } = req.params;
            const diagnostico = await catalogoModel.getCIE10ByCodigo(codigo);

            if (!diagnostico) {
                return res.status(404).json({ error: 'Código CIE10 no encontrado' });
            }

            res.json(diagnostico);
        } catch (error) {
            console.error('Error al obtener CIE10:', error);
            res.status(500).json({ error: 'Error al obtener CIE10' });
        }
    },

    async getCategoriasCIE10(req, res) {
        try {
            const categorias = await catalogoModel.getCategoriasCIE10();
            res.json(categorias);
        } catch (error) {
            console.error('Error al obtener categorías CIE10:', error);
            res.status(500).json({ error: 'Error al obtener categorías' });
        }
    },

    // Roles
    async getRoles(req, res) {
        try {
            const roles = await catalogoModel.getRoles();
            res.json(roles);
        } catch (error) {
            console.error('Error al obtener roles:', error);
            res.status(500).json({ error: 'Error al obtener roles' });
        }
    }
};

module.exports = catalogoController;