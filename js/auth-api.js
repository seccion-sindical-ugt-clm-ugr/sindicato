/**
 * API de Autenticación - Frontend Helper
 * Maneja todas las operaciones de autenticación con el backend
 */

// Configuración de la API
const getBackendConfig = () => {
    if (typeof window.getBackendConfig === 'function') {
        return window.getBackendConfig();
    }
    // Fallback si backend-config.js no está cargado
    return {
        API_URL: window.location.hostname === 'localhost'
            ? 'http://localhost:3000'
            : 'https://sindicato-backend.vercel.app'
    };
};

const API_URL = () => getBackendConfig().API_URL;

/**
 * Clase AuthAPI - Gestiona autenticación
 */
class AuthAPI {
    constructor() {
        this.accessToken = localStorage.getItem('accessToken');
        this.refreshToken = localStorage.getItem('refreshToken');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
    }

    /**
     * Realizar petición HTTP con autenticación
     */
    async request(endpoint, options = {}) {
        const url = `${API_URL()}${endpoint}`;

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Agregar token si existe
        if (this.accessToken && !options.skipAuth) {
            headers['Authorization'] = `Bearer ${this.accessToken}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            const data = await response.json();

            // Si el token expiró, intentar renovarlo
            if (data.code === 'TOKEN_EXPIRED' && !options.skipRefresh) {
                console.log('🔄 Token expirado, renovando...');
                const refreshed = await this.refresh();

                if (refreshed) {
                    // Reintentar la petición original
                    return this.request(endpoint, { ...options, skipRefresh: true });
                } else {
                    // No se pudo renovar, hacer logout
                    this.logout();
                    throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
                }
            }

            return data;

        } catch (error) {
            console.error('❌ Error en petición:', error);
            throw error;
        }
    }

    /**
     * Registrar nuevo usuario
     */
    async register(userData) {
        try {
            const data = await this.request('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData),
                skipAuth: true
            });

            if (data.success) {
                this.saveTokens(data.data);
                console.log('✅ Registro exitoso');
            }

            return data;
        } catch (error) {
            console.error('❌ Error en registro:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Iniciar sesión
     */
    async login(email, password) {
        try {
            const data = await this.request('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
                skipAuth: true
            });

            if (data.success) {
                this.saveTokens(data.data);
                console.log('✅ Login exitoso');
            }

            return data;
        } catch (error) {
            console.error('❌ Error en login:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Renovar access token
     */
    async refresh() {
        if (!this.refreshToken) {
            return false;
        }

        try {
            const data = await this.request('/api/auth/refresh', {
                method: 'POST',
                body: JSON.stringify({ refreshToken: this.refreshToken }),
                skipAuth: true,
                skipRefresh: true
            });

            if (data.success) {
                this.accessToken = data.data.accessToken;
                localStorage.setItem('accessToken', this.accessToken);
                console.log('✅ Token renovado');
                return true;
            }

            return false;
        } catch (error) {
            console.error('❌ Error al renovar token:', error);
            return false;
        }
    }

    /**
     * Cerrar sesión
     */
    async logout() {
        try {
            if (this.accessToken && this.refreshToken) {
                await this.request('/api/auth/logout', {
                    method: 'POST',
                    body: JSON.stringify({ refreshToken: this.refreshToken })
                });
            }
        } catch (error) {
            console.error('❌ Error en logout:', error);
        } finally {
            this.clearTokens();
            console.log('✅ Logout completado');
        }
    }

    /**
     * Obtener usuario actual
     */
    async me() {
        try {
            const data = await this.request('/api/auth/me', {
                method: 'GET'
            });

            if (data.success) {
                this.user = data.data.user;
                localStorage.setItem('user', JSON.stringify(this.user));
            }

            return data;
        } catch (error) {
            console.error('❌ Error al obtener usuario:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Verificar si hay usuario autenticado
     */
    isAuthenticated() {
        return !!this.accessToken && !!this.user;
    }

    /**
     * Obtener usuario desde localStorage
     */
    getUser() {
        return this.user;
    }

    /**
     * Verificar si el usuario es admin
     */
    isAdmin() {
        return this.user?.role === 'admin';
    }

    /**
     * Verificar si el usuario es afiliado
     */
    isAfiliado() {
        return this.user?.role === 'afiliado';
    }

    /**
     * Guardar tokens en localStorage
     */
    saveTokens(data) {
        this.accessToken = data.accessToken;
        this.refreshToken = data.refreshToken;
        this.user = data.user;

        localStorage.setItem('accessToken', this.accessToken);
        localStorage.setItem('refreshToken', this.refreshToken);
        localStorage.setItem('user', JSON.stringify(this.user));
    }

    /**
     * Limpiar tokens del localStorage
     */
    clearTokens() {
        this.accessToken = null;
        this.refreshToken = null;
        this.user = null;

        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    }

    // ==================== GESTIÓN DE USUARIO ====================

    /**
     * Obtener perfil del usuario
     */
    async getProfile() {
        return this.request('/api/user/profile', { method: 'GET' });
    }

    /**
     * Actualizar perfil
     */
    async updateProfile(userData) {
        const data = await this.request('/api/user/profile', {
            method: 'PUT',
            body: JSON.stringify(userData)
        });

        if (data.success) {
            this.user = data.data.user;
            localStorage.setItem('user', JSON.stringify(this.user));
        }

        return data;
    }

    /**
     * Subir foto de perfil
     */
    async uploadPhoto(base64Image) {
        const data = await this.request('/api/user/photo', {
            method: 'POST',
            body: JSON.stringify({ photo: base64Image })
        });

        if (data.success) {
            // Actualizar usuario en localStorage
            const updatedUser = await this.me();
        }

        return data;
    }

    /**
     * Eliminar foto de perfil
     */
    async deletePhoto() {
        const data = await this.request('/api/user/photo', {
            method: 'DELETE'
        });

        if (data.success) {
            const updatedUser = await this.me();
        }

        return data;
    }

    /**
     * Cambiar contraseña
     */
    async changePassword(currentPassword, newPassword) {
        const data = await this.request('/api/user/password', {
            method: 'PUT',
            body: JSON.stringify({ currentPassword, newPassword })
        });

        if (data.success) {
            // Después de cambiar contraseña, se invalidan todos los tokens
            this.clearTokens();
        }

        return data;
    }

    /**
     * Obtener información de membresía
     */
    async getMembership() {
        return this.request('/api/user/membership', { method: 'GET' });
    }

    /**
     * Obtener cursos del usuario
     */
    async getCourses() {
        return this.request('/api/user/courses', { method: 'GET' });
    }

    /**
     * Inscribirse en un curso
     */
    async enrollCourse(courseId, courseName) {
        return this.request('/api/user/enroll', {
            method: 'POST',
            body: JSON.stringify({ courseId, courseName })
        });
    }

    // ==================== RUTAS DE ADMINISTRADOR ====================

    /**
     * Obtener todos los usuarios (admin)
     */
    async getAllUsers(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/api/user/all?${queryString}`, { method: 'GET' });
    }

    /**
     * Obtener estadísticas de usuarios (admin)
     */
    async getUserStats() {
        return this.request('/api/user/stats', { method: 'GET' });
    }

    /**
     * Actualizar rol de usuario (admin)
     */
    async updateUserRole(userId, role) {
        return this.request(`/api/user/${userId}/role`, {
            method: 'PUT',
            body: JSON.stringify({ role })
        });
    }

    /**
     * Activar/Desactivar usuario (admin)
     */
    async updateUserStatus(userId, isActive) {
        return this.request(`/api/user/${userId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ isActive })
        });
    }

    /**
     * Eliminar usuario (admin)
     */
    async deleteUser(userId) {
        return this.request(`/api/user/${userId}`, {
            method: 'DELETE'
        });
    }
}

// Crear instancia global
const authAPI = new AuthAPI();

// Exportar para uso en otros archivos
window.authAPI = authAPI;

// Logging para debug
console.log('🔐 AuthAPI inicializado');
if (authAPI.isAuthenticated()) {
    console.log('✅ Usuario autenticado:', authAPI.getUser().email);
}
