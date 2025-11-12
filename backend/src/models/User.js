const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // Datos básicos
    email: {
        type: String,
        required: [true, 'El email es obligatorio'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria'],
        minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
    },
    name: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true,
        maxlength: [100, 'El nombre no puede exceder 100 caracteres']
    },
    phone: {
        type: String,
        trim: true,
        default: null
    },
    department: {
        type: String,
        trim: true,
        maxlength: [100, 'El departamento no puede exceder 100 caracteres'],
        default: null
    },

    // Afiliación
    member: {
        type: Boolean,
        default: true
    },
    role: {
        type: String,
        enum: ['member', 'admin', 'secretario'],
        default: 'member'
    },
    status: {
        type: String,
        enum: ['active', 'pending', 'inactive'],
        default: 'active'
    },

    // Preferencias
    notifications: {
        type: Boolean,
        default: true
    },
    publicProfile: {
        type: Boolean,
        default: false
    },

    // Foto de perfil
    profilePhoto: {
        type: String,
        default: null
    },
    photoUploadedAt: {
        type: Date,
        default: null
    },

    // Auditoría
    registrationDate: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    loginCount: {
        type: Number,
        default: 0
    },
    passwordChangedAt: {
        type: Date,
        default: null
    },
    registeredFrom: {
        type: String,
        default: 'website'
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Índices para optimización
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ registrationDate: -1 });

// Middleware para actualizar el campo updatedAt
userSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function(candidatePassword) {
    const bcrypt = require('bcryptjs');
    return bcrypt.compare(candidatePassword, this.password);
};

// Método para obtener datos públicos
userSchema.methods.getPublicData = function() {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
};

// Virtual para URL de la foto (puede expandirse en el futuro)
userSchema.virtual('profilePhotoUrl').get(function() {
    return this.profilePhoto;
});

// Establecer opción toJSON para eliminar la contraseña
userSchema.set('toJSON', {
    transform: function(doc, ret) {
        delete ret.password;
        return ret;
    }
});

module.exports = mongoose.model('User', userSchema);