/**
 * Logger Utility
 * Condiciona los logs según el entorno
 * En producción, solo muestra errores críticos
 */

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// Guardar referencias originales
const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
    debug: console.debug
};

/**
 * Configurar logging condicional
 * En producción, deshabilita logs de debug pero mantiene errores
 */
function setupConditionalLogging() {
    if (isProduction) {
        // En producción, silenciar console.log, console.info, console.debug
        console.log = () => {};
        console.info = () => {};
        console.debug = () => {};

        // Mantener console.warn pero con prefijo
        console.warn = (...args) => {
            originalConsole.warn('[WARN]', ...args);
        };

        // Mantener console.error sin cambios (crítico para debugging)
        console.error = (...args) => {
            originalConsole.error('[ERROR]', ...args);
        };

        originalConsole.log('🔇 Logger: Logs de debug deshabilitados en producción');
    } else {
        originalConsole.log('📝 Logger: Logs de debug habilitados en desarrollo');
    }
}

/**
 * Logger explícito para usar en código
 * Uso: logger.debug('mensaje'), logger.info('mensaje'), logger.error('mensaje')
 */
const logger = {
    // Solo en desarrollo
    debug: (...args) => {
        if (!isProduction) {
            originalConsole.log('[DEBUG]', ...args);
        }
    },

    // Solo en desarrollo
    info: (...args) => {
        if (!isProduction) {
            originalConsole.info('[INFO]', ...args);
        }
    },

    // Siempre (advertencias importantes)
    warn: (...args) => {
        originalConsole.warn('[WARN]', ...args);
    },

    // Siempre (errores críticos)
    error: (...args) => {
        originalConsole.error('[ERROR]', ...args);
    },

    // Solo en desarrollo - para operaciones exitosas
    success: (...args) => {
        if (!isProduction) {
            originalConsole.log('[SUCCESS] ✅', ...args);
        }
    }
};

module.exports = {
    setupConditionalLogging,
    logger,
    isProduction,
    isDevelopment
};
