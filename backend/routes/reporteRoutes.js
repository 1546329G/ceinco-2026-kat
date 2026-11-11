const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/roles');

router.use(verifyToken);
router.use(verifyRole([ROLES.ADMIN, ROLES.DOCTOR]));

router.get('/diagnostico', reporteController.resumenDiagnostico);

// Reporte de diagnósticos
router.get('/diagnosticos', reporteController.generateDiagnosticoReporte);

// Reporte de citas
router.get('/citas', reporteController.generateCitasReporte);

// Reporte de actividad de usuarios
router.get('/actividad-usuarios', reporteController.generateUserActivityReporte);

module.exports = router;