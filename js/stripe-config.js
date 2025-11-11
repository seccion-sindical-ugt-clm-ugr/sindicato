// Stripe Configuration
// ⚠️ IMPORTANTE: Este archivo solo contiene configuración de FRONTEND
// ⚠️ NUNCA incluyas claves secretas (secret keys) en archivos frontend
// ⚠️ Las claves secretas SOLO deben estar en el BACKEND (servidor)

const STRIPE_CONFIG = {
    // Clave pública de Stripe (SEGURA para el frontend)
    // TODO: Reemplazar con tu clave LIVE de Stripe Dashboard
    publishableKey: 'TU_CLAVE_LIVE_AQUI',

    // URLs de tu sitio
    successUrl: 'https://sindicato-mu.vercel.app/success.html',
    cancelUrl: 'https://sindicato-mu.vercel.app/cancel.html',

    // Configuración de productos (solo información de referencia)
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
        console.log('✅ Stripe inicializado correctamente');
    } else {
        console.error('❌ Stripe no está cargado. Asegúrate de incluir <script src="https://js.stripe.com/v3/"></script>');
    }
}

/**
 * Crear sesión de checkout para afiliación
 * Llama al backend para crear una sesión de pago segura
 *
 * @param {Object} userData - Datos del usuario
 * @param {string} userData.name - Nombre completo
 * @param {string} userData.email - Email
 * @param {string} userData.phone - Teléfono
 * @param {string} userData.department - Departamento/Centro
 * @returns {Promise<Object>} Session object con id y url
 */
async function createAffiliationCheckout(userData) {
    try {
      // Validar que existe la configuración del backend
        if (!window.BACKEND_CONFIG) {
            throw new Error('⚠️ Configuración del backend no encontrada. Asegúrate de cargar backend-config.js');
        }

        const backendUrl = window.BACKEND_CONFIG.apiUrl;
        const endpoint = window.BACKEND_CONFIG.endpoints.createAffiliation;

        console.log('📤 Enviando solicitud de afiliación al backend...');

        // Llamar al endpoint del backend
        const response = await fetch(`${backendUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        // Verificar respuesta
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Error del servidor: ${response.status}`);
        }

        const session = await response.json();

        console.log('✅ Sesión de afiliación creada:', session.id);

        return session;

    } catch (error) {
        console.error('❌ Error creando sesión de afiliación:', error);

        // Mensajes de error más amigables
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            throw new Error(
                '⚠️ No se puede conectar con el servidor de pagos. ' +
                'Verifica que el backend esté funcionando. ' +
                'URL: ' + (window.BACKEND_CONFIG?.apiUrl || 'no configurada')
            );
        }

        throw error;
    }
}

/**
 * Crear sesión de checkout para curso
 * Llama al backend para crear una sesión de pago segura
 *
 * @param {string} courseType - Tipo de curso (ej: 'ia')
 * @param {Object} userData - Datos del usuario
 * @param {string} userData.name - Nombre completo
 * @param {string} userData.email - Email
 * @param {string} userData.phone - Teléfono
 * @param {string} userData.department - Empresa/Institución
 * @param {boolean} isMember - Si es afiliado UGT o no
 * @returns {Promise<Object>} Session object con id y url
 */
async function createCourseCheckout(courseType, userData, isMember = false) {
    try {
    // Validar que existe la configuración del backend
        if (!window.BACKEND_CONFIG) {
            throw new Error('⚠️ Configuración del backend no encontrada. Asegúrate de cargar backend-config.js');
        }

        const backendUrl = window.BACKEND_CONFIG.apiUrl;
        const endpoint = window.BACKEND_CONFIG.endpoints.createCourse;

        console.log('📤 Enviando solicitud de curso al backend...', {
            courseType,
            isMember,
            price: isMember ? '15€' : '160€'
        });

        // Preparar datos para el backend
        const requestData = {
            ...userData,
            courseType: courseType,
            isMember: isMember
        };

        // Llamar al endpoint del backend
        const response = await fetch(`${backendUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        // Verificar respuesta
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Error del servidor: ${response.status}`);
        }

        const session = await response.json();

        console.log('✅ Sesión de curso creada:', session.id);

        return session;

    } catch (error) {
        console.error('❌ Error creando sesión de curso:', error);

        // Mensajes de error más amigables
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            throw new Error(
                '⚠️ No se puede conectar con el servidor de pagos. ' +
                'Verifica que el backend esté funcionando. ' +
                'URL: ' + (window.BACKEND_CONFIG?.apiUrl || 'no configurada')
            );
        }

        throw error;
    }
}

/**
 * Redirigir a Stripe Checkout
 * @param {string} sessionId - ID de la sesión de Stripe
 */
async function redirectToStripeCheckout(sessionId) {
    if (!stripe) {
        console.error('❌ Stripe no inicializado');
        throw new Error('Stripe no está inicializado');
    }

    try {
        const { error } = await stripe.redirectToCheckout({ sessionId });

        if (error) {
            console.error('❌ Error redirigiendo a checkout:', error);
            showMessage('error', 'Error al redirigir al pago: ' + error.message);
            throw error;
        }
    } catch (error) {
        console.error('❌ Error en redirectToStripeCheckout:', error);
        throw error;
    }
}

/**
 * Verificar estado de una sesión de pago
 * (Solo para consultas, los webhooks manejan la confirmación real)
 *
 * @param {string} sessionId - ID de la sesión de Stripe
 * @returns {Promise<Object>} Información de la sesión
 */
async function checkPaymentStatus(sessionId) {
    try {
        // Validar que existe la configuración del backend
        if (!window.BACKEND_CONFIG) {
            throw new Error('⚠️ Configuración del backend no encontrada');
        }

        const backendUrl = window.BACKEND_CONFIG.apiUrl;
        const endpoint = window.BACKEND_CONFIG.endpoints.getSession;

        const response = await fetch(`${backendUrl}${endpoint}/${sessionId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error obteniendo sesión: ${response.status}`);
        }

        const sessionData = await response.json();
        return sessionData;

    } catch (error) {
        console.error('❌ Error verificando estado de pago:', error);
        throw error;
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
    const required = ['name', 'email', 'department'];
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
    message.style.padding = '15px 20px';
    message.style.borderRadius = '8px';
    message.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    message.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    message.style.fontSize = '14px';
    message.style.maxWidth = '400px';

    // Estilos según tipo
    if (type === 'success') {
        message.style.background = '#4CAF50';
        message.style.color = 'white';
    } else if (type === 'error') {
        message.style.background = '#f44336';
        message.style.color = 'white';
    } else {
        message.style.background = '#2196F3';
        message.style.color = 'white';
    }

    setTimeout(() => {
        if (document.body.contains(message)) {
            message.style.opacity = '0';
            message.style.transition = 'opacity 0.3s';
            setTimeout(() => {
                if (document.body.contains(message)) {
                    document.body.removeChild(message);
                }
            }, 300);
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

    // Verificar configuración del backend
    if (window.BACKEND_CONFIG) {
        console.log('%c✅ Backend API Configurado', 'background: #4CAF50; color: white; padding: 5px; font-weight: bold;');
        console.log('URL:', window.BACKEND_CONFIG.apiUrl);

        // Verificar conexión con el backend
        window.checkBackendConnection().then(connected => {
            if (connected) {
                console.log('%c✅ Sistema de Pagos Listo', 'background: #4CAF50; color: white; padding: 5px; font-weight: bold;');
                console.log('💳 Los pagos están habilitados y funcionando correctamente');
            } else {
                console.warn('%c⚠️ Backend no responde', 'background: #ff9800; color: white; padding: 5px; font-weight: bold;');
                console.warn('Asegúrate de que el backend esté corriendo en:', window.BACKEND_CONFIG.apiUrl);
            }
        });
    } else {
        console.error('%c❌ Backend NO Configurado', 'background: #f44336; color: white; padding: 5px; font-weight: bold;');
        console.error('⚠️ Asegúrate de cargar backend-config.js ANTES de stripe-config.js');
        console.error('Añade <script src="js/backend-config.js"></script> en tu HTML');
    }
});
