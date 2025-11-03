# ⚡ Quick Deploy - Despliegue Rápido

Despliega el sistema completo en producción en 20 minutos.

---

## 🎯 Resumen Ultra-Rápido

```bash
1. Deploy backend en Vercel     [10 min]
2. Actualizar frontend          [5 min]
3. Configurar webhook Stripe    [5 min]
4. Testing                      [5 min]
```

---

## 📱 Paso 1: Backend en Vercel (10 min)

### Via Web (Más fácil)

1. **Abrir** https://vercel.com → Login con GitHub
2. **Click** "Add New..." → "Project"
3. **Importar** `seccion-sindical-ugt-clm-ugr/sindicato`
4. **Root Directory:** `backend` ← IMPORTANTE
5. **Environment Variables** (copiar/pegar):

```bash
STRIPE_SECRET_KEY=sk_test_TU_CLAVE_SECRETA_AQUI
STRIPE_PUBLISHABLE_KEY=pk_test_TU_CLAVE_PUBLICA_AQUI
FRONTEND_URL=https://seccion-sindical-ugt-clm-ugr.github.io
SUCCESS_URL=https://seccion-sindical-ugt-clm-ugr.github.io/sindicato/success.html
CANCEL_URL=https://seccion-sindical-ugt-clm-ugr.github.io/sindicato/cancel.html
ALLOWED_ORIGINS=https://seccion-sindical-ugt-clm-ugr.github.io
```

6. **Click** "Deploy"
7. **Copiar** URL cuando termine (ej: `https://sindicato-abc123.vercel.app`)

### Verificar

```bash
curl https://TU-URL.vercel.app/health
# Debe responder: {"status":"ok"}
```

---

## 📱 Paso 2: Frontend (5 min)

1. **Editar** `js/backend-config.js` línea 21:
```javascript
production: 'https://sindicato-abc123.vercel.app',  // Tu URL real
```

2. **Git:**
```bash
git add js/backend-config.js
git commit -m "Configure production backend URL"
git push
```

3. **Esperar** 1 minuto → GitHub Pages se actualiza

4. **Verificar:**
   - Abrir: https://seccion-sindical-ugt-clm-ugr.github.io/sindicato/
   - F12 → Consola
   - Debe decir: "✅ Backend conectado"

---

## 📱 Paso 3: Webhook Stripe (5 min)

1. **Abrir** https://dashboard.stripe.com/webhooks
2. **Modo Test** (toggle arriba)
3. **"Add endpoint"**
4. **URL:** `https://TU-URL.vercel.app/webhook`
5. **Eventos:** Seleccionar todos o estos:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
6. **"Add endpoint"**
7. **Copiar** "Signing secret" (`whsec_...`)
8. **Vercel** → Settings → Environment Variables
9. **Añadir:** `STRIPE_WEBHOOK_SECRET` = `whsec_...`
10. **Redeploy** en Vercel

---

## 📱 Paso 4: Testing (5 min)

### Test Rápido

1. **Abrir** tu sitio
2. **Completar** formulario afiliación
3. **Datos:**
   - Nombre: Test
   - Email: test@test.com
   - Teléfono: 600000000
   - Depto: Test
4. **Click** "Afiliarse"
5. **Stripe Checkout:**
   - Tarjeta: `4242 4242 4242 4242`
   - Fecha: 12/25
   - CVC: 123
6. **Pagar**
7. **Debe** redirigir a success.html ✅

### Verificar Webhook

- **Stripe** → Webhooks → Tu webhook
- **Recent deliveries** → Debe haber evento
- **Status:** 200 OK ✅

---

## ✅ ¡Listo!

Si todo funciona:

```
✅ Backend en producción
✅ Frontend conectado
✅ Webhooks configurados
✅ Pagos funcionando

🎉 Sistema operativo!
```

---

## 🐛 Si algo falla

### Backend 404
- Vercel Settings → Root Directory → `backend`
- Redeploy

### CORS Error
- Vercel → Environment Variables
- `ALLOWED_ORIGINS` = tu dominio GitHub Pages
- Redeploy

### Webhook Error
- Vercel → Add `STRIPE_WEBHOOK_SECRET`
- Redeploy

### Frontend no conecta
- Verificar URL en `js/backend-config.js`
- Git push
- Hard refresh navegador (Ctrl+Shift+R)

---

## 📚 Más Info

- **Guía completa:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Checklist:** [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md)
- **Integración:** [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)

---

## 💡 Comandos Útiles

```bash
# Ver logs backend
vercel logs --follow

# Health check
curl https://TU-URL.vercel.app/health

# Verificar frontend (en consola navegador)
showBackendConfig()
checkBackendConnection()
```

---

**Tiempo total: ~20 minutos**

**¡Éxito!** 🚀
