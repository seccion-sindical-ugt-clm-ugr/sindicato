/**
 * Modelo de Cuota de Afiliado
 * Gestiona las cuotas mensuales/anuales de los afiliados
 */

const mongoose = require('mongoose');

const membershipFeeSchema = new mongoose.Schema({
    // Usuario afiliado
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El usuario es obligatorio'],
        index: true
    },

    // Período de la cuota
    period: {
        year: {
            type: Number,
            required: true
        },
        month: {
            type: Number,
            required: true,
            min: 1,
            max: 12
        }
    },

    // Monto de la cuota
    amount: {
        type: Number,
        required: [true, 'El monto es obligatorio'],
        min: 0
    },

    // Moneda
    currency: {
        type: String,
        default: 'EUR',
        enum: ['EUR', 'USD', 'GBP']
    },

    // Estado del pago
    status: {
        type: String,
        enum: ['pending', 'paid', 'overdue', 'waived', 'cancelled'],
        default: 'pending'
    },

    // Fecha de vencimiento
    dueDate: {
        type: Date,
        required: true
    },

    // Fecha de pago
    paidDate: {
        type: Date,
        default: null
    },

    // Método de pago
    paymentMethod: {
        type: String,
        enum: ['cash', 'bank_transfer', 'card', 'stripe', 'paypal', 'domiciliation', 'other'],
        default: null
    },

    // Referencia de pago
    paymentReference: {
        type: String,
        trim: true
    },

    // Transacción relacionada
    relatedTransaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        default: null
    },

    // Factura relacionada
    relatedInvoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice',
        default: null
    },

    // Notas
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Las notas no pueden exceder 500 caracteres']
    },

    // Recordatorios enviados
    reminders: [{
        sentDate: {
            type: Date,
            default: Date.now
        },
        type: {
            type: String,
            enum: ['email', 'sms', 'notification']
        },
        status: {
            type: String,
            enum: ['sent', 'failed', 'opened']
        }
    }],

    // Domiciliación bancaria
    directDebit: {
        enabled: {
            type: Boolean,
            default: false
        },
        iban: String,
        mandateDate: Date,
        mandateReference: String
    }
}, {
    timestamps: true,
    collection: 'membership_fees'
});

// Índices
membershipFeeSchema.index({ user: 1, 'period.year': 1, 'period.month': 1 }, { unique: true });
membershipFeeSchema.index({ status: 1 });
membershipFeeSchema.index({ dueDate: 1 });
membershipFeeSchema.index({ 'period.year': 1, 'period.month': 1 });

// Pre-save: Verificar estado overdue
membershipFeeSchema.pre('save', function(next) {
    if (this.status === 'pending' && this.dueDate < new Date()) {
        this.status = 'overdue';
    }
    next();
});

// Método de instancia: Marcar como pagada
membershipFeeSchema.methods.markAsPaid = async function(paymentData) {
    this.status = 'paid';
    this.paidDate = paymentData.date || new Date();
    this.paymentMethod = paymentData.method || 'bank_transfer';
    this.paymentReference = paymentData.reference || '';

    if (paymentData.transactionId) {
        this.relatedTransaction = paymentData.transactionId;
    }

    await this.save();
    return this;
};

// Método de instancia: Exonerar cuota
membershipFeeSchema.methods.waive = async function(reason) {
    this.status = 'waived';
    this.notes = reason || 'Cuota exonerada';
    await this.save();
    return this;
};

// Método de instancia: Enviar recordatorio
membershipFeeSchema.methods.sendReminder = async function(type = 'email') {
    this.reminders.push({
        sentDate: new Date(),
        type,
        status: 'sent'
    });
    await this.save();
    return this;
};

// Método estático: Crear cuota para un usuario
membershipFeeSchema.statics.createForUser = async function(userId, year, month, amount) {
    // Crear fecha de vencimiento (último día del mes)
    const dueDate = new Date(year, month, 0); // Día 0 del siguiente mes = último día del mes actual

    const fee = new this({
        user: userId,
        period: { year, month },
        amount,
        dueDate
    });

    await fee.save();
    return fee;
};

// Método estático: Crear cuotas para todos los afiliados activos
membershipFeeSchema.statics.createForAllActiveMembers = async function(year, month, defaultAmount) {
    const User = mongoose.model('User');

    // Obtener todos los afiliados activos
    const activeMembers = await User.find({
        role: 'afiliado',
        membershipStatus: 'activo',
        isActive: true
    });

    const created = [];
    const errors = [];

    for (const member of activeMembers) {
        try {
            // Verificar si ya existe una cuota para este período
            const existing = await this.findOne({
                user: member._id,
                'period.year': year,
                'period.month': month
            });

            if (!existing) {
                const fee = await this.createForUser(member._id, year, month, defaultAmount);
                created.push(fee);
            }
        } catch (error) {
            errors.push({
                userId: member._id,
                userName: member.nombre,
                error: error.message
            });
        }
    }

    return {
        created: created.length,
        errors: errors.length,
        details: { created, errors }
    };
};

// Método estático: Obtener resumen de cuotas
membershipFeeSchema.statics.getSummary = async function(filters = {}) {
    const query = { ...filters };

    const summary = await this.aggregate([
        { $match: query },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' }
            }
        }
    ]);

    const total = await this.countDocuments(query);
    const totalAmount = await this.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    return {
        byStatus: summary,
        total,
        totalAmount: totalAmount[0]?.total || 0
    };
};

// Método estático: Obtener cuotas pendientes
membershipFeeSchema.statics.getPending = async function() {
    return this.find({
        status: { $in: ['pending', 'overdue'] }
    })
    .populate('user', 'nombre email telefono')
    .sort({ dueDate: 1 });
};

// Método estático: Obtener cuotas vencidas
membershipFeeSchema.statics.getOverdue = async function() {
    return this.find({
        status: 'overdue'
    })
    .populate('user', 'nombre email telefono')
    .sort({ dueDate: 1 });
};

// Configurar virtuals en JSON
membershipFeeSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('MembershipFee', membershipFeeSchema);
