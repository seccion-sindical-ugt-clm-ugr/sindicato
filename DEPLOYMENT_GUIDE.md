# 🚀 Guía de Despliegue a Producción

Guía completa para desplegar el sistema UGT-CLM-UGR en producción con Vercel y GitHub Pages.

---

## 📋 Pre-requisitos

Antes de empezar, asegúrate de tener:

- ✅ Cuenta de GitHub (ya la tienes)
- ✅ Cuenta de Stripe (modo test funcionando)
- ✅ Cuenta de Vercel (gratis) - https://vercel.com/signup
- ✅ Node.js instalado localmente (para testing)
- ✅ Git configurado

---

## 🎯 Plan de Despliegue

```
Fase 1: Desplegar Backend en Vercel          [15 minutos]
Fase 2: Configurar Variables de Entorno      [5 minutos]
Fase 3: Actualizar Frontend                  [5 minutos]
Fase 4: Configurar Webhooks de Stripe        [10 minutos]
Fase 5: Testing Completo                     [10 minutos]
Fase 6: Activar Modo LIVE (opcional)         [5 minutos]

Total: ~50 minutos
```

---

## 🔷 FASE 1: Desplegar Backend en Vercel

### Opción A: Deploy desde GitHub (Recomendado - Auto-deploy)

#### 1. Preparar el repositorio

Tu código ya está en GitHub. Solo necesitas asegurarte de que todo está pusheado:

```bash
cd /home/user/sindicato
git status
# Debería mostrar: nothing to commit, working tree clean
```

#### 2. Conectar con Vercel

1. **Ir a https://vercel.com**
2. **Click en "Sign Up"** o "Login"
3. **Elegir "Continue with GitHub"**
4. **Autorizar Vercel** a acceder a tus repos

#### 3. Importar Proyecto

1. **Click en "Add New..." → "Project"**
2. **Buscar tu repositorio:** `seccion-sindical-ugt-clm-ugr/sindicato`
3. **Click en "Import"**

#### 4. Configurar el Proyecto

En la pantalla de configuración:

```
Framework Preset: Other
Root Directory: backend    ← IMPORTANTE: Click "Edit" y poner "backend"
Build Command: (dejar vacío o "npm install")
Output Directory: (dejar vacío)
Install Command: npm install
```

#### 5. Variables de Entorno

**ANTES de hacer deploy**, click en "Environment Variables" y añadir:

```bash
# STRIPE KEYS (modo test para empezar - reemplazar con tus claves reales)
STRIPE_SECRET_KEY=sk_test_TU_CLAVE_SECRETA_AQUI
STRIPE_PUBLISHABLE_KEY=pk_test_TU_CLAVE_PUBLICA_AQUI

# URLs (actualizar con tu dominio real de GitHub Pages)
FRONTEND_URL=https://seccion-sindical-ugt-clm-ugr.github.io
SUCCESS_URL=https://seccion-sindical-ugt-clm-ugr.github.io/sindicato/success.html
CANCEL_URL=https://seccion-sindical-ugt-clm-ugr.github.io/sindicato/cancel.html

# CORS (tu dominio de GitHub Pages)
ALLOWED_ORIGINS=https://seccion-sindical-ugt-clm-ugr.github.io,http://localhost:8000

# Otros
NODE_ENV=production
PORT=3000
```

**IMPORTANTE:** Reemplaza `sk_test_...` y `pk_test_...` con TUS claves reales de Stripe.

#### 6. Deploy

1. **Click en "Deploy"**
2. **Esperar 1-2 minutos** (Vercel instalará dependencias y desplegará)
3. **Ver los logs** en tiempo real
4. **Cuando termine**, verás: ✅ "Deployment Ready"

#### 7. Copiar URL de Producción

Vercel te dará una URL tipo:

```
https://sindicato-abc123def456.vercel.app
```

**¡COPIA ESTA URL!** La necesitarás en la Fase 3.

---

### Opción B: Deploy desde CLI (Alternativo)

Si prefieres usar la terminal:

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy desde el directorio backend
cd backend
vercel

# Responder a las preguntas:
# Set up and deploy? → Yes
# Which scope? → Tu cuenta
# Link to existing project? → No
# What's your project's name? → ugt-backend (o lo que quieras)
# In which directory is your code located? → ./
# Want to override settings? → No

# 4. Configurar variables de entorno
vercel env add STRIPE_SECRET_KEY
# Pegar tu clave secreta cuando pregunte

vercel env add STRIPE_PUBLISHABLE_KEY
# Pegar tu clave publicable

vercel env add ALLOWED_ORIGINS
# Pegar: https://seccion-sindical-ugt-clm-ugr.github.io

vercel env add FRONTEND_URL
# Pegar: https://seccion-sindical-ugt-clm-ugr.github.io

vercel env add SUCCESS_URL
# Pegar: https://seccion-sindical-ugt-clm-ugr.github.io/sindicato/success.html

vercel env add CANCEL_URL
# Pegar: https://seccion-sindical-ugt-clm-ugr.github.io/sindicato/cancel.html

# 5. Deploy a producción
vercel --prod
```

---

### 8. Verificar Deployment

Probar que el backend funciona:

```bash
# Reemplaza con tu URL real de Vercel
curl https://tu-backend-abc123.vercel.app/health

# Debería responder:
{
  "status": "ok",
  "timestamp": "2024-11-03T...",
  "uptime": 1.234,
  "environment": "production"
}
```

Si responde correctamente: ✅ **Backend desplegado con éxito!**

---

## 🔷 FASE 2: Configurar Variables de Entorno en Vercel Dashboard

Si usaste la Opción A (desde GitHub), verifica las variables:

1. **Ir a https://vercel.com/dashboard**
2. **Click en tu proyecto** (ugt-backend o el nombre que le diste)
3. **Settings → Environment Variables**
4. **Verificar que todas están configuradas:**

```
✅ STRIPE_SECRET_KEY
✅ STRIPE_PUBLISHABLE_KEY
✅ FRONTEND_URL
✅ SUCCESS_URL
✅ CANCEL_URL
✅ ALLOWED_ORIGINS
✅ NODE_ENV (automático)
```

5. **Si falta alguna**, añadir con "Add New"

---

## 🔷 FASE 3: Actualizar Frontend

### 1. Actualizar URL del Backend

Edita el archivo `js/backend-config.js`:

```javascript
// Línea 12 - Reemplazar con tu URL real de Vercel
production: 'https://TU-URL-REAL-DE-VERCEL.vercel.app',

// Por ejemplo:
production: 'https://sindicato-abc123def456.vercel.app',
```

### 2. Guardar y Commit

```bash
git add js/backend-config.js
git commit -m "Configure production backend URL"
git push origin main  # o tu rama principal
```

### 3. Esperar GitHub Pages

GitHub Pages se actualiza automáticamente en 1-2 minutos después del push.

### 4. Verificar Frontend

1. **Abrir tu sitio:** https://seccion-sindical-ugt-clm-ugr.github.io/sindicato/
2. **Abrir consola del navegador** (F12)
3. **Deberías ver:**

```
✅ Backend API Configurado
URL: https://tu-backend-abc123.vercel.app
✅ Backend conectado: {status: 'ok', ...}
✅ Sistema de Pagos Listo
💳 Los pagos están habilitados y funcionando correctamente
```

Si ves estos mensajes: ✅ **Frontend conectado correctamente!**

---

## 🔷 FASE 4: Configurar Webhooks de Stripe

Los webhooks son CRUCIALES para que Stripe notifique a tu backend cuando un pago se completa.

### 1. Ir al Dashboard de Stripe

1. **Login en https://dashboard.stripe.com**
2. **Asegúrate de estar en modo "Test"** (toggle arriba a la derecha)
3. **Ir a "Developers" → "Webhooks"**

### 2. Crear Endpoint

1. **Click en "Add endpoint"**
2. **Endpoint URL:**
   ```
   https://TU-URL-DE-VERCEL.vercel.app/webhook
   ```
   Por ejemplo:
   ```
   https://sindicato-abc123def456.vercel.app/webhook
   ```

3. **Description:** (opcional)
   ```
   UGT-CLM-UGR Production Webhook
   ```

4. **Events to send:**
   - Click en "Select events"
   - Buscar y seleccionar:
     - ✅ `checkout.session.completed`
     - ✅ `checkout.session.expired`
     - ✅ `payment_intent.succeeded`
     - ✅ `payment_intent.payment_failed`
   - O seleccionar "Select all events" si prefieres

5. **Click "Add endpoint"**

### 3. Copiar Signing Secret

1. **Click en el webhook que acabas de crear**
2. **En "Signing secret"**, click en "Reveal"
3. **Copiar el secret** (comienza con `whsec_...`)

### 4. Añadir a Vercel

1. **Ir a Vercel Dashboard** → Tu proyecto → Settings → Environment Variables
2. **Click "Add New"**
3. **Name:** `STRIPE_WEBHOOK_SECRET`
4. **Value:** Pegar el secret que copiaste (whsec_...)
5. **Click "Save"**

### 5. Redeploy

Como añadiste una nueva variable de entorno, necesitas redesplegar:

1. **Ir a Deployments** en Vercel
2. **Click en el último deployment**
3. **Click en los 3 puntos (...)** → "Redeploy"
4. **Esperar 1-2 minutos**

---

## 🔷 FASE 5: Testing Completo en Producción

### Test 1: Health Check del Backend

```bash
curl https://tu-backend-abc123.vercel.app/health

# Debe responder con status: "ok"
```

### Test 2: Verificar Frontend se Conecta

1. Abrir: https://seccion-sindical-ugt-clm-ugr.github.io/sindicato/
2. F12 (consola)
3. Ver mensajes de conexión exitosa

### Test 3: Flujo Completo de Pago (Modo Test)

1. **Ir al formulario de afiliación**
2. **Completar datos:**
   - Nombre: Test User
   - Email: test@test.com
   - Teléfono: 600000000
   - Departamento: Test Department

3. **Click "Afiliarse por 15€/año"**

4. **Verificar en consola:**
   ```
   📤 Enviando solicitud de afiliación al backend...
   ✅ Sesión de afiliación creada: cs_test_...
   ```

5. **Deberías ser redirigido a Stripe Checkout**

6. **Usar tarjeta de prueba:**
   - Número: `4242 4242 4242 4242`
   - Fecha: 12/28 (cualquier futura)
   - CVC: 123
   - Código postal: 12345

7. **Click "Pay"**

8. **Verificar redirección a success.html**

9. **Verificar webhook en Stripe:**
   - Ir a Stripe Dashboard → Developers → Webhooks
   - Click en tu webhook
   - Ver "Recent events"
   - Debería haber un evento `checkout.session.completed` con status ✅ 200

10. **Ver logs del backend en Vercel:**
    ```bash
    vercel logs --follow
    ```
    Deberías ver:
    ```
    💰 Pago completado exitosamente
       Session ID: cs_test_...
       Email: test@test.com
       Tipo: affiliation
    ```

Si TODO funciona: ✅ **¡Sistema en producción completamente funcional!**

---

## 🔷 FASE 6: Activar Modo LIVE (Opcional - Para Pagos Reales)

⚠️ **SOLO HACER ESTO CUANDO ESTÉS 100% LISTO PARA ACEPTAR PAGOS REALES**

### Requisitos Previos

- ✅ Cuenta de Stripe verificada
- ✅ Información bancaria añadida a Stripe
- ✅ Todo probado en modo test
- ✅ Políticas de privacidad y términos de servicio en tu sitio

### Pasos

#### 1. Activar Modo Live en Stripe

1. **Dashboard de Stripe** → Toggle "Test mode" a OFF
2. **Ir a "Developers" → "API keys"**
3. **Copiar las claves LIVE:**
   - Publishable key: `pk_live_...`
   - Secret key: `sk_live_...` (click "Reveal")

#### 2. Actualizar Variables en Vercel

1. **Vercel Dashboard** → Settings → Environment Variables
2. **Editar estas variables:**
   ```
   STRIPE_SECRET_KEY → Cambiar a sk_live_...
   STRIPE_PUBLISHABLE_KEY → Cambiar a pk_live_...
   ```
3. **Redeploy** el backend

#### 3. Actualizar Frontend

Editar `js/stripe-config.js`:

```javascript
// Línea 8 - Cambiar a clave LIVE
publishableKey: 'pk_live_TU_CLAVE_LIVE_AQUI',
```

```bash
git add js/stripe-config.js
git commit -m "Switch to Stripe live mode"
git push
```

#### 4. Recrear Webhooks en Modo Live

1. **Stripe Dashboard** (modo LIVE)
2. **Developers → Webhooks**
3. **Añadir endpoint** (mismo proceso que antes)
4. **Copiar nuevo signing secret**
5. **Actualizar `STRIPE_WEBHOOK_SECRET` en Vercel**
6. **Redeploy**

#### 5. Testing con Tarjeta Real

Probar con una tarjeta real de bajo monto (1€ o similar) y luego hacer refund desde Stripe.

---

## 📊 Monitoreo en Producción

### Ver Logs en Tiempo Real

```bash
# Vercel logs
vercel logs --follow

# O desde el dashboard
# Vercel.com → Tu proyecto → Deployments → Click deployment → Logs
```

### Eventos de Stripe

1. Dashboard Stripe → Developers → Events
2. Ver todos los pagos, webhooks, errores
3. Filtrar por tipo o fecha

### Webhooks Status

1. Dashboard Stripe → Developers → Webhooks
2. Click en tu webhook
3. Ver "Recent deliveries"
4. Todos deberían ser 200 OK

---

## 🐛 Troubleshooting Producción

### Error: "CORS policy blocked"

**Causa:** ALLOWED_ORIGINS no incluye tu dominio

**Solución:**
```bash
# Vercel Dashboard → Environment Variables
ALLOWED_ORIGINS=https://seccion-sindical-ugt-clm-ugr.github.io

# Redeploy
```

### Error: Webhook 400/500

**Causa:** STRIPE_WEBHOOK_SECRET incorrecto o faltante

**Solución:**
1. Stripe Dashboard → Webhooks → Tu webhook → Signing secret
2. Copiar el secret
3. Vercel → Environment Variables → STRIPE_WEBHOOK_SECRET
4. Actualizar valor
5. Redeploy

### Error: Backend responde 404

**Causa:** Root directory no configurado correctamente

**Solución:**
1. Vercel Dashboard → Settings → General
2. Root Directory → `backend`
3. Redeploy

### Frontend no se conecta al backend

**Solución:**
1. Verificar URL en `js/backend-config.js`
2. Abrir consola del navegador
3. Ejecutar:
   ```javascript
   showBackendConfig()
   // Verificar URL
   setBackendUrl('https://tu-backend-correcto.vercel.app')
   ```
4. Hacer hard refresh (Ctrl+Shift+R)

---

## ✅ Checklist de Producción

### Backend
- [ ] Desplegado en Vercel
- [ ] Health check funciona: `curl https://tu-backend.vercel.app/health`
- [ ] Variables de entorno configuradas
- [ ] Logs sin errores
- [ ] CORS configurado con dominio correcto

### Frontend
- [ ] `backend-config.js` actualizado con URL de producción
- [ ] Pusheado a GitHub
- [ ] GitHub Pages actualizado
- [ ] Consola muestra "Backend conectado"
- [ ] No hay errores en consola

### Stripe
- [ ] Webhook creado y activo
- [ ] Signing secret configurado en Vercel
- [ ] Eventos seleccionados correctamente
- [ ] Recent deliveries muestra 200 OK

### Testing
- [ ] Health check ✅
- [ ] Frontend conecta ✅
- [ ] Formulario envía ✅
- [ ] Redirige a Stripe ✅
- [ ] Pago test funciona ✅
- [ ] Webhook recibido ✅
- [ ] Redirige a success ✅

---

## 🚀 URLs de Producción

Una vez desplegado, guarda estas URLs:

```
Frontend: https://seccion-sindical-ugt-clm-ugr.github.io/sindicato/
Backend:  https://TU-BACKEND.vercel.app
Health:   https://TU-BACKEND.vercel.app/health
Webhook:  https://TU-BACKEND.vercel.app/webhook

Stripe Dashboard: https://dashboard.stripe.com
Vercel Dashboard: https://vercel.com/dashboard
```

---

## 📞 Soporte

**Documentación:**
- Vercel: https://vercel.com/docs
- Stripe: https://stripe.com/docs
- Este proyecto: Ver INTEGRATION_GUIDE.md

**Si algo falla:**
1. Revisar logs de Vercel
2. Revisar eventos de Stripe
3. Revisar consola del navegador
4. Verificar variables de entorno

---

## 🎉 ¡Felicitaciones!

Si llegaste hasta aquí y todo funciona:

✅ **Tu sistema de pagos está 100% operativo en producción**
✅ **Puedes aceptar afiliaciones online**
✅ **Puedes vender cursos online**
✅ **Todo es seguro y escalable**

---

**Desarrollado con ❤️ para UGT-CLM-UGR Granada**

**Próximos pasos sugeridos:**
- Añadir base de datos para guardar afiliados
- Sistema de emails automáticos
- Panel de administración
- Analytics y métricas
