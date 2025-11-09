# 🚀 Guía de Despliegue y Configuración
**UGT-CLM-UGR Backend API**

Esta guía explica cómo configurar correctamente las variables de entorno en desarrollo y producción.

---

## 📋 Tabla de Contenidos

1. [Variables de Entorno Requeridas](#variables-de-entorno-requeridas)
2. [Configuración en Desarrollo Local](#configuración-en-desarrollo-local)
3. [Configuración en Producción (Vercel)](#configuración-en-producción-vercel)
4. [Verificación de Configuración](#verificación-de-configuración)
5. [Solución de Problemas](#solución-de-problemas)

---

## 🔑 Variables de Entorno Requeridas

### ⚠️ OBLIGATORIAS (la aplicación no funcionará sin ellas)

| Variable | Descripción | Dónde Obtenerla |
|----------|-------------|-----------------|
| `MONGODB_URI` | Conexión a MongoDB | [MongoDB Atlas](#1-configurar-mongodb-atlas) |
| `JWT_SECRET` | Secreto para JWT | [Generar Localmente](#2-generar-jwt_secret) |
| `STRIPE_SECRET_KEY` | Clave de Stripe | [Stripe Dashboard](#3-configurar-stripe) |
| `STRIPE_WEBHOOK_SECRET` | Webhook de Stripe | [Stripe Webhooks](#4-configurar-stripe-webhooks) |
| `SUCCESS_URL` | URL después de pago exitoso | Tu dominio de GitHub Pages |
| `CANCEL_URL` | URL después de pago cancelado | Tu dominio de GitHub Pages |
| `ALLOWED_ORIGINS` | Orígenes permitidos CORS | Tu dominio de GitHub Pages |

### ✅ OPCIONALES (recomendadas)

| Variable | Descripción | Default |
|----------|-------------|---------|
| `EMAIL_HOST` | Servidor SMTP | smtp.gmail.com |
| `EMAIL_USER` | Usuario de email | - |
| `EMAIL_PASS` | Contraseña de email | - |
| `ADMIN_EMAIL` | Email del admin | - |
| `ADMIN_PASSWORD` | Contraseña admin | ugt2024admin |

---

## 💻 Configuración en Desarrollo Local

### Paso 1: Crear archivo `.env`

En la carpeta `backend/`, crea un archivo `.env` (copia de `.env.example`):

```bash
cd backend
cp .env.example .env
```

### Paso 2: Editar el archivo `.env`

Abre `backend/.env` y configura cada variable:

```bash
# ====================================
# VARIABLES OBLIGATORIAS
# ====================================

NODE_ENV=development
PORT=3000

# MongoDB Atlas (ver instrucciones abajo)
MONGODB_URI=mongodb+srv://tu-usuario:tu-password@cluster.xxxxx.mongodb.net/ugt-database?retryWrites=true&w=majority

# JWT Secret (generar con el comando abajo)
JWT_SECRET=tu-secreto-super-seguro-de-64-caracteres-minimo
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Stripe (obtener de dashboard.stripe.com)
STRIPE_SECRET_KEY=sk_test_[REEMPLAZAR_CON_TU_CLAVE_DE_STRIPE]
STRIPE_WEBHOOK_SECRET=whsec_[REEMPLAZAR_CON_TU_WEBHOOK_SECRET]

# URLs de redirección (desarrollo local)
DOMAIN=http://localhost:8000
SUCCESS_URL=http://localhost:8000/success.html
CANCEL_URL=http://localhost:8000/cancel.html

# CORS (localhost para desarrollo)
ALLOWED_ORIGINS=http://localhost:8000,http://localhost:3000

# ====================================
# VARIABLES OPCIONALES
# ====================================

# Email (opcional, para notificaciones)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-contraseña-de-aplicacion
ADMIN_EMAIL=admin@ugtclm.org

# Seguridad
ADMIN_PASSWORD=tu-password-admin-seguro
```

---

## ☁️ Configuración en Producción (Vercel)

### Opción 1: Desde la Web (Recomendado)

1. **Ir a Vercel Dashboard**
   - Accede a: https://vercel.com/dashboard
   - Selecciona tu proyecto del backend

2. **Configurar Variables de Entorno**
   - Ve a: **Settings** → **Environment Variables**
   - Haz clic en **Add New**

3. **Añadir cada variable:**

   Para cada variable, repite:
   - **Key**: Nombre de la variable (ej: `MONGODB_URI`)
   - **Value**: Valor de la variable
   - **Environment**: Selecciona `Production` (y opcionalmente Preview/Development)
   - Clic en **Save**

   **Variables a configurar:**

   ```
   NODE_ENV=production

   MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/ugt-database

   JWT_SECRET=[tu-secreto-de-64-caracteres]
   JWT_EXPIRES_IN=7d
   JWT_REFRESH_EXPIRES_IN=30d

   STRIPE_SECRET_KEY=sk_live_[TU_CLAVE_DE_PRODUCCION]
   STRIPE_WEBHOOK_SECRET=whsec_[TU_WEBHOOK_SECRET_DE_PRODUCCION]

   DOMAIN=https://seccion-sindical-ugt-clm-ugr.github.io
   SUCCESS_URL=https://seccion-sindical-ugt-clm-ugr.github.io/sindicato/success.html
   CANCEL_URL=https://seccion-sindical-ugt-clm-ugr.github.io/sindicato/cancel.html

   ALLOWED_ORIGINS=https://seccion-sindical-ugt-clm-ugr.github.io,http://localhost:8000

   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=tu-email@gmail.com
   EMAIL_PASS=tu-app-password
   ADMIN_EMAIL=admin@ugtclm.org

   ADMIN_PASSWORD=tu-password-super-seguro
   ```

4. **Redesplegar**
   - Ve a: **Deployments**
   - Haz clic en los tres puntos (...) del último deployment
   - Selecciona **Redeploy**
   - ✅ Marca "Use existing Build Cache" (opcional)
   - Clic en **Redeploy**

### Opción 2: Desde CLI (Avanzado)

```bash
# Instalar Vercel CLI (si no lo tienes)
npm i -g vercel

# Login
vercel login

# Navegar a la carpeta del backend
cd backend

# Añadir variables de entorno
vercel env add MONGODB_URI production
# Pega tu URI cuando te lo pida

vercel env add JWT_SECRET production
# Pega tu secreto cuando te lo pida

# Repetir para cada variable...

# Redesplegar
vercel --prod
```

---

## 📝 Instrucciones Detalladas

### 1. Configurar MongoDB Atlas

**IMPORTANTE:** MongoDB es obligatorio para el funcionamiento de la aplicación.

1. **Crear cuenta gratuita:**
   - Ve a: https://www.mongodb.com/cloud/atlas/register
   - Regístrate con tu email

2. **Crear un cluster:**
   - Selecciona: **FREE** (M0 Sandbox)
   - Región: Elige la más cercana (ej: Frankfurt para Europa)
   - Clic en **Create Cluster**

3. **Crear usuario de base de datos:**
   - Ve a: **Database Access** (menú izquierdo)
   - Clic en **Add New Database User**
   - Username: `ugt-backend`
   - Password: Genera una segura (guárdala)
   - Database User Privileges: **Read and write to any database**
   - Clic en **Add User**

4. **Configurar acceso de red:**
   - Ve a: **Network Access** (menú izquierdo)
   - Clic en **Add IP Address**
   - **IMPORTANTE:** Para producción, selecciona **Allow Access from Anywhere** (0.0.0.0/0)
   - Esto es necesario porque Vercel usa IPs dinámicas
   - Clic en **Confirm**

5. **Obtener URI de conexión:**
   - Ve a: **Database** (menú izquierdo)
   - Clic en **Connect** en tu cluster
   - Selecciona: **Connect your application**
   - Driver: **Node.js**
   - Copia la URI: `mongodb+srv://ugt-backend:<password>@cluster.xxxxx.mongodb.net/`
   - **IMPORTANTE:** Reemplaza `<password>` con la contraseña del paso 3
   - Añade el nombre de la base de datos al final: `/ugt-database`

   URI final:
   ```
   mongodb+srv://ugt-backend:TU_PASSWORD@cluster.xxxxx.mongodb.net/ugt-database?retryWrites=true&w=majority
   ```

6. **Probar conexión:**
   ```bash
   cd backend
   node -e "const mongoose = require('mongoose'); mongoose.connect('TU_URI').then(() => console.log('✅ Conectado')).catch(e => console.log('❌ Error:', e))"
   ```

### 2. Generar `JWT_SECRET`

El secreto JWT debe ser una cadena aleatoria y segura.

**Opción 1: Generar con Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Opción 2: Generar online**
- Ve a: https://www.grc.com/passwords.htm
- Copia la primera clave de 64 caracteres

**Ejemplo de resultado:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

⚠️ **NUNCA** uses el mismo secreto en desarrollo y producción.

### 3. Configurar Stripe

1. **Crear cuenta en Stripe:**
   - Ve a: https://dashboard.stripe.com/register
   - Completa el registro

2. **Obtener claves de API:**

   **Para DESARROLLO:**
   - Ve a: https://dashboard.stripe.com/test/apikeys
   - Modo: **Test mode** (toggle en la esquina superior derecha)
   - Copia: **Secret key** → Empieza con `sk_test_`

   **Para PRODUCCIÓN:**
   - Ve a: https://dashboard.stripe.com/apikeys
   - Modo: **Live mode**
   - Copia: **Secret key** → Empieza con `sk_live_`

   ⚠️ **NUNCA** expongas estas claves públicamente.

### 4. Configurar Stripe Webhooks

Los webhooks son **CRÍTICOS** para procesar pagos y generar documentos automáticamente.

**Para DESARROLLO (Testing Local):**

1. **Instalar Stripe CLI:**
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Linux
   wget https://github.com/stripe/stripe-cli/releases/download/v1.19.4/stripe_1.19.4_linux_x86_64.tar.gz
   tar -xvf stripe_1.19.4_linux_x86_64.tar.gz
   sudo mv stripe /usr/local/bin

   # Windows
   # Descargar desde: https://github.com/stripe/stripe-cli/releases
   ```

2. **Login:**
   ```bash
   stripe login
   ```

3. **Iniciar webhook listener:**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhook
   ```

   Esto te dará un `webhook signing secret`:
   ```
   > Ready! Your webhook signing secret is whsec_[TU_SECRET] (^C to quit)
   ```

   Copia ese valor (empieza con `whsec_`) a tu `.env` como `STRIPE_WEBHOOK_SECRET`

**Para PRODUCCIÓN (Vercel):**

1. **Ir a Webhooks Dashboard:**
   - Ve a: https://dashboard.stripe.com/webhooks
   - Cambia a modo **Live**

2. **Añadir endpoint:**
   - Clic en **Add endpoint**
   - URL: `https://tu-backend.vercel.app/api/webhook`
   - Events to send: Selecciona:
     - `checkout.session.completed`
     - `checkout.session.expired`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
   - Clic en **Add endpoint**

3. **Obtener Webhook Secret:**
   - Clic en el endpoint recién creado
   - Clic en **Reveal** en "Signing secret"
   - Copia el valor completo (empieza con `whsec_`)
   - Añádelo a Vercel como variable `STRIPE_WEBHOOK_SECRET`

4. **Verificar:**
   - Stripe enviará eventos de prueba
   - Verifica que aparezcan en: **Webhooks** → **tu endpoint** → **Recent events**

---

## ✅ Verificación de Configuración

### Verificar Variables Localmente

Crea un script de verificación:

```bash
# En backend/
node -e "
require('dotenv').config();
const required = ['MONGODB_URI', 'JWT_SECRET', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'];
const missing = required.filter(key => !process.env[key]);
if (missing.length) {
  console.log('❌ Faltan variables:', missing.join(', '));
  process.exit(1);
} else {
  console.log('✅ Todas las variables requeridas están configuradas');
}
"
```

### Verificar en Vercel

1. **Vía Web:**
   - Ve a: Settings → Environment Variables
   - Verifica que todas las variables estén presentes

2. **Vía CLI:**
   ```bash
   vercel env ls
   ```

### Probar Conexiones

**MongoDB:**
```bash
cd backend
npm run test:db
# O manualmente:
node -e "const mongoose = require('mongoose'); require('dotenv').config(); mongoose.connect(process.env.MONGODB_URI).then(() => console.log('✅ MongoDB OK')).catch(e => console.log('❌', e.message))"
```

**Stripe:**
```bash
node -e "const stripe = require('stripe')(require('dotenv').config().parsed.STRIPE_SECRET_KEY); stripe.balance.retrieve().then(() => console.log('✅ Stripe OK')).catch(e => console.log('❌', e.message))"
```

---

## 🔧 Solución de Problemas

### Error: "MONGODB_URI is not defined"

**Causa:** MongoDB no está configurada.

**Solución:**
1. Verifica que `.env` existe en `backend/`
2. Verifica que contiene `MONGODB_URI=mongodb+srv://...`
3. En producción, verifica en Vercel Settings → Environment Variables
4. Redesplega después de añadir la variable

### Error: "JWT must be provided"

**Causa:** `JWT_SECRET` no está configurada.

**Solución:**
1. Genera un secreto: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
2. Añádelo a `.env`: `JWT_SECRET=tu-secreto-generado`
3. En Vercel, añádelo como variable de entorno

### Error: "Stripe webhook signature verification failed"

**Causa:** `STRIPE_WEBHOOK_SECRET` incorrecto o falta.

**Solución:**
1. Verifica que el webhook está configurado en Stripe Dashboard
2. Copia el signing secret correcto (empieza con `whsec_`)
3. Añádelo a las variables de entorno
4. Redesplega

### Error: "MongooseServerSelectionError"

**Causas posibles:**
- URI incorrecta
- Contraseña incorrecta
- IP no permitida en MongoDB Atlas

**Solución:**
1. Verifica la URI (formato correcto)
2. Verifica que la contraseña no tenga caracteres especiales sin encodear
3. En MongoDB Atlas → Network Access → Añade `0.0.0.0/0`

### Webhooks no funcionan en producción

**Solución:**
1. Verifica la URL del webhook en Stripe: debe ser `https://tu-backend.vercel.app/api/webhook`
2. Verifica que el `STRIPE_WEBHOOK_SECRET` sea el de producción (Live mode)
3. Revisa logs en Stripe Dashboard → Webhooks → Recent events
4. Revisa logs en Vercel → Deployments → Functions

---

## 📚 Recursos Adicionales

- **MongoDB Atlas:** https://docs.atlas.mongodb.com/
- **Stripe Webhooks:** https://stripe.com/docs/webhooks
- **Vercel Environment Variables:** https://vercel.com/docs/concepts/projects/environment-variables
- **JWT Best Practices:** https://jwt.io/introduction

---

## 🆘 Soporte

Si tienes problemas:

1. Revisa los logs:
   - Local: Consola donde corre `npm run dev`
   - Vercel: Dashboard → Deployments → Functions → Ver logs

2. Verifica variables:
   ```bash
   # Local
   cat backend/.env

   # Vercel
   vercel env ls
   ```

3. Contacta al equipo de desarrollo

---

**Última actualización:** 2025-01-08
**Versión:** 2.0
