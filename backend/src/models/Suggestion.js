/**
 * Modelo de Sugerencia
 * Esquema de datos para sugerencias de afiliados
 */

const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema({
    // Datos del remitente
    name: {
        type: String,
        default: 'Anónimo'
    },
    email: {
        type: String,
        default: null
    },
    department: {
        type: String,
        required: false
    },

    // Contenido de la sugerencia
    type: {
        type: String,
        enum: ['sugerencia', 'queja', 'propuesta', 'denuncia', 'consulta'],
        required: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true
    },
    urgency: {
        type: String,
        enum: ['baja', 'media', 'alta'],
        default: 'media'
    },

    // Metadatos
    isAnonymous: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['pendiente', 'en-revision', 'procesada', 'archivada'],
        default: 'pendiente'
    },
    adminNotes: {
        type: String,
        default: ''
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    processedAt: {
        type: Date,
        default: null
    },
    processedBy: {
        type: String,
        default: null
    }
});

// Índices para búsquedas rápidas
suggestionSchema.index({ createdAt: -1 });
suggestionSchema.index({ status: 1 });
suggestionSchema.index({ type: 1 });
suggestionSchema.index({ urgency: 1 });

module.exports = mongoose.model('Suggestion', suggestionSchema);
