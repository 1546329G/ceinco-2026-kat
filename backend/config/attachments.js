const maxFileSize = process.env.CEINCO_VERCEL_RUNTIME === '1' ? 4 * 1024 * 1024 : 10 * 1024 * 1024;
const useDatabase = process.env.CEINCO_VERCEL_RUNTIME === '1' || process.env.CEINCO_FILE_STORAGE === 'postgres';

module.exports = { maxFileSize, useDatabase };
