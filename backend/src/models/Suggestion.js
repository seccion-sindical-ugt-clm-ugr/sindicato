/**
 * Modelo de Sugerencia para MongoDB
 * Almacena las sugerencias de los afiliados del sindicato
 */

const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema({
    // Información del remitente
    name: {
        type: String,
        required: false,
        trim: true,
        maxlength: 100
    },
    email: {
        type: String,
        required: false,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
    },
    department: {
        type: String,
        required: false,
        trim: true,
        maxlength: 100
    },
    
    // Contenido de la sugerencia
    type: {
        type: String,
        required: true,
        enum: ['sugerencia', 'queja', 'propuesta', 'denuncia', 'consulta'],
        default: 'sugerencia'
    },
    subject: {
        type: String,
        required: true,
        trim: true,
        minlength: 5,
        maxlength: 200
    },
    message: {
        type: String,
        required: true,
        trim: true,
        minlength: 10,
        maxlength: 5000
    },
    urgency: {
        type: String,
        required: true,
        enum: ['baja', 'media', 'alta'],
        default: 'media'
    },
    
    // Control de privacidad
    isAnonymous: {
        type: Boolean,
        required: true,
        default: false
    },
    
    // Estado y gestión
    status: {
        type: String,
        required: true,
        enum: ['pendiente', 'en-revision', 'procesada', 'archivada'],
        default: 'pendiente'
    },
    
    // Información de procesamiento
    processedAt: {
        type: Date,
        required: false
    },
    processedBy: {
        type: String,
        required: false,
        trim: true,
        maxlength: 100
    },
    adminNotes: {
        type: String,
        required: false,
        trim: true,
        maxlength: 1000
    },
    
    // Metadatos
    ipAddress: {
        type: String,
        required: false,
        trim: true
    },
    userAgent: {
        type: String,
        required: false,
        trim: true
    }
}, {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
    collection: 'suggestions'
});

// Índices para mejorar el rendimiento
suggestionSchema.index({ status: 1 });
suggestionSchema.index({ type: 1 });
suggestionSchema.index({ urgency: 1 });
suggestionSchema.index({ createdAt: -1 });
suggestionSchema.index({ isAnonymous: 1 });

// Middleware para sanitizar datos antes de guardar
suggestionSchema.pre('save', function(next) {
    // Eliminar espacios en blanco excesivos
    if (this.subject) {
        this.subject = this.subject.replace(/\s+/g, ' ').trim();
    }
    if (this.message) {
        this.message = this.message.replace(/\s+/g, ' ').trim();
    }
    if (this.name) {
        this.name = this.name.replace(/\s+/g, ' ').trim();
    }
    if (this.department) {
        this.department = this.department.replace(/\s+/g, ' ').trim();
    }
    
    next();
});

// Método virtual para obtener el ID de seguimiento
suggestionSchema.virtual('trackingId').get(function() {
    return '#' + this._id.toString().slice(-8);
});

// Método para verificar si la sugerencia es reciente (menos de 24h)
suggestionSchema.virtual('isRecent').get(function() {
    const now = new Date();
    const diffMs = now - this.createdAt;
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours < 24;
});

// Método estático para obtener estadísticas
suggestionSchema.statics.getStats = async function() {
    const stats = await this.aggregate([
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                pendientes: {
                    $sum: { $cond: [{ $eq: ['$status', 'pendiente'] }, 1, 0] }
                },
                enRevision: {
                    $sum: { $cond: [{ $eq: ['$status', 'en-revision'] }, 1, 0] }
                },
                procesadas: {
                    $sum: { $cond: [{ $eq: ['$status', 'procesada'] }, 1, 0] }
                },
                archivadas: {
                    $sum: { $cond: [{ $eq: ['$status', 'archivada'] }, 1, 0] }
                },
                urgentes: {
                    $sum: { $cond: [{ $eq: ['$urgency', 'alta'] }, 1, 0] }
                },
                anonimas: {
                    $sum: { $cond: ['$isAnonymous', 1, 0] }
                }
            }
        }
    ]);
    
    return stats[0] || {
        total: 0,
        pendientes: 0,
        enRevision: 0,
        procesadas: 0,
        archivadas: 0,
        urgentes: 0,
        anonimas: 0
    };
};

// Método estático para obtener sugerencias por período
suggestionSchema.statics.getByPeriod = async function(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return this.find({
        createdAt: { $gte: startDate }
    }).sort({ createdAt: -1 });
};

// Método para convertir a JSON con campos seleccionados
suggestionSchema.methods.toPublicJSON = function() {
    const obj = this.toObject();
    
    // Eliminar información sensible para respuestas públicas
    if (obj.isAnonymous) {
        delete obj.name;
        delete obj.email;
        delete obj.department;
        delete obj.ipAddress;
    }
    
    delete obj.__v;
    delete obj.ipAddress;
    delete obj.userAgent;
    
    return obj;
};

// Configurar para incluir virtuales en JSON
suggestionSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Suggestion', suggestionSchema);
