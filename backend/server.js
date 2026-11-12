require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectToDatabase, getPool } = require('./config/db');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const pacienteRoutes = require('./routes/pacienteRoutes');
const citaRoutes = require('./routes/citaRoutes');
const consultaRoutes = require('./routes/consultaRoutes');
const catalogoRoutes = require('./routes/catalogoRoutes');
const reporteRoutes = require('./routes/reporteRoutes');
const doctorRoutes = require('./routes/doctorRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// Frontend y API comparten dominio en Vercel y Docker; CORS solo hace falta en desarrollo.
const corsOrigins = process.env.CORS_ORIGIN?.split(',').map(origin => origin.trim()).filter(Boolean);
app.use(cors({ origin: corsOrigins?.length ? corsOrigins : /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/ }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
const { verifyToken, verifyRole } = require('./middleware/authMiddleware');
const { ALL_CLINICAL } = require('./config/roles');
const { maxFileSize, useDatabase } = require('./config/attachments');
const { enVercel } = require('./config/runtime');
const downloadAttachment = async (req, res, next) => {
    if (useDatabase) {
        const [[archivo]] = await getPool().query('SELECT CONTENIDO FROM ADJUNTOS_EXAMEN WHERE NOMBRE = ?', [req.params.archivo]);
        if (archivo) {
            res.set('Cache-Control', 'private, no-store');
            res.set('X-Content-Type-Options', 'nosniff');
            return res.attachment(req.params.archivo).type('application/octet-stream').send(archivo.CONTENIDO);
        }
    }
    next();
};
app.get(['/api/adjuntos/:archivo', '/uploads/:archivo'], verifyToken, verifyRole(ALL_CLINICAL), downloadAttachment);
app.use('/api/adjuntos', (req, res, next) => {
    if (enVercel) return next();
    // Los adjuntos guardados en Docker siguen disponibles en su ruta original.
    res.redirect(307, '/uploads' + req.url);
});
if (!enVercel) app.use('/uploads', verifyToken, verifyRole(ALL_CLINICAL), (req, res, next) => {
    res.set('Cache-Control', 'private, no-store');
    res.attachment();
    next();
}, express.static(path.join(__dirname, 'uploads'), { index: false }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/pacientes', pacienteRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/consultas', consultaRoutes);
app.use('/api/catalogos', catalogoRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/doctores', doctorRoutes);

// Ruta de prueba
app.get('/api/health', async (req, res) => {
    try {
        await getPool().query('SELECT 1 FROM USUARIOS LIMIT 0');
    } catch {
        return res.status(503).json({ status: 'ERROR', message: 'Base de datos no disponible' });
    }
    res.json({ 
        status: 'OK', 
        message: 'Servidor funcionando',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

const webDir = process.env.CEINCO_WEB_DIR;
if (webDir) {
    app.use(express.static(webDir));
    app.get(/^\/(?!api(?:\/|$)|uploads(?:\/|$)|assets(?:\/|$)).*/, (req, res) => {
        res.sendFile(path.join(webDir, 'index.html'));
    });
}

// Ruta de documentación básica
app.get('/', (req, res) => {
    res.json({
        nombre: 'API CEINCO',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            pacientes: '/api/pacientes',
            citas: '/api/citas',
            consultas: '/api/consultas',
            catalogos: '/api/catalogos',
            reportes: '/api/reportes',
            health: '/api/health'
        }
    });
});

// Manejo de errores 404
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Ruta no encontrada',
        path: req.path 
    });
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error('Error no manejado:', err);
    
    // Error de multer (archivos)
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
            error: 'Archivo demasiado grande',
            message: `El tamaño máximo es ${maxFileSize / 1024 / 1024} MB`
        });
    }
    
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
            error: 'Campo de archivo incorrecto',
            message: 'El campo del archivo debe llamarse "archivo"'
        });
    }

    if (err.status === 400) {
        return res.status(400).json({ error: 'Error al subir archivo', message: err.message });
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ 
            error: 'Demasiados archivos',
            message: 'Máximo 5 archivos por petición'
        });
    }
    
    // Error de JWT
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Token inválido' });
    }
    
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expirado' });
    }
    
    // Error de base de datos
    if (err.code === 'ER_DUP_ENTRY' || err.code === '23505') {
        return res.status(400).json({ 
            error: 'Registro duplicado',
            message: 'Ya existe un registro con ese identificador'
        });
    }
    
    res.status(500).json({ 
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Iniciar servidor
const startServer = async () => {
    try {
        await connectToDatabase();
        app.listen(PORT, () => {
            console.log('\n=================================');
            console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
            console.log(`📚 API: http://localhost:${PORT}/api`);
            console.log(`❤️  Health: http://localhost:${PORT}/api/health`);
            console.log(`📁 Uploads: ${path.join(__dirname, 'uploads')}`);
            console.log('=================================\n');
        });
    } catch (error) {
        console.error('❌ Error al iniciar servidor:', error);
        process.exit(1);
    }
};

if (require.main === module) startServer();

module.exports = app;