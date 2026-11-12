const test = require('node:test');
const assert = require('node:assert/strict');
const validators = require('../utils/validator');
const { formatQuery } = require('../config/postgres');
const { verifyRole } = require('../middleware/authMiddleware');

test('formatQuery numera los parámetros y respeta los literales', () => {
    assert.equal(formatQuery('SELECT * FROM T WHERE A = ? AND B = ?'), 'SELECT * FROM T WHERE A = $1 AND B = $2');
    assert.equal(formatQuery("SELECT '?' AS x, \"c?\" FROM T WHERE A = ?"), "SELECT '?' AS x, \"c?\" FROM T WHERE A = $1");
    assert.equal(formatQuery("SELECT 'it''s ?' WHERE A = ?"), "SELECT 'it''s ?' WHERE A = $1");
});

test('validador de DNI exige 8 dígitos', () => {
    assert.equal(validators.dni('12345678'), true);
    assert.equal(validators.dni('1234567'), false);
    assert.equal(validators.dni('1234567a'), false);
});

test('validador de presión arterial', () => {
    assert.equal(validators.presionArterial('120/80'), true);
    assert.equal(validators.presionArterial('12080'), false);
});

test('validateUsuario rechaza cargos desconocidos', () => {
    const base = { dni: '12345678', contrasena: 'secreta1', nombre: 'Ana', apellido: 'Pérez' };
    assert.equal(validators.validateUsuario({ ...base, cargo: 'doctor' }).valido, true);
    assert.equal(validators.validateUsuario({ ...base, cargo: 'root' }).valido, false);
});

test('verifyRole permite solo los roles indicados', () => {
    const run = cargo => {
        let status = 200;
        let nextCalled = false;
        const res = { status(code) { status = code; return this; }, json() { return this; } };
        verifyRole(['administrador'])({ user: cargo && { cargo } }, res, () => { nextCalled = true; });
        return { status, nextCalled };
    };
    assert.deepEqual(run('administrador'), { status: 200, nextCalled: true });
    assert.deepEqual(run('doctor'), { status: 403, nextCalled: false });
    assert.deepEqual(run(undefined), { status: 403, nextCalled: false });
});

test('correo: se normaliza y se valida', () => {
    assert.equal(validators.normalizeEmail('  Ana.Perez@CEINCO.pe '), 'ana.perez@ceinco.pe');
    assert.equal(validators.emailRequerido('ana@ceinco.pe'), true);
    assert.equal(validators.emailRequerido(' ANA@ceinco.pe '), true);
    assert.equal(validators.emailRequerido(''), false);
    assert.equal(validators.emailRequerido('ana@'), false);
    assert.equal(validators.emailRequerido(undefined), false);
});
