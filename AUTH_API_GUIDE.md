# 🔐 Guía de API de Autenticación - UGT-CLM-UGR

Documentación completa del sistema de autenticación JWT implementado en el backend.

---

## 📋 Tabla de Contenidos

- [Introducción](#introducción)
- [Conceptos Clave](#conceptos-clave)
- [Autenticación](#autenticación)
  - [Registro](#post-apiauthregister)
  - [Login](#post-apiauthlogin)
  - [Refresh Token](#post-apiauthrefresh)
  - [Logout](#post-apiauthlogout)
  - [Obtener Usuario Actual](#get-apiauthme)
- [Gestión de Usuario](#gestión-de-usuario)
  - [Ver Perfil](#get-apiuserprofile)
  - [Actualizar Perfil](#put-apiuserprofile)
  - [Subir Foto](#post-apiuserphoto)
  - [Cambiar Contraseña](#put-apiuserpassword)
  - [Ver Membresía](#get-apiusermembership)
- [Rutas de Administrador](#rutas-de-administrador)
- [Códigos de Error](#códigos-de-error)
- [Ejemplos de Uso](#ejemplos-de-uso)

---

## 🎯 Introducción

El sistema de autenticación usa **JWT (JSON Web Tokens)** con:
- **Access Token**: Token de corta duración (7 días) para autenticar peticiones
- **Refresh Token**: Token de larga duración (30 días) para renovar access tokens
- **bcrypt**: Para hashear contraseñas de forma segura
- **Rate Limiting**: Protección contra ataques de fuerza bruta

---

## 🔑 Conceptos Clave

### Flujo de Autenticación

```
1. Usuario se registra o hace login
   ↓
2. Backend genera Access Token + Refresh Token
   ↓
3. Cliente guarda ambos tokens (localStorage/sessionStorage)
   ↓
4. Cliente envía Access Token en cada petición:
   Header: "Authorization: Bearer ACCESS_TOKEN"
   ↓
5. Cuando Access Token expira:
   Cliente usa Refresh Token para obtener nuevo Access Token
```

### Headers Requeridos

```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_ACCESS_TOKEN" // Solo para rutas protegidas
}
```

---

## 🚪 Autenticación

### POST /api/auth/register

Registrar nuevo usuario.

**Rate Limit**: 5 registros por hora por IP

**Body**:
```json
{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "password": "contraseña123",
  "telefono": "600123456",        // Opcional
  "departamento": "Informática"   // Opcional
}
```

**Validaciones**:
- `nombre`: 2-100 caracteres
- `email`: Email válido, único
- `password`: Mínimo 6 caracteres
- `telefono`: 9-15 dígitos (opcional)
- `departamento`: Máx 100 caracteres (opcional)

**Respuesta Exitosa (201)**:
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "nombre": "Juan Pérez",
      "email": "juan@example.com",
      "telefono": "600123456",
      "departamento": "Informática",
      "role": "afiliado",
      "membershipStatus": "pendiente",
      "isActive": true,
      "createdAt": "2024-11-08T10:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer"
  }
}
```

**Errores**:
- `409`: Email ya registrado
- `400`: Datos de validación incorrectos

---

### POST /api/auth/login

Iniciar sesión.

**Rate Limit**: 10 intentos por 15 minutos por IP

**Body**:
```json
{
  "email": "juan@example.com",
  "password": "contraseña123"
}
```

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "user": { /* ... */ },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer"
  }
}
```

**Errores**:
- `401`: Credenciales inválidas
- `403`: Cuenta desactivada

---

### POST /api/auth/refresh

Renovar access token usando refresh token.

**Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "message": "Token refrescado exitosamente",
  "data": {
    "accessToken": "NEW_ACCESS_TOKEN",
    "tokenType": "Bearer"
  }
}
```

**Errores**:
- `401`: Refresh token inválido o expirado

---

### POST /api/auth/logout

Cerrar sesión (invalidar refresh token específico).

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

**Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "message": "Logout exitoso"
}
```

---

### POST /api/auth/logout-all

Cerrar todas las sesiones del usuario.

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "message": "Todas las sesiones cerradas exitosamente"
}
```

---

### GET /api/auth/me

Obtener información del usuario autenticado.

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "nombre": "Juan Pérez",
      "email": "juan@example.com",
      "role": "afiliado",
      "membershipStatus": "activo",
      "profilePhoto": "data:image/png;base64,...",
      "coursesEnrolled": [],
      "lastLogin": "2024-11-08T10:00:00.000Z",
      "loginCount": 5
    }
  }
}
```

---

## 👤 Gestión de Usuario

### GET /api/user/profile

Obtener perfil del usuario autenticado.

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

**Respuesta**: Igual que `/api/auth/me`

---

### PUT /api/user/profile

Actualizar datos del perfil.

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

**Body** (todos opcionales):
```json
{
  "nombre": "Juan Carlos Pérez",
  "telefono": "600987654",
  "departamento": "Ciencias"
}
```

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "message": "Perfil actualizado exitosamente",
  "data": {
    "user": { /* usuario actualizado */ }
  }
}
```

**Errores**:
- `400`: Datos de validación incorrectos

---

### POST /api/user/photo

Subir o actualizar foto de perfil (Base64).

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

**Body**:
```json
{
  "photo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

**Validaciones**:
- Debe empezar con `data:image/(png|jpg|jpeg|gif|webp);base64,`
- Tamaño máximo: 2MB

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "message": "Foto de perfil actualizada exitosamente",
  "data": {
    "profilePhoto": "data:image/png;base64,..."
  }
}
```

**Errores**:
- `400`: Formato inválido o imagen muy grande

---

### DELETE /api/user/photo

Eliminar foto de perfil.

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "message": "Foto de perfil eliminada exitosamente"
}
```

---

### PUT /api/user/password

Cambiar contraseña del usuario.

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

**Body**:
```json
{
  "currentPassword": "contraseña123",
  "newPassword": "nuevaContraseña456"
}
```

**Validaciones**:
- Nueva contraseña mínimo 6 caracteres
- Nueva contraseña debe ser diferente a la actual

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente. Por favor inicia sesión nuevamente."
}
```

**Nota**: Al cambiar la contraseña, se invalidan todos los refresh tokens por seguridad.

**Errores**:
- `401`: Contraseña actual incorrecta
- `400`: Validación fallida

---

### GET /api/user/membership

Obtener información de membresía.

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "status": "activo",
    "isActive": true,
    "startDate": "2024-01-01T00:00:00.000Z",
    "expiryDate": "2025-01-01T00:00:00.000Z",
    "daysUntilExpiry": 54
  }
}
```

---

### GET /api/user/courses

Obtener cursos del usuario.

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "courseId": "curso-ia",
        "courseName": "IA Aplicada",
        "enrollmentDate": "2024-11-01T00:00:00.000Z",
        "status": "in-progress"
      }
    ],
    "total": 1
  }
}
```

---

### POST /api/user/enroll

Inscribir usuario en un curso.

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

**Body**:
```json
{
  "courseId": "curso-ia",
  "courseName": "Inteligencia Artificial Aplicada"
}
```

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "message": "Inscripción exitosa",
  "data": {
    "courses": [ /* lista actualizada */ ]
  }
}
```

**Errores**:
- `400`: Ya inscrito en este curso

---

## 👨‍💼 Rutas de Administrador

Todas requieren `role: "admin"` en el token JWT.

### GET /api/user/all

Listar todos los usuarios (con paginación).

**Query Params**:
- `page`: Número de página (default: 1)
- `limit`: Resultados por página (default: 50)
- `role`: Filtrar por rol (afiliado/admin)
- `membershipStatus`: Filtrar por estado (activo/pendiente/inactivo/suspendido)

**Ejemplo**: `/api/user/all?page=1&limit=20&role=afiliado`

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "users": [ /* array de usuarios */ ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

---

### GET /api/user/stats

Obtener estadísticas de usuarios.

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "total": 150,
    "activos": 145,
    "afiliados": 140,
    "admins": 10,
    "membershipActivo": 120,
    "membershipPendiente": 25,
    "emailVerificados": 100
  }
}
```

---

### PUT /api/user/:userId/role

Cambiar rol de un usuario.

**Body**:
```json
{
  "role": "admin"
}
```

**Valores permitidos**: `"afiliado"`, `"admin"`

---

### PUT /api/user/:userId/status

Activar o desactivar un usuario.

**Body**:
```json
{
  "isActive": false
}
```

**Nota**: Al desactivar se invalidan todos los refresh tokens.

---

### DELETE /api/user/:userId

Eliminar un usuario.

**Nota**: No puedes eliminar tu propia cuenta.

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "message": "Usuario eliminado exitosamente"
}
```

---

## ⚠️ Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Bad Request - Datos de validación incorrectos |
| 401 | Unauthorized - Token inválido o expirado |
| 403 | Forbidden - Sin permisos o cuenta desactivada |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Email ya registrado |
| 429 | Too Many Requests - Rate limit excedido |
| 500 | Internal Server Error - Error del servidor |

### Respuesta de Error Típica

```json
{
  "success": false,
  "error": "Mensaje descriptivo del error",
  "code": "TOKEN_EXPIRED" // Opcional
}
```

### Respuesta de Error de Validación

```json
{
  "success": false,
  "errors": [
    {
      "field": "email",
      "message": "Email inválido"
    },
    {
      "field": "password",
      "message": "La contraseña debe tener al menos 6 caracteres"
    }
  ]
}
```

---

## 💻 Ejemplos de Uso

### JavaScript (Fetch API)

#### Registro
```javascript
const register = async (userData) => {
  const response = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });

  const data = await response.json();

  if (data.success) {
    // Guardar tokens
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.data.user));
  }

  return data;
};

// Uso
await register({
  nombre: 'Juan Pérez',
  email: 'juan@example.com',
  password: 'contraseña123',
  telefono: '600123456',
  departamento: 'Informática'
});
```

#### Login
```javascript
const login = async (email, password) => {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (data.success) {
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.data.user));
  }

  return data;
};
```

#### Petición Autenticada
```javascript
const getUserProfile = async () => {
  const accessToken = localStorage.getItem('accessToken');

  const response = await fetch('http://localhost:3000/api/user/profile', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();

  // Si el token expiró, renovarlo
  if (data.code === 'TOKEN_EXPIRED') {
    await refreshAccessToken();
    // Reintentar la petición
    return getUserProfile();
  }

  return data;
};
```

#### Renovar Token
```javascript
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');

  const response = await fetch('http://localhost:3000/api/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ refreshToken })
  });

  const data = await response.json();

  if (data.success) {
    localStorage.setItem('accessToken', data.data.accessToken);
  } else {
    // Refresh token inválido, hacer logout
    logout();
  }

  return data;
};
```

#### Logout
```javascript
const logout = async () => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');

  await fetch('http://localhost:3000/api/auth/logout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ refreshToken })
  });

  // Limpiar almacenamiento local
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');

  // Redirigir a login
  window.location.href = '/';
};
```

#### Subir Foto de Perfil
```javascript
const uploadProfilePhoto = async (file) => {
  // Convertir imagen a Base64
  const base64 = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });

  const accessToken = localStorage.getItem('accessToken');

  const response = await fetch('http://localhost:3000/api/user/photo', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ photo: base64 })
  });

  return await response.json();
};

// Uso con input file
document.getElementById('photoInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    const result = await uploadProfilePhoto(file);
    if (result.success) {
      console.log('Foto subida exitosamente');
    }
  }
});
```

---

## 🔒 Mejores Prácticas de Seguridad

1. **Nunca** expongas tokens en la URL o logs
2. **Siempre** usa HTTPS en producción
3. **Guarda** tokens en `localStorage` o `sessionStorage` (no en cookies sin httpOnly)
4. **Implementa** auto-refresh de tokens antes de expirar
5. **Limpia** tokens al hacer logout
6. **Valida** tokens en cada petición al backend
7. **Rota** el JWT_SECRET periódicamente en producción

---

## 📞 Soporte

Para más información, consulta:
- [README.md](README.md)
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)

---

**Última actualización**: Noviembre 2024
**Versión**: 1.0.0
