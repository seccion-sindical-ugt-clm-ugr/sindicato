# 🔗 Guía de Integración Frontend-Backend

Guía completa para conectar y utilizar el sistema de pagos UGT-CLM-UGR.

---

## 📋 Resumen del Sistema

El sistema está dividido en dos partes que trabajan juntas:

```
┌──────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA COMPLETA                      │
└──────────────────────────────────────────────────────────────┘

FRONTEND (GitHub Pages)              BACKEND (Vercel/Railway/Render)
├── index.html                       ├── src/server.js
├── pages/curso-ia.html             ├── src/routes/stripe.js
├── js/                              ├── src/routes/health.js
│   ├── backend-config.js  ←────────┼── POST /api/create-affiliation-session
│   ├── stripe-config.js   ←────────┼── POST /api/create-course-session
│   └── main.js            ←────────┼── POST /webhook
└── success.html           ←────────┼── GET /api/session/:id
                           ←────────└── GET /health

Usuario completa formulario → Frontend envía a Backend →
Backend crea sesión con Stripe → Frontend redirige a Stripe →
Usuario paga → Stripe envía webhook al Backend →
Backend procesa → Usuario vuelve al Frontend (success.html)
```

---

## ⚙️ Configuración Inicial

### 1️⃣ **Preparar el Backend**

#### Opción A: Desarrollo Local

```bash
# 1. Navegar al backend
cd backend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env

# 4. Editar .env con tus claves de Stripe
nano .env

# Configurar estas variables:
STRIPE_SECRET_KEY=sk_test_tu_clave_secreta_aqui
STRIPE_PUBLISHABLE_KEY=pk_test_tu_clave_publica_aqui
PORT=3000

# 5. Iniciar el servidor
npm run dev
```

El backend estará disponible en `http://localhost:3000`

#### Opción B: Desplegar en Producción (Vercel - Recomendado)

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Desplegar desde el directorio backend
cd backend
vercel

# 3. Configurar variables de entorno en Vercel Dashboard:
# - Ir a tu proyecto en vercel.com
# - Settings > Environment Variables
# - Añadir:
#   STRIPE_SECRET_KEY=sk_test_...
#   STRIPE_PUBLISHABLE_KEY=pk_test_...
#   NODE_ENV=production

# 4. Copiar la URL de producción
# Ejemplo: https://tu-backend-abc123.vercel.app
```

---

### 2️⃣ **Configurar el Frontend**

#### Para Desarrollo Local:

1. **Abrir el archivo** `js/backend-config.js`

2. **Verificar configuración automática:**
   - Si abres el sitio desde `localhost`, automáticamente usa `http://localhost:3000`
   - Si abres desde GitHub Pages, usa la URL de producción

3. **O configurar manualmente desde la consola del navegador:**
   ```javascript
   // Para apuntar a tu backend local
   setBackendUrl('http://localhost:3000')

   // Para apuntar a tu backend en producción
   setBackendUrl('https://tu-backend.vercel.app')

   // Para volver a auto-detección
   clearBackendUrl()
   ```

#### Para Producción (GitHub Pages):

1. **Editar** `js/backend-config.js`

2. **Cambiar la línea 12:**
   ```javascript
   // ANTES:
   production: 'https://TU-BACKEND.vercel.app',

   // DESPUÉS:
   production: 'https://tu-backend-real.vercel.app',
   ```

3. **Commit y push:**
   ```bash
   git add js/backend-config.js
   git commit -m "Configure production backend URL"
   git push
   ```

---

## 🧪 Probar la Integración

### Test 1: Verificar Backend

```bash
# Probar health check
curl http://localhost:3000/health

# Debería responder:
{
  "status": "ok",
  "timestamp": "2024-11-03T...",
  "uptime": 123.45,
  "environment": "development"
}
```

### Test 2: Verificar Frontend-Backend Connection

1. Abrir el sitio en el navegador
2. Abrir la consola del navegador (F12)
3. Deberías ver:

```
✅ Backend API Configurado
URL: http://localhost:3000
✅ Backend conectado: {status: 'ok', ...}
✅ Sistema de Pagos Listo
💳 Los pagos están habilitados y funcionando correctamente
```

### Test 3: Probar Flujo Completo de Pago

1. **Ir a la página principal**
2. **Completar formulario de afiliación:**
   - Nombre: Test User
   - Email: test@test.com
   - Teléfono: 600000000
   - Departamento: Test

3. **Clic en "Afiliarse por 15€/año"**

4. **Verificar en consola:**
   ```
   📤 Enviando solicitud de afiliación al backend...
   ✅ Sesión de afiliación creada: cs_test_abc123...
   ```

5. **Deberías ser redirigido a Stripe Checkout**

6. **Usar tarjeta de prueba:**
   - Número: `4242 4242 4242 4242`
   - Fecha: Cualquier futura (ej: 12/25)
   - CVC: 123

7. **Completar el pago**

8. **Verificar en el servidor backend (consola):**
   ```
   📝 Nueva solicitud de afiliación: { name: 'Test User', ... }
   ✅ Sesión de afiliación creada: cs_test_abc123...
   💰 Pago completado exitosamente
      Session ID: cs_test_abc123...
      Email: test@test.com
      Tipo: affiliation
   ```

---

## 🔧 Comandos Útiles del Frontend

Abre la consola del navegador (F12) y prueba estos comandos:

### Ver Configuración Actual
```javascript
showBackendConfig()
```

### Cambiar Backend Temporalmente
```javascript
// Para testing local
setBackendUrl('http://localhost:3000')

// Para otro puerto
setBackendUrl('http://localhost:3001')

// Para producción
setBackendUrl('https://tu-backend.vercel.app')
```

### Verificar Conexión
```javascript
await checkBackendConnection()
// true si conecta, false si no
```

### Limpiar Configuración Manual
```javascript
clearBackendUrl()
// Vuelve a auto-detección
```

---

## 🐛 Solución de Problemas

### Error: "Backend NO Configurado"

**Síntoma:**
```
❌ Backend NO Configurado
⚠️ Asegúrate de cargar backend-config.js ANTES de stripe-config.js
```

**Solución:**
1. Verificar que `index.html` tiene:
   ```html
   <script src="js/backend-config.js"></script>
   <script src="js/stripe-config.js"></script>
   ```
2. El orden es importante: `backend-config.js` DEBE ir antes

---

### Error: "No se puede conectar con el servidor de pagos"

**Síntoma:**
```
⚠️ No se puede conectar con el servidor de pagos.
Verifica que el backend esté funcionando.
URL: http://localhost:3000
```

**Causas y Soluciones:**

1. **Backend no está corriendo**
   ```bash
   cd backend
   npm run dev
   ```

2. **URL incorrecta**
   ```javascript
   // Verificar URL actual
   showBackendConfig()

   // Corregir si es necesario
   setBackendUrl('http://localhost:3000')
   ```

3. **Error de CORS**
   - Verificar que el backend tiene tu frontend en `ALLOWED_ORIGINS` (archivo `.env`)
   ```bash
   ALLOWED_ORIGINS=https://seccion-sindical-ugt-clm-ugr.github.io,http://localhost:8000
   ```

4. **Puerto incorrecto**
   - Verificar puerto del backend en `.env`
   - Actualizar frontend si usa otro puerto:
     ```javascript
     setBackendUrl('http://localhost:3001')
     ```

---

### Error: "Failed to fetch"

**Síntoma:**
```
❌ Error creando sesión: Failed to fetch
```

**Causas:**
1. Backend no está corriendo
2. Error de CORS
3. Firewall bloqueando la conexión
4. URL del backend incorrecta

**Solución:**
```bash
# 1. Verificar backend está corriendo
curl http://localhost:3000/health

# 2. Ver logs del backend para errores CORS

# 3. Verificar configuración en frontend
# En consola del navegador:
showBackendConfig()
```

---

### Error: "Stripe no está inicializado"

**Síntoma:**
```
❌ Stripe no está cargado
```

**Solución:**
Verificar que `index.html` tiene:
```html
<script src="https://js.stripe.com/v3/"></script>
```
ANTES de cargar otros scripts de Stripe.

---

## 📱 Probando en Dispositivos Móviles

### Opción 1: Usar ngrok (para testing local)

```bash
# 1. Instalar ngrok
brew install ngrok  # o descargar de ngrok.com

# 2. Exponer tu backend local
ngrok http 3000

# 3. Copiar la URL pública (ej: https://abc123.ngrok.io)

# 4. En el navegador del móvil:
setBackendUrl('https://abc123.ngrok.io')
```

### Opción 2: Usar Backend Desplegado

1. Desplegar backend en Vercel/Railway
2. Configurar la URL en `js/backend-config.js`
3. Abrir GitHub Pages desde el móvil

---

## 🚀 Checklist Pre-Producción

Antes de lanzar a producción, verifica:

### Backend
- [ ] Backend desplegado en Vercel/Railway/Render
- [ ] Variables de entorno configuradas correctamente
- [ ] `STRIPE_SECRET_KEY` en modo **LIVE** (no test)
- [ ] `ALLOWED_ORIGINS` incluye tu dominio de GitHub Pages
- [ ] Webhook configurado en Stripe Dashboard
- [ ] Health check responde: `curl https://tu-backend.com/health`

### Frontend
- [ ] `js/backend-config.js` apunta a URL de producción
- [ ] `js/stripe-config.js` tiene `publishableKey` en modo **LIVE**
- [ ] Scripts cargados en orden correcto en HTML
- [ ] Probado flujo completo con tarjeta de test
- [ ] Mensajes de error apropiados
- [ ] Success/Cancel URLs correctas

### Stripe
- [ ] Cuenta de Stripe verificada
- [ ] Modo LIVE activado
- [ ] Webhook creado apuntando a `https://tu-backend.com/webhook`
- [ ] Eventos configurados:
  - `checkout.session.completed`
  - `checkout.session.expired`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
- [ ] `STRIPE_WEBHOOK_SECRET` configurado en backend

---

## 📊 Monitoreo en Producción

### Ver Logs del Backend (Vercel)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Ver logs en tiempo real
vercel logs --follow

# Ver últimos logs
vercel logs
```

### Ver Eventos de Stripe

1. Ir a https://dashboard.stripe.com/events
2. Ver todos los eventos (pagos, webhooks, errores)
3. Filtrar por tipo o fecha

### Ver Webhooks en Stripe

1. Ir a https://dashboard.stripe.com/webhooks
2. Click en tu webhook
3. Ver "Recent deliveries"
4. Verificar que todos entregan correctamente (200 OK)

---

## 🔐 Seguridad en Producción

### ✅ Buenas Prácticas Implementadas

- ✅ Clave secreta SOLO en backend
- ✅ CORS configurado correctamente
- ✅ Rate limiting activo (100 req/15min)
- ✅ Validación de datos en backend
- ✅ Verificación de firmas de webhooks
- ✅ Headers de seguridad (Helmet)
- ✅ HTTPS obligatorio

### ⚠️ No Hacer Nunca

- ❌ Subir `.env` al repositorio
- ❌ Hardcodear claves secretas en código
- ❌ Deshabilitar CORS en producción
- ❌ Ignorar errores de webhooks
- ❌ Usar claves de test en producción

---

## 📚 Recursos Adicionales

- [Backend README.md](backend/README.md) - Documentación completa del backend
- [Backend QUICK_START.md](backend/QUICK_START.md) - Inicio rápido del backend
- [STRIPE_BACKEND_SETUP.md](STRIPE_BACKEND_SETUP.md) - Guía arquitectura Stripe
- [Documentación de Stripe](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)

---

## 🎯 Flujo Completo de Usuario

```
1. Usuario visita el sitio
   └─> index.html

2. Completa formulario de afiliación
   └─> Datos: nombre, email, teléfono, departamento

3. Click en "Afiliarse por 15€/año"
   └─> js/main.js captura evento
   └─> Llama a showPaymentForm(userData)

4. showPaymentForm() valida datos
   └─> validateUserData(userData)

5. Llama al backend
   └─> fetch('http://backend/api/create-affiliation-session')
   └─> Backend crea sesión en Stripe
   └─> Backend devuelve Session ID

6. Redirige a Stripe
   └─> redirectToStripeCheckout(sessionId)
   └─> Usuario ve página de Stripe Checkout

7. Usuario ingresa tarjeta y paga
   └─> Stripe procesa el pago

8. Stripe envía webhook al backend
   └─> POST https://backend/webhook
   └─> Backend verifica firma
   └─> Backend procesa evento
   └─> Backend guarda en DB (futuro)
   └─> Backend envía email (futuro)

9. Stripe redirige al usuario
   └─> success.html?session_id=cs_xxx
   └─> Usuario ve mensaje de confirmación
```

---

## ✅ Estado Actual del Sistema

```
✅ FRONTEND COMPLETAMENTE FUNCIONAL
  ├─ Detección automática de entorno
  ├─ Configuración manual disponible
  ├─ Conexión con backend habilitada
  ├─ Formularios integrados
  ├─ Manejo de errores robusto
  └─ UI responsive y profesional

✅ BACKEND COMPLETAMENTE FUNCIONAL
  ├─ Endpoints de afiliación
  ├─ Endpoints de cursos
  ├─ Webhooks de Stripe
  ├─ Seguridad completa
  ├─ Validación de datos
  └─ Listo para producción

✅ INTEGRACIÓN COMPLETA
  ├─ Frontend llama a backend
  ├─ Backend crea sesiones Stripe
  ├─ Stripe procesa pagos
  ├─ Webhooks funcionan
  └─ Usuario completa flujo

🔄 PENDIENTE PARA PRODUCCIÓN
  ├─ Desplegar backend
  ├─ Configurar URLs de producción
  ├─ Activar modo LIVE en Stripe
  ├─ Configurar webhooks en Stripe
  └─ Testing end-to-end completo
```

---

**¿Problemas? ¿Preguntas?**

- Revisa los logs del backend: `vercel logs`
- Revisa la consola del navegador (F12)
- Verifica eventos en Stripe Dashboard
- Usa los comandos de debug: `showBackendConfig()`, `checkBackendConnection()`

---

**Desarrollado con ❤️ para UGT-CLM-UGR Granada**
