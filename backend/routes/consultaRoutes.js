const express = require('express');
const router = express.Router();
const consultaController = require('../controllers/consultaController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');
const fileUpload = require('../middleware/fileUpload');
const complementos = require('../controllers/consultaComplementosController');
const { ROLES, ALL_CLINICAL, DOCTOR } = require('../config/roles');

router.use(verifyToken);

router.post('/signos-vitales', verifyRole(ALL_CLINICAL), complementos.registrarSignos);
router.get('/signos-vitales/hoy/:idFicha', verifyRole(ALL_CLINICAL), complementos.signosDeHoy);
router.post('/:idConsulta/recetas', verifyRole(DOCTOR), consultaController.registrarReceta);
router.get('/:idConsulta/examen-fisico', verifyRole(DOCTOR), complementos.obtenerExamenFisico);
router.put('/:idConsulta/examen-fisico', verifyRole(DOCTOR), complementos.guardarExamenFisico);
router.post('/:idConsulta/diagnosticos', verifyRole(DOCTOR), complementos.agregarDiagnostico);
router.delete('/:idConsulta/diagnosticos/:idDiagnostico', verifyRole(DOCTOR), complementos.eliminarDiagnostico);

// Registrar consulta completa
router.post('/completa', 
    verifyRole([ROLES.ADMIN, ROLES.DOCTOR]), 
    consultaController.registrarCompleta
);

// Obtener consulta por ID
router.get('/:idConsulta', 
    verifyRole([ROLES.ADMIN, ROLES.DOCTOR, ROLES.ASISTENTE]), 
    consultaController.getById
);

// Editar consulta
router.put('/:idConsulta', 
    verifyRole([ROLES.ADMIN, ROLES.DOCTOR]), 
    consultaController.edit
);

// Buscar CIE10
router.get('/cie10/search', 
    verifyRole([ROLES.ADMIN, ROLES.DOCTOR, ROLES.ASISTENTE]), 
    consultaController.searchCIE10
);

// Consultas por paciente
router.get('/paciente/:dni', 
    verifyRole([ROLES.ADMIN, ROLES.DOCTOR, ROLES.ASISTENTE]), 
    consultaController.getByPaciente
);

// Subir examen auxiliar
router.post('/:idConsulta/examenes', 
    verifyRole([ROLES.ADMIN, ROLES.DOCTOR, ROLES.ASISTENTE]), 
    fileUpload.single('archivo'),
    consultaController.uploadExamen
);

module.exports = router;