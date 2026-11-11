const helpers = {
    // Formatear fecha a DD/MM/YYYY
    formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('es-PE');
    },

    // Formatear fecha y hora
    formatDateTime(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleString('es-PE');
    },

    // Calcular edad desde fecha de nacimiento
    calculateAge(fechaNacimiento) {
        if (!fechaNacimiento) return null;
        const today = new Date();
        const birthDate = new Date(fechaNacimiento);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    },

    // Calcular IMC
    calculateIMC(peso, talla) {
        if (!peso || !talla || talla <= 0) return null;
        return (peso / (talla * talla)).toFixed(2);
    },

    // Clasificar IMC
    classifyIMC(imc) {
        if (!imc) return 'No disponible';
        if (imc < 18.5) return 'Bajo peso';
        if (imc < 25) return 'Normal';
        if (imc < 30) return 'Sobrepeso';
        if (imc < 35) return 'Obesidad grado I';
        if (imc < 40) return 'Obesidad grado II';
        return 'Obesidad grado III';
    },

    // Generar código único
    generateCode(prefix = '') {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `${prefix}${timestamp}${random}`.toUpperCase();
    },

    // Sanitizar objeto (remover campos vacíos)
    sanitizeObject(obj) {
        const sanitized = {};
        Object.keys(obj).forEach(key => {
            if (obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
                sanitized[key] = obj[key];
            }
        });
        return sanitized;
    },

    // Paginar resultados
    paginate(data, page = 1, limit = 10) {
        const start = (page - 1) * limit;
        const end = page * limit;
        
        return {
            data: data.slice(start, end),
            pagination: {
                page,
                limit,
                total: data.length,
                pages: Math.ceil(data.length / limit)
            }
        };
    },

    // Agrupar por campo
    groupBy(array, key) {
        return array.reduce((result, item) => {
            const groupKey = item[key];
            if (!result[groupKey]) {
                result[groupKey] = [];
            }
            result[groupKey].push(item);
            return result;
        }, {});
    },

    // Ordenar por campo
    sortBy(array, key, order = 'asc') {
        return [...array].sort((a, b) => {
            if (order === 'asc') {
                return a[key] > b[key] ? 1 : -1;
            }
            return a[key] < b[key] ? 1 : -1;
        });
    },

    // Convertir a mayúsculas y quitar espacios extras
    normalizeText(text) {
        if (!text) return '';
        return text.toString().toUpperCase().trim().replace(/\s+/g, ' ');
    },

    // Extraer solo números
    extractNumbers(text) {
        if (!text) return '';
        return text.toString().replace(/\D/g, '');
    },

    // Validar si es objeto vacío
    isEmpty(obj) {
        return Object.keys(obj).length === 0;
    },

    // Deep clone de objeto
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    // Formatear moneda (soles)
    formatCurrency(amount) {
        if (amount === null || amount === undefined) return '';
        return `S/ ${amount.toFixed(2)}`;
    },

    // Obtener iniciales
    getInitials(nombre, apellido) {
        const first = nombre ? nombre.charAt(0).toUpperCase() : '';
        const last = apellido ? apellido.charAt(0).toUpperCase() : '';
        return `${first}${last}`;
    },

    // Truncar texto
    truncate(text, length = 50) {
        if (!text) return '';
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    },

    // Generar contraseña aleatoria
    generateRandomPassword(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    },

    // Parsear query params para filtros
    parseQueryFilters(query) {
        const filters = {};
        const allowedOperators = ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'like'];
        
        Object.keys(query).forEach(key => {
            if (key.includes('[')) {
                const [field, operator] = key.replace(']', '').split('[');
                if (allowedOperators.includes(operator)) {
                    if (!filters[field]) filters[field] = {};
                    filters[field][operator] = query[key];
                }
            } else {
                filters[key] = { eq: query[key] };
            }
        });
        
        return filters;
    }
};

module.exports = helpers;