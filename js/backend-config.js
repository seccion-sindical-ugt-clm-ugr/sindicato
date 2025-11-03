/**
 * Configuración de Backend API
 *
 * Este archivo configura la URL del backend según el entorno.
 * El backend maneja todas las operaciones sensibles con Stripe.
 */

// Detectar entorno automáticamente
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isGitHubPages = window.location.hostname.includes('github.io');

// Configuración de URLs del backend
const BACKEND_CONFIG = {
    // URL del backend en desarrollo (servidor local)
    development: 'http://localhost:3000',

    // URL del backend en producción (reemplazar con tu URL de Vercel/Railway/Render)
    production: 'https://TU-BACKEND.vercel.app',

    // Auto-detectar entorno actual
    get apiUrl() {
        // Si hay una configuración manual en localStorage, usarla
        const manualUrl = localStorage.getItem('BACKEND_API_URL');
        if (manualUrl) {
            console.log('📍 Usando backend configurado manualmente:', manualUrl);
            return manualUrl;
        }

        // Auto-detectar según el hostname
        if (isLocal) {
            console.log('📍 Entorno detectado: DESARROLLO (localhost)');
            return this.development;
        } else {
            console.log('📍 Entorno detectado: PRODUCCIÓN');
            return this.production;
        }
    },

    // Endpoints disponibles
    endpoints: {
        createAffiliation: '/api/create-affiliation-session',
        createCourse: '/api/create-course-session',
        getSession: '/api/session',
        health: '/health'
    }
};

/**
 * Configurar manualmente la URL del backend
 * Útil para testing o cuando trabajas con un backend en otra ubicación
 *
 * Ejemplo de uso desde la consola del navegador:
 *   setBackendUrl('https://mi-backend.vercel.app')
 *   setBackendUrl('http://localhost:3001')  // Si usas otro puerto
 *   clearBackendUrl()  // Para volver a la detección automática
 */
function setBackendUrl(url) {
    if (!url || typeof url !== 'string') {
        console.error('❌ URL inválida');
        return;
    }

    // Validar que es una URL válida
    try {
        new URL(url);
        localStorage.setItem('BACKEND_API_URL', url);
        console.log('✅ Backend URL configurada:', url);
        console.log('🔄 Recarga la página para aplicar los cambios');
    } catch (e) {
        console.error('❌ URL inválida:', e.message);
    }
}

/**
 * Limpiar configuración manual del backend
 */
function clearBackendUrl() {
    localStorage.removeItem('BACKEND_API_URL');
    console.log('✅ Configuración manual eliminada');
    console.log('🔄 Recarga la página para volver a la detección automática');
}

/**
 * Mostrar configuración actual
 */
function showBackendConfig() {
    console.log('📋 Configuración del Backend:');
    console.log('   URL actual:', BACKEND_CONFIG.apiUrl);
    console.log('   Entorno:', isLocal ? 'Desarrollo' : 'Producción');
    console.log('   Configuración manual:', localStorage.getItem('BACKEND_API_URL') || 'No');
    console.log('\n💡 Para cambiar: setBackendUrl("https://tu-backend.com")');
    console.log('💡 Para resetear: clearBackendUrl()');
}

// Verificar conexión con el backend
async function checkBackendConnection() {
    try {
        const response = await fetch(`${BACKEND_CONFIG.apiUrl}${BACKEND_CONFIG.endpoints.health}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend conectado:', data);
            return true;
        } else {
            console.warn('⚠️ Backend respondió con error:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ No se puede conectar con el backend:', error.message);
        console.log('\n💡 Asegúrate de que:');
        console.log('   1. El backend está corriendo');
        console.log('   2. La URL es correcta:', BACKEND_CONFIG.apiUrl);
        console.log('   3. CORS está configurado correctamente en el backend');
        return false;
    }
}

// Exportar al scope global
window.BACKEND_CONFIG = BACKEND_CONFIG;
window.setBackendUrl = setBackendUrl;
window.clearBackendUrl = clearBackendUrl;
window.showBackendConfig = showBackendConfig;
window.checkBackendConnection = checkBackendConnection;

// Log de configuración inicial
console.log('%c🔧 Backend API Configuration', 'background: #4CAF50; color: white; padding: 5px; font-weight: bold;');
console.log('Backend URL:', BACKEND_CONFIG.apiUrl);
console.log('Usa showBackendConfig() para ver detalles');
