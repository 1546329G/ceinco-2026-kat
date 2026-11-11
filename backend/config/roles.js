const ROLES = {
    ADMIN: 'administrador',
    DOCTOR: 'doctor',
    ASISTENTE: 'asistente'
};

module.exports = {
    ROLES,
    ASISTENTE: [ROLES.ASISTENTE, ROLES.ADMIN],
    DOCTOR: [ROLES.DOCTOR, ROLES.ADMIN],
    ADMIN: [ROLES.ADMIN],
    ALL_CLINICAL: Object.values(ROLES),
    ALL_AUTH: Object.values(ROLES)
};
