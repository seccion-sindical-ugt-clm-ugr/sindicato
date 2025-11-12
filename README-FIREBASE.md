# 🚀 GUÍA DE DESPLIEGUE FIREBASE - UGT-CLM Granada

## 📋 CONFIGURACIÓN REQUERIDA PARA PRODUCCIÓN

### 1. Crear Proyecto Firebase
1. Ir a [Firebase Console](https://console.firebase.google.com/)
2. Crear nuevo proyecto: `ugt-clm-granada`
3. Habilitar servicios:
   - ✅ Authentication (Email/Password)
   - ✅ Firestore Database
   - ✅ Storage (para fotos de perfil)

### 2. Configurar Firebase Authentication
```
Authentication → Sign-in method → Email/Password → Activar
```

### 3. Configurar Firestore Database
```
Firestore Database → Crear base de datos → Iniciar en modo producción
```

### 4. Aplicar Reglas de Seguridad
Copiar el contenido de `firestore.rules` en Firestore → Rules

### 5. Configurar Firebase Storage
```
Storage → Empezar en modo producción
Reglas de storage:
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profile-photos/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🔑 CONFIGURACIÓN DE VARIABLES

### Archivo: `firebase-config.js`
Reemplazar estos valores con los del proyecto real:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXX",      // Reemplazar
    authDomain: "ugt-clm-granada.firebaseapp.com",      // Reemplazar
    projectId: "ugt-clm-granada",                       // Reemplazar
    storageBucket: "ugt-clm-granada.appspot.com",      // Reemplazar
    messagingSenderId: "123456789",                     // Reemplazar
    appId: "1:123456789:web:abcdef123456789"          // Reemplazar
};
```

## 🏗️ ESTRUCTURA DE DATOS EN FIRESTORE

### Colección: `users`
```javascript
{
  email: "usuario@ugt.org",
  name: "Juan Pérez",
  phone: "+34 600 123 456",
  department: "Educación",
  member: true,
  notifications: true,
  publicProfile: false,
  profilePhoto: "https://firebasestorage.googleapis.com/...",
  registrationDate: timestamp,
  lastLogin: timestamp,
  role: "member", // member, admin, secretario
  status: "active" // active, pending, inactive
}
```

### Colección: `courses`
```javascript
{
  title: "Inteligencia Artificial Aplicada al CLM",
  description: "Curso sobre IA para educadores",
  startDate: timestamp,
  endDate: timestamp,
  status: "active",
  price: 0,
  maxStudents: 30,
  currentStudents: 15
}
```

### Colección: `events`
```javascript
{
  title: "Asamblea General UGT-CLM",
  description: "Asamblea ordinaria",
  date: timestamp,
  location: "Sede UGT Granada",
  status: "active",
  attendees: []
}
```

## 🚀 DESPLIEGUE A PRODUCCIÓN

### Opción 1: Firebase Hosting (Recomendado)
```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login en Firebase
firebase login

# Inicializar proyecto
firebase init

# Desplegar
firebase deploy
```

### Opción 2: Hosting Personalizado
1. Subir archivos al servidor
2. Configurar dominio personalizado
3. Instalar SSL certificate

## 📊 FUNCIONALIDADES IMPLEMENTADAS

### ✅ Autenticación
- Registro de nuevos afiliados
- Inicio de sesión seguro
- Recuperación de contraseña
- Cambio de contraseña
- Cierre de sesión

### ✅ Gestión de Perfiles
- Edición de datos personales
- Subida de foto de perfil
- Configuración de notificaciones
- Perfil público/privado

### ✅ Base de Datos Persistente
- Usuarios guardados en Firestore
- Datos persistencia real
- Backup automático

### ✅ Seguridad
- Reglas de seguridad Firestore
- Autenticación segura
- Protección de datos

## 🧪 MODO PRUEBAS

El sitio funciona en dos modos:

### 🔥 Modo Producción (Firebase)
- Datos reales en Firestore
- Autenticación Firebase Auth
- Persistencia real

### 🛠️ Modo Desarrollo (Local)
- Datos en memoria
- Sin Firebase requerido
- Para desarrollo local

## 🔧 MANTENIMIENTO

### Monitorización
- Firebase Console → Usage
- Revisar consumos diarios
- Alertas de seguridad

### Backups
- Firestore exportaciones automáticas
- Configurar retención de datos
- Plan de recuperación

### Actualizaciones
- Mantener SDKs actualizados
- Revisar reglas de seguridad
- Actualizar dependencias

## 📞 SOPORTE

Para cualquier incidencia con Firebase:
- Documentación: https://firebase.google.com/docs
- Soporte: https://firebase.google.com/support
- Consola: https://console.firebase.google.com/