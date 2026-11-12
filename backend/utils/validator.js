const validators = {
    // Validar DNI (8 dígitos)
    dni(dni) {
        const regex = /^\d{8}$/;
        return regex.test(dni);
    },

    // Normalizar correo (minúsculas y sin espacios)
    normalizeEmail(email) {
        return typeof email === 'string' ? email.trim().toLowerCase() : '';
    },

    // Correo obligatorio y bien formado
    emailRequerido(email) {
        const valor = this.normalizeEmail(email);
        return valor.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
    },

    // Validar presión arterial (formato "120/80")
    presionArterial(pa) {
        if (!pa) return true;
        const regex = /^\d{2,3}\/\d{2,3}$/;
        return regex.test(pa);
    },

    // Validar longitud mínima
    minLength(valor, min) {
        return valor && valor.length >= min;
    },

    // Validar usuario
    validateUsuario(data, isUpdate = false) {
        const errores = [];

        if (!isUpdate) {
            if (!this.dni(data.dni)) {
                errores.push('DNI debe tener 8 dígitos');
            }

            if (!this.minLength(data.contrasena, 6)) {
                errores.push('Contraseña debe tener al menos 6 caracteres');
            }
        }

        if (!this.minLength(data.nombre, 2)) {
            errores.push('Nombre debe tener al menos 2 caracteres');
        }

        if (!this.minLength(data.apellido, 2)) {
            errores.push('Apellido debe tener al menos 2 caracteres');
        }

        const cargosValidos = ['administrador', 'doctor', 'asistente'];
        if (!cargosValidos.includes(data.cargo)) {
            errores.push('Cargo inválido');
        }

        return {
            valido: errores.length === 0,
            errores
        };
    }
};

module.exports = validators;