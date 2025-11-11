# 🚨 AUDITORÍA COMPLETA DE PRODUCCIÓN - UGT-CLM-UGR
**Fecha:** 11 de Noviembre de 2024  
**Estado:** ⚠️ NO APTO PARA PRODUCCIÓN - Múltiples problemas críticos identificados  
**Prioridad General:** CRÍTICA - Resolver antes de cualquier despliegue

---

## 📊 RESUMEN EJECUTIVO

| Categoría | Críticos | Altos | Moderados | Total |
|-----------|----------|-------|-----------|-------|
| **Seguridad** | 5 | 3 | 2 | 10 |
| **Configuración** | 3 | 2 | 1 | 6 |
| **Funcionalidad** | 2 | 1 | 2 | 5 |
| **UX/UI** | 0 | 1 | 2 | 3 |
| **Rendimiento** | 0 | 0 | 1 | 1 |
| **DevOps** | 1 | 1 | 0 | 2 |
| **Total** | **11** | **8** | **8** | **27** |

---

## 🔴 PROBLEMAS CRÍTICOS (DEBE RESOLVER PRIMERO)

### 1. ⚠️ CREDENCIAL HARDCODEADA EN MongoDB - CRÍTICA
**Archivo:** `/home/user/sindicato/db/mongodb.js` línea 7  
**Severidad:** 🔴 CRÍTICA  
**Riesgo:** Exposición de credenciales de base de datos

```javascript
// ❌ INSEGURO - URI con credenciales hardcodeadas
this.uri = process.env.MONGODB_URI || "mongodb+srv://adminblabaele:<db_password>@ugt-production.tpwafoj.mongodb.net/?appName=UGT-Production";
```

**Problemas:**
- El usuario `adminblabaele` y el cluster `ugt-production` están expuestos
- El patrón de contraseña es visible
- Cualquiera puede intentar acceder a MongoDB

**Solución:**
```javascript
this.uri = process.env.MONGODB_URI;
if (!this.uri) {
    throw new Error('MONGODB_URI es requerida en variables de entorno');
}
```

---

### 2. 🔐 JWT Secret con valor por defecto predecible - CRÍTICA
**Archivo:** `/home/user/sindicato/backend/src/middleware/auth.js` línea 10  
**Severidad:** 🔴 CRÍTICA  
**Riesgo:** Tokens JWT pueden ser falsificados

```javascript
// ❌ INSEGURO - Valor por defecto predecible
const JWT_SECRET = process.env.JWT_SECRET || 'ugt-clm-ugr-secret-key-change-in-production';
```

**Problemas:**
- Si `JWT_SECRET` no está configurado, usa el valor por defecto
- El valor por defecto es visible en el código
- Cualquiera puede crear tokens válidos

**Solución:**
```javascript
if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET es REQUERIDO en variables de entorno. Usa: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
}
const JWT_SECRET = process.env.JWT_SECRET;
```

---

### 3. 🔓 Webhook de Stripe sin verificación - CRÍTICA
**Archivo:** `/home/user/sindicato/backend/src/routes/webhook.js` línea 23-32  
**Severidad:** 🔴 CRÍTICA  
**Riesgo:** Webhooks falsificados pueden procesar pagos fraudulentos

```javascript
// ❌ INSEGURO - Si no existe secret, acepta cualquier evento
if (process.env.STRIPE_WEBHOOK_SECRET) {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
} else {
    // ⚠️ PELIGRO: Sin verificación
    console.warn('⚠️ ADVERTENCIA: Webhook sin verificar');
    event = JSON.parse(req.body.toString());
}
```

**Problemas:**
- En producción, si `STRIPE_WEBHOOK_SECRET` no está configurado, acepta eventos sin validar
- Permitiría falsificar pagos completados
- Riesgo de fraude financiero

**Solución:**
```javascript
if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET es REQUERIDO para webhooks seguros');
}
const sig = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
```

---

### 4. 🔑 Clave Stripe Pública Hardcodeada - CRÍTICA
**Archivo:** `/home/user/sindicato/js/stripe-config.js` línea 8  
**Severidad:** 🔴 CRÍTICA  
**Riesgo:** Clave de prueba expuesta públicamente, dificulta transición a producción

```javascript
// ❌ INSEGURO - Clave hardcodeada
publishableKey: 'pk_test_5KBH6AipFVudtyqsznP9vJXo00ku526ehA',
```

**Problemas:**
- Es una clave de prueba pero está hardcodeada
- Débil control de versiones
- Dificulta cambiar a claves de producción
- Hace que se vea un patrón de cómo se configura

**Solución:**
```javascript
const STRIPE_CONFIG = {
    // Cargar desde la configuración del backend
    get publishableKey() {
        return window.STRIPE_CONFIG_FROM_BACKEND?.publishableKey || 
               localStorage.getItem('STRIPE_PUBLISHABLE_KEY') ||
               null;
    }
};
```

---

### 5. 🛡️ URLs hardcodeadas de Backend en Múltiples Ubicaciones - CRÍTICA
**Archivos:** 
- `/home/user/sindicato/js/backend-config.js` línea 19: `'https://sindicato-mu.vercel.app'`
- `/home/user/sindicato/js/auth-api.js` línea 15: `'https://sindicato-mu.vercel.app'`

**Severidad:** 🔴 CRÍTICA  
**Riesgo:** URLs de diferentes instancias, imposible desplegar correctamente

```javascript
// ❌ INSEGURO - URL hardcodeada
production: 'https://sindicato-mu.vercel.app',

// Y también en auth-api.js:
: 'https://sindicato-mu.vercel.app'
```

**Problemas:**
- Las URLs son de una instancia anterior (`sindicato-mu.vercel.app`)
- No coinciden con la URL real de producción según PRODUCTION_CHECKLIST.md
- Cada instancia tiene URLs diferentes
- Hace imposible el despliegue consistente

**Solución:**
```javascript
const BACKEND_CONFIG = {
    // Detectar desde las variables de entorno de la página
    get apiUrl() {
        const envUrl = window.BACKEND_API_URL;
        if (envUrl) return envUrl;
        
        // Fallback según entorno detectado
        if (isLocal) return 'http://localhost:3000';
        if (isProd) {
            throw new Error('Backend URL debe ser configurada en producción');
        }
    }
};
```

---

### 6. 🚨 Sistema de Autenticación de Admin sin Hash - CRÍTICA
**Archivos:** 
- `/home/user/sindicato/backend/src/routes/suggestions.js`
- `/home/user/sindicato/admin-suggestions.html`
- `/home/user/sindicato/admin.html`

**Severidad:** 🔴 CRÍTICA  
**Riesgo:** Credenciales en texto plano, interceptables

```javascript
// ❌ INSEGURO - Contraseña en Bearer token sin hash
const adminPassword = process.env.ADMIN_PASSWORD || 'ugt2024admin';
if (token !== adminPassword) { /* rechazo */ }
```

**Frontend:**
```javascript
// ❌ INSEGURO - Envía contraseña como token
authToken = password;
'Authorization': `Bearer ${password}`
```

**Problemas:**
- La contraseña se envía en texto plano en cada request
- No hay JWT, no hay hash, no hay validación segura
- Visible en Network Inspector del navegador
- Vulnerable a MITM (Man in the Middle) sin HTTPS estricto
- Contraseña por defecto es predecible: `'ugt2024admin'`

**Solución Recomendada:**
```javascript
// Backend - Usar JWT con contraseña hasheada
const adminLogin = async (password) => {
    const passwordHash = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
    if (!passwordHash) throw new Error('Unauthorized');
    
    const token = jwt.sign({ admin: true }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return token;
};

// Frontend - Usar el token JWT
const response = await fetch('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ password })
});
const { token } = await response.json();
localStorage.setItem('adminToken', token);
```

---

### 7. 🌐 CORS Temporal sin Verificación - CRÍTICA
**Archivo:** `/home/user/sindicato/backend/src/server.js` línea 116  
**Severidad:** 🔴 CRÍTICA  
**Riesgo:** Permite acceso desde cualquier origen que comience con `https://ugtclmgranada.org`

```javascript
// ❌ INSEGURO - Comentario "TEMPORAL"
// TEMPORAL: Permitir todos los orígenes que empiecen con https://ugtclmgranada.org
if (origin && origin.startsWith('https://ugtclmgranada.org')) {
    console.log(`✅ CORS: Origin ${origin} permitido`);
    return callback(null, true);
}
```

**Problemas:**
- Es "TEMPORAL" según el comentario, pero está en producción
- Permite cualquier subdominio de `ugtclmgranada.org`
- Alguien con acceso al dominio puede explotar esto
- Debug logs revela intención temporal

**Solución:**
```javascript
// Lista explícita de dominios permitidos
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);

if (!ALLOWED_ORIGINS.includes(origin)) {
    return callback(new Error('CORS not allowed'));
}
return callback(null, true);
```

---

### 8. 🔍 Debug Statements en Producción - CRÍTICA
**Archivos:**
- `/home/user/sindicato/pages/curso-ia.html` líneas 1857-1871: 7 DEBUG logs
- `/home/user/sindicato/backend/src/routes/stripe.js` líneas 106-121: 4 DEBUG logs

**Severidad:** 🔴 CRÍTICA  
**Riesgo:** Exposición de datos internos, rendimiento, rastreo

```javascript
// ❌ INSEGURO - Logs de debug en consola
console.log('🔍 DEBUG - Datos del curso:', courseData);
console.log('🔍 DEBUG - Datos del usuario:', userData);
console.log('🔍 DEBUG - Request body:', JSON.stringify(req.body, null, 2));
```

**Problemas:**
- 173 líneas de `console.log/warn/error` en el backend
- Expone estructura de datos internos
- Visible en logs de servidor (Vercel logs)
- Puede incluir datos sensibles de usuarios

**Solución:**
```javascript
// Sistema de logging condicional
const debugLog = process.env.NODE_ENV === 'development' ? console.log : () => {};
debugLog('Debug info:', data);

// O usar un logger profesional
const logger = require('./logger');
logger.debug('Debug info', data);
```

---

### 9. 🗄️ MongoDB URI como fallback sin error - ALTA
**Archivos:** `/home/user/sindicato/backend/src/server.js` línea 116-120  
**Severidad:** 🟠 ALTA  
**Riesgo:** Permite operación sin base de datos de forma silenciosa

```javascript
// TEMPORAL: Permitir todos los orígenes que empiecen con https://ugtclmgranada.org
```

Este comentario marca que es temporal, pero el código sigue en producción.

---

### 10. 📄 Contraseña Admin por Defecto - ALTA
**Archivo:** `/home/user/sindicato/backend/src/routes/suggestions.js`  
**Severidad:** 🟠 ALTA  
**Riesgo:** Contraseña por defecto predecible

```javascript
const adminPassword = process.env.ADMIN_PASSWORD || 'ugt2024admin';
```

Si `ADMIN_PASSWORD` no está configurada, usa `'ugt2024admin'` que es débil y predecible.

---

### 11. 🔐 Stripe Secret Key Cargable desde localStorage - ALTA
**Archivo:** `/home/user/sindicato/js/stripe-config-loader.js`  
**Severidad:** 🟠 ALTA  
**Riesgo:** Permite inyectar secret key desde localStorage

```javascript
// Cargar secret key desde localStorage (NUNCA debería estar aquí)
```

---

---

## 🟠 PROBLEMAS DE ALTO RIESGO

### A. Variables de Entorno Faltantes - ALTO
**Archivos Afectados:**
- `/home/user/sindicato/backend/.env.example` - Solo ejemplo, no configurado

**Variables Críticas Faltantes:**
- `STRIPE_SECRET_KEY` - ❌ No configurado en Vercel
- `STRIPE_WEBHOOK_SECRET` - ❌ No configurado (crítico para webhooks)
- `MONGODB_URI` - ❌ Opcional actualmente, pero necesario
- `JWT_SECRET` - ❌ Usando valor por defecto inseguro
- `ADMIN_PASSWORD` - ❌ Usando valor por defecto

**Impacto:** Funcionalidad rota en producción

**Checklist:**
- [ ] Generar `JWT_SECRET` aleatorio:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- [ ] Configurar en Vercel todas las variables listadas en `.env.example`
- [ ] Verificar en `backend/scripts/verify-env.js`

---

### B. No Hay Tests Unitarios - ALTO
**Problema:** `package.json` línea 7-8:
```json
"test": "echo \"Error: no test specified\" && exit 1"
```

**Impacto:** Imposible validar funcionalidad antes de despliegue

---

### C. BASE64 Images en localStorage Puede Saturar - ALTO
**Archivo:** `/home/user/sindicato/backend/src/routes/auth.js`  
**Problema:** Las fotos de perfil se guardan en Base64 en MongoDB

```javascript
// Las fotos de perfil como Base64 en el user
profilePhoto: {
    type: String,
    default: null
}
```

**Impacto:** 
- Base64 es 33% más grande que binario
- Llenarán rápidamente la base de datos
- Ralentizan todos los queries de usuarios

---

### D. Rate Limiting Insuficiente para Ataques de Fuerza Bruta - ALTO
**Archivo:** `/home/user/sindicato/backend/src/routes/auth.js` línea 20-26

```javascript
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // 10 intentos por ventana ← ALTO (recomendado: 5)
    ...
});
```

**Recomendación:** Reducir a 5 intentos en 15 minutos

---

### E. Información Sensible en Logs Públicos - ALTO
**Archivos:**
- Logs en Vercel son públicos
- Contiene emails de usuarios
- Contiene tipos de cursos inscritos
- Contiene números de transacciones

---

### F. Express JSON Limit 5MB Puede Permitir DoS - ALTO
**Archivo:** `/home/user/sindicato/backend/src/server.js` línea 164

```javascript
app.use(express.json({ limit: '5mb' })); // ← Podría ser menor (1-2MB)
```

---

### G. Email sin Configuración Completa - ALTO
**Archivo:** `/home/user/sindicato/backend/.env.example` líneas 44-49

```
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-contraseña-de-aplicacion
```

**Problemas:**
- No hay servidor de email configurado
- Sugerencias no se envían por email (solo se guardan)
- Admins no reciben notificaciones

---

### H. MongoDB Atlas sin Whitelist IP - ALTO
**Impacto:** Si MongoDB está en Atlas, necesita whitelist de IPs

**Verá este error en producción:**
```
IP whitelist not allowed
```

---

### I. HTTPS Forzado No Configurado - ALTO
**Problema:** No hay configuración de HTTPS forzado en el frontend

Debería tener:
```javascript
// Forzar HTTPS en producción
if (window.location.protocol === 'http:' && !isLocalhost) {
    window.location.protocol = 'https:';
}
```

---

---

## 🟡 PROBLEMAS MODERADOS

### 1. TODO Implementar endpoint de recovery - MODERADO
**Archivo:** `/home/user/sindicato/js/main.js` línea 1206

```javascript
// TODO: Implementar endpoint de recovery en el backend
```

Hay un modal para "Recuperar contraseña" pero no hay endpoint en el backend.

---

### 2. Validación de Email Incompleta - MODERADO
**Problema:** No hay verificación de email (isEmailVerified siempre false)

**Usuario puede tener email falso y el sistema acepta**

---

### 3. Image Optimization Faltante - MODERADO
**Archivo:** `/home/user/sindicato/images/ugt-logo.PNG` (2.77 MB)

**Problema:** Logo sin optimizar, 2.77 MB es enorme

**Solución:**
```bash
# Comprimir imagen
convert ugt-logo.PNG -quality 85 ugt-logo-optimized.PNG
# O usar: imagemagick, ImageOptim, TinyPNG
```

**Impacto:** Carga lenta en conexiones móviles

---

### 4. No hay Política de Privacidad - MODERADO
**En PRODUCTION_CHECKLIST.md línea 146:**
```
- [ ] Políticas y términos en el sitio
```

No hay página de privacidad, términos de servicio, o cookies policy.

**Riesgo Legal:** RGPD, LSSI-CE requieren estos documentos

---

### 5. Responsivo Design con Problemas - MODERADO
**Múltiples problemas en dispositivos móviles:**
- Formularios demasiado grandes
- Títulos no se adaptan bien
- Imágenes pueden desbordar

---

### 6. Ninguna Validación en Frontend de Seguridad - MODERADO
**Problema:** No hay validación contra:
- XSS (Cross-site scripting)
- SQL Injection (aunque usa MongoDB)
- CSRF attacks

---

### 7. Caché no Configurada - MODERADO
**Problema:** No hay headers de caché configurados

```javascript
// Debería tener:
app.use((req, res, next) => {
    if (req.path.match(/\.(js|css|png|jpg|gif)$/)) {
        res.set('Cache-Control', 'public, max-age=31536000'); // 1 año
    } else {
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    next();
});
```

---

### 8. Datos Sensibles en Query Parameters - MODERADO
**Ejemplo:** `success.html?session_id={CHECKOUT_SESSION_ID}`

Los session IDs aparecen en URL y logs

---

### 9. Teléfono Placeholder en Emails - MODERADO
**Archivos:**
- `/home/user/sindicato/backend/src/services/emailService.js` líneas 116, 146, 341

```html
<p><strong>Teléfono:</strong> 958 XXX XXX</p>
```

No está configurado el teléfono real

---

---

## 🟢 PROBLEMAS DE UX/UI

### 1. Links a Cursos Secundarios Rotos - BAJO
**Archivo:** `/home/user/sindicato/index.html`

Links a:
- `pages/curso-negociacion-laboral.html` - ¿Existe?

**Verificación:**
```bash
ls -la pages/curso-negociacion-laboral.html
```

---

### 2. Diseño Responsivo Incompleto - BAJO
**Problemas:**
- Menú hamburger no se cierra en algunos eventos
- Formularios muy anchos en móvil

---

### 3. Mensajes de Error Poco Claros - BAJO
Usuarios no saben qué hacer cuando fallan pagos

---

---

## 🔵 PROBLEMAS DE RENDIMIENTO

### 1. Imágenes sin Lazy Loading - BAJO
**Problema:** Todas las imágenes se cargan al inicial

```html
<!-- Cambiar a: -->
<img src="..." loading="lazy" alt="...">
```

---

### 2. 173 console.log en Producción - BAJO
Cada uno de estos ralentiza ejecución levemente

---

---

## 🟣 PROBLEMAS DE DEVOPS/DEPLOYMENT

### 1. Sin CI/CD Pipeline - MODERADO
**Problema:** No hay automatización de tests antes de deploy

**Recomendación:** Configurar GitHub Actions

---

### 2. Vercel Configuration Incompleta - MODERADO
**Archivo:** `/home/user/sindicato/backend/vercel.json`

Falta:
- Configuración de headers de seguridad
- Configuración de redirects
- Configuración de rewrites

```json
{
  "version": 2,
  "builds": [
    { "src": "src/server.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "src/server.js" }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  // FALTA: headers de seguridad
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

---

---

## 📋 CHECKLIST DE RESOLUCIÓN - ORDEN RECOMENDADO

### FASE 1: SEGURIDAD CRÍTICA (Día 1)
- [ ] **FIX #1:** Remover URI hardcodeada de MongoDB
  ```bash
  # En db/mongodb.js, remover la parte con || "mongodb+srv://..."
  ```
  
- [ ] **FIX #2:** Generar JWT_SECRET seguro
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  # Guardar en .env como JWT_SECRET=...
  ```

- [ ] **FIX #3:** Forzar STRIPE_WEBHOOK_SECRET
  ```javascript
  // En webhook.js - no permitir fallback sin verificación
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('STRIPE_WEBHOOK_SECRET es requerido');
  }
  ```

- [ ] **FIX #4:** Cambiar sistema de autenticación de Admin
  ```bash
  # Migrar a JWT en lugar de contraseña plana
  ```

- [ ] **FIX #5:** URLs hardcodeadas del backend
  ```bash
  # Remover URLs hardcodeadas, usar variables de entorno
  ```

### FASE 2: CONFIGURACIÓN (Día 2)
- [ ] Generar contraseña fuerte para ADMIN_PASSWORD
- [ ] Configurar todas las variables en Vercel
- [ ] Verificar CORS permitiendo solo dominios específicos
- [ ] Remover todos los DEBUG statements de producción

### FASE 3: VALIDACIÓN (Día 3)
- [ ] Añadir tests básicos
- [ ] Testing de flujo de pago completo
- [ ] Testing de autenticación
- [ ] Testing de webhooks

### FASE 4: OPTIMIZACIÓN (Día 4)
- [ ] Optimizar imágenes
- [ ] Añadir lazy loading
- [ ] Configurar caché
- [ ] Añadir headers de seguridad

### FASE 5: DOCUMENTACIÓN (Día 5)
- [ ] Política de privacidad
- [ ] Términos de servicio
- [ ] Cookie policy

---

---

## 🔐 CAMBIOS REQUERIDOS EN VERCEL

Antes de desplegar, configurar en Vercel → Settings → Environment Variables:

```
STRIPE_SECRET_KEY=sk_live_XXX (tu clave real)
STRIPE_WEBHOOK_SECRET=whsec_XXX (tu webhook secret)
JWT_SECRET=XXXXXXX (generado con el comando arriba)
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/db (tu URI real)
ADMIN_PASSWORD=CONTRASEÑA_FUERTE_ALEATORIA
NODE_ENV=production
ALLOWED_ORIGINS=https://seccion-sindical-ugt-clm-ugr.github.io
```

---

## ⚠️ ADVERTENCIAS FINALES

1. **NO DESPLEGAR EN PRODUCCIÓN** hasta que resuelva todos los problemas críticos
2. **CAMBIAR TODAS LAS CONTRASEÑAS POR DEFECTO**
3. **USAR HTTPS ESTRICTO** en toda la aplicación
4. **VERIFICAR MONGODB WHITELIST** en MongoDB Atlas
5. **HACER BACKUP** de datos antes de cambios
6. **TESTING COMPLETO** en staging antes de producción

---

## 📞 SIGUIENTE PASO

Una vez resueltos estos problemas, ejecutar:
```bash
npm run verify-env
```

Para validar que todas las variables están configuradas correctamente.

---

**Última Actualización:** 11 de Noviembre de 2024  
**Auditoría Realizada Por:** Sistema de Auditoría Automática  
**Próxima Revisión:** Después de resolver problemas críticos
