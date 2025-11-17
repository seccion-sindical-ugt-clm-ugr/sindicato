/**
 * Protección de Rutas de Administración
 * Redirige a usuarios no autorizados
 */

(function() {
    'use strict';

    /**
     * Verificar si el usuario actual es admin
     */
    function isUserAdmin() {
        try {
            const user = JSON.parse(localStorage.getItem('user') || 'null');
            const accessToken = localStorage.getItem('accessToken');

            // Debe tener token y ser admin
            return user && accessToken && user.role === 'admin';
        } catch (error) {
            console.error('Error verificando rol de usuario:', error);
            return false;
        }
    }

    /**
     * Redirigir a la página principal con mensaje
     */
    function redirectToHome(message) {
        console.warn('⚠️ Acceso denegado:', message);

        // Guardar mensaje para mostrar en la página principal
        sessionStorage.setItem('accessDeniedMessage', message);

        // Redirigir después de un breve delay para que se vea el mensaje
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 1500);
    }

    /**
     * Mostrar mensaje de acceso denegado
     */
    function showAccessDenied(message) {
        const body = document.body;

        // Limpiar contenido existente
        body.innerHTML = '';

        // Crear contenedor de mensaje
        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        container.innerHTML = `
            <div style="
                background: white;
                padding: 40px;
                border-radius: 12px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                text-align: center;
                max-width: 500px;
                margin: 20px;
            ">
                <div style="
                    font-size: 64px;
                    color: #d32f2f;
                    margin-bottom: 20px;
                ">🔒</div>
                <h1 style="
                    color: #333;
                    font-size: 28px;
                    margin-bottom: 15px;
                ">Acceso Denegado</h1>
                <p style="
                    color: #666;
                    font-size: 16px;
                    margin-bottom: 30px;
                    line-height: 1.6;
                ">${message}</p>
                <a href="../index.html" style="
                    display: inline-block;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-decoration: none;
                    padding: 12px 30px;
                    border-radius: 6px;
                    font-weight: 600;
                    transition: transform 0.2s;
                ">Volver al Inicio</a>
            </div>
        `;

        body.appendChild(container);
    }

    /**
     * Proteger la página actual
     */
    function protectAdminPage() {
        console.log('🔒 Verificando permisos de administrador...');

        // Verificar si el usuario es admin
        if (!isUserAdmin()) {
            const user = JSON.parse(localStorage.getItem('user') || 'null');
            const accessToken = localStorage.getItem('accessToken');

            let message;
            if (!accessToken) {
                message = 'Debes iniciar sesión para acceder al panel de administración.';
            } else if (!user || user.role !== 'admin') {
                message = 'No tienes permisos para acceder a esta página. Solo los administradores pueden ver esta sección.';
            } else {
                message = 'Acceso no autorizado. Por favor, contacta con el administrador.';
            }

            // Mostrar mensaje y redirigir
            showAccessDenied(message);

            // Lanzar error para detener ejecución de scripts adicionales
            throw new Error('Acceso denegado: ' + message);
        }

        console.log('✅ Permisos verificados: Usuario es administrador');
    }

    // Proteger la página inmediatamente al cargar
    protectAdminPage();

    // Exportar funciones útiles
    window.adminProtection = {
        isUserAdmin,
        protectAdminPage
    };
})();
