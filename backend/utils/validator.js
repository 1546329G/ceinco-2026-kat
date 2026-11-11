const validators = {
    // Validar DNI (8 dígitos)
    dni(dni) {
        const regex = /^\d{8}$/;
        return regex.test(dni);
    },

    // Validar email
    email(email) {
        if (!email) return true; // Opcional
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    // Validar teléfono (formato peruano)
    telefono(telefono) {
        if (!telefono) return true; // Opcional
        const regex = /^[9][0-9]{8}$|^[0-9]{7}$/;
        return regex.test(telefono);
    },

    // Validar fecha
    fecha(fecha) {
        if (!fecha) return false;
        const date = new Date(fecha);
        return date instanceof Date && !isNaN(date);
    },

    // Validar que no sea fecha futura
    fechaNoFutura(fecha) {
        if (!this.fecha(fecha)) return false;
        return new Date(fecha) <= new Date();
    },

    // Validar hora (HH:MM)
    hora(hora) {
        const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return regex.test(hora);
    },

    // Validar que sea número positivo
    numeroPositivo(valor) {
        return !isNaN(valor) && parseFloat(valor) >= 0;
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

    // Validar longitud máxima
    maxLength(valor, max) {
        return !valor || valor.length <= max;
    },

    // Validar objeto requerido
    required(obj, campos) {
        const faltantes = [];
        campos.forEach(campo => {
            if (!obj[campo] || obj[campo].toString().trim() === '') {
                faltantes.push(campo);
            }
        });
        return {
            valido: faltantes.length === 0,
            faltantes
        };
    },

    // Validar paciente
    validatePaciente(data) {
        const errores = [];

        if (!this.dni(data.dni)) {
            errores.push('DNI debe tener 8 dígitos');
        }

        if (!this.minLength(data.nombre_apellido, 3)) {
            errores.push('Nombre debe tener al menos 3 caracteres');
        }

        if (!this.fecha(data.fecha_nacimiento)) {
            errores.push('Fecha de nacimiento inválida');
        } else if (!this.fechaNoFutura(data.fecha_nacimiento)) {
            errores.push('La fecha de nacimiento no puede ser futura');
        }

        if (data.email && !this.email(data.email)) {
            errores.push('Email inválido');
        }

        if (data.telefono && !this.telefono(data.telefono)) {
            errores.push('Teléfono inválido');
        }

        return {
            valido: errores.length === 0,
            errores
        };
    },

    // Validar cita
    validateCita(data) {
        const errores = [];

        if (!this.dni(data.dni)) {
            errores.push('DNI del paciente debe tener 8 dígitos');
        }

        if (!this.fecha(data.fecha)) {
            errores.push('Fecha inválida');
        }

        if (!this.hora(data.hora)) {
            errores.push('Hora inválida (formato HH:MM)');
        }

        return {
            valido: errores.length === 0,
            errores
        };
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