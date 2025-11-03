# Configuración de Backend para Stripe - Guía Completa

## ⚠️ IMPORTANTE: SEGURIDAD PRIMERO

**NUNCA** incluyas tu clave secreta de Stripe (`sk_test_...` o `sk_live_...`) en código frontend (HTML, JavaScript cliente).

**Las claves secretas SOLO deben estar en:**
- Servidores backend
- Variables de entorno
- Servicios de gestión de secretos

---

## 📋 Estado Actual del Proyecto

### ✅ Lo que ya funciona (Frontend)
- ✅ Diseño y estructura del sitio web
- ✅ Formularios de afiliación y cursos
- ✅ Validación de datos en frontend
- ✅ Integración de Stripe.js (SDK de cliente)
- ✅ Clave pública de Stripe configurada

### ❌ Lo que falta (Backend)
- ❌ Servidor backend para procesar pagos
- ❌ API endpoints para crear sesiones de Stripe
- ❌ Almacenamiento seguro de la clave secreta
- ❌ Base de datos para afiliados y cursos
- ❌ Webhooks de Stripe para confirmaciones
- ❌ Sistema de emails para notificaciones

---

## 🏗️ Arquitectura Necesaria

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│   FRONTEND      │         │    BACKEND       │         │   STRIPE    │
│  (GitHub Pages) │         │   (Tu Servidor)  │         │     API     │
└────────┬────────┘         └────────┬─────────┘         └──────┬──────┘
         │                           │                           │
         │  1. Usuario completa      │                           │
         │     formulario            │                           │
         ├──────────────────────────>│                           │
         │                           │                           │
         │                           │  2. Crea sesión de pago   │
         │                           ├──────────────────────────>│
         │                           │     (con clave secreta)   │
         │                           │                           │
         │                           │  3. Session ID            │
         │  4. Devuelve Session ID   │<──────────────────────────┤
         │<──────────────────────────┤                           │
         │                           │                           │
         │  5. Redirige a Checkout   │                           │
         ├───────────────────────────────────────────────────────>│
         │                           │                           │
         │  6. Usuario paga          │                           │
         │<──────────────────────────────────────────────────────>│
         │                           │                           │
         │                           │  7. Webhook: pago exitoso │
         │                           │<──────────────────────────┤
         │                           │                           │
         │                           │  8. Guarda afiliación     │
         │                           │     en base de datos      │
         │                           │                           │
         │  9. Redirige a success    │                           │
         │<──────────────────────────┤                           │
         │                           │                           │
```

---

## 🚀 Opciones de Implementación

### Opción 1: Node.js + Express (Recomendado)

**Ventajas:**
- JavaScript en frontend y backend (mismo lenguaje)
- Excelente soporte de Stripe
- Fácil despliegue en Vercel, Railway, Render

**Pasos:**

1. **Instalar dependencias:**
```bash
npm init -y
npm install express stripe dotenv cors body-parser
```

2. **Crear servidor (`server.js`):**
```javascript
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors({
    origin: 'https://seccion-sindical-ugt-clm-ugr.github.io'
}));

// Endpoint para afiliación
app.post('/api/create-affiliation-session', async (req, res) => {
    try {
        const { name, email, phone, department } = req.body;

        // Validar datos
        if (!name || !email || !phone || !department) {
            return res.status(400).json({ error: 'Faltan datos obligatorios' });
        }

        // Crear sesión de Stripe
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: 'Afiliación Anual UGT-CLM-UGR',
                        description: 'Cuota anual de afiliación'
                    },
                    unit_amount: 1500 // 15.00 EUR en centavos
                },
                quantity: 1
            }],
            mode: 'payment',
            success_url: 'https://seccion-sindical-ugt-clm-ugr.github.io/sindicato/success.html?session_id={CHECKOUT_SESSION_ID}',
            cancel_url: 'https://seccion-sindical-ugt-clm-ugr.github.io/sindicato/cancel.html',
            customer_email: email,
            metadata: {
                type: 'affiliation',
                name: name,
                phone: phone,
                department: department
            }
        });

        res.json({ id: session.id });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para cursos
app.post('/api/create-course-session', async (req, res) => {
    try {
        const { name, email, phone, department, courseType, isMember } = req.body;

        const price = isMember ? 1500 : 16000; // 15€ o 160€

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: `Curso Inteligencia Artificial - ${isMember ? 'Afiliado' : 'Externo'}`,
                        description: 'Acceso completo al curso de IA'
                    },
                    unit_amount: price
                },
                quantity: 1
            }],
            mode: 'payment',
            success_url: `https://seccion-sindical-ugt-clm-ugr.github.io/sindicato/success.html?session_id={CHECKOUT_SESSION_ID}&course=${courseType}`,
            cancel_url: 'https://seccion-sindical-ugt-clm-ugr.github.io/sindicato/cancel.html',
            customer_email: email,
            metadata: {
                type: 'course',
                courseType: courseType,
                isMember: isMember.toString(),
                name: name,
                phone: phone,
                department: department
            }
        });

        res.json({ id: session.id });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Webhook para eventos de Stripe
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Manejar eventos
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;

            // Aquí guardarías los datos en tu base de datos
            console.log('Pago completado:', session);

            // Enviar email de confirmación
            // await sendConfirmationEmail(session);

            break;

        case 'payment_intent.payment_failed':
            console.log('Pago fallido:', event.data.object);
            break;
    }

    res.json({received: true});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en puerto ${PORT}`);
});
```

3. **Crear archivo `.env`:**
```bash
STRIPE_SECRET_KEY=sk_test_TU_CLAVE_SECRETA_AQUI
STRIPE_WEBHOOK_SECRET=whsec_TU_WEBHOOK_SECRET
PORT=3000
```

4. **Modificar frontend (`js/stripe-config.js`):**
```javascript
// Reemplazar las funciones deshabilitadas con llamadas a tu API

async function createAffiliationCheckout(userData) {
    const response = await fetch('https://tu-servidor.com/api/create-affiliation-session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
    });

    if (!response.ok) {
        throw new Error('Error al crear sesión de pago');
    }

    return await response.json();
}

async function createCourseCheckout(courseType, userData, isMember) {
    const response = await fetch('https://tu-servidor.com/api/create-course-session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...userData,
            courseType,
            isMember
        })
    });

    if (!response.ok) {
        throw new Error('Error al crear sesión de pago');
    }

    return await response.json();
}
```

---

### Opción 2: Python + Flask

**Ventajas:**
- Sintaxis simple
- Buena integración con Stripe
- Fácil de desplegar

```python
from flask import Flask, request, jsonify
import stripe
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["https://seccion-sindical-ugt-clm-ugr.github.io"])

stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')

@app.route('/api/create-affiliation-session', methods=['POST'])
def create_affiliation_session():
    data = request.json

    session = stripe.checkout.Session.create(
        payment_method_types=['card'],
        line_items=[{
            'price_data': {
                'currency': 'eur',
                'product_data': {
                    'name': 'Afiliación Anual UGT-CLM-UGR',
                },
                'unit_amount': 1500,
            },
            'quantity': 1,
        }],
        mode='payment',
        success_url='https://seccion-sindical-ugt-clm-ugr.github.io/sindicato/success.html?session_id={CHECKOUT_SESSION_ID}',
        cancel_url='https://seccion-sindical-ugt-clm-ugr.github.io/sindicato/cancel.html',
        customer_email=data['email'],
        metadata=data
    )

    return jsonify({'id': session.id})

if __name__ == '__main__':
    app.run(port=3000)
```

---

### Opción 3: PHP (Para hosting tradicional)

```php
<?php
require_once('vendor/autoload.php');

header("Access-Control-Allow-Origin: https://seccion-sindical-ugt-clm-ugr.github.io");
header("Content-Type: application/json");

\Stripe\Stripe::setApiKey(getenv('STRIPE_SECRET_KEY'));

$input = json_decode(file_get_contents('php://input'), true);

$session = \Stripe\Checkout\Session::create([
    'payment_method_types' => ['card'],
    'line_items' => [[
        'price_data' => [
            'currency' => 'eur',
            'product_data' => [
                'name' => 'Afiliación Anual UGT-CLM-UGR',
            ],
            'unit_amount' => 1500,
        ],
        'quantity' => 1,
    ]],
    'mode' => 'payment',
    'success_url' => 'https://seccion-sindical-ugt-clm-ugr.github.io/sindicato/success.html?session_id={CHECKOUT_SESSION_ID}',
    'cancel_url' => 'https://seccion-sindical-ugt-clm-ugr.github.io/sindicato/cancel.html',
    'customer_email' => $input['email'],
    'metadata' => $input
]);

echo json_encode(['id' => $session->id]);
?>
```

---

## 🌐 Opciones de Hosting para Backend

### 1. **Vercel** (Recomendado para Node.js)
- ✅ Gratis hasta cierto límite
- ✅ Deploy automático desde Git
- ✅ HTTPS incluido
- ✅ Fácil configuración de variables de entorno

### 2. **Railway**
- ✅ Gratis con créditos mensuales
- ✅ Soporte para Node.js, Python, PHP
- ✅ Base de datos incluida

### 3. **Render**
- ✅ Gratis para servicios web
- ✅ Auto-deploy desde GitHub
- ✅ PostgreSQL gratis incluido

### 4. **Heroku**
- ✅ Conocido y confiable
- ⚠️ Ya no tiene plan gratuito

---

## 🗄️ Base de Datos

Para guardar afiliados y cursos, necesitas una base de datos:

### PostgreSQL (Recomendado)
```sql
-- Tabla de afiliados
CREATE TABLE affiliates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    department VARCHAR(255),
    stripe_session_id VARCHAR(255),
    payment_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de inscripciones a cursos
CREATE TABLE course_enrollments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    department VARCHAR(255),
    course_type VARCHAR(100),
    is_member BOOLEAN,
    price INTEGER,
    stripe_session_id VARCHAR(255),
    payment_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📧 Sistema de Emails

Para enviar confirmaciones, usa un servicio como:

- **SendGrid** (12,000 emails gratis/mes)
- **Mailgun** (5,000 emails gratis/mes)
- **Amazon SES** (muy económico)

---

## ✅ Checklist de Implementación

- [ ] Elegir opción de backend (Node.js, Python, PHP)
- [ ] Configurar servidor con endpoints API
- [ ] Configurar variables de entorno
- [ ] Desplegar backend en hosting
- [ ] Obtener URL del servidor backend
- [ ] Configurar webhooks de Stripe
- [ ] Configurar base de datos
- [ ] Actualizar frontend con URL del backend
- [ ] Probar con Stripe en modo test
- [ ] Implementar sistema de emails
- [ ] Configurar claves de producción de Stripe
- [ ] Realizar pruebas completas
- [ ] Lanzar a producción

---

## 🔒 Seguridad Esencial

1. **Variables de entorno:** NUNCA hardcodees claves
2. **HTTPS:** Obligatorio para pagos
3. **CORS:** Configura solo tu dominio
4. **Validación:** Valida todos los datos de entrada
5. **Webhooks:** Verifica firmas de Stripe
6. **Rate limiting:** Previene abuso de API
7. **Logs:** Registra todo para debugging

---

## 📚 Recursos Adicionales

- [Documentación de Stripe](https://stripe.com/docs)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Webhooks de Stripe](https://stripe.com/docs/webhooks)
- [Dashboard de Stripe](https://dashboard.stripe.com/)

---

## 💡 Ayuda y Soporte

Para implementar el backend, considera:
1. Contratar un desarrollador backend
2. Usar servicios de integración como Zapier + Stripe
3. Contactar con el soporte de Stripe

**Contacto del proyecto:**
- Email: ugt.clm.ugr@ugt.org
