# 🚀 Guía Rápida de Configuración

## 📦 Instalación Inicial

```bash
cd backend
npm install
```

## ⚙️ Configuración en 5 Pasos

### 1️⃣ Crear archivo `.env`

```bash
cp .env.example .env
```

### 2️⃣ Generar JWT Secret

```bash
npm run generate-jwt-secret
```

Copia el resultado y pégalo en `.env`:
```bash
JWT_SECRET=a1b2c3d4e5f6... (el valor generado)
```

### 3️⃣ Configurar MongoDB

1. Ve a: https://www.mongodb.com/cloud/atlas/register
2. Crea un cluster gratuito (M0)
3. Crea un usuario de base de datos
4. Añade acceso desde cualquier IP (0.0.0.0/0)
5. Obtén la URI de conexión
6. Pégala en `.env`:

```bash
MONGODB_URI=mongodb+srv://usuario:password@cluster.xxxxx.mongodb.net/ugt-database
```

### 4️⃣ Configurar Stripe

1. Ve a: https://dashboard.stripe.com/register
2. Obtén tu clave secreta: https://dashboard.stripe.com/test/apikeys
3. Pégala en `.env`:

```bash
STRIPE_SECRET_KEY=sk_test_[TU_CLAVE_DE_STRIPE_TEST]
```

4. Configura webhook (desarrollo local):

```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS
# O descarga desde: https://github.com/stripe/stripe-cli/releases

# Login
stripe login

# Iniciar listener (en otra terminal)
stripe listen --forward-to localhost:3000/api/webhook
```

5. Copia el webhook secret que aparece y pégalo en `.env`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_[TU_WEBHOOK_SECRET]
```

### 5️⃣ Configurar URLs de Redirección

En `.env`:

```bash
# Para desarrollo local
SUCCESS_URL=http://localhost:8000/success.html
CANCEL_URL=http://localhost:8000/cancel.html
ALLOWED_ORIGINS=http://localhost:8000,http://localhost:3000

# Para producción (GitHub Pages)
# SUCCESS_URL=https://seccion-sindical-ugt-clm-ugr.github.io/sindicato/success.html
# CANCEL_URL=https://seccion-sindical-ugt-clm-ugr.github.io/sindicato/cancel.html
# ALLOWED_ORIGINS=https://seccion-sindical-ugt-clm-ugr.github.io
```

## ✅ Verificar Configuración

Ejecuta el verificador automático:

```bash
npm run verify-env
```

Si todo está bien, verás:
```
✅ ¡La configuración es PERFECTA!
✨ Todas las variables están configuradas correctamente.
✨ Todas las conexiones funcionan.
```

## 🧪 Pruebas Individuales

### Probar MongoDB
```bash
npm run test:db
```

### Probar Stripe
```bash
npm run test:stripe
```

### Generar nuevo JWT Secret
```bash
npm run generate-jwt-secret
```

## 🎯 Iniciar Servidor

### Desarrollo (con auto-reload)
```bash
npm run dev
```

### Producción
```bash
npm start
```

## 🌐 Desplegar en Vercel

### Opción 1: Desde la Web (Recomendado)

1. Ve a: https://vercel.com/new
2. Importa tu repositorio
3. Configura variables de entorno:
   - **Settings** → **Environment Variables**
   - Añade todas las variables de `.env.example`
   - Cambia valores de desarrollo a producción:
     - `STRIPE_SECRET_KEY`: Usa `sk_live_[TU_CLAVE_LIVE]`
     - `STRIPE_WEBHOOK_SECRET`: Configura webhook en Stripe Live mode
     - `SUCCESS_URL`: Tu dominio de GitHub Pages
     - `CANCEL_URL`: Tu dominio de GitHub Pages
     - `ALLOWED_ORIGINS`: Tu dominio de GitHub Pages
4. Deploy!

### Opción 2: Desde CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd backend
vercel

# Añadir variables de entorno (una por una)
vercel env add MONGODB_URI production
vercel env add JWT_SECRET production
# ... (todas las demás)

# Deploy a producción
vercel --prod
```

## 📚 Documentación Completa

Para más detalles, consulta:
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Guía completa de despliegue
- **[AUTH_API_GUIDE.md](../AUTH_API_GUIDE.md)** - API de autenticación
- **README.md** - Información general del proyecto

## 🆘 Problemas Comunes

### "Cannot connect to MongoDB"
- Verifica que la URI sea correcta
- Asegúrate de que 0.0.0.0/0 esté en Network Access (MongoDB Atlas)
- Verifica usuario y contraseña

### "Stripe webhook verification failed"
- Verifica que `STRIPE_WEBHOOK_SECRET` sea correcto
- En desarrollo: Asegúrate de que Stripe CLI esté ejecutándose
- En producción: Verifica que el webhook esté configurado con la URL correcta

### "JWT_SECRET not found"
- Genera uno con: `npm run generate-jwt-secret`
- Cópialo a `.env`

## 📞 Soporte

¿Problemas? Ejecuta el verificador:
```bash
npm run verify-env
```

Te dirá exactamente qué falta o está mal configurado.

---

**¡Listo!** Ya puedes empezar a desarrollar 🎉
