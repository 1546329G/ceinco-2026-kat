const jwt = require('jsonwebtoken');
const { getPool } = require('../config/db');

const verifyToken = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. Token requerido.' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        
        const pool = getPool();
        const [rows] = await pool.execute(
            'SELECT ID_USUARIO, ULTIMA_SESION_TOKEN_ID, ESTADO FROM USUARIOS WHERE DNI = ?',
            [req.user.dni]
        );

        const user = rows[0];
        
        if (!user) {
            return res.status(401).json({ error: 'Usuario no encontrado.' });
        }

        if (user.ESTADO === 0) {
            return res.status(403).json({ error: 'Usuario deshabilitado.' });
        }

        if (user.ULTIMA_SESION_TOKEN_ID !== req.user.sid) {
            return res.status(401).json({ error: 'Sesión expirada. Inicie sesión nuevamente.' });
        }
        
        req.user.id = user.ID_USUARIO;
        next();
        
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expirado. Inicie sesión nuevamente.' });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Token inválido.' });
        }
        res.status(500).json({ error: 'Error de autenticación.' });
    }
};

const verifyRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.cargo) {
            return res.status(403).json({ error: 'Acceso prohibido. Rol no definido.' });
        }

        const userRole = req.user.cargo;
        
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ 
                error: `Acceso prohibido. Rol requerido: ${allowedRoles.join(', ')}.` 
            });
        }

        next();
    };
};

module.exports = { verifyToken, verifyRole };