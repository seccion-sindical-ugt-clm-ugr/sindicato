# 🗄️ API BACKEND PARA UGT-CLM Granada con MongoDB

## 📋 ESTRUCTURA DE ENDPOINTS API

### Base URL:
- **Desarrollo:** `http://localhost:3000/api`
- **Producción:** `https://ugtclmgranada.org/api`

---

## 🔐 AUTENTICACIÓN (`/auth`)

### `POST /auth/login`
**Descripción:** Iniciar sesión de usuario

**Request:**
```json
{
  "email": "usuario@ugt.org",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "email": "usuario@ugt.org",
    "name": "Juan Pérez",
    "phone": "+34 600 123 456",
    "department": "Educación",
    "member": true,
    "notifications": true,
    "publicProfile": false,
    "profilePhoto": "https://...",
    "role": "member",
    "registrationDate": "2024-01-15T10:30:00Z",
    "lastLogin": "2024-01-20T09:15:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (401):**
```json
{
  "success": false,
  "error": "Email o contraseña incorrectos"
}
```

### `POST /auth/register`
**Descripción:** Registrar nuevo afiliado

**Request:**
```json
{
  "email": "nuevo@ugt.org",
  "password": "temporal123",
  "name": "María García",
  "phone": "+34 600 789 012",
  "department": "Sanidad",
  "notifications": true,
  "publicProfile": false,
  "registeredFrom": "website"
}
```

**Response (201):**
```json
{
  "success": true,
  "user": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "email": "nuevo@ugt.org",
    "name": "María García",
    // ... resto de campos
  },
  "message": "Usuario registrado correctamente"
}
```

### `POST /auth/logout`
**Descripción:** Cerrar sesión

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "success": true,
  "message": "Sesión cerrada correctamente"
}
```

### `GET /auth/verify`
**Descripción:** Verificar token de autenticación

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "success": true,
  "user": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "email": "usuario@ugt.org",
    "name": "Juan Pérez",
    // ... resto de campos
  }
}
```

### `POST /auth/change-password`
**Descripción:** Cambiar contraseña del usuario

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "currentPassword": "vieja123",
  "newPassword": "nueva456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Contraseña actualizada correctamente"
}
```

---

## 👤 USUARIOS (`/users`)

### `GET /users/profile`
**Descripción:** Obtener perfil del usuario actual

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "success": true,
  "user": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "email": "usuario@ugt.org",
    "name": "Juan Pérez",
    "phone": "+34 600 123 456",
    "department": "Educación",
    "notifications": true,
    "publicProfile": false,
    "profilePhoto": "https://...",
    "registrationDate": "2024-01-15T10:30:00Z"
  }
}
```

### `PUT /users/update`
**Descripción:** Actualizar perfil de usuario

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "name": "Juan Pérez Updated",
  "phone": "+34 600 123 999",
  "department": "Educación Secundaria",
  "notifications": false,
  "publicProfile": true
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    // ... campos actualizados
  }
}
```

### `POST /users/upload-photo`
**Descripción:** Subir foto de perfil

**Headers:**
- `Authorization: Bearer {token}`
- `Content-Type: multipart/form-data`

**Request (FormData):**
```
photo: [file]
```

**Response (200):**
```json
{
  "success": true,
  "photoURL": "https://storage.googleapis.com/ugt-photos/64f8a1b2c3d4e5f6a7b8c9d0/photo.jpg"
}
```

### `DELETE /users/delete-photo`
**Descripción:** Eliminar foto de perfil

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "success": true,
  "message": "Foto eliminada correctamente"
}
```

---

## 📚 CURSOS (`/courses`)

### `GET /courses`
**Descripción:** Obtener lista de cursos disponibles

**Response (200):**
```json
{
  "success": true,
  "courses": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "title": "Inteligencia Artificial Aplicada al CLM",
      "description": "Curso intensivo sobre IA para educadores",
      "startDate": "2024-12-15T09:00:00Z",
      "endDate": "2024-12-17T18:00:00Z",
      "status": "active",
      "price": 0,
      "maxStudents": 30,
      "currentStudents": 15,
      "location": "Sede UGT Granada",
      "instructor": "Dr. Antonio López"
    }
  ]
}
```

### `POST /courses/preinscription`
**Descripción:** Enviar preinscripción a curso

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "courseId": "64f8a1b2c3d4e5f6a7b8c9d2",
  "userData": {
    "name": "Juan Pérez",
    "email": "juan@ugt.org",
    "phone": "+34 600 123 456",
    "department": "Educación"
  },
  "comments": "Interesado en el curso de IA"
}
```

**Response (201):**
```json
{
  "success": true,
  "preinscriptionId": "64f8a1b2c3d4e5f6a7b8c9d3",
  "message": "Preinscripción enviada correctamente"
}
```

---

## 📅 EVENTOS (`/events`)

### `GET /events`
**Descripción:** Obtener lista de eventos

**Response (200):**
```json
{
  "success": true,
  "events": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
      "title": "Asamblea General UGT-CLM Granada",
      "description": "Asamblea ordinaria trimestral",
      "date": "2024-12-20T18:00:00Z",
      "location": "Sede UGT Granada",
      "status": "active",
      "attendees": ["64f8a1b2c3d4e5f6a7b8c9d0"]
    }
  ]
}
```

---

## 📁 DOCUMENTOS (`/documents`)

### `GET /documents`
**Descripción:** Obtener lista de documentos disponibles

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "success": true,
  "documents": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d5",
      "title": "Estatutos UGT-CLM",
      "description": "Documentos estatutarios actualizados",
      "type": "PDF",
      "url": "https://storage.googleapis.com/ugt-docs/estatutos.pdf",
      "category": "legal",
      "uploadDate": "2024-01-10T10:00:00Z",
      "size": "2.5 MB"
    }
  ]
}
```

---

## 📞 CONTACTO (`/contact`)

### `POST /contact/submit`
**Descripción:** Enviar formulario de contacto

**Request:**
```json
{
  "name": "Ana Martínez",
  "email": "ana@email.com",
  "phone": "+34 600 555 666",
  "subject": "Consulta sobre afiliación",
  "message": "Me gustaría recibir información sobre los beneficios de afiliarme..."
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Mensaje enviado correctamente"
}
```

---

## 🤝 AFILIACIONES (`/affiliations`)

### `POST /affiliations/submit`
**Descripción:** Enviar solicitud de afiliación

**Request:**
```json
{
  "name": "Carlos López",
  "email": "carlos@email.com",
  "phone": "+34 600 777 888",
  "department": "Administración",
  "comments": "Interesado en afiliarme a UGT-CLM Granada"
}
```

**Response (201):**
```json
{
  "success": true,
  "affiliationId": "64f8a1b2c3d4e5f6a7b8c9d6",
  "message": "Solicitud de afiliación enviada correctamente"
}
```

---

## 🔍 HEALTH CHECK

### `GET /health`
**Descripción:** Verificar estado de la API

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:00Z",
  "version": "1.0.0",
  "database": "connected"
}
```

---

## 🚨 CÓDIGOS DE ERROR

- **200:** Success
- **201:** Created
- **400:** Bad Request
- **401:** Unauthorized
- **403:** Forbidden
- **404:** Not Found
- **409:** Conflict (email duplicado)
- **422:** Validation Error
- **500:** Internal Server Error

**Error Response Format:**
```json
{
  "success": false,
  "error": "Mensaje de error descriptivo",
  "code": "VALIDATION_ERROR"
}
```

---

## 🔐 SEGURIDAD

1. **Autenticación JWT** con expiración de 24h
2. **Hashing de contraseñas** con bcrypt
3. **Validación de inputs** contra inyección
4. **Rate limiting** para prevenir ataques
5. **CORS** configurado para dominios permitidos
6. **HTTPS** obligatorio en producción

---

## 📊 MODELOS DE DATOS MONGODB

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  name: String,
  phone: String,
  department: String,
  member: Boolean,
  notifications: Boolean,
  publicProfile: Boolean,
  profilePhoto: String,
  role: String, // member, admin, secretario
  status: String, // active, pending, inactive
  registrationDate: Date,
  lastLogin: Date,
  registeredFrom: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Courses Collection
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  startDate: Date,
  endDate: Date,
  status: String,
  price: Number,
  maxStudents: Number,
  currentStudents: Number,
  location: String,
  instructor: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Events Collection
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  date: Date,
  location: String,
  status: String,
  attendees: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}
```