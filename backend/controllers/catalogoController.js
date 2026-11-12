const catalogoModel = require('../models/catalogoModel');

const catalogoController = {
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
    }
};

module.exports = catalogoController;