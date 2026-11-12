const { enVercel } = require('./runtime');

const maxFileSize = enVercel ? 4 * 1024 * 1024 : 10 * 1024 * 1024;
const useDatabase = enVercel || process.env.CEINCO_FILE_STORAGE === 'postgres';

module.exports = { maxFileSize, useDatabase };
