process.env.CEINCO_VERCEL_RUNTIME = '1';
const app = require('../backend/server');

module.exports = (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const route = url.searchParams.get('__ceinco_path');
    url.searchParams.delete('__ceinco_path');
    if (url.pathname === '/api/ceinco') {
        if (!route) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Ruta no encontrada' }));
        }
        url.pathname = '/api/' + route;
    }
    req.url = url.pathname + url.search;
    return app(req, res);
};
