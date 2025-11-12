// 🔥 CONFIGURACIÓN FIREBASE PARA PRODUCCIÓN - UGT-CLM Granada
// Reemplazar estos valores con los del proyecto Firebase real
const firebaseConfig = {
    apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "ugt-clm-granada.firebaseapp.com",
    projectId: "ugt-clm-granada",
    storageBucket: "ugt-clm-granada.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456789"
};

// Inicializar Firebase
if (typeof firebase === 'undefined') {
    // Cargar Firebase SDK (añadir en HTML antes de este script)
    console.error('❌ Firebase SDK no cargado. Añadir los scripts de Firebase en el HTML');
}

// Inicializar servicios Firebase
let auth, db, storage;

try {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
        storage = firebase.storage();

        console.log('✅ Firebase inicializado correctamente para producción');
    }
} catch (error) {
    console.error('❌ Error al inicializar Firebase:', error);
}

// 📋 ESTRUCTURA DE DATOS EN FIRESTORE

/*
Colecciones:
- users: Datos de usuarios/afiliados
- courses: Cursos de formación
- events: Eventos y actividades
- documents: Documentos importantes
- affiliations: Solicitudes de afiliación
- payments: Registro de pagos

Estructura de documento de usuario:
{
    email: "usuario@ugt.org",
    name: "Juan Pérez",
    phone: "+34 600 123 456",
    department: "Educación",
    member: true,
    notifications: true,
    publicProfile: false,
    profilePhoto: "url/to/photo.jpg",
    registrationDate: timestamp,
    lastLogin: timestamp,
    role: "member|admin|secretario",
    status: "active|pending|inactive"
}
*/

// 🔐 SERVICIO DE AUTENTICACIÓN FIREBASE
class AuthService {
    constructor() {
        this.auth = auth;
        this.db = db;
    }

    // Registro de nuevo usuario
    async registerUser(userData) {
        try {
            // Crear usuario en Firebase Auth
            const userCredential = await this.auth.createUserWithEmailAndPassword(
                userData.email,
                userData.password
            );

            const user = userCredential.user;

            // Guardar datos adicionales en Firestore
            await this.db.collection('users').doc(user.uid).set({
                email: userData.email,
                name: userData.name,
                phone: userData.phone || '',
                department: userData.department || '',
                member: true,
                notifications: userData.notifications || true,
                publicProfile: userData.publicProfile || false,
                profilePhoto: userData.profilePhoto || null,
                registrationDate: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                role: 'member',
                status: 'active',
                registeredFrom: 'website'
            });

            console.log('✅ Usuario registrado correctamente:', user.email);
            return { success: true, user };

        } catch (error) {
            console.error('❌ Error en registro:', error);
            return { success: false, error: error.message };
        }
    }

    // Inicio de sesión
    async loginUser(email, password) {
        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Actualizar último login
            await this.db.collection('users').doc(user.uid).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log('✅ Usuario logueado correctamente:', user.email);
            return { success: true, user };

        } catch (error) {
            console.error('❌ Error en login:', error);
            return { success: false, error: error.message };
        }
    }

    // Cerrar sesión
    async logoutUser() {
        try {
            await this.auth.signOut();
            console.log('✅ Sesión cerrada correctamente');
            return { success: true };
        } catch (error) {
            console.error('❌ Error al cerrar sesión:', error);
            return { success: false, error: error.message };
        }
    }

    // Obtener datos de usuario actual
    async getCurrentUserData() {
        try {
            const user = this.auth.currentUser;
            if (!user) return null;

            const userDoc = await this.db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                return { uid: user.uid, ...userDoc.data() };
            }
            return null;
        } catch (error) {
            console.error('❌ Error al obtener datos de usuario:', error);
            return null;
        }
    }

    // Actualizar datos de usuario
    async updateUserData(uid, updateData) {
        try {
            await this.db.collection('users').doc(uid).update({
                ...updateData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log('✅ Datos de usuario actualizados correctamente');
            return { success: true };
        } catch (error) {
            console.error('❌ Error al actualizar datos:', error);
            return { success: false, error: error.message };
        }
    }

    // Subir foto de perfil
    async uploadProfilePhoto(uid, file) {
        try {
            const storageRef = storage.ref();
            const photoRef = storageRef.child(`profile-photos/${uid}/${file.name}`);

            // Subir archivo
            const snapshot = await photoRef.put(file);
            const downloadURL = await snapshot.ref.getDownloadURL();

            // Actualizar URL en Firestore
            await this.updateUserData(uid, { profilePhoto: downloadURL });

            console.log('✅ Foto de perfil subida correctamente');
            return { success: true, photoURL: downloadURL };

        } catch (error) {
            console.error('❌ Error al subir foto:', error);
            return { success: false, error: error.message };
        }
    }

    // Cambiar contraseña
    async changePassword(currentPassword, newPassword) {
        try {
            const user = this.auth.currentUser;
            if (!user) throw new Error('No hay usuario autenticado');

            // Reautenticar usuario para verificar contraseña actual
            const credential = firebase.auth.EmailAuthProvider.credential(
                user.email,
                currentPassword
            );
            await user.reauthenticateWithCredential(credential);

            // Cambiar contraseña
            await user.updatePassword(newPassword);

            console.log('✅ Contraseña cambiada correctamente');
            return { success: true };

        } catch (error) {
            console.error('❌ Error al cambiar contraseña:', error);
            return { success: false, error: error.message };
        }
    }

    // Escuchar cambios de autenticación
    onAuthStateChanged(callback) {
        return this.auth.onAuthStateChanged(callback);
    }
}

// 📊 SERVICIO DE BASE DE DATOS FIREBASE
class DatabaseService {
    constructor() {
        this.db = db;
    }

    // Obtener todos los usuarios (solo admin)
    async getAllUsers() {
        try {
            const snapshot = await this.db.collection('users').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('❌ Error al obtener usuarios:', error);
            return [];
        }
    }

    // Obtener cursos disponibles
    async getCourses() {
        try {
            const snapshot = await this.db.collection('courses')
                .where('status', '==', 'active')
                .orderBy('startDate', 'asc')
                .get();

            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('❌ Error al obtener cursos:', error);
            return [];
        }
    }

    // Obtener eventos
    async getEvents() {
        try {
            const snapshot = await this.db.collection('events')
                .where('status', '==', 'active')
                .orderBy('date', 'asc')
                .get();

            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('❌ Error al obtener eventos:', error);
            return [];
        }
    }

    // Guardar preinscripción a curso
    async saveCoursePreinscription(courseId, userData) {
        try {
            await this.db.collection('course_preinscriptions').add({
                courseId: courseId,
                userData: userData,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'pending'
            });

            console.log('✅ Preinscripción guardada correctamente');
            return { success: true };
        } catch (error) {
            console.error('❌ Error al guardar preinscripción:', error);
            return { success: false, error: error.message };
        }
    }

    // Guardar solicitud de contacto
    async saveContactRequest(contactData) {
        try {
            await this.db.collection('contact_requests').add({
                ...contactData,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'pending'
            });

            console.log('✅ Solicitud de contacto guardada');
            return { success: true };
        } catch (error) {
            console.error('❌ Error al guardar contacto:', error);
            return { success: false, error: error.message };
        }
    }
}

// 🌭 EXPORTAR SERVICIOS PARA USO GLOBAL
window.UGTFirebase = {
    auth: new AuthService(),
    db: new DatabaseService(),
    firebase: firebase
};

console.log('🚀 Servicios Firebase para producción cargados correctamente');