/**
 * Webhook de Stripe
 * Maneja eventos de pagos desde Stripe
 */

const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const Document = require('../models/Document');
const { generateReciboPago } = require('../services/pdfService');

/**
 * POST /webhook
 * Recibe eventos de Stripe
 */
router.post('/', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    // SECURITY: STRIPE_WEBHOOK_SECRET is REQUIRED for production
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        console.error('❌ ERROR CRÍTICO: STRIPE_WEBHOOK_SECRET no configurado');
        console.error('Configúralo en Vercel → Settings → Environment Variables');
        console.error('Obtén el secret desde: https://dashboard.stripe.com/webhooks');
        return res.status(500).json({
            error: 'Webhook configuration error'
        });
    }

    try {
        // Verificar la firma del webhook
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );

    } catch (err) {
        console.error('❌ Error verificando firma del webhook:', err.message);
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

module.exports = router;
