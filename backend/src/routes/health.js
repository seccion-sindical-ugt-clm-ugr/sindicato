/**
 * Health Check Routes
 * Endpoints para verificar el estado del servidor
 */

const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mongoose = require('mongoose');

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
    const mongoState = mongoose.connection.readyState;
    const mongoStates = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };

    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        services: {
            stripe: 'checking',
            mongodb: {
                status: mongoStates[mongoState] || 'unknown',
                stateCode: mongoState,
                configured: !!process.env.MONGODB_URI,
                host: mongoose.connection.host || 'not connected',
                database: mongoose.connection.name || 'not connected'
            }
        },
        config: {
            port: process.env.PORT || 3000,
            cors: process.env.ALLOWED_ORIGINS ? 'configured' : 'default',
            webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ? 'configured' : 'not configured',
            mongodbUri: process.env.MONGODB_URI ? 'configured' : 'not configured'
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

    // Si MongoDB no está conectado y está configurado, marcar como degradado
    if (process.env.MONGODB_URI && mongoState !== 1) {
        health.status = 'degraded';
        health.services.mongodb.message = 'MongoDB configurado pero no conectado';
    }

    res.json(health);
});

// Ping simple
router.get('/ping', (req, res) => {
    res.send('pong');
});

module.exports = router;
