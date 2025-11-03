/**
 * Helper Functions
 * Funciones auxiliares para el backend
 */

/**
 * Formatea un precio de centavos a formato legible
 * @param {number} cents - Precio en centavos
 * @returns {string} Precio formateado (ej: "15,00 €")
 */
function formatPrice(cents) {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR'
    }).format(cents / 100);
}

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {boolean} true si es válido
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Sanitiza datos del usuario
 * @param {object} data - Datos a sanitizar
 * @returns {object} Datos sanitizados
 */
function sanitizeUserData(data) {
    const sanitized = {};

    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
            // Remover espacios extra y caracteres peligrosos
            sanitized[key] = value.trim().replace(/[<>]/g, '');
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
}

/**
 * Genera un ID único
 * @returns {string} ID único
 */
function generateUniqueId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calcula el precio del curso según tipo de usuario
 * @param {string} courseType - Tipo de curso
 * @param {boolean} isMember - Si es miembro o no
 * @returns {number} Precio en centavos
 */
function calculateCoursePrice(courseType, isMember) {
    // Precios base
    const prices = {
        ia: {
            member: 1500,    // 15€
            external: 16000  // 160€
        }
        // Agregar más cursos aquí
    };

    const coursePrices = prices[courseType] || prices.ia;
    return isMember ? coursePrices.member : coursePrices.external;
}

/**
 * Valida que todos los campos requeridos estén presentes
 * @param {object} data - Datos a validar
 * @param {array} requiredFields - Campos requeridos
 * @returns {object} { valid: boolean, missing: array }
 */
function validateRequiredFields(data, requiredFields) {
    const missing = requiredFields.filter(field => !data[field]);

    return {
        valid: missing.length === 0,
        missing: missing
    };
}

module.exports = {
    formatPrice,
    isValidEmail,
    sanitizeUserData,
    generateUniqueId,
    calculateCoursePrice,
    validateRequiredFields
};
