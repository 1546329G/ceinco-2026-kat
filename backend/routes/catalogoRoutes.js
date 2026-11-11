const express = require('express');
const router = express.Router();
const catalogoController = require('../controllers/catalogoController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/roles');

router.use(verifyToken);

// Todos los catálogos
router.get('/all', 
    verifyRole([ROLES.ADMIN, ROLES.DOCTOR, ROLES.ASISTENTE]), 
    catalogoController.getAllCatalogos
);

// Sexos
router.get('/sexos', 
    verifyRole([ROLES.ADMIN, ROLES.DOCTOR, ROLES.ASISTENTE]), 
    catalogoController.getSexos
);

// Estados civiles
router.get('/estados-civil', 
    verifyRole([ROLES.ADMIN, ROLES.DOCTOR, ROLES.ASISTENTE]), 
    catalogoController.getEstadosCivil
);

// Roles
router.get('/roles', 
    verifyRole([ROLES.ADMIN]), 
    catalogoController.getRoles
);

// Medicamentos
router.get('/medicamentos', 
    verifyRole([ROLES.ADMIN, ROLES.DOCTOR, ROLES.ASISTENTE]), 
    catalogoController.getMedicamentos
);

router.get('/medicamentos/buscar/:termino', 
    verifyRole([ROLES.ADMIN, ROLES.DOCTOR, ROLES.ASISTENTE]), 
    catalogoController.searchMedicamentos
);

router.post('/medicamentos', 
    verifyRole([ROLES.ADMIN]), 
    catalogoController.createMedicamento
);

router.put('/medicamentos/:id', 
    verifyRole([ROLES.ADMIN]), 
    catalogoController.updateMedicamento
);

// CIE10
router.get('/cie10/buscar/:termino', 
    verifyRole([ROLES.ADMIN, ROLES.DOCTOR, ROLES.ASISTENTE]), 
    catalogoController.searchCIE10
);

router.get('/cie10/categorias', 
    verifyRole([ROLES.ADMIN, ROLES.DOCTOR, ROLES.ASISTENTE]), 
    catalogoController.getCategoriasCIE10
);

router.get('/cie10/:codigo', 
    verifyRole([ROLES.ADMIN, ROLES.DOCTOR, ROLES.ASISTENTE]), 
    catalogoController.getCIE10ByCodigo
);

module.exports = router;