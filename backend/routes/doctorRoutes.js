const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', 
    verifyRole(['administrador', 'doctor', 'asistente']), 
    doctorController.getAllDoctores
);

router.get('/:idDoctor', 
    verifyRole(['administrador', 'doctor', 'asistente']), 
    doctorController.getDoctorById
);

module.exports = router;