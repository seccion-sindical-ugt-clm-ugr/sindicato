// 🗄️ CONFIGURACIÓN API - UGT-CLM Granada con MongoDB
// Conexión a la base de datos MongoDB existente

class DatabaseAPI {
    constructor() {
        // Configuración de la API (debe apuntar al backend existente)
        this.baseURL = window.location.hostname === 'localhost'
            ? 'http://localhost:3000/api'  // Desarrollo local
            : 'https://ugtclmgranada.org/api';  // Producción

        // URLs alternativas para desarrollo
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            // Intentar diferentes puertos para desarrollo
            this.altBaseURLs = [
                'http://localhost:3000/api',
                'http://localhost:8000/api',
                'http://127.0.0.1:3000/api',
                'http://127.0.0.1:8000/api'
            ];
        }

        this.endpoints = {
            // Usuarios y autenticación
            auth: {
                login: '/auth/login',
                register: '/auth/register',
                logout: '/auth/logout',
                verify: '/auth/verify',
                changePassword: '/auth/change-password'
            },
            users: {
                profile: '/users/profile',
                update: '/users/update',
                uploadPhoto: '/users/upload-photo',
                deletePhoto: '/users/delete-photo'
            },
            courses: {
                list: '/courses',
                preinscription: '/courses/preinscription'
            },
            events: {
                list: '/events'
            },
            documents: {
                list: '/documents'
            },
            contact: {
                submit: '/contact/submit'
            },
            affiliations: {
                submit: '/affiliations/submit'
            }
        };
    }

    // Método genérico para hacer peticiones con fallback a URLs alternativas
    async request(endpoint, options = {}) {
        const urls = [this.baseURL];

        // Añadir URLs alternativas en desarrollo
        if (this.altBaseURLs) {
            urls.push(...this.altBaseURLs);
        }

        for (const baseURL of urls) {
            try {
                const url = `${baseURL}${endpoint}`;

                const config = {
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    },
                    ...options
                };

                // Añadir token de autenticación si existe
                const token = localStorage.getItem('authToken');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }

                console.log(`📡 API Request: ${options.method || 'GET'} ${url}`);

                const response = await fetch(url, config);

                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ API Response:', data);

                    // Si esta URL funcionó, guardarla como principal para futuras peticiones
                    if (baseURL !== this.baseURL) {
                        this.baseURL = baseURL;
                        console.log(`🎯 Nueva URL principal detectada: ${baseURL}`);
                    }

                    return data;
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
                }

            } catch (error) {
                console.warn(`⚠️ Intento fallido con ${baseURL}: ${error.message}`);

                // Si es el último intento, lanzar el error
                if (baseURL === urls[urls.length - 1]) {
                    console.error('❌ Todos los intentos de conexión fallaron');
                    throw new Error('No se pudo conectar con el servidor. Por favor, verifica tu conexión.');
                }

                // Si no es el último, continuar con el siguiente intento
                continue;
            }
        }
    }

    // Métodos de autenticación
    async login(email, password) {
        return this.request(this.endpoints.auth.login, {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    async register(userData) {
        return this.request(this.endpoints.auth.register, {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async logout() {
        return this.request(this.endpoints.auth.logout, {
            method: 'POST'
        });
    }

    async verifyToken() {
        return this.request(this.endpoints.auth.verify);
    }

    async changePassword(currentPassword, newPassword) {
        return this.request(this.endpoints.auth.changePassword, {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword })
        });
    }

    // Métodos de perfil de usuario
    async getUserProfile() {
        return this.request(this.endpoints.users.profile);
    }

    async updateUserProfile(updateData) {
        return this.request(this.endpoints.users.update, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });
    }

    async uploadProfilePhoto(file) {
        const formData = new FormData();
        formData.append('photo', file);

        return this.request(this.endpoints.users.uploadPhoto, {
            method: 'POST',
            headers: {}, // Dejar que browser establezca Content-Type para FormData
            body: formData
        });
    }

    async deleteProfilePhoto() {
        return this.request(this.endpoints.users.deletePhoto, {
            method: 'DELETE'
        });
    }

    // Métodos de cursos
    async getCourses() {
        return this.request(this.endpoints.courses.list);
    }

    async submitCoursePreinscription(courseData) {
        return this.request(this.endpoints.courses.preinscription, {
            method: 'POST',
            body: JSON.stringify(courseData)
        });
    }

    // Métodos de eventos
    async getEvents() {
        return this.request(this.endpoints.events.list);
    }

    // Métodos de documentos
    async getDocuments() {
        return this.request(this.endpoints.documents.list);
    }

    // Métodos de contacto
    async submitContactForm(contactData) {
        return this.request(this.endpoints.contact.submit, {
            method: 'POST',
            body: JSON.stringify(contactData)
        });
    }

    // Métodos de afiliación
    async submitAffiliation(affiliationData) {
        return this.request(this.endpoints.affiliations.submit, {
            method: 'POST',
            body: JSON.stringify(affiliationData)
        });
    }
}

// 🔄 Fallback para desarrollo local si el backend no está disponible
class LocalFallback {
    constructor() {
        this.users = [
            {
                _id: '1',
                email: 'afiliado@ugt.org',
                password: 'ugt2024',
                name: 'Juan Pérez',
                member: true,
                phone: '+34 600 123 456',
                department: 'Educación',
                notifications: true,
                publicProfile: false,
                profilePhoto: null
            },
            {
                _id: '2',
                email: 'test@ugt.org',
                password: 'test123',
                name: 'María García',
                member: true,
                phone: '+34 600 789 012',
                department: 'Sanidad',
                notifications: true,
                publicProfile: false,
                profilePhoto: null
            },
            {
                _id: '3',
                email: 'admin@ugt.org',
                password: 'admin123',
                name: 'Administrador',
                member: true,
                admin: true,
                phone: '+34 600 111 222',
                department: 'Administración',
                notifications: true,
                publicProfile: true,
                profilePhoto: null
            },
            {
                _id: '4',
                email: 'ugtclmgranada@gmail.com',
                password: 'ugt123456',
                name: 'UGT-CLM Granada Oficial',
                member: true,
                admin: true,
                phone: '+34 958 123 456',
                department: 'Sindical',
                notifications: true,
                publicProfile: true,
                profilePhoto: null
            }
        ];

        this.currentUser = null;
        this.courses = [
            {
                _id: '1',
                title: 'Inteligencia Artificial Aplicada al Sector Educativo del CLM',
                description: 'Curso intensivo sobre IA aplicada a la educación',
                startDate: new Date('2024-12-15'),
                status: 'active',
                price: 0
            }
        ];

        this.events = [
            {
                _id: '1',
                title: 'Asamblea General UGT-CLM Granada',
                description: 'Asamblea ordinaria de miembros',
                date: new Date('2024-12-20'),
                location: 'Sede UGT Granada',
                status: 'active'
            }
        ];
    }

    async login(email, password) {
        console.log('🛠️ Local fallback: login');

        const user = this.users.find(u => u.email === email && u.password === password);

        if (user) {
            this.currentUser = { ...user };
            delete this.currentUser.password; // No enviar contraseña al frontend

            // Guardar en localStorage
            localStorage.setItem('authToken', 'local-fallback-token');
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

            return {
                success: true,
                user: this.currentUser,
                token: 'local-fallback-token'
            };
        } else {
            throw new Error('Email o contraseña incorrectos');
        }
    }

    async register(userData) {
        console.log('🛠️ Local fallback: register');

        const existingUser = this.users.find(u => u.email === userData.email);
        if (existingUser) {
            throw new Error('El email ya está registrado');
        }

        const newUser = {
            _id: Date.now().toString(),
            ...userData,
            member: true,
            registrationDate: new Date(),
            notifications: true,
            publicProfile: false,
            profilePhoto: null
        };

        this.users.push(newUser);

        return {
            success: true,
            user: { ...newUser },
            message: 'Usuario registrado correctamente'
        };
    }

    async logout() {
        console.log('🛠️ Local fallback: logout');

        this.currentUser = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');

        return { success: true };
    }

    async getUserProfile() {
        console.log('🛠️ Local fallback: getUserProfile');

        const currentUserData = localStorage.getItem('currentUser');
        if (currentUserData) {
            this.currentUser = JSON.parse(currentUserData);
        }

        if (this.currentUser) {
            return { success: true, user: this.currentUser };
        } else {
            throw new Error('No hay usuario autenticado');
        }
    }

    async updateUserProfile(updateData) {
        console.log('🛠️ Local fallback: updateUserProfile');

        if (!this.currentUser) {
            throw new Error('No hay usuario autenticado');
        }

        const userIndex = this.users.findIndex(u => u._id === this.currentUser._id);
        if (userIndex !== -1) {
            this.users[userIndex] = { ...this.users[userIndex], ...updateData };
            this.currentUser = { ...this.currentUser, ...updateData };

            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

            return { success: true, user: this.currentUser };
        } else {
            throw new Error('Usuario no encontrado');
        }
    }

    async changePassword(currentPassword, newPassword) {
        console.log('🛠️ Local fallback: changePassword');

        if (!this.currentUser) {
            throw new Error('No hay usuario autenticado');
        }

        const user = this.users.find(u => u._id === this.currentUser._id);
        if (user && user.password === currentPassword) {
            user.password = newPassword;
            return { success: true };
        } else {
            throw new Error('La contraseña actual es incorrecta');
        }
    }

    async getCourses() {
        console.log('🛠️ Local fallback: getCourses');
        return { success: true, courses: this.courses };
    }

    async getEvents() {
        console.log('🛠️ Local fallback: getEvents');
        return { success: true, events: this.events };
    }

    async submitContactForm(contactData) {
        console.log('🛠️ Local fallback: submitContactForm');
        console.log('Contact data:', contactData);
        return { success: true, message: 'Mensaje enviado correctamente' };
    }

    async submitAffiliation(affiliationData) {
        console.log('🛠️ Local fallback: submitAffiliation');
        console.log('Affiliation data:', affiliationData);
        return { success: true, message: 'Solicitud de afiliación enviada' };
    }
}

// 🎯 Servicio principal de base de datos
class DatabaseService {
    constructor() {
        this.api = new DatabaseAPI();
        this.fallback = new LocalFallback();
        this.usingAPI = false;
        this.currentUser = null;
    }

    // Inicializar y probar conexión
    async init() {
        try {
            // Probar conexión con el backend
            await this.api.request('/health');
            this.usingAPI = true;
            console.log('✅ Conectado a MongoDB via API');

            // Verificar si hay token guardado
            const token = localStorage.getItem('authToken');
            if (token) {
                try {
                    const result = await this.api.verifyToken();
                    if (result.success) {
                        this.currentUser = result.user;
                        console.log('✅ Usuario autenticado:', this.currentUser.name);
                    }
                } catch (error) {
                    console.log('⚠️ Token inválido, limpiando localStorage');
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('currentUser');
                }
            }

        } catch (error) {
            this.usingAPI = false;
            console.warn('⚠️ Backend no disponible, usando modo local (desarrollo)');

            // Cargar usuario del localStorage si existe
            const currentUserData = localStorage.getItem('currentUser');
            if (currentUserData) {
                this.currentUser = JSON.parse(currentUserData);
            }
        }
    }

    // Métodos que delegan a API o fallback
    async login(email, password) {
        try {
            if (this.usingAPI) {
                const result = await this.api.login(email, password);
                if (result.success) {
                    this.currentUser = result.user;
                    localStorage.setItem('authToken', result.token);
                    localStorage.setItem('currentUser', JSON.stringify(result.user));
                }
                return result;
            } else {
                const result = await this.fallback.login(email, password);
                this.currentUser = result.user;
                return result;
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async register(userData) {
        try {
            if (this.usingAPI) {
                return await this.api.register(userData);
            } else {
                return await this.fallback.register(userData);
            }
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    }

    async logout() {
        try {
            if (this.usingAPI) {
                await this.api.logout();
            }
            await this.fallback.logout();
            this.currentUser = null;
        } catch (error) {
            console.error('Logout error:', error);
            // Siempre limpiar datos locales incluso si falla la API
            this.fallback.logout();
            this.currentUser = null;
        }
    }

    async getUserProfile() {
        try {
            if (this.usingAPI) {
                const result = await this.api.getUserProfile();
                if (result.success) {
                    this.currentUser = result.user;
                    localStorage.setItem('currentUser', JSON.stringify(result.user));
                }
                return result;
            } else {
                return await this.fallback.getUserProfile();
            }
        } catch (error) {
            console.error('Get profile error:', error);
            throw error;
        }
    }

    async updateUserProfile(updateData) {
        try {
            if (this.usingAPI) {
                const result = await this.api.updateUserProfile(updateData);
                if (result.success) {
                    this.currentUser = result.user;
                    localStorage.setItem('currentUser', JSON.stringify(result.user));
                }
                return result;
            } else {
                const result = await this.fallback.updateUserProfile(updateData);
                this.currentUser = result.user;
                return result;
            }
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    }

    async changePassword(currentPassword, newPassword) {
        try {
            if (this.usingAPI) {
                return await this.api.changePassword(currentPassword, newPassword);
            } else {
                return await this.fallback.changePassword(currentPassword, newPassword);
            }
        } catch (error) {
            console.error('Change password error:', error);
            throw error;
        }
    }

    async getCourses() {
        try {
            if (this.usingAPI) {
                return await this.api.getCourses();
            } else {
                return await this.fallback.getCourses();
            }
        } catch (error) {
            console.error('Get courses error:', error);
            return { success: true, courses: [] };
        }
    }

    async getEvents() {
        try {
            if (this.usingAPI) {
                return await this.api.getEvents();
            } else {
                return await this.fallback.getEvents();
            }
        } catch (error) {
            console.error('Get events error:', error);
            return { success: true, events: [] };
        }
    }

    async submitContactForm(contactData) {
        try {
            if (this.usingAPI) {
                return await this.api.submitContactForm(contactData);
            } else {
                return await this.fallback.submitContactForm(contactData);
            }
        } catch (error) {
            console.error('Submit contact error:', error);
            throw error;
        }
    }

    async submitAffiliation(affiliationData) {
        try {
            if (this.usingAPI) {
                return await this.api.submitAffiliation(affiliationData);
            } else {
                return await this.fallback.submitAffiliation(affiliationData);
            }
        } catch (error) {
            console.error('Submit affiliation error:', error);
            throw error;
        }
    }

    // Upload de foto (solo disponible en producción)
    async uploadProfilePhoto(file) {
        if (this.usingAPI) {
            try {
                const result = await this.api.uploadProfilePhoto(file);
                if (result.success) {
                    this.currentUser.profilePhoto = result.photoURL;
                    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                }
                return result;
            } catch (error) {
                console.error('Upload photo error:', error);
                throw error;
            }
        } else {
            // Modo desarrollo: convertir a base64
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const photoURL = e.target.result;
                    this.currentUser.profilePhoto = photoURL;
                    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                    resolve({ success: true, photoURL });
                };
                reader.readAsDataURL(file);
            });
        }
    }

    // Getters útiles
    get isLoggedIn() {
        return !!this.currentUser;
    }

    get isAdmin() {
        return this.currentUser?.admin || this.currentUser?.role === 'admin';
    }

    get userName() {
        return this.currentUser?.name || 'Afiliado';
    }

    get userEmail() {
        return this.currentUser?.email || '';
    }

    get userProfilePhoto() {
        return this.currentUser?.profilePhoto || null;
    }
}

// 🌭 Exportar servicio global para uso en la aplicación
window.UGTDatabase = new DatabaseService();

// Inicializar servicio cuando cargue la página
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await window.UGTDatabase.init();
        console.log('🚀 Base de datos UGT inicializada correctamente');
        console.log(`📊 Modo: ${window.UGTDatabase.usingAPI ? 'MongoDB (Producción)' : 'Local (Desarrollo)'}`);
    } catch (error) {
        console.error('❌ Error al inicializar base de datos:', error);
    }
});

console.log('🗄️ Sistema de base de datos UGT-CLM Granada cargado');