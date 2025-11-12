/**
 * Backend Server - UGT-CLM-UGR Granada
 * Maneja pagos con Stripe y gestión de afiliaciones
 * Última actualización: Verificación de conexión MongoDB
 */

require('dotenv').config();

// SECURITY: Configurar logging condicional ANTES de cualquier otro código
// En producción, deshabilita console.log/info/debug pero mantiene console.error
const { setupConditionalLogging } = require('./utils/logger');
setupConditionalLogging();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

// Importar rutas
const stripeRoutes = require('./routes/stripe');
const webhookRoutes = require('./routes/webhook');
const healthRoutes = require('./routes/health');
const suggestionsRoutes = require('./routes/suggestions');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const completeRegistrationRoutes = require('./routes/complete-registration');
const documentsRoutes = require('./routes/documents');
const cursoIAPdfRoutes = require('./routes/curso-ia-pdf');
const certificatesRoutes = require('./routes/certificates');

// Importar middleware
const errorHandler = require('./middleware/errorHandler');
const logger = require('./middleware/logger');

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 3000;

// Configurar confianza en proxies (necesario para Vercel, Heroku, etc.)
// Permite que express-rate-limit y otros middlewares obtengan la IP real del cliente
app.set('trust proxy', true);

// ====================================
// CONECTAR A MONGODB (Opcional)
// ====================================

// Variable para guardar el error de conexión si ocurre
let mongoConnectionError = null;

if (process.env.MONGODB_URI) {
    console.log('🔄 Intentando conectar a MongoDB...');
    console.log('📍 URI detectada (primeros 20 chars):', process.env.MONGODB_URI.substring(0, 20) + '...');

    mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 30000, // 30 segundos para encontrar servidor
        socketTimeoutMS: 45000, // 45 segundos para operaciones
        connectTimeoutMS: 30000, // 30 segundos para conexión inicial
        bufferTimeoutMS: 30000, // 30 segundos para buffering de operaciones
    })
    .then(() => {
        console.log('✅ MongoDB conectado correctamente');
        console.log('📊 Estado de conexión:', mongoose.connection.readyState);
    })
    .catch((error) => {
        mongoConnectionError = error;
        console.error('❌ Error conectando a MongoDB:', error.message);
        console.error('🔍 Tipo de error:', error.name);
        console.error('📋 Detalles:', error.codeName || error.code || 'Sin código de error');
        console.log('⚠️ El servidor continuará sin base de datos');
        console.log('💡 Las sugerencias no se guardarán hasta resolver el problema');

        // Sugerencias según el tipo de error
        if (error.message.includes('Authentication failed')) {
            console.log('🔐 Solución: Verifica el usuario y contraseña en MONGODB_URI');
        } else if (error.message.includes('IP') || error.message.includes('whitelist')) {
            console.log('🌐 Solución: Añade 0.0.0.0/0 a la whitelist en MongoDB Atlas');
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
            console.log('🔌 Solución: Verifica que la URI de MongoDB sea correcta');
        }
    });
} else {
    console.log('⚠️ MONGODB_URI no configurado - sistema de sugerencias deshabilitado');
    console.log('💡 Para habilitar sugerencias, añade MONGODB_URI a las variables de entorno');
    mongoConnectionError = new Error('MONGODB_URI no configurada');
}

// ====================================
// MIDDLEWARE DE SEGURIDAD
// ====================================

// Helmet: Protección de headers HTTP
app.use(helmet());

// CORS: Configurar dominios permitidos de forma restrictiva
// SECURITY: Lista explícita de orígenes permitidos
let allowedOrigins = [];

if (process.env.ALLOWED_ORIGINS) {
    // Limpiar y validar cada origen
    allowedOrigins = process.env.ALLOWED_ORIGINS
        .split(',')
        .map(origin => origin.trim())
        .filter(origin => {
            try {
                new URL(origin);
                return true;
            } catch (e) {
                console.warn(`⚠️ Origen inválido ignorado: ${origin}`);
                return false;
            }
        });
} else {
    // Defaults seguros solo para desarrollo
    if (process.env.NODE_ENV !== 'production') {
        allowedOrigins = ['http://localhost:8000', 'http://localhost:3000'];
        console.log('⚠️ Usando orígenes por defecto (solo desarrollo)');
    } else {
        console.error('❌ ALLOWED_ORIGINS no configurado en producción');
        throw new Error(
            '❌ ALLOWED_ORIGINS es REQUERIDA en producción.\n' +
            'Configúrala en Vercel → Settings → Environment Variables\n' +
            'Ejemplo: https://ugtclmgranada.org,https://seccion-sindical-ugt-clm-ugr.github.io'
        );
    }
}

console.log('🔒 CORS configurado con orígenes permitidos:', allowedOrigins);

// CORS restrictivo con lista explícita
app.use(cors({
    origin: function(origin, callback) {
        // Permitir requests sin origin (como Postman, curl, o mismo servidor)
        if (!origin) {
            return callback(null, true);
        }

        // Verificar que el origen esté en la lista explícita
        if (allowedOrigins.includes(origin)) {
            console.log(`✅ CORS: Origin ${origin} permitido`);
            return callback(null, true);
        }

        // Bloquear cualquier otro origen
        console.log(`❌ CORS BLOQUEADO: ${origin} no está en la lista de orígenes permitidos`);
        const msg = 'La política CORS no permite el acceso desde este origen.';
        return callback(new Error(msg), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting: Prevenir abuso
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Límite de 100 requests por ventana
    message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.',
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/', limiter);

// ====================================
// MIDDLEWARE DE PARSEO
// ====================================

// Para Stripe webhooks - debe ir ANTES de express.json()
app.use('/webhook', express.raw({ type: 'application/json' }));

// Para el resto de endpoints - aumentar límite para permitir imágenes Base64
app.use(express.json({ limit: '5mb' })); // Aumentado para fotos de perfil
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Logger personalizado
app.use(logger);

// ====================================
// RUTAS
// ====================================

// Webhook de Stripe (DEBE ir antes de otras rutas porque usa express.raw)
app.use('/webhook', webhookRoutes);

// Health check
app.use('/health', healthRoutes);

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Rutas de usuario
app.use('/api/user', userRoutes);

// Ruta de completar registro (después del pago)
app.use('/api', completeRegistrationRoutes);

// Rutas de Stripe
app.use('/api', stripeRoutes);

// Rutas de Sugerencias
app.use('/api', suggestionsRoutes);

// Rutas de Documentos
app.use('/api', documentsRoutes);

// Ruta PDF del curso de IA
app.use('/api/curso-ia', cursoIAPdfRoutes);

// Rutas de Certificados
app.use('/api/certificates', certificatesRoutes);

// Ruta raíz
app.get('/', (req, res) => {
    const mongoState = mongoose.connection.readyState;
    const mongoStates = {
        0: 'desconectada',
        1: 'conectada',
        2: 'conectando',
        3: 'desconectando'
    };

    const response = {
        name: 'UGT-CLM-UGR Backend API',
        version: '1.0.0',
        status: 'running',
        database: {
            status: mongoStates[mongoState] || 'desconocido',
            stateCode: mongoState,
            configured: !!process.env.MONGODB_URI,
            error: mongoConnectionError ? mongoConnectionError.message : null
        },
        endpoints: {
            health: '/health',
            healthDetailed: '/health/detailed',
            // Autenticación
            register: 'POST /api/auth/register',
            login: 'POST /api/auth/login',
            refresh: 'POST /api/auth/refresh',
            logout: 'POST /api/auth/logout',
            me: 'GET /api/auth/me',
            checkEmail: 'GET /api/auth/check-email',
            forgotPassword: 'POST /api/auth/forgot-password',
            resetPassword: 'POST /api/auth/reset-password',
            // Usuario
            profile: 'GET /api/user/profile',
            updateProfile: 'PUT /api/user/profile',
            uploadPhoto: 'POST /api/user/photo',
            deletePhoto: 'DELETE /api/user/photo',
            changePassword: 'PUT /api/user/password',
            membership: 'GET /api/user/membership',
            // Documentos
            documents: 'GET /api/user/documents',
            documentDownload: 'GET /api/user/documents/:id',
            generateDocument: 'POST /api/user/documents/generate',
            deleteDocument: 'DELETE /api/user/documents/:id',
            // Pagos
            createAffiliationSession: 'POST /api/create-affiliation-session',
            createCourseSession: 'POST /api/create-course-session',
            webhook: 'POST /webhook',
            // Sugerencias
            suggestions: 'POST /api/suggestions',
            suggestionsAdmin: 'GET /api/suggestions/admin (requiere auth)',
            suggestionsStats: 'GET /api/suggestions/stats',
            // Certificados
            generateCertificate: 'POST /api/certificates/generate (requiere auth)',
            checkEligibility: 'GET /api/certificates/check-eligibility/:courseType (requiere auth)'
        },
        documentation: 'Ver README.md para más información'
    };

    res.json(response);
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
const requiredEnvVars = ['STRIPE_SECRET_KEY', 'JWT_SECRET'];
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
    console.log(`   🔐 JWT: ${process.env.JWT_SECRET ? '✓ Configurado' : '✗ No configurado'}`);
    console.log(`   🌐 CORS: ${process.env.ALLOWED_ORIGINS ? '✓ Configurado' : '✗ No configurado'}`);
    if (process.env.ALLOWED_ORIGINS) {
        console.log(`   📋 ALLOWED_ORIGINS: ${process.env.ALLOWED_ORIGINS}`);
    }
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
