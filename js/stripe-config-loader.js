// Loader de configuración de Stripe con variables de entorno
// Este archivo carga las claves de forma segura sin exponerlas en el código

// Función para cargar configuración de Stripe
function loadStripeConfig() {
    // En producción, estas variables vendrían del backend
    // Para desarrollo local, las cargamos de .env.local o de variables globales

    let config = {
        publishableKey: 'pk_test_5KBH6AipFVudtyqsznP9vJXo00ku526ehA',
        secretKey: 'TU_CLAVE_SECRETA_AQUI' // ⚠️ Configurar manualmente
    };

    // Si existe una variable global con la clave secreta (definida manualmente)
    if (typeof window.STRIPE_SECRET_KEY !== 'undefined') {
        config.secretKey = window.STRIPE_SECRET_KEY;
    }

    // Intentar cargar de localStorage (método alternativo)
    const localSecretKey = localStorage.getItem('STRIPE_SECRET_KEY');
    if (localSecretKey) {
        config.secretKey = localSecretKey;
    }

    return config;
}

// Configuración completa del sitio
const STRIPE_CONFIG = {
    ...loadStripeConfig(),

    // URLs del sitio
    successUrl: 'https://seccion-sindical-ugt-clm-ugr.github.io/sindicato/success.html',
    cancelUrl: 'https://seccion-sindical-ugt-clm-ugr.github.io/sindicato/cancel.html',

    // Configuración de productos
    products: {
        affiliation: {
            name: 'Afiliación Anual UGT-CLM-UGR',
            price: 1500, // 15.00 EUR en centavos
            currency: 'eur',
            description: 'Cuota anual de afiliación a la Sección Sindical UGT-CLM-UGR Granada'
        },
        courseIA: {
            name: 'Curso Inteligencia Artificial - Miembro UGT',
            price: 1500, // 15.00 EUR para afiliados
            currency: 'eur',
            description: 'Acceso completo al curso de IA para miembros de UGT'
        },
        courseIAExternal: {
            name: 'Curso Inteligencia Artificial - Externo',
            price: 16000, // 160.00 EUR para externos
            currency: 'eur',
            description: 'Acceso completo al curso de IA para público general'
        }
    }
};

// Función para configurar la clave secreta manualmente (solo para desarrollo)
function configureStripeSecretKey(secretKey) {
    if (typeof secretKey === 'string' && secretKey.startsWith('sk_test_')) {
        STRIPE_CONFIG.secretKey = secretKey;
        localStorage.setItem('STRIPE_SECRET_KEY', secretKey);
        console.log('✅ Clave secreta de Stripe configurada correctamente');
        return true;
    } else {
        console.error('❌ Clave secreta inválida. Debe empezar con "sk_test_"');
        return false;
    }
}

// Exportar para uso global
window.STRIPE_CONFIG = STRIPE_CONFIG;
window.configureStripeSecretKey = configureStripeSecretKey;

// Mostrar instrucciones si la clave secreta no está configurada
if (STRIPE_CONFIG.secretKey === 'TU_CLAVE_SECRETA_AQUI') {
    console.warn('⚠️ ATENCIÓN: La clave secreta de Stripe no está configurada');
    console.info('Para configurar manualmente, ejecuta en la consola:');
    console.info('configureStripeSecretKey("sk_test_tu_clave_aqui");');
}

// Para desarrollo: Configurar automáticamente si detectamos que estamos en local
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Solo para desarrollo local - configurar clave automáticamente
    // window.configureStripeSecretKey('sk_test_tu_clave_aqui'); // Descomentar para desarrollo
}