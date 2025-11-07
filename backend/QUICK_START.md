# 🚀 Quick Start - Backend UGT-CLM-UGR

Guía rápida para poner en marcha el backend en **5 minutos**.

## ✅ Prerequisitos

- ✅ Node.js instalado (v18+)
- ✅ Cuenta de Stripe (modo test gratuito)

## 📝 Pasos

### 1️⃣ Instalar dependencias (1 minuto)

```bash
cd backend
npm install
```

### 2️⃣ Obtener claves de Stripe (2 minutos)

1. Ve a https://dashboard.stripe.com/register (crea cuenta si no tienes)
2. Activa "Modo de prueba" (toggle arriba a la derecha)
3. Ve a "Developers" > "API keys"
4. Copia tu clave **secreta** (`sk_test_...`)
5. Copia tu clave **publicable** (`pk_test_...`)

### 3️⃣ Configurar variables de entorno (1 minuto)

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar el archivo .env
nano .env  # o usa tu editor preferido
```

**Reemplaza estos valores en `.env`:**

```bash
STRIPE_SECRET_KEY=sk_test_PEGA_TU_CLAVE_AQUI
STRIPE_PUBLISHABLE_KEY=pk_test_PEGA_TU_CLAVE_AQUI
```

Los demás valores pueden dejarse como están por ahora.

### 4️⃣ Iniciar el servidor (30 segundos)

```bash
npm run dev
```

Deberías ver:

```
🚀 ===================================
   Servidor UGT-CLM-UGR iniciado
   ===================================
   🌐 URL: http://localhost:3000
   📝 Entorno: development
   💳 Stripe: ✓ Configurado
   ===================================
```

### 5️⃣ Probar que funciona (30 segundos)

Abre otra terminal y ejecuta:

```bash
curl http://localhost:3000/health
```

Deberías ver:
```json
{
  "status": "ok",
  "timestamp": "2024-11-03T21:00:00.000Z",
  "uptime": 5.123,
  "environment": "development"
}
```

## 🎉 ¡Listo!

Tu backend está funcionando. Ahora puedes:

### Probar crear una sesión de pago:

```bash
curl -X POST http://localhost:3000/api/create-affiliation-session \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Test",
    "email": "juan@test.com",
    "phone": "600000000",
    "department": "Test Dept"
  }'
```

Respuesta:
```json
{
  "id": "cs_test_abc123...",
  "url": "https://checkout.stripe.com/pay/cs_test_abc123..."
}
```

**¡Copia la URL y ábrela en el navegador para ver el checkout de Stripe!**

## 🔄 Siguiente Paso: Conectar con el Frontend

Ahora necesitas actualizar el frontend para que use tu servidor backend.

### Opción A: Servidor local

Si vas a probar en local, el frontend debe llamar a:
```
http://localhost:3000/api/...
```

### Opción B: Desplegar en internet

Para que funcione con tu sitio en GitHub Pages, necesitas desplegar el backend en:
- **Vercel** (recomendado, gratis)
- **Railway** (gratis con créditos)
- **Render** (gratis)

Ver README.md sección "Despliegue" para instrucciones.

## 🐛 ¿Problemas?

### Error: "Cannot find module"
```bash
# Reinstalar dependencias
rm -rf node_modules
npm install
```

### Error: "STRIPE_SECRET_KEY is required"
```bash
# Verifica que .env existe y tiene la clave
cat .env | grep STRIPE_SECRET_KEY
```

### Puerto 3000 ocupado
```bash
# Cambiar puerto en .env
echo "PORT=3001" >> .env
npm run dev
```

## 📚 Más Información

- **README.md** - Documentación completa
- **STRIPE_BACKEND_SETUP.md** - Guía detallada de arquitectura
- https://stripe.com/docs - Documentación de Stripe

## 💡 Tarjetas de Prueba

Para probar pagos en modo test:

- **Éxito:** `4242 4242 4242 4242`
- **Fallo:** `4000 0000 0000 0002`
- Cualquier fecha futura (ej: 12/25)
- Cualquier CVC (ej: 123)

---

**¿Todo funcionando?** 🎉 ¡Perfecto! Ahora continúa con la configuración del frontend.
