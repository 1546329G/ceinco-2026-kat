const usuarioModel = require('../models/usuarioModel');
const { logActivity } = require('../middleware/logActivity');

const usuarioController = {
    // Obtener todos los usuarios
    async getAll(req, res) {
        try {
            const { cargo, estado, search } = req.query;
            const usuarios = await usuarioModel.getAll({ cargo, estado, search });
            res.json(usuarios);
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            res.status(500).json({ error: 'Error al obtener usuarios' });
        }
    },

    // Obtener usuario por ID
    async getById(req, res) {
        try {
            const { id } = req.params;
            const usuario = await usuarioModel.getById(id);

            if (!usuario) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            res.json(usuario);
        } catch (error) {
            console.error('Error al obtener usuario:', error);
            res.status(500).json({ error: 'Error al obtener usuario' });
        }
    },

    // Obtener usuario por DNI
    async getByDni(req, res) {
        try {
            const { dni } = req.params;
            const usuario = await usuarioModel.getByDni(dni);

            if (!usuario) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            // No enviar la contraseña
            const { CONTRASENA, ...usuarioSinPass } = usuario;
            res.json(usuarioSinPass);
        } catch (error) {
            console.error('Error al obtener usuario:', error);
            res.status(500).json({ error: 'Error al obtener usuario' });
        }
    },

    // Crear usuario
    async create(req, res) {
        try {
            const { dni, nombre, apellido, cargo, contrasena } = req.body;

            // Validaciones
            if (!dni || !nombre || !apellido || !cargo || !contrasena) {
                return res.status(400).json({ error: 'Todos los campos son requeridos' });
            }

            if (contrasena.length < 6) {
                return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
            }

            const id = await usuarioModel.create({
                dni, nombre, apellido, cargo, contrasena
            });

            await logActivity(req.user.dni, 'USUARIO_CREADO', {
                id_usuario: id,
                dni_usuario: dni,
                cargo
            });

            res.status(201).json({
                message: 'Usuario creado exitosamente',
                id_usuario: id
            });
        } catch (error) {
            if (error.message === 'USUARIO_YA_EXISTE') {
                return res.status(400).json({ error: 'El DNI ya está registrado' });
            }
            console.error('Error al crear usuario:', error);
            res.status(500).json({ error: 'Error al crear usuario' });
        }
    },

    // Actualizar usuario
    async update(req, res) {
        try {
            const { id } = req.params;
            const { nombre, apellido, cargo, estado } = req.body;

            // No permitir que un admin se auto-modifique el estado (opcional)
            if (id == req.user.id && estado === 0) {
                return res.status(400).json({ error: 'No puedes deshabilitar tu propia cuenta' });
            }

            const actualizado = await usuarioModel.update(id, {
                nombre, apellido, cargo, estado
            });

            if (!actualizado) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            await logActivity(req.user.dni, 'USUARIO_ACTUALIZADO', {
                id_usuario: id
            });

            res.json({ message: 'Usuario actualizado exitosamente' });
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            res.status(500).json({ error: 'Error al actualizar usuario' });
        }
    },

    // Cambiar contraseña (como admin)
    async changePassword(req, res) {
        try {
            const { id } = req.params;
            const { nueva_contrasena } = req.body;

            if (!nueva_contrasena || nueva_contrasena.length < 6) {
                return res.status(400).json({ 
                    error: 'La nueva contraseña debe tener al menos 6 caracteres' 
                });
            }

            const actualizado = await usuarioModel.changePassword(id, nueva_contrasena);

            if (!actualizado) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            await logActivity(req.user.dni, 'PASSWORD_RESET', {
                id_usuario: id
            });

            res.json({ message: 'Contraseña actualizada exitosamente' });
        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            res.status(500).json({ error: 'Error al cambiar contraseña' });
        }
    },

    // Cambiar estado
    async toggleStatus(req, res) {
        try {
            const { id } = req.params;

            // No permitir auto-deshabilitarse
            if (id == req.user.id) {
                return res.status(400).json({ error: 'No puedes cambiar el estado de tu propia cuenta' });
            }

            const actualizado = await usuarioModel.toggleStatus(id);

            if (!actualizado) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            await logActivity(req.user.dni, 'USUARIO_ESTADO_CAMBIADO', {
                id_usuario: id
            });

            res.json({ message: 'Estado de usuario actualizado exitosamente' });
        } catch (error) {
            console.error('Error al cambiar estado:', error);
            res.status(500).json({ error: 'Error al cambiar estado' });
        }
    },

    // Eliminar usuario
    async delete(req, res) {
        try {
            const { id } = req.params;

            if (id == req.user.id) {
                return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
            }

            const eliminado = await usuarioModel.delete(id);

            if (!eliminado) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            await logActivity(req.user.dni, 'USUARIO_ELIMINADO', {
                id_usuario: id
            });

            res.json({ message: 'Usuario eliminado exitosamente' });
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            res.status(500).json({ error: 'Error al eliminar usuario' });
        }
    },

    // Estadísticas
    async getStats(req, res) {
        try {
            const stats = await usuarioModel.getStats();
            res.json(stats);
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            res.status(500).json({ error: 'Error al obtener estadísticas' });
        }
    },

    // Perfil propio (además del de auth)
    async getMyProfile(req, res) {
        try {
            const usuario = await usuarioModel.getByDni(req.user.dni);
            const { CONTRASENA, ULTIMA_SESION_TOKEN_ID, ...perfil } = usuario;
            res.json(perfil);
        } catch (error) {
            console.error('Error al obtener perfil:', error);
            res.status(500).json({ error: 'Error al obtener perfil' });
        }
    }
};

module.exports = usuarioController;