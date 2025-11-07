// Stripe Configuration
// NOTA: Reemplaza con tus claves reales de Stripe
const STRIPE_CONFIG = {
    // Claves de prueba (modo desarrollo)
    publishableKey: 'pk_test_5KBH6AipFVudtyqsznP9vJXo00ku526ehA', // Tu clave real
    secretKey: 'TU_CLAVE_SECRETA_AQUI',     // ⚠️ Configurar por seguridad - No subir con clave real

    // Para producción (descomenta y reemplaza cuando estés listo)
    // publishableKey: 'pk_live_1234567890abcdef', // Reemplazar con tu clave real
    // secretKey: 'sk_live_1234567890abcdef',     // Solo para backend

    // URLs de tu sitio
    successUrl: 'https://sindicato-mu.vercel.app/success.html',
    cancelUrl: 'https://sindicato-mu.vercel.app/cancel.html',

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

// Crear checkout session para afiliación
async function createAffiliationCheckout(userData) {
    try {
        const response = await fetch('https://sindicato-mu.vercel.app/api/create-affiliation-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userData: userData
            })
        });

        const session = await response.json();

        if (session.error) {
            throw new Error(session.error.message);
        }

        return session;
    } catch (error) {
        console.error('Error creating checkout session:', error);
        throw error;
    }
}

// Crear checkout session para cursos
async function createCourseCheckout(courseType, userData, isMember = false) {
    try {
        const response = await fetch('https://sindicato-mu.vercel.app/api/create-course-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                courseType: courseType,
                userData: userData,
                isMember: isMember
            })
        });

        const session = await response.json();

        if (session.error) {
            throw new Error(session.error.message);
        }

        return session;
    } catch (error) {
        console.error('Error creating course checkout session:', error);
        throw error;
    }
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

// Verificar estado del pago
async function checkPaymentStatus(sessionId) {
    try {
        const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
            headers: {
                'Authorization': `Bearer ${STRIPE_CONFIG.secretKey}`
            }
        });

        const session = await response.json();
        return {
            status: session.payment_status,
            customer: session.customer_details,
            metadata: session.metadata
        };
    } catch (error) {
        console.error('Error checking payment status:', error);
        return null;
    }
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
});