/**
 * Modelo de Usuario para MongoDB
 * Gestiona los afiliados y administradores del sindicato UGT-CLM-UGR Granada
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    // Información personal
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true,
        minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
        maxlength: [100, 'El nombre no puede exceder 100 caracteres']
    },
    email: {
        type: String,
        required: [true, 'El email es obligatorio'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/, 'Email inválido'],
        index: true
    },
    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria'],
        minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
    },
    telefono: {
        type: String,
        trim: true,
        match: [/^[0-9]{9,15}$/, 'Teléfono inválido']
    },
    departamento: {
        type: String,
        trim: true,
        maxlength: [100, 'El departamento no puede exceder 100 caracteres']
    },

    // Foto de perfil (Base64 o URL)
    profilePhoto: {
        type: String,
        default: null
    },

    // Rol del usuario
    role: {
        type: String,
        enum: ['afiliado', 'admin'],
        default: 'afiliado',
        required: true
    },

    // Estado del usuario
    isActive: {
        type: Boolean,
        default: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },

    // Información de afiliación
    membershipStatus: {
        type: String,
        enum: ['activo', 'pendiente', 'inactivo', 'suspendido'],
        default: 'pendiente'
    },
    membershipStartDate: {
        type: Date,
        default: null
    },
    membershipExpiryDate: {
        type: Date,
        default: null
    },

    // Estadísticas y actividad
    coursesEnrolled: [{
        courseId: String,
        courseName: String,
        enrollmentDate: Date,
        status: {
            type: String,
            enum: ['enrolled', 'in-progress', 'completed', 'cancelled'],
            default: 'enrolled'
        }
    }],

    // Historial de pagos
    paymentHistory: [{
        stripeSessionId: String,
        amount: Number,
        currency: { type: String, default: 'eur' },
        description: String,
        status: { type: String, default: 'completed' },
        date: { type: Date, default: Date.now }
    }],

    // Sugerencias del usuario
    suggestions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Suggestion'
    }],

    // Documentos generados
    documents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document'
    }],

    lastLogin: {
        type: Date,
        default: null
    },
    loginCount: {
        type: Number,
        default: 0
    },

    // Tokens de seguridad
    refreshTokens: [{
        token: String,
        createdAt: {
            type: Date,
            default: Date.now
        },
        expiresAt: Date
    }],

    // Verificación de email
    emailVerificationToken: {
        type: String,
        default: null
    },
    emailVerificationExpires: {
        type: Date,
        default: null
    },

    // Recuperación de contraseña
    resetPasswordToken: {
        type: String,
        default: null
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    },

    // Metadatos
    ipAddress: {
        type: String,
        trim: true
    },
    userAgent: {
        type: String,
        trim: true
    }
}, {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
    collection: 'users'
});

// Índices para mejorar el rendimiento
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ membershipStatus: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Middleware: Hashear contraseña antes de guardar
userSchema.pre('save', async function(next) {
    // Solo hashear si la contraseña fue modificada
    if (!this.isModified('password')) {
        return next();
    }

    try {
        // Generar salt y hashear
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Middleware: Sanitizar datos antes de guardar
userSchema.pre('save', function(next) {
    // Eliminar espacios en blanco excesivos
    if (this.nombre) {
        this.nombre = this.nombre.replace(/\s+/g, ' ').trim();
    }
    if (this.departamento) {
        this.departamento = this.departamento.replace(/\s+/g, ' ').trim();
    }

    // Sanitizar teléfono: quitar espacios, guiones, paréntesis, puntos
    if (this.telefono) {
        // Quitar caracteres no numéricos (excepto el + al inicio)
        const hasPlus = this.telefono.trim().startsWith('+');
        this.telefono = this.telefono.replace(/[\s\-().]/g, '');

        // Si tenía +, quitarlo también (la validación es solo números)
        if (hasPlus) {
            this.telefono = this.telefono.replace(/^\+/, '');
        }
    }

    next();
});

// Método de instancia: Comparar contraseña
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Error al comparar contraseñas');
    }
};

// Método de instancia: Generar objeto público (sin datos sensibles)
userSchema.methods.toPublicJSON = function() {
    const obj = this.toObject();

    // Eliminar campos sensibles
    delete obj.password;
    delete obj.refreshTokens;
    delete obj.emailVerificationToken;
    delete obj.emailVerificationExpires;
    delete obj.resetPasswordToken;
    delete obj.resetPasswordExpires;
    delete obj.ipAddress;
    delete obj.userAgent;
    delete obj.__v;

    return obj;
};

// Método de instancia: Actualizar último login
userSchema.methods.updateLastLogin = async function() {
    this.lastLogin = new Date();
    this.loginCount += 1;
    await this.save();
};

// Método de instancia: Verificar si la membresía está activa
userSchema.methods.isMembershipActive = function() {
    if (this.membershipStatus !== 'activo') {
        return false;
    }

    if (this.membershipExpiryDate && this.membershipExpiryDate < new Date()) {
        return false;
    }

    return true;
};

// Método de instancia: Renovar membresía
userSchema.methods.renewMembership = async function(durationMonths = 12) {
    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setMonth(expiryDate.getMonth() + durationMonths);

    this.membershipStatus = 'activo';
    if (!this.membershipStartDate) {
        this.membershipStartDate = now;
    }
    this.membershipExpiryDate = expiryDate;

    await this.save();
    return this;
};

// Método de instancia: Enrollar en curso
userSchema.methods.enrollInCourse = async function(courseId, courseName) {
    const existingEnrollment = this.coursesEnrolled.find(
        c => c.courseId === courseId
    );

    if (existingEnrollment) {
        throw new Error('Ya estás inscrito en este curso');
    }

    this.coursesEnrolled.push({
        courseId,
        courseName,
        enrollmentDate: new Date(),
        status: 'enrolled'
    });

    await this.save();
    return this;
};

// Virtual: Nombre completo para display
userSchema.virtual('displayName').get(function() {
    return this.nombre;
});

// Virtual: Días hasta expiración de membresía
userSchema.virtual('daysUntilExpiry').get(function() {
    if (!this.membershipExpiryDate) return null;

    const now = new Date();
    const diffMs = this.membershipExpiryDate - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return diffDays;
});

// Método estático: Buscar por email
userSchema.statics.findByEmail = async function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

// Método estático: Obtener estadísticas de usuarios
userSchema.statics.getStats = async function() {
    const stats = await this.aggregate([
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                activos: {
                    $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                },
                afiliados: {
                    $sum: { $cond: [{ $eq: ['$role', 'afiliado'] }, 1, 0] }
                },
                admins: {
                    $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] }
                },
                membershipActivo: {
                    $sum: { $cond: [{ $eq: ['$membershipStatus', 'activo'] }, 1, 0] }
                },
                membershipPendiente: {
                    $sum: { $cond: [{ $eq: ['$membershipStatus', 'pendiente'] }, 1, 0] }
                },
                emailVerificados: {
                    $sum: { $cond: ['$isEmailVerified', 1, 0] }
                }
            }
        }
    ]);

    return stats[0] || {
        total: 0,
        activos: 0,
        afiliados: 0,
        admins: 0,
        membershipActivo: 0,
        membershipPendiente: 0,
        emailVerificados: 0
    };
};

// Método estático: Obtener usuarios registrados por período
userSchema.statics.getByPeriod = async function(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.find({
        createdAt: { $gte: startDate }
    }).sort({ createdAt: -1 });
};

// Configurar para incluir virtuales en JSON
userSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret.__v;
        delete ret.password;
        delete ret.refreshTokens;
        return ret;
    }
});

userSchema.set('toObject', {
    virtuals: true
});

module.exports = mongoose.model('User', userSchema);
