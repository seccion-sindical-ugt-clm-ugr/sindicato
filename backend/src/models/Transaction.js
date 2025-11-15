/**
 * Transaction Model
 * Modelo para gestionar todas las transacciones financieras del sindicato
 */

const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    // Tipo de transacción
    type: {
        type: String,
        enum: ['income', 'expense'],
        required: true
    },

    // Categoría de la transacción
    category: {
        type: String,
        enum: [
            // Ingresos
            'membership_fee',      // Cuotas de afiliados
            'donation',           // Donaciones
            'course_payment',     // Pagos de cursos
            'subsidy',           // Subvenciones
            'other_income',      // Otros ingresos

            // Gastos
            'office_supplies',   // Material de oficina
            'services',          // Servicios (luz, agua, internet)
            'salaries',          // Salarios/honorarios
            'rent',              // Alquiler
            'legal_fees',        // Gastos legales
            'events',            // Organización de eventos
            'communication',     // Comunicación y publicidad
            'training',          // Formación
            'transport',         // Transporte
            'other_expense'      // Otros gastos
        ],
        required: true
    },

    // Monto de la transacción
    amount: {
        type: Number,
        required: true,
        min: 0
    },

    // Descripción detallada
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },

    // Fecha de la transacción
    transactionDate: {
        type: Date,
        required: true,
        default: Date.now
    },

    // Año fiscal
    fiscalYear: {
        type: Number,
        required: true
    },

    // Quarter fiscal (1-4)
    fiscalQuarter: {
        type: Number,
        min: 1,
        max: 4
    },

    // Método de pago
    paymentMethod: {
        type: String,
        enum: ['cash', 'bank_transfer', 'card', 'direct_debit', 'check', 'other'],
        default: 'bank_transfer'
    },

    // Referencia (número de factura, recibo, etc.)
    reference: {
        type: String,
        trim: true
    },

    // Usuario relacionado (si aplica)
    relatedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Factura relacionada (si aplica)
    relatedInvoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice'
    },

    // Cuota de afiliación relacionada (si aplica)
    relatedMembershipFee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MembershipFee'
    },

    // Estado de la transacción
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled', 'refunded'],
        default: 'completed'
    },

    // Usuario que registró la transacción
    registeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Aprobación para gastos extraordinarios
    requiresApproval: {
        type: Boolean,
        default: false
    },

    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    approvalDate: {
        type: Date
    },

    // Adjuntos (facturas, recibos escaneados)
    attachments: [{
        fileName: String,
        fileUrl: String,
        uploadDate: {
            type: Date,
            default: Date.now
        }
    }],

    // Notas adicionales
    notes: {
        type: String,
        maxlength: 1000
    },

    // Para conciliación bancaria
    bankReconciled: {
        type: Boolean,
        default: false
    },

    reconciledDate: {
        type: Date
    }
}, {
    timestamps: true
});

// Índices para mejorar rendimiento de consultas
transactionSchema.index({ type: 1, fiscalYear: 1 });
transactionSchema.index({ category: 1 });
transactionSchema.index({ transactionDate: -1 });
transactionSchema.index({ relatedUser: 1 });
transactionSchema.index({ status: 1 });

// Middleware para calcular año y quarter fiscal antes de guardar
transactionSchema.pre('save', function(next) {
    if (!this.fiscalYear) {
        const date = this.transactionDate || new Date();
        this.fiscalYear = date.getFullYear();
    }

    if (!this.fiscalQuarter) {
        const date = this.transactionDate || new Date();
        const month = date.getMonth() + 1; // 0-11 -> 1-12
        this.fiscalQuarter = Math.ceil(month / 3);
    }

    next();
});

// Métodos estáticos útiles

// Obtener balance total o por filtros
transactionSchema.statics.getBalance = async function(filters = {}) {
    const query = { status: 'completed', ...filters };

    const result = await this.aggregate([
        { $match: query },
        {
            $group: {
                _id: '$type',
                total: { $sum: '$amount' }
            }
        }
    ]);

    const income = result.find(r => r._id === 'income')?.total || 0;
    const expense = result.find(r => r._id === 'expense')?.total || 0;

    return {
        income,
        expense,
        balance: income - expense
    };
};

// Obtener estadísticas mensuales
transactionSchema.statics.getMonthlyStats = async function(year) {
    return await this.aggregate([
        {
            $match: {
                fiscalYear: year,
                status: 'completed'
            }
        },
        {
            $group: {
                _id: {
                    month: { $month: '$transactionDate' },
                    type: '$type'
                },
                total: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { '_id.month': 1 }
        }
    ]);
};

// Obtener transacciones por categoría
transactionSchema.statics.getByCategory = async function(filters = {}) {
    const query = { status: 'completed', ...filters };

    return await this.aggregate([
        { $match: query },
        {
            $group: {
                _id: {
                    category: '$category',
                    type: '$type'
                },
                total: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { total: -1 }
        }
    ]);
};

// Obtener gastos pendientes de aprobación
transactionSchema.statics.getPendingApprovals = async function() {
    return await this.find({
        type: 'expense',
        requiresApproval: true,
        status: 'pending'
    })
    .populate('registeredBy', 'nombre email')
    .sort({ createdAt: -1 });
};

// Aprobar transacción
transactionSchema.methods.approve = async function(approvedByUserId) {
    this.status = 'completed';
    this.approvedBy = approvedByUserId;
    this.approvalDate = new Date();
    return await this.save();
};

// Cancelar transacción
transactionSchema.methods.cancel = async function() {
    this.status = 'cancelled';
    return await this.save();
};

// Virtual para obtener el nombre de la categoría en español
transactionSchema.virtual('categoryName').get(function() {
    const names = {
        // Ingresos
        'membership_fee': 'Cuota de afiliación',
        'donation': 'Donación',
        'course_payment': 'Pago de curso',
        'subsidy': 'Subvención',
        'other_income': 'Otros ingresos',

        // Gastos
        'office_supplies': 'Material de oficina',
        'services': 'Servicios',
        'salaries': 'Salarios',
        'rent': 'Alquiler',
        'legal_fees': 'Gastos legales',
        'events': 'Eventos',
        'communication': 'Comunicación',
        'training': 'Formación',
        'transport': 'Transporte',
        'other_expense': 'Otros gastos'
    };
    return names[this.category] || this.category;
});

// Asegurar que los virtuals se incluyan en JSON
transactionSchema.set('toJSON', { virtuals: true });
transactionSchema.set('toObject', { virtuals: true });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
