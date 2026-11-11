const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/roles');

// Rutas públicas
router.post('/login', authController.login);

// Rutas protegidas
router.post('/logout', verifyToken, authController.logout);
router.get('/profile', verifyToken, authController.getProfile);
router.put('/change-password', verifyToken, authController.changePassword);

// Rutas de administración
router.post('/register', 
    verifyToken, 
    verifyRole([ROLES.ADMIN]), 
    authController.register
);

router.get('/users', 
    verifyToken, 
    verifyRole([ROLES.ADMIN]), 
    authController.getAllUsers
);

router.put('/users/toggle-status', 
    verifyToken, 
    verifyRole([ROLES.ADMIN]), 
    authController.toggleUserStatus
);

module.exports = router;