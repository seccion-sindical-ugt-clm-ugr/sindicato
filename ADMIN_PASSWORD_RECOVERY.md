# 🔐 Recuperación de Contraseña de Admin

## El Problema

No puedes acceder al panel de admin en `https://ugtclmgranada.org/admin.html` porque no recuerdas la contraseña.

## Cómo Funciona el Sistema

El panel de admin (`admin.html`) usa un sistema simple:
- **Solo requiere UNA contraseña** (no email)
- Esta contraseña se compara con la variable de entorno `ADMIN_PASSWORD` en Vercel
- Si coincide, obtienes acceso al panel durante 8 horas

## Solución: Configurar Nueva Contraseña

### Opción 1: Acceder a Vercel (Recomendado)

Si tienes acceso al proyecto en Vercel:

#### Paso 1: Generar Nueva Contraseña

```bash
node generate-admin-password.js
```

Esto te dará 2 contraseñas:
- **Contraseña larga** (más segura): `MIUSUo9g4MkDM4KWTPcDfRfWD17pAvcNHGREN/CRnE4=`
- **Contraseña corta** (más fácil): `e70cf4a710d1fbf54e89b258b5d1ef13`

**⚠️ GUARDA LA CONTRASEÑA EN UN LUGAR SEGURO!**

#### Paso 2: Configurar en Vercel

1. Ve a tu proyecto en Vercel: https://vercel.com/
2. Click en tu proyecto `sindicato`
3. Ve a **Settings** → **Environment Variables**
4. Busca `ADMIN_PASSWORD`:

   **Si EXISTE:**
   - Click en **Edit** (icono de lápiz)
   - Borra el valor antiguo
   - Pega la nueva contraseña
   - Click **Save**

   **Si NO EXISTE:**
   - Click en **Add New**
   - Name: `ADMIN_PASSWORD`
   - Value: [pega tu contraseña]
   - Environments: Selecciona **Production**, **Preview**, **Development**
   - Click **Save**

#### Paso 3: Redeploy

**IMPORTANTE**: Los cambios en variables de entorno NO se aplican hasta hacer un nuevo deploy.

1. Ve a la pestaña **Deployments**
2. Encuentra el último deployment (el de arriba)
3. Click en los **tres puntos** (`⋯`) a la derecha
4. Click **Redeploy**
5. Confirma haciendo click en **Redeploy** nuevamente
6. Espera 1-2 minutos mientras se despliega

#### Paso 4: Probar

1. Ve a: https://ugtclmgranada.org/admin.html
2. Ingresa la nueva contraseña
3. Click **Iniciar Sesión**
4. ✅ Deberías ver el panel de admin

---

### Opción 2: Sin Acceso a Vercel

Si NO tienes acceso a Vercel, necesitas contactar con quien tiene acceso al proyecto en Vercel.

**Personas que pueden tener acceso:**
- El dueño de la cuenta de Vercel donde está desplegado el proyecto
- Colaboradores del proyecto en Vercel
- Administradores de GitHub que hayan conectado Vercel

**Qué pedirles:**
1. Que generen una nueva contraseña usando `node generate-admin-password.js`
2. Que la configuren en Vercel como `ADMIN_PASSWORD`
3. Que hagan un redeploy
4. Que te compartan la nueva contraseña de forma segura

---

### Opción 3: Ver la Contraseña Actual (Solo con acceso a Vercel)

Si prefieres ver la contraseña actual en lugar de crear una nueva:

1. Ve a Vercel → Tu Proyecto → **Settings** → **Environment Variables**
2. Busca `ADMIN_PASSWORD`
3. **PROBLEMA**: Vercel oculta los valores por seguridad
4. **Solución**: No se puede ver, debes crear una nueva (Opción 1)

---

## Scripts Incluidos

### `generate-admin-password.js`
Genera una contraseña segura aleatoria para el panel de admin.

**Uso:**
```bash
node generate-admin-password.js
```

**Output:**
- Contraseña larga (base64) - Más segura
- Contraseña corta (hex) - Más fácil de escribir
- Instrucciones paso a paso

### `backend/scripts/admin-recovery.js`
Este script es para el sistema de usuarios con email/password (NO para admin.html).

Solo úsalo si necesitas resetear la contraseña de un usuario regular del sistema.

---

## Troubleshooting

### ❌ "Contraseña incorrecta"

**Causas posibles:**
1. La contraseña que ingresaste no coincide con `ADMIN_PASSWORD` en Vercel
2. Olvidaste hacer redeploy después de cambiar la variable
3. El redeploy aún está en progreso

**Solución:**
- Verifica que hiciste redeploy
- Espera 2-3 minutos para que el deploy termine
- Intenta de nuevo
- Si persiste, genera y configura una nueva contraseña

### ❌ "Error del servidor"

**Causa:** El backend no puede conectarse o hay un error de configuración

**Solución:**
1. Verifica que el backend esté desplegado: https://sindicato-mu.vercel.app/api/health
2. Revisa los logs en Vercel → Deployments → [último deploy] → Logs
3. Verifica que `JWT_SECRET` también esté configurado en Vercel

### ❌ No puedo acceder a Vercel

**Solución:**
1. Verifica tu email de acceso a Vercel
2. Resetea tu contraseña de Vercel
3. Contacta al administrador del proyecto para que te agregue como colaborador

---

## Seguridad

### ✅ Buenas Prácticas

1. **Nunca compartas** la contraseña de admin públicamente
2. **Usa contraseñas largas** (las generadas automáticamente son ideales)
3. **Cambia la contraseña** si sospechas que fue comprometida
4. **Guarda la contraseña** en un gestor de contraseñas seguro
5. **No la escribas** en archivos que se suban a Git

### 🔒 Variables de Entorno en Vercel

- Las variables están **encriptadas** en Vercel
- **No se pueden ver** después de guardarlas (solo editar)
- **No se sincronizan** con Git (están solo en Vercel)
- Se aplican **solo después de redeploy**

---

## Contacto

Si necesitas ayuda adicional:
- Revisa la documentación en `/backend/README.md`
- Contacta al administrador del proyecto
