# 📦 Configuración de MongoDB Atlas para Sistema de Sugerencias

Este documento explica cómo configurar MongoDB Atlas (base de datos gratuita) para el sistema de sugerencias.

## 🎯 Resumen

- **Tiempo estimado:** 10 minutos
- **Costo:** Gratuito (plan FREE)
- **Necesario para:** Sistema de sugerencias

---

## 📋 PASO 1: Crear Cuenta en MongoDB Atlas

### 1.1 Regist rarse

1. **Ve a:** https://www.mongodb.com/cloud/atlas/register
2. **Rellena el formulario:**
   - Email
   - Contraseña
   - Nombre
3. **Click en:** "Create your Atlas account"
4. **Verifica tu email** (revisa bandeja de entrada)

### 1.2 Configuración Inicial

Después de verificar el email:

1. **¿Qué describes tu experiencia?** → Selecciona cualquier opción
2. **¿Qué quieres hacer?** → "Learn MongoDB"
3. **¿Qué lenguaje prefieres?** → JavaScript/Node.js
4. **Click en:** "Finish"

---

## 📋 PASO 2: Crear Cluster Gratuito

### 2.1 Crear Nuevo Cluster

1. Verás la pantalla "Create a deployment"
2. **Selecciona:** **"M0 FREE"** (plan gratuito)
3. **Provider:** AWS o Google Cloud (cualquiera está bien)
4. **Region:** Selecciona la más cercana (ej: Frankfurt, eu-west-1)
5. **Cluster Name:** `UGT-Cluster` (o el nombre que prefieras)
6. **Click en:** **"Create Deployment"**

⏱️ **Espera 1-3 minutos** mientras se crea el cluster.

### 2.2 Crear Usuario de Base de Datos

Aparecerá un modal "Security Quickstart":

1. **Authentication Method:** Username and Password
2. **Username:** `ugt_admin` (o el que prefieras)
3. **Password:** Click en "Autogenerate Secure Password" → **COPIA Y GUARDA LA CONTRASEÑA**
4. **Click en:** "Create Database User"

### 2.3 Configurar IP Whitelist

En la misma pantalla:

1. **¿Dónde te conectarás?** → "My Local Environment"
2. **IP Address:** Escribe `0.0.0.0/0` (permitir desde cualquier IP)
3. **Description:** `Allow Vercel`
4. **Click en:** "Add Entry"
5. **Click en:** "Finish and Close"

---

## 📋 PASO 3: Obtener Connection String

### 3.1 Ir a Connect

1. En el dashboard, verás tu cluster
2. **Click en el botón "Connect"**

### 3.2 Seleccionar Método

1. **Click en:** "Drivers"
2. **Driver:** Node.js
3. **Version:** 5.5 or later

### 3.3 Copiar Connection String

Verás algo como:

```
mongodb+srv://ugt_admin:<password>@ugt-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

**Copia esta URL** y:
1. **Reemplaza `<password>`** con la contraseña que copiaste en el paso 2.2
2. **Añade el nombre de la base de datos** después de `.net/`:

Resultado final:
```
mongodb+srv://ugt_admin:TU_PASSWORD@ugt-cluster.xxxxx.mongodb.net/ugt_clm_ugr?retryWrites=true&w=majority
```

---

## 📋 PASO 4: Añadir a Vercel

### 4.1 Ir a Variables de Entorno

1. **Ve a:** https://vercel.com/dashboard
2. **Click en tu proyecto:** `sindicato`
3. **Click en:** "Settings"
4. **Click en:** "Environment Variables"

### 4.2 Añadir Variables

**Variable 1: MONGODB_URI**

```
Key: MONGODB_URI
Value: mongodb+srv://ugt_admin:TU_PASSWORD@ugt-cluster.xxxxx.mongodb.net/ugt_clm_ugr?retryWrites=true&w=majority
Environments: ✅ Production ✅ Preview ✅ Development
```

**Variable 2: ADMIN_PASSWORD**

```
Key: ADMIN_PASSWORD
Value: [ELIGE_UNA_CONTRASEÑA_SEGURA]
Environments: ✅ Production ✅ Preview ✅ Development
```

Esta contraseña es para acceder al panel de admin de sugerencias en:
`https://seccion-sindical-ugt-clm-ugr.github.io/sindicato/admin-suggestions.html`

### 4.3 Redesplegar

1. **Ve a:** "Deployments"
2. **Click en los 3 puntos (⋯)** del último deployment
3. **Click en:** "Redeploy"
4. **Espera 2-3 minutos**

---

## ✅ VERIFICAR QUE FUNCIONA

### Opción 1: Ver Logs de Vercel

1. **Ve a:** Tu proyecto en Vercel → "Deployments" → Último deployment
2. **Click en "Logs"** o "Runtime Logs"
3. **Deberías ver:**
   ```
   ✅ MongoDB conectado correctamente
   ```

### Opción 2: Probar el Backend

1. **Abre:** `https://sindicato-mu.vercel.app`
2. **Deberías ver:**
   ```json
   {
     "database": "conectada"
   }
   ```

### Opción 3: Enviar Sugerencia de Prueba

1. **Ve a:** https://seccion-sindical-ugt-clm-ugr.github.io/sindicato/
2. **Click en el botón flotante de la bombilla** (esquina inferior derecha)
3. **Rellena el formulario y envía**
4. **Deberías ver:** "✅ Sugerencia enviada correctamente"

### Opción 4: Ver en Panel de Admin

1. **Ve a:** https://seccion-sindical-ugt-clm-ugr.github.io/sindicato/admin-suggestions.html
2. **Introduce la contraseña** que configuraste en `ADMIN_PASSWORD`
3. **Deberías ver** las sugerencias enviadas

---

## 🔍 TROUBLESHOOTING

### Error: "MongoServerError: Authentication failed"

**Causa:** Usuario o contraseña incorrectos

**Solución:**
1. Ve a MongoDB Atlas → Database Access
2. Verifica el usuario
3. Reset password si es necesario
4. Actualiza `MONGODB_URI` en Vercel

### Error: "MongoServerError: IP not whitelisted"

**Causa:** IP de Vercel no permitida

**Solución:**
1. Ve a MongoDB Atlas → Network Access
2. Click "Add IP Address"
3. Añade `0.0.0.0/0` (permitir todas)
4. Click "Confirm"

### Error: "Base de datos no disponible"

**Causa:** Variable `MONGODB_URI` no configurada en Vercel

**Solución:**
1. Ve a Vercel → Settings → Environment Variables
2. Verifica que existe `MONGODB_URI`
3. Redeploy

### No veo sugerencias en el panel de admin

**Causa:** Contraseña incorrecta o no hay sugerencias

**Solución:**
1. Verifica la contraseña de `ADMIN_PASSWORD`
2. Envía una sugerencia de prueba primero
3. Revisa los logs del navegador (F12 → Console)

---

## 📊 MONITOREAR SUGERENCIAS EN MONGODB

### Ver datos directamente en MongoDB Atlas

1. **Ve a:** https://cloud.mongodb.com
2. **Click en:** "Database" (menú lateral)
3. **Click en:** "Browse Collections"
4. **Selecciona:** Base de datos `ugt_clm_ugr`
5. **Collection:** `suggestions`
6. **Verás todas las sugerencias** guardadas

---

## 🎯 RESUMEN

✅ **Cuenta creada** en MongoDB Atlas
✅ **Cluster gratuito** configurado
✅ **Usuario de base de datos** creado
✅ **IP whitelist** configurada
✅ **Connection string** obtenida
✅ **Variables de entorno** añadidas a Vercel
✅ **Backend redeployado**
✅ **Sistema probado**

---

## 📞 SOPORTE

Si tienes problemas:
1. Revisa los logs de Vercel
2. Revisa la consola del navegador (F12)
3. Verifica que MongoDB Atlas esté accesible
4. Contacta con el desarrollador

---

**¡Listo!** El sistema de sugerencias está completamente configurado y funcionando. 🎉
