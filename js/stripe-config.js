// Stripe Configuration
// ⚠️ IMPORTANTE: Este archivo solo contiene configuración de FRONTEND
// ⚠️ NUNCA incluyas claves secretas (secret keys) en archivos frontend
// ⚠️ Las claves secretas SOLO deben estar en el BACKEND (servidor)

const STRIPE_CONFIG = {
    // Clave pública de Stripe (SEGURA para el frontend)
    publishableKey: 'pk_test_5KBH6AipFVudtyqsznP9vJXo00ku526ehA',

    // ❌ ELIMINADO POR SEGURIDAD: secretKey
    // Las claves secretas NUNCA deben estar en el frontend
    // Implementa un backend (Node.js, PHP, Python) para manejar operaciones secretas

    // URLs de tu sitio
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

// Inicializar Stripe
let stripe;
let elements;

// Función para inicializar Stripe
function initStripe() {
    if (typeof Stripe !== 'undefined') {
        stripe = Stripe(STRIPE_CONFIG.publishableKey);
        console.log('Stripe inicializado correctamente');
    } else {
        console.error('Stripe no está cargado');
    }
}

// ⚠️ FUNCIÓN DESHABILITADA POR SEGURIDAD
// Esta función requiere un BACKEND para funcionar correctamente
// NO se pueden crear sesiones de Stripe directamente desde el navegador
async function createAffiliationCheckout(userData) {
    // ❌ DESHABILITADO: Llamadas directas a la API de Stripe desde el frontend son INSEGURAS

    throw new Error(
        '⚠️ BACKEND REQUERIDO: ' +
        'Los pagos requieren un servidor backend para procesar de forma segura. ' +
        'Por favor, implementa un endpoint de servidor que maneje la creación de sesiones de Stripe. ' +
        'Ver documentación en stripe-setup-guide.md'
    );

    /* CÓDIGO DE REFERENCIA PARA IMPLEMENTAR EN EL BACKEND:

    // Este código debe ejecutarse en tu SERVIDOR (Node.js, PHP, Python, etc.)
    // NUNCA en el navegador del cliente

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
            price_data: {
                currency: 'eur',
                product_data: {
                    name: 'Afiliación Anual UGT-CLM-UGR',
                    description: 'Cuota anual de afiliación'
                },
                unit_amount: 1500  // 15.00 EUR en centavos
            },
            quantity: 1
        }],
        mode: 'payment',
        success_url: 'https://tu-sitio.com/success.html?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'https://tu-sitio.com/cancel.html',
        customer_email: userData.email,
        metadata: {
            name: userData.name,
            phone: userData.phone,
            department: userData.department
        }
    });

    return session;
    */
}

// ⚠️ FUNCIÓN DESHABILITADA POR SEGURIDAD
// Esta función requiere un BACKEND para funcionar correctamente
async function createCourseCheckout(courseType, userData, isMember = false) {
    // ❌ DESHABILITADO: Llamadas directas a la API de Stripe desde el frontend son INSEGURAS

    throw new Error(
        '⚠️ BACKEND REQUERIDO: ' +
        'Los pagos de cursos requieren un servidor backend. ' +
        'Implementa un endpoint de servidor para crear sesiones de pago de forma segura.'
    );

    /* CÓDIGO DE REFERENCIA PARA IMPLEMENTAR EN EL BACKEND:

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const price = isMember ? 1500 : 16000; // 15€ o 160€ en centavos

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
            price_data: {
                currency: 'eur',
                product_data: {
                    name: `Curso Inteligencia Artificial - ${isMember ? 'Afiliado' : 'Externo'}`,
                    description: 'Acceso completo al curso de IA'
                },
                unit_amount: price
            },
            quantity: 1
        }],
        mode: 'payment',
        success_url: 'https://tu-sitio.com/success.html?session_id={CHECKOUT_SESSION_ID}&course=' + courseType,
        cancel_url: 'https://tu-sitio.com/cancel.html',
        customer_email: userData.email,
        metadata: {
            courseType: courseType,
            isMember: isMember.toString(),
            name: userData.name,
            phone: userData.phone
        }
    });

    return session;
    */
}

// Redirigir a Stripe Checkout
async function redirectToStripeCheckout(sessionId) {
    if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) {
            console.error('Error redirecting to checkout:', error);
            showMessage('error', 'Error al redirigir al pago: ' + error.message);
        }
    }
}

// ⚠️ FUNCIÓN DESHABILITADA POR SEGURIDAD
// Verificación de pagos debe hacerse en el BACKEND
async function checkPaymentStatus(sessionId) {
    // ❌ DESHABILITADO: Esta operación requiere clave secreta y debe ejecutarse en el servidor

    throw new Error(
        '⚠️ BACKEND REQUERIDO: ' +
        'La verificación del estado de pago debe hacerse desde el servidor backend.'
    );

    /* CÓDIGO DE REFERENCIA PARA IMPLEMENTAR EN EL BACKEND:

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return {
        status: session.payment_status,
        customer: session.customer_details,
        metadata: session.metadata
    };
    */
}

// Formatear precio para mostrar
function formatPrice(cents) {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR'
    }).format(cents / 100);
}

// Validar datos del usuario
function validateUserData(userData) {
    const required = ['name', 'email', 'phone', 'department'];
    const missing = required.filter(field => !userData[field] || userData[field].trim() === '');

    if (missing.length > 0) {
        throw new Error(`Faltan campos obligatorios: ${missing.join(', ')}`);
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
        throw new Error('El email no es válido');
    }

    return true;
}

// Mostrar mensajes
function showMessage(type, text) {
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;

    document.body.appendChild(message);
    message.style.position = 'fixed';
    message.style.top = '20px';
    message.style.right = '20px';
    message.style.zIndex = '10000';

    setTimeout(() => {
        if (document.body.contains(message)) {
            document.body.removeChild(message);
        }
    }, 5000);
}

// Exportar para uso global
window.StripeConfig = STRIPE_CONFIG;
window.initStripe = initStripe;
window.createAffiliationCheckout = createAffiliationCheckout;
window.createCourseCheckout = createCourseCheckout;
window.redirectToStripeCheckout = redirectToStripeCheckout;
window.checkPaymentStatus = checkPaymentStatus;
window.formatPrice = formatPrice;
window.validateUserData = validateUserData;
window.showMessage = showMessage;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    initStripe();

    // ⚠️ ADVERTENCIA DE SEGURIDAD
    console.warn(
        '%c⚠️ ADVERTENCIA DE SEGURIDAD - STRIPE NO CONFIGURADO COMPLETAMENTE',
        'background: #ff6b6b; color: white; font-size: 16px; padding: 10px; font-weight: bold;'
    );
    console.warn(
        '%cLos pagos con Stripe requieren un BACKEND (servidor) para funcionar de forma segura.\n' +
        'Actualmente, las funciones de pago están DESHABILITADAS por seguridad.\n\n' +
        'Para habilitar pagos:\n' +
        '1. Implementa un servidor backend (Node.js, PHP, Python, etc.)\n' +
        '2. Mueve la clave secreta de Stripe al servidor\n' +
        '3. Crea endpoints API en tu servidor para crear sesiones de pago\n' +
        '4. Modifica el frontend para llamar a tus endpoints\n\n' +
        'Ver: stripe-setup-guide.md para más información',
        'color: #666; font-size: 12px;'
    );
});