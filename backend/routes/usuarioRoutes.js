const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/roles');

router.use(verifyToken);

// Solo administradores pueden gestionar usuarios
router.use(verifyRole([ROLES.ADMIN]));

// Estadísticas
router.get('/stats', usuarioController.getStats);

// Listar usuarios (con filtros)
router.get('/', usuarioController.getAll);

// Obtener usuario por ID
router.get('/:id', usuarioController.getById);

// Obtener usuario por DNI
router.get('/dni/:dni', usuarioController.getByDni);

// Crear usuario
router.post('/', usuarioController.create);

// Actualizar usuario
router.put('/:id', usuarioController.update);

// Cambiar contraseña (admin)
router.put('/:id/change-password', usuarioController.changePassword);

// Cambiar estado
router.patch('/:id/toggle-status', usuarioController.toggleStatus);

// Eliminar usuario
router.delete('/:id', usuarioController.delete);

// Perfil propio (para cualquier usuario autenticado)
router.get('/profile/me', 
    verifyRole([ROLES.ADMIN, ROLES.DOCTOR, ROLES.ASISTENTE]), 
    usuarioController.getMyProfile
);

module.exports = router;