const express = require('express');
const router = express.Router();
const citaController = require('../controllers/citaController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');
const { ROLES, ASISTENTE, DOCTOR } = require('../config/roles');

router.use(verifyToken);

// Crear cita
router.post('/', 
    verifyRole([ROLES.ADMIN, ROLES.ASISTENTE]), 
    citaController.create
);

// Citas del día
router.get('/today', 
    verifyRole([ROLES.ADMIN, ROLES.DOCTOR, ROLES.ASISTENTE]), 
    citaController.getToday
);

// Buscar citas
router.get('/search', 
    verifyRole([ROLES.ADMIN, ROLES.DOCTOR, ROLES.ASISTENTE]), 
    citaController.search
);

// Iniciar consulta desde cita
router.post('/:idCita/iniciar-consulta', 
    verifyRole([ROLES.ADMIN, ROLES.DOCTOR]), 
    citaController.iniciarConsulta
);

// Cancelar cita
router.patch('/:idCita/cancelar', 
    verifyRole([ROLES.ADMIN, ROLES.ASISTENTE]), 
    citaController.cancelar
);

router.put('/:idCita', verifyRole(ASISTENTE), citaController.update);
router.patch('/:idCita/atender', verifyRole(DOCTOR), citaController.atender);
router.delete('/:idCita', verifyRole(ASISTENTE), citaController.eliminarCancelada);

module.exports = router;