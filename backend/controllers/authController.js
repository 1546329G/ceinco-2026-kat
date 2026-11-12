const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('node:crypto');
const usuarioModel = require('../models/usuarioModel');
const authModel = require('../models/authModel');
const { logActivity } = require('../middleware/logActivity');
const { checkBlock, handleFailedAttempt, clearAttempts } = require('../middleware/loginAttempts');
const validators = require('../utils/validator');

const authController = {
    // Login
    async login(req, res) {
        try {
            const email = validators.normalizeEmail(req.body.email);
            const { contrasena } = req.body;

            // Validar entrada
            if (!email || !contrasena) {
                return res.status(400).json({ error: 'Correo y contraseña son requeridos' });
            }

            // Verificar bloqueo (los intentos se cuentan por correo)
            const blockStatus = await checkBlock(email);
            if (blockStatus.blocked) {
                return res.status(429).json({ 
                    error: `Demasiados intentos fallidos. Intente nuevamente en ${blockStatus.remainingTime} minutos.`
                });
            }

            // Buscar usuario
            const user = await authModel.findByEmail(email);
            
            if (!user) {
                return await handleFailedAttempt(email, res);
            }

            if (user.ESTADO === 0) {
                await logActivity(user.DNI, 'LOGIN_BLOCKED', { reason: 'Usuario deshabilitado' });
                return res.status(403).json({ error: 'Usuario deshabilitado. Contacte al administrador.' });
            }

            // Verificar contraseña
            const validPassword = await bcrypt.compare(contrasena, user.CONTRASENA);
            
            if (!validPassword) {
                return await handleFailedAttempt(email, res);
            }

            // Login exitoso - limpiar intentos
            await clearAttempts(email);

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
            await logActivity(user.DNI, 'LOGIN_SUCCESS', { 
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
                    email: user.EMAIL,
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
                email: user.EMAIL,
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
            const email = validators.normalizeEmail(req.body.email);

            // Validaciones
            if (!dni || !email || !nombre || !apellido || !cargo || !contrasena) {
                return res.status(400).json({ error: 'Todos los campos son requeridos' });
            }
            if (!validators.emailRequerido(email)) {
                return res.status(400).json({ error: 'Correo electrónico inválido' });
            }

            // Verificar si ya existe
            if (await authModel.findByDni(dni)) {
                return res.status(400).json({ error: 'El DNI ya está registrado' });
            }
            if (await authModel.findByEmail(email)) {
                return res.status(400).json({ error: 'El correo ya está registrado' });
            }

            await usuarioModel.create({ dni, email, nombre, apellido, cargo, contrasena });

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

    // Asignar o cambiar el correo de inicio de sesión (solo admin)
    async updateUserEmail(req, res) {
        try {
            const { dni } = req.body;
            const email = validators.normalizeEmail(req.body.email);

            if (!dni || !validators.emailRequerido(email)) {
                return res.status(400).json({ error: 'DNI y correo electrónico válido son requeridos' });
            }

            const otro = await authModel.findByEmail(email);
            if (otro && otro.DNI !== dni) {
                return res.status(400).json({ error: 'El correo ya está registrado' });
            }

            if (!await authModel.updateEmail(dni, email)) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            await logActivity(req.user.dni, 'USER_EMAIL_CHANGED', { usuario_afectado: dni });
            res.json({ message: 'Correo actualizado', email });
        } catch (error) {
            console.error('Error al actualizar correo:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Editar usuario: nombre, apellido, cargo y correo (solo admin)
    async updateUser(req, res) {
        try {
            const { dni } = req.params;
            const email = validators.normalizeEmail(req.body.email);
            const nombre = typeof req.body.nombre === 'string' ? req.body.nombre.trim() : '';
            const apellido = typeof req.body.apellido === 'string' ? req.body.apellido.trim() : '';
            const { cargo } = req.body;

            const { valido, errores } = validators.validateUsuario({ nombre, apellido, cargo }, true);
            if (!valido) return res.status(400).json({ error: errores.join('. ') });
            if (!validators.emailRequerido(email)) {
                return res.status(400).json({ error: 'Correo electrónico inválido' });
            }

            const usuario = await authModel.findByDni(dni);
            if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

            if (cargo !== usuario.CARGO) {
                if (dni === req.user.dni) {
                    return res.status(400).json({ error: 'No puedes cambiar tu propio cargo' });
                }
                if (usuario.CARGO === 'administrador' && !await authModel.countOtherActiveAdmins(dni)) {
                    return res.status(400).json({ error: 'Debe quedar al menos un administrador activo' });
                }
            }

            const otro = await authModel.findByEmail(email);
            if (otro && otro.DNI !== dni) {
                return res.status(400).json({ error: 'El correo ya está registrado' });
            }

            await authModel.updateUser(dni, { nombre, apellido, cargo, email });
            await logActivity(req.user.dni, 'USER_UPDATED', { usuario_afectado: dni, cargo });
            res.json({ message: 'Usuario actualizado' });
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Restablecer la contraseña de otro usuario (solo admin)
    async resetUserPassword(req, res) {
        try {
            const { dni } = req.params;
            const { contrasena } = req.body;

            if (dni === req.user.dni) {
                return res.status(400).json({ error: 'Cambia tu propia contraseña desde Perfil' });
            }
            if (typeof contrasena !== 'string' || contrasena.length < 6) {
                return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
            }

            const hash = await bcrypt.hash(contrasena, 10);
            if (!await authModel.changePassword(dni, hash)) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }
            // Cierra la sesión activa del usuario para que entre con la nueva contraseña
            await authModel.updateSessionToken(dni, null);
            await logActivity(req.user.dni, 'USER_PASSWORD_RESET', { usuario_afectado: dni });
            res.json({ message: 'Contraseña actualizada' });
        } catch (error) {
            console.error('Error al restablecer contraseña:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Eliminar usuario sin registros clínicos (solo admin)
    async deleteUser(req, res) {
        try {
            const { dni } = req.params;

            if (dni === req.user.dni) {
                return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
            }
            const usuario = await authModel.findByDni(dni);
            if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
            if (usuario.CARGO === 'administrador' && !await authModel.countOtherActiveAdmins(dni)) {
                return res.status(400).json({ error: 'Debe quedar al menos un administrador activo' });
            }

            try {
                await authModel.deleteUser(dni);
            } catch (error) {
                // Tiene citas, consultas, recetas o signos vitales asociados
                if (error.code === '23503' || error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
                    return res.status(409).json({
                        error: 'El usuario tiene registros clínicos asociados y no se puede eliminar. Deshabilítelo en su lugar.'
                    });
                }
                throw error;
            }

            await logActivity(req.user.dni, 'USER_DELETED', { usuario_afectado: dni, cargo: usuario.CARGO });
            res.json({ message: 'Usuario eliminado' });
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
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