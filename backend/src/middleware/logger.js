/**
 * Logger Middleware
 * Registra todas las peticiones HTTP
 */

const logger = (req, res, next) => {
    const start = Date.now();

    // Capturar cuando la respuesta termina
    res.on('finish', () => {
        const duration = Date.now() - start;
        const timestamp = new Date().toISOString();

        // Determinar el emoji según el status code
        let statusEmoji = '✅';
        if (res.statusCode >= 400 && res.statusCode < 500) statusEmoji = '⚠️';
        if (res.statusCode >= 500) statusEmoji = '❌';

        // Color según el método
        const methodColors = {
            GET: '\x1b[32m',    // Verde
            POST: '\x1b[33m',   // Amarillo
            PUT: '\x1b[34m',    // Azul
            DELETE: '\x1b[31m', // Rojo
            PATCH: '\x1b[35m'   // Magenta
        };

        const color = methodColors[req.method] || '\x1b[0m';
        const reset = '\x1b[0m';

        // Log de la petición
        console.log(
            `${statusEmoji} ${timestamp} | ` +
            `${color}${req.method}${reset} ` +
            `${req.path} | ` +
            `Status: ${res.statusCode} | ` +
            `${duration}ms`
        );

        // Log adicional para errores
        if (res.statusCode >= 400) {
            console.log(`   └─ IP: ${req.ip || req.connection.remoteAddress}`);
        }
    });

    next();
};

module.exports = logger;
