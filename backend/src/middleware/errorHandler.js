/**
 * Error Handler Middleware
 * Maneja errores de manera centralizada y devuelve respuestas consistentes
 */

const errorHandler = (err, req, res, next) => {
    // Log del error
    console.error('❌ Error capturado:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    // Errores de Stripe
    if (err.type === 'StripeCardError') {
        return res.status(400).json({
            error: 'Error en la tarjeta',
            message: err.message,
            code: err.code
        });
    }

    if (err.type === 'StripeInvalidRequestError') {
        return res.status(400).json({
            error: 'Solicitud inválida a Stripe',
            message: err.message
        });
    }

    if (err.type === 'StripeAPIError') {
        return res.status(500).json({
            error: 'Error en la API de Stripe',
            message: 'Por favor, intenta de nuevo más tarde'
        });
    }

    // Errores de validación
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Error de validación',
            message: err.message
        });
    }

    // Error CORS
    if (err.message && err.message.includes('CORS')) {
        return res.status(403).json({
            error: 'CORS Error',
            message: 'Origen no permitido'
        });
    }

    // Error genérico
    res.status(err.status || 500).json({
        error: 'Error del servidor',
        message: process.env.NODE_ENV === 'development'
            ? err.message
            : 'Ha ocurrido un error. Por favor, intenta de nuevo.',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;
