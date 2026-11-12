// Pruebas HTTP que no necesitan base de datos: rutas protegidas, 404 y CORS.
process.env.JWT_SECRET = 'test-secret';
process.env.HASH_SALT = 'test-salt-de-16-caracteres';
delete process.env.CORS_ORIGIN;

const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../server');

let server;
let base;

test.before(async () => {
    server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => new Promise(resolve => server.close(resolve)));

test('las rutas clínicas exigen token', async () => {
    for (const path of ['/api/pacientes', '/api/citas/today', '/api/citas/1', '/api/auth/users', '/api/auth/profile', '/api/reportes/citas']) {
        const res = await fetch(base + path);
        assert.equal(res.status, 401, path);
    }
});

test('un token con firma inválida se rechaza', async () => {
    const res = await fetch(base + '/api/pacientes', { headers: { Authorization: 'Bearer abc.def.ghi' } });
    assert.equal(res.status, 401);
});

test('el login exige correo y contraseña', async () => {
    for (const body of [{}, { email: 'ana@ceinco.pe' }, { contrasena: 'secreta1' }, { dni: '12345678', contrasena: 'secreta1' }]) {
        const res = await fetch(base + '/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        assert.equal(res.status, 400, JSON.stringify(body));
        assert.equal((await res.json()).error, 'Correo y contraseña son requeridos');
    }
});

test('cambiar el correo de un usuario exige sesión de administrador', async () => {
    const res = await fetch(base + '/api/auth/users/email', { method: 'PUT' });
    assert.equal(res.status, 401);
});

test('una ruta desconocida devuelve 404 en JSON', async () => {
    const res = await fetch(base + '/api/no-existe');
    assert.equal(res.status, 404);
    assert.equal((await res.json()).error, 'Ruta no encontrada');
});

test('CORS solo acepta orígenes locales por defecto', async () => {
    const local = await fetch(base + '/api/no-existe', { headers: { Origin: 'http://localhost:3000' } });
    assert.equal(local.headers.get('access-control-allow-origin'), 'http://localhost:3000');
    const externo = await fetch(base + '/api/no-existe', { headers: { Origin: 'https://ejemplo.com' } });
    assert.equal(externo.headers.get('access-control-allow-origin'), null);
});

test('editar, restablecer contraseña y eliminar usuarios exigen sesión', async () => {
    for (const [method, path] of [['PUT', '/api/auth/users/12345678'], ['PUT', '/api/auth/users/12345678/password'], ['DELETE', '/api/auth/users/12345678']]) {
        const res = await fetch(base + path, { method });
        assert.equal(res.status, 401, `${method} ${path}`);
    }
});
