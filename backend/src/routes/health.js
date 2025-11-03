/**
 * Health Check Routes
 * Endpoints para verificar el estado del servidor
 */

const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Health check básico
router.get('/', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Health check detallado
router.get('/detailed', async (req, res) => {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        services: {
            stripe: 'checking'
        },
        config: {
            port: process.env.PORT || 3000,
            cors: process.env.ALLOWED_ORIGINS ? 'configured' : 'default',
            webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ? 'configured' : 'not configured'
        }
    };

    // Verificar conexión con Stripe
    try {
        await stripe.balance.retrieve();
        health.services.stripe = 'connected';
    } catch (error) {
        health.services.stripe = 'error';
        health.status = 'degraded';
    }

    res.json(health);
});

// Ping simple
router.get('/ping', (req, res) => {
    res.send('pong');
});

module.exports = router;
