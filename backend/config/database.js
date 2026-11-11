const { getPool, isPostgres } = require('./db');

module.exports = {
    isPostgres,
    dateOnly(column) {
        return isPostgres ? `TO_CHAR(${column}, 'YYYY-MM-DD')` : `DATE_FORMAT(${column}, '%Y-%m-%d')`;
    },
    ageYears(birth, date = 'CURRENT_DATE') {
        return isPostgres ? `EXTRACT(YEAR FROM AGE(${date}, ${birth}))::integer` : `TIMESTAMPDIFF(YEAR, ${birth}, ${date})`;
    },
    query(...args) {
        return getPool().query(...args);
    },
    getConnection() {
        return getPool().getConnection();
    }
};
