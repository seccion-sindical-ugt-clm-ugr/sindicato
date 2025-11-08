/**
 * Modelo de Documento para MongoDB
 * Almacena documentos generados automáticamente para los afiliados
 */

const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    // Usuario propietario
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Tipo de documento
    type: {
        type: String,
        required: true,
        enum: ['certificado-afiliado', 'recibo-pago', 'certificado-curso', 'ficha-afiliacion'],
        index: true
    },

    // Información del documento
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },

    // Datos del PDF (Base64)
    fileData: {
        type: String,
        required: true
    },

    // Metadatos
    fileSize: {
        type: Number, // Tamaño en bytes
        required: true
    },
    mimeType: {
        type: String,
        default: 'application/pdf'
    },

    // Información adicional según tipo
    metadata: {
        // Para recibos de pago
        amount: Number,
        currency: String,
        stripeSessionId: String,

        // Para certificados de curso
        courseId: String,
        courseName: String,
        completionDate: Date,

        // General
        generatedBy: {
            type: String,
            default: 'system'
        }
    },

    // Fecha de generación
    generatedAt: {
        type: Date,
        default: Date.now
    },

    // Fecha de expiración (opcional)
    expiresAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    collection: 'documents'
});

// Índices
documentSchema.index({ userId: 1, type: 1 });
documentSchema.index({ generatedAt: -1 });

// Método para obtener el tamaño legible
documentSchema.virtual('fileSizeReadable').get(function() {
    const bytes = this.fileSize;
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
});

// Método para verificar si el documento está expirado
documentSchema.virtual('isExpired').get(function() {
    if (!this.expiresAt) return false;
    return this.expiresAt < new Date();
});

// Método estático: Obtener documentos por usuario
documentSchema.statics.findByUser = async function(userId) {
    return this.find({ userId }).sort({ generatedAt: -1 });
};

// Método estático: Obtener documentos por tipo
documentSchema.statics.findByUserAndType = async function(userId, type) {
    return this.find({ userId, type }).sort({ generatedAt: -1 });
};

// Configurar para incluir virtuals en JSON
documentSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        // No enviar el fileData completo en listados (solo cuando se descarga)
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Document', documentSchema);
