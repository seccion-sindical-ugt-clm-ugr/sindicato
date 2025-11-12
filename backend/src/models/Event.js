/**
 * Modelo de Evento/Mensaje
 * Gestiona eventos y mensajes del sindicato para los afiliados
 */

const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    // Tipo de evento
    type: {
        type: String,
        enum: ['announcement', 'meeting', 'course', 'reminder', 'notification'],
        default: 'announcement',
        required: true
    },

    // Título del evento
    title: {
        type: String,
        required: [true, 'El título es obligatorio'],
        trim: true,
        maxlength: [200, 'El título no puede exceder 200 caracteres']
    },

    // Descripción/Mensaje
    description: {
        type: String,
        required: [true, 'La descripción es obligatoria'],
        trim: true,
        maxlength: [2000, 'La descripción no puede exceder 2000 caracteres']
    },

    // Fecha del evento (opcional, para eventos con fecha específica)
    eventDate: {
        type: Date,
        default: null
    },

    // Fecha límite (opcional, para recordatorios)
    deadline: {
        type: Date,
        default: null
    },

    // Ubicación (opcional, para reuniones presenciales)
    location: {
        type: String,
        trim: true,
        maxlength: [200, 'La ubicación no puede exceder 200 caracteres']
    },

    // Link/URL (opcional, para reuniones virtuales o más información)
    link: {
        type: String,
        trim: true,
        maxlength: [500, 'El link no puede exceder 500 caracteres']
    },

    // Prioridad
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },

    // Estado
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'published'
    },

    // A quién está dirigido
    targetAudience: {
        type: String,
        enum: ['all', 'affiliates', 'admins', 'specific'],
        default: 'affiliates'
    },

    // IDs de usuarios específicos (si targetAudience === 'specific')
    targetUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    // Creado por (admin)
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Usuarios que han leído el evento
    readBy: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Metadatos adicionales
    metadata: {
        color: {
            type: String,
            default: '#1976d2' // Color para mostrar en el frontend
        },
        icon: {
            type: String,
            default: 'fa-bell' // Ícono de Font Awesome
        }
    }
}, {
    timestamps: true,
    collection: 'events'
});

// Índices para mejorar el rendimiento
eventSchema.index({ createdAt: -1 });
eventSchema.index({ eventDate: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ targetAudience: 1 });
eventSchema.index({ priority: 1 });

// Método de instancia: Verificar si un usuario ha leído el evento
eventSchema.methods.isReadBy = function(userId) {
    return this.readBy.some(read => read.userId.toString() === userId.toString());
};

// Método de instancia: Marcar como leído por un usuario
eventSchema.methods.markAsReadBy = async function(userId) {
    if (!this.isReadBy(userId)) {
        this.readBy.push({
            userId: userId,
            readAt: new Date()
        });
        await this.save();
    }
    return this;
};

// Método de instancia: Verificar si el evento es visible para un usuario
eventSchema.methods.isVisibleFor = function(user) {
    // Si el evento es para todos
    if (this.targetAudience === 'all') {
        return true;
    }

    // Si el evento es para afiliados
    if (this.targetAudience === 'affiliates' && user.role === 'afiliado') {
        return true;
    }

    // Si el evento es para admins
    if (this.targetAudience === 'admins' && user.role === 'admin') {
        return true;
    }

    // Si el evento es para usuarios específicos
    if (this.targetAudience === 'specific') {
        return this.targetUsers.some(id => id.toString() === user._id.toString());
    }

    return false;
};

// Método estático: Obtener eventos visibles para un usuario
eventSchema.statics.getVisibleEvents = async function(user, options = {}) {
    const {
        status = 'published',
        limit = 50,
        skip = 0
    } = options;

    // Construir query
    const query = { status };

    // Filtrar por audiencia
    query.$or = [
        { targetAudience: 'all' },
        { targetAudience: user.role === 'afiliado' ? 'affiliates' : 'admins' },
        { targetAudience: 'specific', targetUsers: user._id }
    ];

    // Si el usuario es admin, puede ver todos los eventos
    if (user.role === 'admin') {
        delete query.$or;
    }

    return this.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .populate('createdBy', 'nombre email role');
};

// Método estático: Obtener eventos próximos
eventSchema.statics.getUpcomingEvents = async function(user, daysAhead = 30) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const query = {
        status: 'published',
        eventDate: {
            $gte: now,
            $lte: futureDate
        }
    };

    // Filtrar por audiencia
    query.$or = [
        { targetAudience: 'all' },
        { targetAudience: user.role === 'afiliado' ? 'affiliates' : 'admins' },
        { targetAudience: 'specific', targetUsers: user._id }
    ];

    return this.find(query)
        .sort({ eventDate: 1 })
        .populate('createdBy', 'nombre email role');
};

// Método estático: Obtener estadísticas de eventos
eventSchema.statics.getStats = async function() {
    const stats = await this.aggregate([
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                published: {
                    $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
                },
                draft: {
                    $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
                },
                archived: {
                    $sum: { $cond: [{ $eq: ['$status', 'archived'] }, 1, 0] }
                },
                byType: {
                    $push: '$type'
                }
            }
        }
    ]);

    return stats[0] || {
        total: 0,
        published: 0,
        draft: 0,
        archived: 0,
        byType: []
    };
};

module.exports = mongoose.model('Event', eventSchema);
