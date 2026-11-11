const express = require('express');
const router = express.Router();
const pacienteController = require('../controllers/pacienteController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');
const complementos = require('../controllers/consultaComplementosController');
const { ROLES, ALL_CLINICAL, DOCTOR } = require('../config/roles');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Roles permitidos para pacientes
const rolesPermitidos = [ROLES.ADMIN, ROLES.DOCTOR, ROLES.ASISTENTE];

router.get('/', verifyRole(rolesPermitidos), pacienteController.getAll);

router.get('/:dni/primera-consulta', verifyRole(ALL_CLINICAL), complementos.primeraConsulta);
router.put('/:dni/antecedentes', verifyRole(DOCTOR), complementos.guardarAntecedentes);

// Registrar paciente
router.post('/', 
    verifyRole(rolesPermitidos), 
    pacienteController.create
);

// Búsqueda de pacientes
router.get('/buscar/:termino', 
    verifyRole(rolesPermitidos), 
    pacienteController.search
);

// Obtener paciente por DNI
router.get('/:dni', 
    verifyRole(rolesPermitidos), 
    pacienteController.getByDni
);

// Historia clínica completa
router.get('/:dni/historia', 
    verifyRole([ROLES.ADMIN, ROLES.DOCTOR]), 
    pacienteController.getHistoriaCompleta
);

// Generar PDF
router.get('/:dni/pdf', 
    verifyRole([ROLES.ADMIN, ROLES.DOCTOR]), 
    pacienteController.generatePDF
);

// Consultas del paciente
router.get('/:dni/consultas', 
    verifyRole(rolesPermitidos), 
    pacienteController.getConsultas
);

// Actualizar paciente
router.put('/:dni', 
    verifyRole(rolesPermitidos), 
    pacienteController.update
);

module.exports = router;