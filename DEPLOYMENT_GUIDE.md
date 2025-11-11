# 🚀 Guía de Deployment a Producción

## Variables de Entorno Requeridas en Vercel

Antes de desplegar, configura estas variables en **Vercel → Settings → Environment Variables**:

### 1. Seguridad (CRÍTICO)

```bash
# JWT Secret - Genera con el comando:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=<tu_jwt_secret_generado>

# Admin Password - Genera con el comando:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
ADMIN_PASSWORD=<tu_admin_password_generado>
```

### 2. Base de Datos (CRÍTICO)

```bash
# MongoDB Atlas URI
# Obtén desde: https://cloud.mongodb.com → Connect → Connect your application
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/ugt_sindical
```

**Importante**: Configura MongoDB Atlas whitelist:
1. Ve a Network Access en MongoDB Atlas
2. Añade `0.0.0.0/0` para permitir conexiones desde Vercel
3. O añade las IPs específicas de Vercel

### 3. Stripe (CRÍTICO)

```bash
# Claves de producción desde: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxx

# Webhook secret desde: https://dashboard.stripe.com/webhooks
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# URLs de redirección
SUCCESS_URL=https://ugtclmgranada.org/success.html
CANCEL_URL=https://ugtclmgranada.org/cancel.html
```

**Configurar Webhook en Stripe**:
1. Ve a https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. URL: `https://tu-backend.vercel.app/api/webhook`
4. Eventos: Selecciona `checkout.session.completed`
5. Copia el "Signing secret" y úsalo en `STRIPE_WEBHOOK_SECRET`

### 4. CORS (CRÍTICO)

```bash
# Dominios permitidos (separados por coma, sin espacios)
ALLOWED_ORIGINS=https://ugtclmgranada.org,https://seccion-sindical-ugt-clm-ugr.github.io
```

### 5. Entorno

```bash
NODE_ENV=production
```

### 6. Email (OPCIONAL)

Si quieres recibir notificaciones por email:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-password-de-aplicacion
EMAIL_FROM=noreply@ugtclmgranada.org
EMAIL_FROM_NAME=UGT CLM Granada
ADMIN_EMAIL=admin@ugtclmgranada.org
```

## Configuración del Frontend

En los archivos HTML principales (index.html, etc.), añade ANTES de cargar los scripts JS:

```html
<script>
    // Configurar URL del backend
    window.BACKEND_URL = 'https://tu-backend.vercel.app';
</script>
<script src="js/backend-config.js"></script>
<script src="js/auth-api.js"></script>
<!-- resto de scripts -->
```

## Checklist Pre-Deployment

- [ ] ✅ Todas las variables de entorno configuradas en Vercel
- [ ] ✅ MongoDB Atlas whitelist configurado (0.0.0.0/0 o IPs de Vercel)
- [ ] ✅ Webhook de Stripe configurado con la URL correcta
- [ ] ✅ ALLOWED_ORIGINS incluye todos los dominios del frontend
- [ ] ✅ window.BACKEND_URL configurado en todos los HTMLs
- [ ] ✅ Claves de Stripe en modo LIVE (no test)
- [ ] ✅ JWT_SECRET y ADMIN_PASSWORD únicos y seguros

## Testing Post-Deployment

1. **Health Check**:
   ```bash
   curl https://tu-backend.vercel.app/health
   ```
   Debe responder: `{"status": "ok"}`

2. **Test de CORS**:
   - Abre la consola del navegador en tu sitio
   - Ejecuta: `checkBackendConnection()`
   - Debe mostrar: "✅ Backend conectado"

3. **Test de Pago** (con tarjeta de test):
   - Tarjeta: `4242 4242 4242 4242`
   - Fecha: Cualquier fecha futura
   - CVC: Cualquier 3 dígitos

4. **Test de Admin Panel**:
   - Ve a `/admin-suggestions.html`
   - Inicia sesión con la `ADMIN_PASSWORD` configurada
   - Verifica que puedas ver las sugerencias

## Solución de Problemas Comunes

### Error: "JWT_SECRET no configurada"
- Verifica que la variable esté en Vercel → Settings → Environment Variables
- Redeploy después de añadir variables

### Error: "MongoDB connection failed"
- Verifica que MONGODB_URI sea correcta
- Asegúrate de que 0.0.0.0/0 esté en el whitelist de MongoDB Atlas
- Verifica que el usuario tenga permisos de lectura/escritura

### Error: "CORS blocked"
- Verifica que ALLOWED_ORIGINS incluya tu dominio exacto
- No uses wildcards o subdominios genéricos
- Redeploy después de cambiar ALLOWED_ORIGINS

### Error: "Webhook signature verification failed"
- Verifica que STRIPE_WEBHOOK_SECRET sea correcto
- Asegúrate de que el webhook en Stripe apunte a la URL correcta
- Verifica que estés usando el secret del webhook correcto (test vs live)

## Contacto de Soporte

Si encuentras problemas:
1. Revisa los logs en Vercel → Deployments → Ver Logs
2. Verifica todas las variables de entorno
3. Consulta este documento para configuración correcta
