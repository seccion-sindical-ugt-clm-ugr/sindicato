# ✅ Checklist de Producción - UGT-CLM-UGR

Lista de verificación para desplegar el sistema a producción de forma segura.

---

## 📋 Antes de Empezar

- [ ] Backend funciona localmente (`cd backend && npm run dev`)
- [ ] Frontend funciona localmente (servidor HTTP cualquiera)
- [ ] Tienes cuenta de Stripe con claves de test
- [ ] Tienes cuenta de Vercel (gratis en vercel.com)
- [ ] Todo el código está commiteado y pusheado a GitHub

---

## 🔷 Fase 1: Desplegar Backend (15 min)

### Opción A: Vercel Dashboard (Más fácil)

- [ ] 1. Ir a https://vercel.com y login con GitHub
- [ ] 2. Click "Add New..." → "Project"
- [ ] 3. Importar repositorio `seccion-sindical-ugt-clm-ugr/sindicato`
- [ ] 4. Configurar Root Directory: `backend`
- [ ] 5. Añadir variables de entorno:
  ```
  STRIPE_SECRET_KEY=sk_test_...
  STRIPE_PUBLISHABLE_KEY=pk_test_...
  FRONTEND_URL=https://seccion-sindical-ugt-clm-ugr.github.io
  SUCCESS_URL=https://seccion-sindical-ugt-clm-ugr.github.io/sindicato/success.html
  CANCEL_URL=https://seccion-sindical-ugt-clm-ugr.github.io/sindicato/cancel.html
  ALLOWED_ORIGINS=https://seccion-sindical-ugt-clm-ugr.github.io
  ```
- [ ] 6. Click "Deploy"
- [ ] 7. Esperar a que termine (~2 minutos)
- [ ] 8. Copiar la URL de producción (ej: `https://sindicato-xyz.vercel.app`)

### Verificación

- [ ] Abrir: `https://TU-URL.vercel.app/health`
- [ ] Debe responder: `{"status":"ok",...}`

---

## 🔷 Fase 2: Actualizar Frontend (5 min)

- [ ] 1. Editar `js/backend-config.js` línea 21:
  ```javascript
  production: 'https://TU-URL-REAL.vercel.app',
  ```
- [ ] 2. Guardar archivo
- [ ] 3. Commit y push:
  ```bash
  git add js/backend-config.js
  git commit -m "Configure production backend URL"
  git push
  ```
- [ ] 4. Esperar 1-2 minutos a que GitHub Pages se actualice

### Verificación

- [ ] Abrir: https://seccion-sindical-ugt-clm-ugr.github.io/sindicato/
- [ ] Abrir consola (F12)
- [ ] Debe mostrar:
  ```
  ✅ Backend API Configurado
  ✅ Backend conectado
  ✅ Sistema de Pagos Listo
  ```

---

## 🔷 Fase 3: Configurar Webhooks Stripe (10 min)

- [ ] 1. Ir a https://dashboard.stripe.com/webhooks
- [ ] 2. Asegurarse de estar en modo "Test"
- [ ] 3. Click "Add endpoint"
- [ ] 4. Endpoint URL: `https://TU-URL.vercel.app/webhook`
- [ ] 5. Description: `UGT Production Webhook`
- [ ] 6. Seleccionar eventos:
  - [ ] `checkout.session.completed`
  - [ ] `checkout.session.expired`
  - [ ] `payment_intent.succeeded`
  - [ ] `payment_intent.payment_failed`
- [ ] 7. Click "Add endpoint"
- [ ] 8. Copiar "Signing secret" (empieza con `whsec_`)
- [ ] 9. Ir a Vercel → Settings → Environment Variables
- [ ] 10. Añadir: `STRIPE_WEBHOOK_SECRET` = `whsec_...`
- [ ] 11. Redeploy el proyecto en Vercel

### Verificación

- [ ] El webhook aparece en lista de Stripe
- [ ] Status: Active

---

## 🔷 Fase 4: Testing Completo (10 min)

### Test 1: Backend Health
- [ ] `curl https://TU-URL.vercel.app/health`
- [ ] Responde OK

### Test 2: Frontend Conecta
- [ ] Abrir sitio en navegador
- [ ] F12 → Consola
- [ ] Ver mensajes de conexión exitosa

### Test 3: Flujo de Pago Completo
- [ ] Completar formulario de afiliación
- [ ] Usar datos de prueba:
  ```
  Nombre: Test User
  Email: test@test.com
  Teléfono: 600000000
  Departamento: Test
  ```
- [ ] Click "Afiliarse por 15€/año"
- [ ] Ver en consola: "✅ Sesión creada"
- [ ] Redirigido a Stripe Checkout
- [ ] Usar tarjeta test: `4242 4242 4242 4242`
- [ ] Completar pago
- [ ] Redirigido a success.html
- [ ] Verificar webhook en Stripe:
  - [ ] Developers → Webhooks → Tu webhook
  - [ ] Recent deliveries muestra evento
  - [ ] Status: 200 OK

### Test 4: Ver Logs
- [ ] Vercel Dashboard → Deployments → Latest → Logs
- [ ] Debe mostrar:
  ```
  📝 Nueva solicitud de afiliación
  ✅ Sesión creada
  💰 Pago completado exitosamente
  ```

---

## 🔷 Fase 5: Modo LIVE (Opcional - Solo cuando estés listo)

⚠️ **NO HACER HASTA QUE ESTÉS 100% SEGURO**

### Requisitos
- [ ] Cuenta Stripe verificada
- [ ] Información bancaria añadida
- [ ] TODO probado en modo test
- [ ] Políticas y términos en el sitio

### Cambios Necesarios

#### En Stripe:
- [ ] 1. Cambiar a modo "Live"
- [ ] 2. Copiar nuevas claves live:
  - Publishable: `pk_live_...`
  - Secret: `sk_live_...`

#### En Vercel:
- [ ] 3. Actualizar variables:
  - `STRIPE_SECRET_KEY` → `sk_live_...`
  - `STRIPE_PUBLISHABLE_KEY` → `pk_live_...`
- [ ] 4. Redeploy

#### En Frontend:
- [ ] 5. Editar `js/stripe-config.js` línea 8:
  ```javascript
  publishableKey: 'pk_live_...',
  ```
- [ ] 6. Commit y push

#### Webhooks Live:
- [ ] 7. Stripe (modo Live) → Webhooks → Add endpoint
- [ ] 8. Misma URL: `https://TU-URL.vercel.app/webhook`
- [ ] 9. Copiar nuevo signing secret
- [ ] 10. Actualizar `STRIPE_WEBHOOK_SECRET` en Vercel
- [ ] 11. Redeploy

#### Testing Live:
- [ ] 12. Probar con tarjeta real (1€)
- [ ] 13. Verificar pago en Stripe
- [ ] 14. Hacer refund si es prueba

---

## 🎯 URLs Importantes

Guarda estas URLs para referencia:

```
Frontend:
https://seccion-sindical-ugt-clm-ugr.github.io/sindicato/

Backend:
https://TU-URL.vercel.app

Endpoints:
https://TU-URL.vercel.app/health
https://TU-URL.vercel.app/api/create-affiliation-session
https://TU-URL.vercel.app/api/create-course-session
https://TU-URL.vercel.app/webhook

Dashboards:
https://vercel.com/dashboard
https://dashboard.stripe.com
https://github.com/seccion-sindical-ugt-clm-ugr/sindicato
```

---

## 🐛 Troubleshooting

### Backend no responde
- [ ] Verificar que desplegó correctamente en Vercel
- [ ] Revisar logs en Vercel
- [ ] Verificar variables de entorno están configuradas
- [ ] Probar health check: `curl https://TU-URL.vercel.app/health`

### CORS Error
- [ ] Verificar `ALLOWED_ORIGINS` incluye tu dominio GitHub Pages
- [ ] Redeploy después de cambiar variables

### Webhook falla
- [ ] Verificar `STRIPE_WEBHOOK_SECRET` está configurado
- [ ] Verificar URL del webhook es correcta
- [ ] Redeploy después de añadir secret
- [ ] Ver "Recent deliveries" en Stripe para error exacto

### Frontend no conecta
- [ ] Verificar `js/backend-config.js` tiene URL correcta
- [ ] Hard refresh (Ctrl+Shift+R)
- [ ] Abrir consola y ejecutar `showBackendConfig()`
- [ ] Verificar GitHub Pages se actualizó

---

## 📞 Ayuda

**Documentación completa:**
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Guía paso a paso detallada
- [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) - Integración frontend-backend
- [backend/README.md](backend/README.md) - Documentación del backend

**Recursos externos:**
- [Vercel Docs](https://vercel.com/docs)
- [Stripe Docs](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)

---

## ✅ Estado Final

Una vez completado todo:

```
✅ Backend desplegado en Vercel
✅ Frontend actualizado en GitHub Pages
✅ Webhooks configurados en Stripe
✅ Testing completo exitoso
✅ Sistema funcional en producción

🎉 ¡Listo para aceptar afiliaciones y pagos!
```

---

**Tiempo estimado total: ~50 minutos**

**Última actualización: Noviembre 2024**
