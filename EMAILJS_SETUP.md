# 📧 Configuración de EmailJS para Formulario de Contacto

## 🎯 **Objetivo**
Hacer que el formulario de contacto del sitio web UGT-CLM Granada envíe emails reales a `ugtclmgranada@gmail.com`

## 🚀 **Pasos para Configurar EmailJS**

### 1. **Crear Cuenta EmailJS (Gratis)**
- Visita: https://www.emailjs.com/
- Regístrate con tu email: `ugtclmgranada@gmail.com`
- Es gratis para hasta 200 emails/mes

### 2. **Crear Servicio de Email**
- En el dashboard de EmailJS, haz clic en "Email Services"
- Click en "Add New Service"
- Selecciona "Gmail" (u otro servicio que prefieras)
- Conecta tu cuenta `ugtclmgranada@gmail.com`
- **Anota el Service ID** (ej: `service_gmail123`)

### 3. **Crear Template (Plantilla de Email)**
- Haz clic en "Email Templates"
- Click en "Create New Template"
- Configura los siguientes parámetros:

#### **Template ID:** `template_contact_form`

#### **Asunto:** `Nuevo mensaje de {{from_name}} - UGT-CLM Granada`

#### **Contenido del Email:**
```
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Nuevo Mensaje - UGT-CLM Granada</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header UGT -->
        <div style="background: #E30613; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">UGT-CLM Granada</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px;">Sección Sindical</p>
        </div>

        <!-- Contenido del Mensaje -->
        <div style="background: #f9f9f9; padding: 30px; border: 1px solid #ddd;">
            <h2 style="color: #E30613; margin-top: 0;">Nuevo Mensaje de Contacto</h2>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>📝 Nombre:</strong> {{from_name}}</p>
                <p><strong>📧 Email:</strong> {{from_email}}</p>
                <p><strong>📋 Asunto:</strong> {{subject}}</p>
                <p><strong>💬 Mensaje:</strong></p>
                <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 10px 0;">
                    {{message}}
                </div>
            </div>

            <div style="background: #e8f4f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>📅 Fecha y hora:</strong> {{timestamp}}</p>
                <p style="margin: 5px 0;"><strong>🌐 Sitio web:</strong> {{website}}</p>
            </div>
        </div>

        <!-- Footer -->
        <div style="background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="margin: 0;">Sección Sindical UGT-CLM Granada</p>
            <p style="margin: 5px 0; font-size: 12px;">Centro de Lenguas Modernas, Placeta Hospicio Viejo s/n</p>
            <p style="margin: 5px 0; font-size: 12px;">Viernes 9:00 - 21:00</p>
        </div>
    </div>
</body>
</html>
```

#### **Variables del Template:**
- `{{from_name}}` - Nombre del remitente
- `{{from_email}}` - Email del remitente
- `{{subject}}` - Asunto del mensaje
- `{{message}}` - Contenido del mensaje
- `{{to_email}}` - Tu email (ugtclmgranada@gmail.com)
- `{{reply_to}}` - Email para responder
- `{{website}}` - Nombre del sitio web
- `{{timestamp}}` - Fecha y hora

### 4. **Obtener Public Key**
- En EmailJS, ve a "Account" → "API Keys"
- **Anota tu Public Key** (ej: `public_key_abc123`)

## 🔧 **Configurar el Código**

### Reemplaza estos valores en `js/main.js`:

```javascript
// Línea 732 - Reemplaza con tu Public Key
emailjs.init("TU_PUBLIC_KEY_AQUI");

// Línea 751 - Reemplaza con tu Service ID
'YOUR_SERVICE_ID',

// Línea 752 - Reemplaza con tu Template ID
'YOUR_TEMPLATE_ID',
```

### Ejemplo con valores reales:
```javascript
emailjs.init("public_key_abc123");

await emailjs.send(
    "service_gmail123",
    "template_contact_form",
    templateParams
);
```

## 📧 **Cómo Funcionará**

### Cuando un usuario envíe un mensaje:
1. ✅ **Validación** de todos los campos
2. 📧 **Email real** enviado a `ugtclmgranada@gmail.com`
3. 📊 **Registro** en localStorage para estadísticas
4. ✅ **Confirmación** para el usuario
5. 🔄 **Reply-to** configurado para responder fácilmente

### El email recibido incluirá:
- 📝 Nombre y email del remitente
- 📋 Asunto y mensaje completo
- 📅 Fecha y hora de envío
- 🎨 Diseño profesional UGT
- 🔄 Botón de "Responder" directo

## 🎯 **Ventajas de EmailJS**

✅ **Gratis** hasta 200 emails/mes
✅ **Sin backend** necesario
✅ **Seguro** y confiable
✅ **Plantillas HTML** personalizadas
✅ **Dashboard** para ver estadísticas
✅ **Reply-to** automático

## ⚠️ **Importante**

- Reemplaza los valores `YOUR_*` con tus credenciales reales
- Guarda tus claves de API de forma segura
- El plan gratuito es suficiente para uso sindical normal
- Los emails llegarán instantáneamente a tu Gmail

## 🚀 **Para Empezar**

1. **Crea cuenta** en EmailJS
2. **Configura servicio** Gmail
3. **Crea template** con el contenido proporcionado
4. **Copia tus credenciales** al código
5. **¡Listo!** Los formularios enviarán emails reales

---

**¿Necesitas ayuda con la configuración?** Contáctame y puedo ayudarte paso a paso.