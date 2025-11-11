# 📋 ACCIONES ESPECÍFICAS PARA RESOLVER CADA PROBLEMA

## 🔴 PROBLEMA #1: MongoDB URI Hardcodeada

**Archivo:** `/home/user/sindicato/db/mongodb.js`

### Cambio Requerido:
```javascript
// ❌ ANTES (INSEGURO)
this.uri = process.env.MONGODB_URI || "mongodb+srv://adminblabaele:<db_password>@ugt-production.tpwafoj.mongodb.net/?appName=UGT-Production";

// ✅ DESPUÉS (SEGURO)
this.uri = process.env.MONGODB_URI;
if (!this.uri) {
    throw new Error('❌ MONGODB_URI no configurada. Requierida para producción.');
}
```

### Verificación:
```bash
# Verificar que no hay URI hardcodeada
grep -n "mongodb+srv://" db/mongodb.js
# No debe retornar nada
```

---

## 🔴 PROBLEMA #2: JWT Secret Inseguro

**Archivo:** `/home/user/sindicato/backend/src/middleware/auth.js`

### Paso 1: Generar Secret Seguro
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Salida: 8a3f2c9d1e4b7a5f... (guardar este valor)
```

### Paso 2: Cambiar Código
```javascript
// ❌ ANTES (INSEGURO)
const JWT_SECRET = process.env.JWT_SECRET || 'ugt-clm-ugr-secret-key-change-in-production';

// ✅ DESPUÉS (SEGURO)
if (!process.env.JWT_SECRET) {
    throw new Error('❌ JWT_SECRET es REQUERIDA. Genera una con:\n' +
        'node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
}
const JWT_SECRET = process.env.JWT_SECRET;
```

### Paso 3: Configurar en .env Local (Testing)
```bash
echo "JWT_SECRET=8a3f2c9d1e4b7a5f..." >> backend/.env
```

### Paso 4: Configurar en Vercel
1. Ir a: https://vercel.com/dashboard
2. Seleccionar proyecto
3. Settings → Environment Variables
4. Añadir: `JWT_SECRET` = `8a3f2c9d1e4b7a5f...`
5. Redeploy

---

## 🔴 PROBLEMA #3: Webhook Stripe Sin Validación

**Archivo:** `/home/user/sindicato/backend/src/routes/webhook.js`

### Cambio Requerido:
```javascript
// ❌ ANTES (INSEGURO)
if (process.env.STRIPE_WEBHOOK_SECRET) {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
} else {
    console.warn('⚠️ Webhook sin verificar');
    event = JSON.parse(req.body.toString());
}

// ✅ DESPUÉS (SEGURO)
if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('❌ ERROR CRÍTICO: STRIPE_WEBHOOK_SECRET no configurado');
    throw new Error('STRIPE_WEBHOOK_SECRET es REQUERIDA');
}

try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
} catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
}
```

### Obtener Webhook Secret en Stripe:
1. Ir a: https://dashboard.stripe.com/webhooks
2. Asegurarse de estar en modo "Test"
3. Buscar endpoint creado previamente
4. Copiar "Signing secret" (empieza con `whsec_`)
5. Configurar en Vercel con clave `STRIPE_WEBHOOK_SECRET`

---

## 🔴 PROBLEMA #4: Clave Stripe Pública Hardcodeada

**Archivo:** `/home/user/sindicato/js/stripe-config.js`

### Problema:
```javascript
// ❌ INSEGURO - Clave hardcodeada
publishableKey: 'pk_test_5KBH6AipFVudtyqsznP9vJXo00ku526ehA',
```

### Solución:
Esta clave es de prueba. Al cambiar a producción, será diferente.

**Pasos:**

1. **Para Pruebas:**
   ```javascript
   publishableKey: process.env.REACT_APP_STRIPE_PUBLIC_KEY || 'pk_test_...',
   ```
   (Nota: No es un patrón ideal para frontend)

2. **Mejor Solución - Cargar desde backend:**
   ```javascript
   // En el HTML head, cargar la configuración del backend
   <script>
       fetch('/api/config')
           .then(r => r.json())
           .then(config => {
               window.STRIPE_CONFIG = config;
           });
   </script>
   ```

3. **En Backend - Endpoint nuevo:**
   ```javascript
   app.get('/api/config', (req, res) => {
       res.json({
           stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY
       });
   });
   ```

---

## 🔴 PROBLEMA #5: URLs Backend Hardcodeadas

**Archivos:**
- `/home/user/sindicato/js/backend-config.js` línea 19
- `/home/user/sindicato/js/auth-api.js` línea 15

### Cambio #1 - backend-config.js
```javascript
// ❌ ANTES
production: 'https://sindicato-mu.vercel.app',

// ✅ DESPUÉS
get apiUrl() {
    // 1. Intentar desde localStorage (configurable manualmente)
    const manual = localStorage.getItem('BACKEND_API_URL');
    if (manual) return manual;
    
    // 2. Usar variable de entorno inyectada en HTML
    if (window.BACKEND_URL) return window.BACKEND_URL;
    
    // 3. Auto-detectar según entorno
    if (isLocal) return 'http://localhost:3000';
    
    // 4. En producción, lanzar error si no está configurado
    throw new Error('Backend URL no configurada. Configura BACKEND_URL en window.');
}
```

### Cambio #2 - auth-api.js
```javascript
// ❌ ANTES
const API_URL = () => getBackendConfig().API_URL;

// ✅ DESPUÉS
const API_URL = () => {
    if (!window.BACKEND_CONFIG?.apiUrl) {
        throw new Error('Backend no configurado');
    }
    return window.BACKEND_CONFIG.apiUrl;
};
```

### Inyectar URL en HTML
En el HTML head, antes de cargar los scripts de JS:
```html
<script>
    window.BACKEND_URL = 'https://sindicato-abc123.vercel.app';
</script>
<script src="js/backend-config.js"></script>
```

---

## 🔴 PROBLEMA #6: Admin Authentication Sin Hash

**Archivos:**
- `/home/user/sindicato/backend/src/routes/suggestions.js`
- `/home/user/sindicato/admin-suggestions.html`

### Solución Completa - Migrar a JWT

**PASO 1: Backend - Crear endpoint de login para admin**

```javascript
// En backend/src/routes/suggestions.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Endpoint: POST /api/admin/login
router.post('/admin/login', async (req, res) => {
    try {
        const { password } = req.body;
        
        // Validar contraseña
        if (password !== process.env.ADMIN_PASSWORD) {
            return res.status(401).json({
                success: false,
                error: 'Contraseña incorrecta'
            });
        }
        
        // Generar JWT token
        const token = jwt.sign(
            { admin: true, role: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        
        res.json({
            success: true,
            token,
            expiresIn: 3600
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error en login'
        });
    }
});

// Middleware para verificar admin
const adminAuth = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ error: 'Token requerido' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded.admin) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }
        req.admin = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
};

// Usar el middleware en rutas admin
router.get('/suggestions', adminAuth, async (req, res) => {
    // ... resto del código
});
```

**PASO 2: Frontend - Cambiar login**

```javascript
// ❌ ANTES (INSEGURO)
authToken = password;
'Authorization': `Bearer ${password}`

// ✅ DESPUÉS (SEGURO)
const response = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
});

const { token } = await response.json();
localStorage.setItem('adminToken', token);
localStorage.setItem('adminTokenExpiry', Date.now() + 3600000);

// En requests posteriores:
'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
```

**PASO 3: Generar contraseña fuerte**

```bash
# Opción 1: Usar openssl
openssl rand -base64 32

# Opción 2: Usar node
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Copiar resultado a ADMIN_PASSWORD en Vercel
```

---

## 🔴 PROBLEMA #7: CORS Temporal Sin Restricción

**Archivo:** `/home/user/sindicato/backend/src/server.js` línea 116

### Cambio Requerido:
```javascript
// ❌ ANTES (INSEGURO)
// TEMPORAL: Permitir todos los orígenes que empiecen con https://ugtclmgranada.org
if (origin && origin.startsWith('https://ugtclmgranada.org')) {
    return callback(null, true);
}

// ✅ DESPUÉS (SEGURO)
// Usar lista explícita de dominios permitidos
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);

if (allowedOrigins.length === 0) {
    console.warn('⚠️ ADVERTENCIA: ALLOWED_ORIGINS vacío, usando defaults seguros');
    allowedOrigins.push('https://seccion-sindical-ugt-clm-ugr.github.io');
}

if (!origin || !allowedOrigins.includes(origin)) {
    return callback(new Error('CORS no permitido'));
}

return callback(null, true);
```

### Configurar en Vercel:
```
ALLOWED_ORIGINS=https://seccion-sindical-ugt-clm-ugr.github.io,https://ugtclmgranada.org
```

---

## 🔴 PROBLEMA #8: Debug Statements

**Ubicaciones:**
- `/home/user/sindicato/pages/curso-ia.html` (7 logs)
- `/home/user/sindicato/backend/src/routes/stripe.js` (4 logs)
- Total: 173+ en todo el backend

### Solución Sistemática:

**OPCIÓN 1: Usar un logger profesional**

```bash
npm install winston
```

```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

// Usar en lugar de console.log
logger.debug('Debug info', data);  // Solo si LOG_LEVEL=debug
logger.info('Info message');        // Información normal
logger.error('Error message', err); // Solo errores
```

**OPCIÓN 2: Buscar y remover manualmente**

```bash
# Encontrar todos los console.log
grep -n "console\\.log\|console\\.warn\|console\\.error" backend/src/**/*.js

# Reemplazar en VS Code:
# Find: console\.(log|warn|error)\(
# Replace: // [REMOVED LOG]
```

**OPCIÓN 3: Condicionalmente en desarrollo**

```javascript
// Al inicio de cada archivo
const isDevelopment = process.env.NODE_ENV === 'development';
const debug = (...args) => isDevelopment && console.log(...args);

// Usar:
debug('Debug info', data);  // Solo se ejecuta en desarrollo
```

### Para Remover Rápidamente:
```bash
# Crear script de búsqueda
find backend/src -name "*.js" -type f | xargs grep -l "console.log" | head -20

# Editar cada archivo y comentar o remover los console.log
```

---

## 🔴 PROBLEMA #9: Contraseña Admin por Defecto

**Archivo:** `/home/user/sindicato/backend/src/routes/suggestions.js`

### Cambio Requerido:
```javascript
// ❌ ANTES
const adminPassword = process.env.ADMIN_PASSWORD || 'ugt2024admin';

// ✅ DESPUÉS
if (!process.env.ADMIN_PASSWORD) {
    throw new Error('❌ ADMIN_PASSWORD es REQUERIDA. Genera una con:\n' +
        'openssl rand -base64 32');
}
const adminPassword = process.env.ADMIN_PASSWORD;
```

### Generar Contraseña Fuerte:
```bash
# Opción 1
openssl rand -base64 32

# Opción 2
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Copiar a Vercel Environment Variables
```

---

## 🔴 PROBLEMA #10 & 11: Variables No Configuradas

### Checklist de Variables Requeridas:

**En Vercel → Settings → Environment Variables, configurar:**

```
✓ STRIPE_SECRET_KEY=sk_live_XXXX...
✓ STRIPE_PUBLISHABLE_KEY=pk_live_XXXX...
✓ STRIPE_WEBHOOK_SECRET=whsec_XXXX...
✓ JWT_SECRET=XXXX... (generado con comando anterior)
✓ ADMIN_PASSWORD=XXXX... (generado con openssl)
✓ MONGODB_URI=mongodb+srv://usuario:pass@cluster...
✓ ALLOWED_ORIGINS=https://dominio.com
✓ NODE_ENV=production
✓ SUCCESS_URL=https://dominio.com/success.html
✓ CANCEL_URL=https://dominio.com/cancel.html
```

### Script de Verificación:
```bash
cd backend
npm run verify-env
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] #1: Remover URI MongoDB hardcodeada
- [ ] #2: Implementar JWT_SECRET obligatorio
- [ ] #3: Forzar STRIPE_WEBHOOK_SECRET
- [ ] #4: Configurar Stripe public key dinámicamente
- [ ] #5: Remover URLs hardcodeadas del backend
- [ ] #6: Migrar admin auth a JWT
- [ ] #7: Configurar CORS restrictivo
- [ ] #8: Remover/Condicionalizar debug statements (173 logs)
- [ ] #9: Remover contraseña admin por defecto
- [ ] #10: Configurar variables en Vercel
- [ ] #11: Verificar con npm run verify-env

---

## 🧪 Testing Post-Cambios

```bash
# 1. Verificar variables de entorno
npm run verify-env

# 2. Test local
cd backend
npm run dev

# 3. Verificar health endpoint
curl http://localhost:3000/health

# 4. Test de pago (usar tarjeta test)
curl -X POST http://localhost:3000/api/create-affiliation-session \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","phone":"600000000","department":"Test"}'
```

---

## 📞 Ayuda Adicional

- Documentación Stripe: https://stripe.com/docs
- Node.js Crypto: https://nodejs.org/api/crypto.html
- JWT: https://jwt.io
- Vercel Env Vars: https://vercel.com/docs/environment-variables

