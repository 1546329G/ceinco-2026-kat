const express = require('express');
const router = express.Router();
const catalogoController = require('../controllers/catalogoController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/roles');

router.use(verifyToken);

// Sexos
router.get('/sexos', 
    verifyRole([ROLES.ADMIN, ROLES.DOCTOR, ROLES.ASISTENTE]), 
    catalogoController.getSexos
);

// Medicamentos
router.get('/medicamentos', 
    verifyRole([ROLES.ADMIN, ROLES.DOCTOR, ROLES.ASISTENTE]), 
    catalogoController.getMedicamentos
);

// CIE10
router.get('/cie10/buscar/:termino', 
    verifyRole([ROLES.ADMIN, ROLES.DOCTOR, ROLES.ASISTENTE]), 
    catalogoController.searchCIE10
);

router.get('/cie10/:codigo', 
    verifyRole([ROLES.ADMIN, ROLES.DOCTOR, ROLES.ASISTENTE]), 
    catalogoController.getCIE10ByCodigo
);

module.exports = router;