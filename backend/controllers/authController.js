const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('node:crypto');
const usuarioModel = require('../models/usuarioModel');
const authModel = require('../models/authModel');
const { logActivity } = require('../middleware/logActivity');
const { checkBlock, handleFailedAttempt, clearAttempts } = require('../middleware/loginAttempts');

const authController = {
    // Login
    async login(req, res) {
        try {
            const { dni, contrasena } = req.body;

            // Validar entrada
            if (!dni || !contrasena) {
                return res.status(400).json({ error: 'DNI y contraseña son requeridos' });
            }

            // Verificar bloqueo
            const blockStatus = await checkBlock(dni);
            if (blockStatus.blocked) {
                return res.status(429).json({ 
                    error: `Demasiados intentos fallidos. Intente nuevamente en ${blockStatus.remainingTime} minutos.`
                });
            }

            // Buscar usuario
            const user = await authModel.findByDni(dni);
            
            if (!user) {
                return await handleFailedAttempt(dni, res);
            }

            if (user.ESTADO === 0) {
                await logActivity(dni, 'LOGIN_BLOCKED', { reason: 'Usuario deshabilitado' });
                return res.status(403).json({ error: 'Usuario deshabilitado. Contacte al administrador.' });
            }

            // Verificar contraseña
            const validPassword = await bcrypt.compare(contrasena, user.CONTRASENA);
            
            if (!validPassword) {
                return await handleFailedAttempt(dni, res);
            }

            // Login exitoso - limpiar intentos
            await clearAttempts(dni);

            // Generar token
            const tokenId = randomUUID();
            const token = jwt.sign(
                { 
                    dni: user.DNI, 
                    cargo: user.CARGO,
                    nombre: `${user.NOMBRE} ${user.APELLIDO}`,
                    sid: tokenId 
                },
                process.env.JWT_SECRET,
                { expiresIn: '8h' }
            );

            // Actualizar token en BD
            await authModel.updateSessionToken(user.DNI, tokenId);

            // Log de éxito
            await logActivity(dni, 'LOGIN_SUCCESS', { 
                cargo: user.CARGO,
                timestamp: new Date().toISOString()
            });

            res.json({
                message: 'Login exitoso',
                token,
                login: true,
                cargo: user.CARGO,
                user: {
                    id: user.ID_USUARIO,
                    dni: user.DNI,
                    nombre: user.NOMBRE,
                    apellido: user.APELLIDO,
                    cargo: user.CARGO
                }
            });

        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Logout
    async logout(req, res) {
        try {
            const { dni } = req.user;
            
            // Limpiar token en BD
            await authModel.updateSessionToken(dni, null);
            
            // Log de logout
            await logActivity(dni, 'LOGOUT', { timestamp: new Date().toISOString() });

            res.json({ message: 'Sesión cerrada exitosamente' });
        } catch (error) {
            console.error('Error en logout:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Obtener perfil
    async getProfile(req, res) {
        try {
            const user = await authModel.findByDni(req.user.dni);
            
            if (!user) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            res.json({
                id: user.ID_USUARIO,
                fecha_creacion: user.FECHA_CREACION,
                dni: user.DNI,
                nombre: user.NOMBRE,
                apellido: user.APELLIDO,
                cargo: user.CARGO,
                estado: user.ESTADO
            });
        } catch (error) {
            console.error('Error al obtener perfil:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Cambiar contraseña
    async changePassword(req, res) {
        try {
            const { contrasena_actual, contrasena_nueva } = req.body;
            const { dni } = req.user;

            // Validaciones básicas
            if (!contrasena_actual || !contrasena_nueva) {
                return res.status(400).json({ error: 'Todas las contraseñas son requeridas' });
            }

            if (contrasena_nueva.length < 6) {
                return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
            }

            // Obtener usuario
            const user = await authModel.findByDni(dni);
            
            if (!user) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            // Verificar contraseña actual
            const validPassword = await bcrypt.compare(contrasena_actual, user.CONTRASENA);
            
            if (!validPassword) {
                await logActivity(dni, 'PASSWORD_CHANGE_FAILED', { reason: 'Contraseña actual incorrecta' });
                return res.status(400).json({ error: 'Contraseña actual incorrecta' });
            }

            // Hashear nueva contraseña
            const salt = await bcrypt.genSalt(10);
            const newHash = await bcrypt.hash(contrasena_nueva, salt);

            // Actualizar
            await authModel.changePassword(dni, newHash);

            // Invalidar sesiones actuales (opcional)
            await authModel.updateSessionToken(dni, null);

            await logActivity(dni, 'PASSWORD_CHANGED', { timestamp: new Date().toISOString() });

            res.json({ message: 'Contraseña actualizada exitosamente' });

        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Registrar usuario (solo admin)
    async register(req, res) {
        try {
            const { dni, nombre, apellido, cargo, contrasena } = req.body;

            // Validaciones
            if (!dni || !nombre || !apellido || !cargo || !contrasena) {
                return res.status(400).json({ error: 'Todos los campos son requeridos' });
            }

            // Verificar si ya existe
            const existe = await authModel.findByDni(dni);
            if (existe) {
                return res.status(400).json({ error: 'El DNI ya está registrado' });
            }

            await usuarioModel.create({ dni, nombre, apellido, cargo, contrasena });

            await logActivity(req.user.dni, 'USER_CREATED', { 
                nuevo_usuario: dni,
                cargo 
            });

            res.status(201).json({ message: 'Usuario creado exitosamente' });

        } catch (error) {
            console.error('Error al registrar usuario:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Obtener todos los usuarios
    async getAllUsers(req, res) {
        try {
            const users = await authModel.getAll();
            res.json(users);
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Cambiar estado de usuario
    async toggleUserStatus(req, res) {
        try {
            const { dni } = req.body;

            if (dni === req.user.dni) {
                return res.status(400).json({ error: 'No puedes deshabilitar tu propia cuenta' });
            }

            const actualizado = await authModel.toggleStatus(dni);

            if (!actualizado) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            await logActivity(req.user.dni, 'USER_STATUS_CHANGED', { 
                usuario_afectado: dni,
                accion: 'toggle_status'
            });

            res.json({ message: 'Estado de usuario actualizado' });

        } catch (error) {
            console.error('Error al cambiar estado:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
};

module.exports = authController;