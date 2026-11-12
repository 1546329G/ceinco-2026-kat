// Vercel define VERCEL=1 en sus funciones. CEINCO_VERCEL_RUNTIME permite simularlo en local.
const enVercel = process.env.VERCEL === '1' || process.env.CEINCO_VERCEL_RUNTIME === '1';

module.exports = { enVercel };
