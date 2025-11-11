# Configuración de Variables en Vercel

## Variables OBLIGATORIAS para que funcione la recuperación de contraseña

Ve a: **https://vercel.com** → Tu proyecto backend → **Settings** → **Environment Variables**

Añade estas variables:

### 1. EMAIL (Para recuperación de contraseña)

```
EMAIL_USER = tu-email@gmail.com
EMAIL_PASS = tu-contraseña-de-aplicacion-google
EMAIL_FROM = ugt.clm.ugr@ugt.org
EMAIL_HOST = smtp.gmail.com
EMAIL_PORT = 587
EMAIL_SECURE = false
```

**¿Cómo obtener EMAIL_PASS de Gmail?**

1. Ve a tu cuenta de Google: https://myaccount.google.com/security
2. Activa "Verificación en 2 pasos"
3. Ve a "Contraseñas de aplicaciones"
4. Genera una nueva contraseña para "Correo"
5. Copia esa contraseña (16 caracteres) y úsala en `EMAIL_PASS`

### 2. FRONTEND_URL (Para enlaces en emails)

```
FRONTEND_URL = https://ugtclmgranada.org
```

### 3. Otras variables ya configuradas (verifica que existan)

```
MONGODB_URI = mongodb+srv://...
STRIPE_SECRET_KEY = sk_live_...
STRIPE_WEBHOOK_SECRET = whsec_...
JWT_SECRET = (tu secret de 64 caracteres)
ADMIN_PASSWORD = (tu password de admin)
ALLOWED_ORIGINS = https://ugtclmgranada.org
SUCCESS_URL = https://ugtclmgranada.org/success.html
CANCEL_URL = https://ugtclmgranada.org/cancel.html
NODE_ENV = production
```

## Después de añadir variables:

1. **Redeploy** en Vercel (Deployments → ... → Redeploy)
2. Espera 2-3 minutos
3. Prueba la recuperación de contraseña

---

## Si no quieres configurar email (modo desarrollo)

Sin EMAIL_USER/EMAIL_PASS configurados:
- El backend simulará el envío de email
- Verás el link en los logs de Vercel
- NO funcionará en producción real

Para ver los logs: Vercel → Deployments → [último deployment] → View Function Logs
