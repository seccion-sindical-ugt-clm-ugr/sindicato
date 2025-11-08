#!/usr/bin/env node

/**
 * Script de Verificación de Variables de Entorno
 * UGT-CLM-UGR Backend
 *
 * Verifica que todas las variables de entorno requeridas estén configuradas correctamente.
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Colores para la consola
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(color, symbol, message) {
    console.log(`${color}${symbol} ${message}${colors.reset}`);
}

function success(message) {
    log(colors.green, '✅', message);
}

function error(message) {
    log(colors.red, '❌', message);
}

function warning(message) {
    log(colors.yellow, '⚠️ ', message);
}

function info(message) {
    log(colors.blue, 'ℹ️ ', message);
}

function header(message) {
    console.log(`\n${colors.cyan}═════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}  ${message}${colors.reset}`);
    console.log(`${colors.cyan}═════════════════════════════════════════════${colors.reset}\n`);
}

// Variables requeridas
const REQUIRED_VARS = {
    'MONGODB_URI': {
        description: 'URI de conexión a MongoDB',
        validator: (val) => val && val.startsWith('mongodb'),
        help: 'Debe comenzar con "mongodb://" o "mongodb+srv://"'
    },
    'JWT_SECRET': {
        description: 'Secreto para firmar tokens JWT',
        validator: (val) => val && val.length >= 32,
        help: 'Debe tener al menos 32 caracteres. Genera uno con: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
    },
    'STRIPE_SECRET_KEY': {
        description: 'Clave secreta de Stripe',
        validator: (val) => val && (val.startsWith('sk_test_') || val.startsWith('sk_live_')),
        help: 'Debe comenzar con "sk_test_" (testing) o "sk_live_" (producción)'
    },
    'STRIPE_WEBHOOK_SECRET': {
        description: 'Secreto para verificar webhooks de Stripe',
        validator: (val) => val && val.startsWith('whsec_'),
        help: 'Debe comenzar con "whsec_". Obtenerlo en https://dashboard.stripe.com/webhooks'
    },
    'SUCCESS_URL': {
        description: 'URL de redirección después de pago exitoso',
        validator: (val) => val && (val.startsWith('http://') || val.startsWith('https://')),
        help: 'Debe ser una URL completa (ej: https://tu-dominio.com/success.html)'
    },
    'CANCEL_URL': {
        description: 'URL de redirección después de pago cancelado',
        validator: (val) => val && (val.startsWith('http://') || val.startsWith('https://')),
        help: 'Debe ser una URL completa (ej: https://tu-dominio.com/cancel.html)'
    },
    'ALLOWED_ORIGINS': {
        description: 'Orígenes permitidos para CORS',
        validator: (val) => val && val.length > 0,
        help: 'Lista separada por comas de dominios permitidos (ej: https://dominio1.com,https://dominio2.com)'
    }
};

// Variables opcionales pero recomendadas
const OPTIONAL_VARS = {
    'NODE_ENV': 'Entorno de ejecución (development/production)',
    'PORT': 'Puerto del servidor',
    'JWT_EXPIRES_IN': 'Tiempo de expiración de tokens de acceso',
    'JWT_REFRESH_EXPIRES_IN': 'Tiempo de expiración de tokens de refresh',
    'EMAIL_HOST': 'Host del servidor SMTP',
    'EMAIL_USER': 'Usuario de email',
    'EMAIL_PASS': 'Contraseña de email',
    'ADMIN_EMAIL': 'Email del administrador',
    'ADMIN_PASSWORD': 'Contraseña del administrador'
};

async function verifyEnvironmentVariables() {
    header('Verificación de Variables de Entorno');

    let hasErrors = false;
    let hasWarnings = false;

    // Verificar variables requeridas
    info('Verificando variables OBLIGATORIAS...\n');

    for (const [varName, config] of Object.entries(REQUIRED_VARS)) {
        const value = process.env[varName];

        if (!value) {
            error(`${varName} - No configurada`);
            console.log(`   ${colors.yellow}Descripción:${colors.reset} ${config.description}`);
            console.log(`   ${colors.yellow}Ayuda:${colors.reset} ${config.help}\n`);
            hasErrors = true;
        } else if (!config.validator(value)) {
            error(`${varName} - Valor inválido`);
            console.log(`   ${colors.yellow}Valor actual:${colors.reset} ${value.substring(0, 20)}...`);
            console.log(`   ${colors.yellow}Ayuda:${colors.reset} ${config.help}\n`);
            hasErrors = true;
        } else {
            success(`${varName} - OK`);
        }
    }

    // Verificar variables opcionales
    console.log('');
    info('Verificando variables OPCIONALES...\n');

    for (const [varName, description] of Object.entries(OPTIONAL_VARS)) {
        const value = process.env[varName];

        if (!value) {
            warning(`${varName} - No configurada`);
            console.log(`   ${colors.yellow}Descripción:${colors.reset} ${description}\n`);
            hasWarnings = true;
        } else {
            success(`${varName} - OK (${value.substring(0, 20)}...)`);
        }
    }

    return { hasErrors, hasWarnings };
}

async function testMongoDBConnection() {
    header('Prueba de Conexión a MongoDB');

    if (!process.env.MONGODB_URI) {
        error('No se puede probar: MONGODB_URI no está configurada');
        return false;
    }

    try {
        info('Conectando a MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000
        });

        success('Conexión a MongoDB exitosa');

        // Información adicional
        const dbName = mongoose.connection.db.databaseName;
        const host = mongoose.connection.host;
        console.log(`   ${colors.cyan}Base de datos:${colors.reset} ${dbName}`);
        console.log(`   ${colors.cyan}Host:${colors.reset} ${host}`);

        await mongoose.disconnect();
        return true;

    } catch (err) {
        error('No se pudo conectar a MongoDB');
        console.log(`   ${colors.yellow}Error:${colors.reset} ${err.message}`);

        if (err.message.includes('authentication failed')) {
            console.log(`   ${colors.yellow}Sugerencia:${colors.reset} Verifica el usuario y contraseña en la URI`);
        } else if (err.message.includes('ENOTFOUND')) {
            console.log(`   ${colors.yellow}Sugerencia:${colors.reset} Verifica que la URI sea correcta`);
        } else if (err.message.includes('IP')) {
            console.log(`   ${colors.yellow}Sugerencia:${colors.reset} Añade 0.0.0.0/0 en MongoDB Atlas → Network Access`);
        }

        return false;
    }
}

async function testStripeConnection() {
    header('Prueba de Conexión a Stripe');

    if (!process.env.STRIPE_SECRET_KEY) {
        error('No se puede probar: STRIPE_SECRET_KEY no está configurada');
        return false;
    }

    try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

        info('Verificando clave de Stripe...');
        const balance = await stripe.balance.retrieve();

        success('Conexión a Stripe exitosa');
        console.log(`   ${colors.cyan}Modo:${colors.reset} ${process.env.STRIPE_SECRET_KEY.startsWith('sk_test_') ? 'Test' : 'Live'}`);
        console.log(`   ${colors.cyan}Balance disponible:${colors.reset} ${balance.available[0]?.amount / 100 || 0} ${balance.available[0]?.currency?.toUpperCase() || 'EUR'}`);

        return true;

    } catch (err) {
        error('No se pudo conectar a Stripe');
        console.log(`   ${colors.yellow}Error:${colors.reset} ${err.message}`);
        console.log(`   ${colors.yellow}Sugerencia:${colors.reset} Verifica que STRIPE_SECRET_KEY sea válida en https://dashboard.stripe.com/apikeys`);
        return false;
    }
}

async function generateReport() {
    header('Resumen de Verificación');

    const results = await verifyEnvironmentVariables();
    const mongoOk = await testMongoDBConnection();
    const stripeOk = await testStripeConnection();

    console.log('');
    header('Resultado Final');

    if (results.hasErrors) {
        error('La configuración tiene ERRORES CRÍTICOS');
        console.log(`\n${colors.red}La aplicación NO funcionará correctamente.${colors.reset}`);
        console.log(`${colors.yellow}Por favor, corrige los errores anteriores y vuelve a ejecutar este script.${colors.reset}\n`);
        console.log(`${colors.cyan}Ayuda detallada en:${colors.reset} backend/DEPLOYMENT_GUIDE.md\n`);
        process.exit(1);
    } else if (!mongoOk || !stripeOk) {
        warning('La configuración tiene problemas de conexión');
        console.log(`\n${colors.yellow}Algunas variables están configuradas pero hay problemas de conexión.${colors.reset}`);
        console.log(`${colors.yellow}Revisa los errores de conexión anteriores.${colors.reset}\n`);
        process.exit(1);
    } else if (results.hasWarnings) {
        warning('La configuración está FUNCIONAL pero incompleta');
        console.log(`\n${colors.green}La aplicación funcionará, pero se recomienda configurar las variables opcionales.${colors.reset}\n`);
        process.exit(0);
    } else {
        success('¡La configuración es PERFECTA!');
        console.log(`\n${colors.green}✨ Todas las variables están configuradas correctamente.${colors.reset}`);
        console.log(`${colors.green}✨ Todas las conexiones funcionan.${colors.reset}`);
        console.log(`\n${colors.cyan}Puedes iniciar el servidor con:${colors.reset} npm run dev\n`);
        process.exit(0);
    }
}

// Ejecutar verificación
generateReport().catch(err => {
    console.error('Error inesperado:', err);
    process.exit(1);
});
