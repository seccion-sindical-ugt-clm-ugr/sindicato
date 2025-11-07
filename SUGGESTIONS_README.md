# 📝 Sistema de Sugerencias - UGT Centro Lenguas Modernas - UGR

Un sistema completo para que los afiliados puedan enviar sugerencias, quejas, propuestas y consultas de forma segura y anónima si lo desean.

## 🌟 Características

### Para Afiliados
- ✅ Formulario intuitivo y accesible
- 🔒 Opción de envío anónimo
- 🛡️ Protección contra spam con CAPTCHA
- 📧 Confirmación por email
- 📱 Diseño responsive para móviles
- 🎨 Interfaz moderna y profesional

### Para Administradores
- 🏛️ Panel de administración completo
- 📊 Estadísticas en tiempo real
- 🔍 Filtros avanzados (estado, tipo, urgencia)
- 📝 Gestión de estados (pendiente, en revisión, procesada, archivada)
- 📧 Notificaciones automáticas
- 🔐 Autenticación segura
- 📄 Paginación de resultados

## 🚀 Instalación y Configuración

### 1. Configurar el Backend

```bash
# Navegar al directorio del backend
cd backend

# Instalar dependencias
npm install

# Copiar archivo de configuración
cp .env.example .env

# Editar .env con tus configuraciones
nano .env
```

### 2. Variables de Entorno Requeridas

```env
# Obligatorias
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
ADMIN_PASSWORD=tu-contraseña-segura

# Para sistema de sugerencias
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ugt-database

# Para notificaciones por email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-contraseña-de-aplicacion
ADMIN_EMAIL=admin@ugt-ugr.org

# Configuración CORS
ALLOWED_ORIGINS=http://localhost:8000,https://elcorreveidile.github.io
```

### 3. Iniciar el Servidor

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 📁 Estructura de Archivos

```
sindicato/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   └── Suggestion.js          # Modelo de datos MongoDB
│   │   ├── routes/
│   │   │   └── suggestions.js        # Endpoints API
│   │   ├── services/
│   │   │   ├── emailService.js        # Servicio de email
│   │   │   └── captchaService.js      # Generador CAPTCHA
│   │   └── server.js                  # Servidor principal
│   ├── package.json
│   └── .env.example
├── admin.html                         # Panel de administración
├── index.html                         # Formulario de sugerencias
└── SUGGESTIONS_README.md              # Este archivo
```

## 🔧 Endpoints de la API

### Públicos
- `GET /api/captcha` - Generar nuevo CAPTCHA
- `POST /api/suggestions` - Enviar nueva sugerencia
- `GET /api/suggestions/stats` - Estadísticas públicas

### Administración (requieren autenticación)
- `GET /api/suggestions/admin` - Listar sugerencias
- `GET /api/suggestions/admin/:id` - Ver sugerencia específica
- `PATCH /api/suggestions/admin/:id` - Actualizar estado
- `DELETE /api/suggestions/admin/:id` - Eliminar sugerencia

## 🔐 Autenticación de Administrador

El panel de administración usa autenticación Bearer Token:

```javascript
headers: {
    'Authorization': `Bearer ${ADMIN_PASSWORD}`
}
```

## 📊 Modelo de Datos

```javascript
{
    // Información del remitente
    name: String,
    email: String,
    department: String,
    
    // Contenido
    type: String,           // sugerencia, queja, propuesta, denuncia, consulta
    subject: String,
    message: String,
    urgency: String,        // baja, media, alta
    
    // Privacidad
    isAnonymous: Boolean,
    
    // Gestión
    status: String,         // pendiente, en-revision, procesada, archivada
    processedAt: Date,
    processedBy: String,
    adminNotes: String,
    
    // Metadatos
    ipAddress: String,
    userAgent: String,
    createdAt: Date,
    updatedAt: Date
}
```

## 🛡️ Medidas de Seguridad

1. **Rate Limiting**: Máximo 3 sugerencias por IP cada 15 minutos
2. **CAPTCHA**: Prevención de bots automatizados
3. **Sanitización**: Protección contra XSS y MongoDB injection
4. **Validación**: Estricta validación de datos de entrada
5. **CORS**: Configuración restrictiva de orígenes permitidos
6. **Headers de Seguridad**: Configuración con Helmet.js

## 📧 Sistema de Notificaciones

### Para Usuarios
- ✅ Email de confirmación al enviar sugerencia
- 📧 Notificación de cambios de estado

### Para Administradores
- 📨 Email inmediato al recibir nueva sugerencia
- 📊 Resumen diario de sugerencias pendientes

## 🎨 Personalización

### Colores y Estilos
Los colores principales están definidos en CSS:
- **Primario**: `#667eea` (azul)
- **Secundario**: `#764ba2` (púrpura)
- **UGT**: `#e74c3c` (rojo sindical)

### Textos y Mensajes
Puedes personalizar los textos en:
- `index.html` - Formulario público
- `admin.html` - Panel de administración
- `emailService.js` - Plantillas de email

## 🚀 Despliegue

### Vercel (Recomendado)
1. Conectar repositorio a Vercel
2. Configurar variables de entorno en el dashboard
3. Despliegue automático en cada push

### Otros Hosting
Asegúrate de configurar:
- Variables de entorno
- Node.js versión 18+
- MongoDB Atlas si usas base de datos

## 📈 Monitoreo y Estadísticas

El sistema proporciona métricas automáticas:
- Total de sugerencias
- Distribución por estado
- Sugerencias urgentes
- Tendencias temporales

## 🔍 Solución de Problemas

### Problemas Comunes

1. **Error 503 - Base de datos no disponible**
   - Verificar `MONGODB_URI` en `.env`
   - Confirmar conexión a MongoDB Atlas

2. **Error de CORS**
   - Verificar `ALLOWED_ORIGINS` en `.env`
   - Incluir el dominio correcto

3. **Emails no se envían**
   - Verificar configuración SMTP
   - Usar contraseña de aplicación para Gmail

4. **CAPTCHA no funciona**
   - Verificar que `canvas` esté disponible
   - Revisar consola de errores JavaScript

### Logs y Depuración
```bash
# Ver logs del servidor
npm run dev

# Logs en producción
pm2 logs ugt-backend
```

## 🤝 Contribución

1. Fork del repositorio
2. Crear rama de características: `git checkout -feature/nueva-funcion`
3. Commit de cambios: `git commit -am 'Agregar nueva función'`
4. Push a la rama: `git push origin feature/nueva-funcion`
5. Pull Request

## 📄 Licencia

Este proyecto es propiedad de UGT Centro Lenguas Modernas - UGR. Todos los derechos reservados.

## 📞 Soporte

Para soporte técnico:
- 📧 Email: admin@ugt-ugr.org
- 🌐 Web: https://ugt-ugr.org
- 📱 Teléfono: [Número de contacto del sindicato]

---

**Desarrollado con ❤️ para los afiliados de UGT Centro Lenguas Modernas - UGR**
