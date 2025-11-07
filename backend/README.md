# Backend API - UGT-CLM-UGR Granada

Backend para gestión de pagos con Stripe, afiliaciones y cursos de formación.

## 🚀 Características

- ✅ Procesamiento seguro de pagos con Stripe
- ✅ API RESTful con Express.js
- ✅ Validación de datos con express-validator
- ✅ Protección CORS configurada
- ✅ Rate limiting para prevenir abuso
- ✅ Webhooks de Stripe integrados
- ✅ Logs de peticiones HTTP
- ✅ Manejo centralizado de errores
- ✅ Health checks para monitoreo

## 📋 Requisitos

- Node.js >= 18.0.0
- npm >= 9.0.0
- Cuenta de Stripe (puedes usar modo test)

## 🛠️ Instalación

### 1. Instalar dependencias

```bash
cd backend
npm install
```

### 2. Configurar variables de entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar .env con tus valores
nano .env
```

**Variables requeridas en `.env`:**

```bash
# Servidor
PORT=3000
NODE_ENV=development

# Stripe - Obtén tus claves en https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_tu_clave_aqui
STRIPE_PUBLISHABLE_KEY=pk_test_tu_clave_aqui

# Webhooks - Configura en https://dashboard.stripe.com/webhooks
STRIPE_WEBHOOK_SECRET=whsec_tu_secret_aqui

# URLs del sitio
FRONTEND_URL=https://seccion-sindical-ugt-clm-ugr.github.io
SUCCESS_URL=https://seccion-sindical-ugt-clm-ugr.github.io/sindicato/success.html
CANCEL_URL=https://seccion-sindical-ugt-clm-ugr.github.io/sindicato/cancel.html

# CORS
ALLOWED_ORIGINS=https://seccion-sindical-ugt-clm-ugr.github.io,http://localhost:8000
```

### 3. Ejecutar el servidor

**Modo desarrollo (con auto-reload):**
```bash
npm run dev
```

**Modo producción:**
```bash
npm start
```

El servidor iniciará en `http://localhost:3000`

## 📡 Endpoints

### Health Check

```http
GET /health
```

Respuesta:
```json
{
  "status": "ok",
  "timestamp": "2024-11-03T21:00:00.000Z",
  "uptime": 123.45,
  "environment": "development"
}
```

### Crear Sesión de Afiliación

```http
POST /api/create-affiliation-session
Content-Type: application/json

{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "phone": "600123456",
  "department": "Departamento de Física"
}
```

Respuesta:
```json
{
  "id": "cs_test_abc123...",
  "url": "https://checkout.stripe.com/pay/cs_test_abc123..."
}
```

### Crear Sesión de Curso

```http
POST /api/create-course-session
Content-Type: application/json

{
  "name": "María García",
  "email": "maria@example.com",
  "phone": "600654321",
  "department": "Departamento de Informática",
  "courseType": "ia",
  "isMember": true
}
```

Respuesta:
```json
{
  "id": "cs_test_xyz789...",
  "url": "https://checkout.stripe.com/pay/cs_test_xyz789..."
}
```

### Webhook de Stripe

```http
POST /webhook
Content-Type: application/json
Stripe-Signature: [firma de stripe]

[Evento de Stripe]
```

Este endpoint recibe eventos de Stripe cuando ocurren pagos.

### Verificar Sesión (Opcional)

```http
GET /api/session/:sessionId
```

Respuesta:
```json
{
  "id": "cs_test_abc123...",
  "payment_status": "paid",
  "customer_email": "juan@example.com",
  "amount_total": 1500,
  "currency": "eur",
  "metadata": {
    "type": "affiliation",
    "name": "Juan Pérez",
    "phone": "600123456",
    "department": "Departamento de Física"
  }
}
```

## 🔒 Seguridad

### CORS

El servidor solo acepta peticiones desde los orígenes configurados en `ALLOWED_ORIGINS`.

### Rate Limiting

- Máximo 100 requests por IP cada 15 minutos en endpoints `/api/*`
- Previene ataques DDoS y abuso

### Validación

Todos los datos de entrada son validados con `express-validator`:
- Emails válidos
- Campos requeridos no vacíos
- Tipos de datos correctos

### Headers de Seguridad

Helmet.js añade headers de seguridad HTTP:
- X-DNS-Prefetch-Control
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security
- Y más...

## 🧪 Testing

### Probar con cURL

**Crear sesión de afiliación:**
```bash
curl -X POST http://localhost:3000/api/create-affiliation-session \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "600000000",
    "department": "Test Department"
  }'
```

**Health check:**
```bash
curl http://localhost:3000/health
```

### Probar con Postman

1. Importa la colección desde `docs/postman_collection.json` (si existe)
2. Configura las variables de entorno
3. Ejecuta las peticiones

### Tarjetas de prueba de Stripe

En modo test, usa estas tarjetas:

- **Éxito:** `4242 4242 4242 4242`
- **Fallo:** `4000 0000 0000 0002`
- **Requiere autenticación:** `4000 0025 0000 3155`

Cualquier fecha futura y cualquier CVC funcionan.

## 🔄 Webhooks de Stripe

### 1. Configurar webhook en Stripe Dashboard

1. Ve a https://dashboard.stripe.com/webhooks
2. Clic en "Add endpoint"
3. URL: `https://tu-servidor.com/webhook`
4. Selecciona eventos:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copia el "Signing secret" y añádelo a `.env` como `STRIPE_WEBHOOK_SECRET`

### 2. Probar webhooks localmente con Stripe CLI

```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Escuchar webhooks y reenviarlos a localhost
stripe listen --forward-to localhost:3000/webhook

# En otra terminal, ejecutar tu servidor
npm run dev

# Probar un evento
stripe trigger checkout.session.completed
```

## 📦 Estructura del Proyecto

```
backend/
├── src/
│   ├── routes/
│   │   ├── stripe.js          # Rutas de Stripe
│   │   └── health.js           # Health checks
│   ├── middleware/
│   │   ├── errorHandler.js    # Manejo de errores
│   │   └── logger.js           # Logger HTTP
│   ├── utils/
│   │   └── helpers.js          # Funciones auxiliares
│   └── server.js               # Servidor principal
├── .env.example                # Ejemplo de variables de entorno
├── .gitignore                  # Archivos ignorados por Git
├── package.json                # Dependencias y scripts
└── README.md                   # Esta documentación
```

## 🚀 Despliegue

### Opción 1: Vercel (Recomendado)

1. Instala Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Configura las variables de entorno en el dashboard de Vercel

### Opción 2: Railway

1. Crea una cuenta en https://railway.app
2. Conecta tu repositorio de GitHub
3. Railway detectará automáticamente el proyecto Node.js
4. Añade las variables de entorno en Settings > Variables
5. Deploy automático en cada push

### Opción 3: Render

1. Crea una cuenta en https://render.com
2. New > Web Service
3. Conecta tu repositorio
4. Configura:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Añade variables de entorno
6. Deploy

### Opción 4: Heroku

```bash
# Instalar Heroku CLI
brew tap heroku/brew && brew install heroku

# Login
heroku login

# Crear app
heroku create tu-app-ugt

# Configurar variables de entorno
heroku config:set STRIPE_SECRET_KEY=sk_test_...
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

## 📊 Monitoreo

### Logs

El servidor registra todas las peticiones:

```
✅ 2024-11-03T21:00:00.000Z | POST /api/create-affiliation-session | Status: 200 | 145ms
⚠️ 2024-11-03T21:01:00.000Z | POST /api/create-course-session | Status: 400 | 12ms
❌ 2024-11-03T21:02:00.000Z | GET /api/nonexistent | Status: 404 | 5ms
```

### Health Check Endpoints

Para servicios de monitoreo (UptimeRobot, Pingdom, etc.):

- **Simple:** `GET /health/ping` → `pong`
- **Básico:** `GET /health`
- **Detallado:** `GET /health/detailed`

## 🐛 Solución de Problemas

### Error: "STRIPE_SECRET_KEY is required"

Solución: Asegúrate de tener el archivo `.env` con la clave de Stripe configurada.

### Error: CORS

Solución: Añade el origen del frontend a `ALLOWED_ORIGINS` en `.env`.

### Error: "Webhook signature verification failed"

Solución: Verifica que `STRIPE_WEBHOOK_SECRET` esté correctamente configurado.

### Puerto en uso

```bash
# Encontrar proceso usando el puerto 3000
lsof -i :3000

# Matar el proceso
kill -9 [PID]

# O cambiar el puerto en .env
PORT=3001
```

## 📚 Recursos

- [Documentación de Stripe](https://stripe.com/docs)
- [Express.js](https://expressjs.com/)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Webhooks de Stripe](https://stripe.com/docs/webhooks)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está desarrollado para la Sección Sindical UGT-CLM-UGR Granada.

## 📧 Contacto

- Email: ugt.clm.ugr@ugt.org
- Sitio web: https://seccion-sindical-ugt-clm-ugr.github.io/sindicato

---

**Desarrollado con ❤️ para los trabajadores de la Universidad de Granada**
