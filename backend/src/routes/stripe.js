/**
 * Rutas de Stripe - Endpoints de Pago
 * Maneja la creación de sesiones de checkout y webhooks
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const Document = require('../models/Document');
const { generateReciboPago } = require('../services/pdfService');

// ====================================
// VALIDADORES
// ====================================

const affiliationValidators = [
    body('name').trim().notEmpty().withMessage('El nombre es requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('phone').trim().notEmpty().withMessage('El teléfono es requerido'),
    body('department').trim().notEmpty().withMessage('El departamento es requerido')
];

const courseValidators = [
    body('name').trim().notEmpty().withMessage('El nombre es requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('phone').trim().notEmpty().withMessage('El teléfono es requerido'),
    body('department').trim().notEmpty().withMessage('El departamento/empresa es requerido'),
    body('courseType').trim().notEmpty().withMessage('El tipo de curso es requerido'),
    body('isMember').isBoolean().withMessage('isMember debe ser boolean')
];

// ====================================
// ENDPOINT: Crear sesión de afiliación
// ====================================

router.post('/create-affiliation-session', affiliationValidators, async (req, res) => {
    try {
        // Validar datos
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Datos inválidos',
                details: errors.array()
            });
        }

        const { name, email, phone, department } = req.body;

        console.log('📝 Nueva solicitud de afiliación:', { name, email, department });

        // Crear sesión de Stripe Checkout
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: 'Afiliación Anual UGT-CLM-UGR',
                        description: 'Cuota anual de afiliación a la Sección Sindical UGT-CLM-UGR Granada',
                        images: ['https://seccion-sindical-ugt-clm-ugr.github.io/sindicato/images/brand/ugt-logo.PNG']
                    },
                    unit_amount: 1500 // 15.00 EUR en centavos
                },
                quantity: 1
            }],
            mode: 'payment',
            success_url: process.env.SUCCESS_URL + '?session_id={CHECKOUT_SESSION_ID}',
            cancel_url: process.env.CANCEL_URL,
            customer_email: email,
            client_reference_id: email, // Para identificar al cliente después
            metadata: {
                type: 'affiliation',
                name: name,
                email: email,
                phone: phone,
                department: department,
                timestamp: new Date().toISOString()
            }
        });

        console.log('✅ Sesión de afiliación creada:', session.id);

        // Devolver el ID de sesión al frontend
        res.json({
            id: session.id,
            url: session.url // URL alternativa para redirigir
        });

    } catch (error) {
        console.error('❌ Error creando sesión de afiliación:', error);
        res.status(500).json({
            error: 'Error al crear la sesión de pago',
            message: error.message
        });
    }
});

// ====================================
// ENDPOINT: Crear sesión de curso
// ====================================

router.post('/create-course-session', courseValidators, async (req, res) => {
    try {
        // Validar datos
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Datos inválidos',
                details: errors.array()
            });
        }

        const { name, email, phone, department, courseType, isMember } = req.body;

        // Determinar precio según tipo de usuario
        const price = isMember ? 1500 : 16000; // 15€ o 160€ en centavos
        const userType = isMember ? 'Afiliado UGT' : 'Externo';

        console.log('📝 Nueva inscripción a curso:', {
            name,
            email,
            courseType,
            isMember,
            price: price / 100
        });

        // Crear sesión de Stripe Checkout
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: `Curso Inteligencia Artificial - ${userType}`,
                        description: `Acceso completo al curso de IA aplicada (${userType})`,
                        images: ['https://seccion-sindical-ugt-clm-ugr.github.io/sindicato/images/courses/ia-course.jpg']
                    },
                    unit_amount: price
                },
                quantity: 1
            }],
            mode: 'payment',
            success_url: process.env.SUCCESS_URL + `?session_id={CHECKOUT_SESSION_ID}&course=${courseType}`,
            cancel_url: process.env.CANCEL_URL,
            customer_email: email,
            client_reference_id: email,
            metadata: {
                type: 'course',
                courseType: courseType,
                isMember: isMember.toString(),
                name: name,
                email: email,
                phone: phone,
                department: department,
                price: price.toString(),
                timestamp: new Date().toISOString()
            }
        });

        console.log('✅ Sesión de curso creada:', session.id);

        res.json({
            id: session.id,
            url: session.url
        });

    } catch (error) {
        console.error('❌ Error creando sesión de curso:', error);
        res.status(500).json({
            error: 'Error al crear la sesión de pago',
            message: error.message
        });
    }
});

// ====================================
// ENDPOINT: Webhook de Stripe
// ====================================

router.post('/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        // Verificar la firma del webhook
        if (process.env.STRIPE_WEBHOOK_SECRET) {
            event = stripe.webhooks.constructEvent(
                req.body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } else {
            // Si no hay secret configurado, parsear el body directamente (solo desarrollo)
            console.warn('⚠️ ADVERTENCIA: Webhook sin verificar (no hay STRIPE_WEBHOOK_SECRET)');
            event = JSON.parse(req.body.toString());
        }

    } catch (err) {
        console.error('❌ Error verificando webhook:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Manejar el evento
    console.log(`📨 Webhook recibido: ${event.type}`);

    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            console.log('💰 Pago completado exitosamente');
            console.log('   Session ID:', session.id);
            console.log('   Email:', session.customer_email);
            console.log('   Tipo:', session.metadata.type);
            console.log('   Metadata:', session.metadata);

            // Procesar pago y generar recibo
            try {
                const userEmail = session.customer_email;
                const user = await User.findByEmail(userEmail);

                if (user) {
                    console.log(`✅ Usuario encontrado: ${userEmail}`);

                    // Datos del pago
                    const paymentData = {
                        stripeSessionId: session.id,
                        amount: session.amount_total / 100, // Convertir de centavos a euros
                        currency: session.currency,
                        description: session.metadata.type === 'affiliation'
                            ? 'Afiliación anual UGT-CLM-UGR'
                            : `Curso de ${session.metadata.courseType || 'Formación'}`,
                        status: 'completed',
                        date: new Date()
                    };

                    // 1. Agregar a historial de pagos del usuario
                    user.paymentHistory.push(paymentData);
                    await user.save();
                    console.log(`💾 Pago registrado en historial del usuario`);

                    // 2. Generar recibo de pago
                    console.log('📄 Generando recibo de pago...');
                    const reciboResult = await generateReciboPago(user, paymentData);

                    const reciboDocument = new Document({
                        userId: user._id,
                        type: 'recibo-pago',
                        title: 'Recibo de Pago',
                        description: `Recibo de ${paymentData.description} - ${paymentData.amount.toFixed(2)} ${paymentData.currency.toUpperCase()}`,
                        fileData: reciboResult.fileData,
                        fileSize: reciboResult.fileSize,
                        metadata: {
                            amount: paymentData.amount,
                            stripeSessionId: session.id
                        }
                    });

                    await reciboDocument.save();
                    console.log(`✅ Recibo generado: ${reciboDocument._id}`);

                    // 3. Agregar documento al usuario
                    user.documents.push(reciboDocument._id);
                    await user.save();

                    console.log(`✅ Recibo vinculado al usuario ${userEmail}`);

                } else {
                    console.log(`⚠️ Usuario no encontrado: ${userEmail} - Pago registrado pero sin recibo`);
                }

            } catch (error) {
                console.error('❌ Error procesando pago:', error);
                // No fallar el webhook si hay error en procesamiento
            }

            break;

        case 'checkout.session.expired':
            console.log('⏰ Sesión de checkout expirada:', event.data.object.id);
            break;

        case 'payment_intent.succeeded':
            console.log('✅ PaymentIntent exitoso:', event.data.object.id);
            break;

        case 'payment_intent.payment_failed':
            console.log('❌ Pago fallido:', event.data.object.id);
            console.log('   Razón:', event.data.object.last_payment_error?.message);
            break;

        default:
            console.log(`ℹ️ Evento no manejado: ${event.type}`);
    }

    // Devolver respuesta para confirmar recepción
    res.json({ received: true });
});

// ====================================
// ENDPOINT: Verificar sesión (opcional)
// ====================================

router.get('/session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        res.json({
            id: session.id,
            payment_status: session.payment_status,
            customer_email: session.customer_email,
            amount_total: session.amount_total,
            currency: session.currency,
            metadata: session.metadata
        });

    } catch (error) {
        console.error('❌ Error obteniendo sesión:', error);
        res.status(500).json({
            error: 'Error al obtener la sesión',
            message: error.message
        });
    }
});

module.exports = router;
