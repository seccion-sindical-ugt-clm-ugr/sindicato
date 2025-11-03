# Guía de Configuración de Stripe para UGT-CLM-UGR

## 🚀 Configuración Rápida

### 1. Obtener tus Claves API de Stripe

1. **Crea tu cuenta Stripe** si no la tienes:
   - Ve a [Stripe.com](https://stripe.com)
   - Regístrate con tu email
   - Verifica tu cuenta y email

2. **Obtén tus claves API**:
   - Inicia sesión en [Stripe Dashboard](https://dashboard.stripe.com)
   - Ve a **Developers → API keys**
   - Copia estas claves:
     - **Publishable key**: `pk_test_...` (para modo prueba)
     - **Secret key**: `sk_test_...` (para modo prueba)

### 2. Configurar el Archivo `stripe-config.js`

Abre el archivo: `js/stripe-config.js`

Reemplaza las líneas 5-6 con tus claves reales:

```javascript
// ANTES (claves de ejemplo):
publishableKey: 'pk_test_51234567890abcdef',
secretKey: 'sk_test_51234567890abcdef',

// DESPUÉS (tus claves reales):
publishableKey: 'pk_test_tu_clave_real_aqui',
secretKey: 'sk_test_tu_clave_real_aqui',
```

### 3. Actualizar URLs (Importante)

En el mismo archivo, verifica que las URLs sean correctas:

```javascript
// Líneas 10-11 - Reemplaza con tu dominio real:
successUrl: 'https://seccion-sindical-ugt-clm-ugr.github.io/sindicato/success.html',
cancelUrl: 'https://seccion-sindical-ugt-clm-ugr.github.io/sindicato/cancel.html',
```

## 🔐 Modo Prueba vs Producción

### Modo Prueba (Recomendado para empezar)
- Usa claves que empiezan con `pk_test_` y `sk_test_`
- Puedes usar tarjetas de prueba de Stripe
- No se realizan cargos reales

### Tarjetas de Prueba Stripe:
- **Visa**: 4242 4242 4242 4242
- **Mastercard**: 5555 5555 5555 4444
- **Declinada**: 4000 0000 0000 0002

### Modo Producción (Cuando estés listo)
- Ve a **Settings → Account details** en Stripe
- Completa la verificación de identidad
- Activa las transferencias a tu cuenta bancaria
- Usa claves que empiezan con `pk_live_` y `sk_live_`

## 🎯 Productos Configurados

El sistema ya tiene configurados estos productos:

### Afiliación Anual
- **Precio**: 15,00€
- **ID**: `affiliation`
- **Modo**: Pago único

### Curso IA - Miembros UGT
- **Precio**: 15,00€
- **ID**: `courseIA`
- **Para**: Afiliados UGT

### Curso IA - Externos
- **Precio**: 160,00€
- **ID**: `courseIAExternal`
- **Para**: Público general

## 📱 Flujo de Pago

1. **Usuario llena formulario** → Datos validados
2. **Creación de sesión Stripe** → Checkout seguro
3. **Redirección a Stripe** → Pago en entorno Stripe
4. **Redirección de vuelta** → Página de éxito/confirmación
5. **Procesamiento del pago** → Confirmación y activación

## 🔧 Webhooks (Opcional pero recomendado)

Para recibir notificaciones automáticas:

1. En Stripe Dashboard → **Developers → Webhooks**
2. **Add endpoint**: `https://tu-dominio.com/webhook/stripe`
3. **Selecciona eventos**:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

## ⚠️ Consideraciones de Seguridad

### ✅ Buenas prácticas implementadas:
- ✅ Validación de datos en frontend
- ✅ URLs de retorno seguras
- ✅ Metadata en transacciones
- ✅ Manejo de errores
- ✅ Sin almacenamiento de datos sensibles

### ⚠️ Importante:
- 🔒 **NUNCA** exponer tu `secret_key` en el frontend
- 🔒 Las claves secretas solo deben usarse en el servidor
- 🔒 Usa siempre HTTPS en producción
- 🔒 Valida datos también en el backend

## 🧪 Testing del Sistema

### Para probar en modo desarrollo:
1. Usa claves `pk_test_` y `sk_test_`
2. Usa tarjetas de prueba
3. Verifica flujo completo
4. Comprueba páginas de éxito/fracaso

### Checklist de testing:
- [ ] Formulario de afiliación funciona
- [ ] Formulario de cursos funciona
- [ ] Página de éxito muestra datos correctos
- [ ] Página de cancelación funciona
- [ ] Precios diferenciados (afiliado vs externo)
- [ ] Validación de email y campos requeridos

## 🚀 Subir a Producción

Cuando estés listo para producción:

1. **Cambia a claves live**:
   ```javascript
   publishableKey: 'pk_live_tu_clave_real',
   secretKey: 'sk_live_tu_clave_real',
   ```

2. **Verifica URLs de producción**:
   ```javascript
   successUrl: 'https://tu-dominio-real.com/success.html',
   cancelUrl: 'https://tu-dominio-real.com/cancel.html',
   ```

3. **Activa transferencias** en Stripe
4. **Configura webhooks** para tu servidor
5. **Prueba con transacciones reales pequeñas**

## 🆘 Soporte y Problemas Comunes

### Error "No such key: pk_test_..."
- **Solución**: Verifica que la clave esté correcta y activa

### Error "Invalid amount"
- **Solución**: Los precios deben estar en centavos (15€ = 1500)

### Error "Invalid redirect URL"
- **Solución**: Las URLs deben empezar con https:// en producción

### Pago no se procesa
- **Solución**: Revisa la consola del navegador para errores JavaScript

## 📞 Contacto

Si necesitas ayuda:
- **Documentación Stripe**: [stripe.com/docs](https://stripe.com/docs)
- **Soporte Stripe**: [stripe.com/contact](https://stripe.com/contact)
- **Email de soporte UGT**: ugt.clm.ugr@ugt.org

---

🎉 **¡Listo! Tu sistema de pagos con Stripe está configurado y listo para usar.**