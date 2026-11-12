const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { maxFileSize, useDatabase } = require('../config/attachments');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads');
        
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const originalName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const timestamp = Date.now();
        const random = Math.round(Math.random() * 1E9);
        cb(null, `${timestamp}-${random}-${originalName}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'image/jpeg',
        'image/jpg',
        'image/png', 
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        const error = new Error(`Tipo de archivo no permitido: ${file.mimetype}. Tipos permitidos: imágenes, PDF, Word, Excel, texto.`);
        error.status = 400;
        cb(error, false);
    }
};

const fileUpload = multer({
    storage: useDatabase ? multer.memoryStorage() : storage,
    limits: {
        fileSize: maxFileSize, 
        files: 5 
    },
    fileFilter: fileFilter
});

module.exports = fileUpload;