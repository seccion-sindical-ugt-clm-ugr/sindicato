/**
 * Backend Server - UGT-CLM-UGR Granada
 * Maneja pagos con Stripe y gestión de afiliaciones
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

// Importar rutas
const stripeRoutes = require('./routes/stripe');
const healthRoutes = require('./routes/health');
const suggestionsRoutes = require('./routes/suggestions');

// Importar middleware
const errorHandler = require('./middleware/errorHandler');
const logger = require('./middleware/logger');

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 3000;

// ====================================
// CONECTAR A MONGODB (Opcional)
// ====================================

if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ MongoDB conectado correctamente');
    })
    .catch((error) => {
        console.error('❌ Error conectando a MongoDB:', error.message);
        console.log('⚠️ El servidor continuará sin base de datos');
        console.log('💡 Las sugerencias no se guardarán hasta configurar MONGODB_URI');
    });
} else {
    console.log('⚠️ MONGODB_URI no configurado - sistema de sugerencias deshabilitado');
    console.log('💡 Para habilitar sugerencias, añade MONGODB_URI a las variables de entorno');
}

// ====================================
// MIDDLEWARE DE SEGURIDAD
// ====================================

// Helmet: Protección de headers HTTP
app.use(helmet());

// CORS: Configurar dominios permitidos
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:8000', 'http://localhost:3000'];

app.use(cors({
    origin: function(origin, callback) {
        // Permitir requests sin origin (como Postman o mismo servidor)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'La política CORS no permite el acceso desde este origen.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting: Prevenir abuso
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Límite de 100 requests por ventana
    message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter);

// ====================================
// MIDDLEWARE DE PARSEO
// ====================================

// Para Stripe webhooks - debe ir ANTES de express.json()
app.use('/webhook', express.raw({ type: 'application/json' }));

// Para el resto de endpoints
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger personalizado
app.use(logger);

// ====================================
// RUTAS
// ====================================

// Health check
app.use('/health', healthRoutes);

// Rutas de Stripe
app.use('/api', stripeRoutes);

// Rutas de Sugerencias
app.use('/api', suggestionsRoutes);

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        name: 'UGT-CLM-UGR Backend API',
        version: '1.0.0',
        status: 'running',
        database: mongoose.connection.readyState === 1 ? 'conectada' : 'desconectada',
        endpoints: {
            health: '/health',
            createAffiliationSession: 'POST /api/create-affiliation-session',
            createCourseSession: 'POST /api/create-course-session',
            webhook: 'POST /webhook',
            suggestions: 'POST /api/suggestions',
            suggestionsAdmin: 'GET /api/suggestions/admin (requiere auth)',
            suggestionsStats: 'GET /api/suggestions/stats'
        },
        documentation: 'Ver README.md para más información'
    });
});

// Ruta 404
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Ruta no encontrada',
        path: req.originalUrl
    });
});

// ====================================
// MANEJO DE ERRORES
// ====================================

app.use(errorHandler);

// ====================================
// INICIAR SERVIDOR
// ====================================

// Validar variables de entorno requeridas
const requiredEnvVars = ['STRIPE_SECRET_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error('❌ ERROR: Faltan variables de entorno requeridas:');
    missingEnvVars.forEach(varName => {
        console.error(`   - ${varName}`);
    });
    console.error('\n💡 Copia .env.example a .env y configura las variables');
    process.exit(1);
}

// Iniciar servidor
app.listen(PORT, () => {
    console.log('\n🚀 ===================================');
    console.log(`   Servidor UGT-CLM-UGR iniciado`);
    console.log('   ===================================');
    console.log(`   🌐 URL: http://localhost:${PORT}`);
    console.log(`   📝 Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   💳 Stripe: ${process.env.STRIPE_SECRET_KEY ? '✓ Configurado' : '✗ No configurado'}`);
    console.log(`   💾 MongoDB: ${process.env.MONGODB_URI ? '✓ Configurado' : '✗ No configurado'}`);
    console.log('   ===================================\n');
});

// Manejo de errores no capturados
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled Promise Rejection:', error);
    // En producción, podrías querer cerrar el servidor
    // process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

module.exports = app;
