/**
 * Modelo de Factura
 * Gestiona facturas de ingresos y gastos del sindicato
 */

const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    // Número de factura (generado automáticamente)
    invoiceNumber: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    // Tipo de factura
    type: {
        type: String,
        enum: ['income', 'expense'],
        required: [true, 'El tipo de factura es obligatorio']
    },

    // Serie de factura (para organización)
    series: {
        type: String,
        default: 'A',
        trim: true
    },

    // Fecha de emisión
    issueDate: {
        type: Date,
        required: [true, 'La fecha de emisión es obligatoria'],
        default: Date.now
    },

    // Fecha de vencimiento
    dueDate: {
        type: Date,
        required: [true, 'La fecha de vencimiento es obligatoria']
    },

    // Cliente/Proveedor
    clientProvider: {
        name: {
            type: String,
            required: [true, 'El nombre del cliente/proveedor es obligatorio'],
            trim: true
        },
        taxId: {
            type: String,
            trim: true
        },
        address: {
            type: String,
            trim: true
        },
        email: {
            type: String,
            trim: true,
            lowercase: true
        },
        phone: {
            type: String,
            trim: true
        }
    },

    // Usuario relacionado (si aplica)
    relatedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    // Líneas de factura
    items: [{
        description: {
            type: String,
            required: true,
            trim: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 0,
            default: 1
        },
        unitPrice: {
            type: Number,
            required: true,
            min: 0
        },
        taxRate: {
            type: Number,
            default: 21, // IVA en España
            min: 0,
            max: 100
        },
        subtotal: {
            type: Number,
            required: true
        }
    }],

    // Totales
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },

    taxAmount: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },

    total: {
        type: Number,
        required: true,
        min: 0
    },

    // Moneda
    currency: {
        type: String,
        default: 'EUR',
        enum: ['EUR', 'USD', 'GBP']
    },

    // Estado
    status: {
        type: String,
        enum: ['draft', 'issued', 'paid', 'partially_paid', 'overdue', 'cancelled'],
        default: 'draft'
    },

    // Pagos recibidos/realizados
    payments: [{
        amount: Number,
        date: Date,
        method: String,
        reference: String,
        notes: String
    }],

    // Monto pagado
    paidAmount: {
        type: Number,
        default: 0,
        min: 0
    },

    // Monto pendiente
    pendingAmount: {
        type: Number,
        default: 0,
        min: 0
    },

    // Notas
    notes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Las notas no pueden exceder 1000 caracteres']
    },

    // Adjuntos
    attachments: [{
        filename: String,
        url: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Usuario que creó la factura
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Año fiscal
    fiscalYear: {
        type: Number,
        default: function() {
            return new Date(this.issueDate).getFullYear();
        }
    }
}, {
    timestamps: true,
    collection: 'invoices'
});

// Índices
invoiceSchema.index({ invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ type: 1, status: 1 });
invoiceSchema.index({ issueDate: -1 });
invoiceSchema.index({ dueDate: 1 });
invoiceSchema.index({ fiscalYear: 1 });
invoiceSchema.index({ relatedUser: 1 });

// Pre-save: Calcular totales
invoiceSchema.pre('save', function(next) {
    // Calcular subtotal de cada item
    this.items.forEach(item => {
        item.subtotal = item.quantity * item.unitPrice;
    });

    // Calcular subtotal total
    this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);

    // Calcular impuestos
    this.taxAmount = this.items.reduce((sum, item) => {
        return sum + (item.subtotal * item.taxRate / 100);
    }, 0);

    // Calcular total
    this.total = this.subtotal + this.taxAmount;

    // Calcular monto pendiente
    this.pendingAmount = this.total - this.paidAmount;

    // Actualizar estado si está completamente pagada
    if (this.paidAmount >= this.total && this.status !== 'cancelled') {
        this.status = 'paid';
    } else if (this.paidAmount > 0 && this.paidAmount < this.total) {
        this.status = 'partially_paid';
    }

    // Verificar si está vencida
    if (this.status !== 'paid' && this.status !== 'cancelled' &&
        this.dueDate < new Date() && this.status === 'issued') {
        this.status = 'overdue';
    }

    next();
});

// Método estático: Generar número de factura
invoiceSchema.statics.generateInvoiceNumber = async function(series = 'A', year = null) {
    const fiscalYear = year || new Date().getFullYear();

    // Buscar el último número de esta serie y año
    const lastInvoice = await this.findOne({
        series,
        fiscalYear
    }).sort({ invoiceNumber: -1 });

    let nextNumber = 1;
    if (lastInvoice && lastInvoice.invoiceNumber) {
        // Extraer el número de la factura (formato: A-2024-0001)
        const parts = lastInvoice.invoiceNumber.split('-');
        if (parts.length === 3) {
            nextNumber = parseInt(parts[2]) + 1;
        }
    }

    // Formatear número con ceros a la izquierda
    const formattedNumber = String(nextNumber).padStart(4, '0');
    return `${series}-${fiscalYear}-${formattedNumber}`;
};

// Método de instancia: Añadir pago
invoiceSchema.methods.addPayment = async function(paymentData) {
    this.payments.push({
        amount: paymentData.amount,
        date: paymentData.date || new Date(),
        method: paymentData.method || 'bank_transfer',
        reference: paymentData.reference || '',
        notes: paymentData.notes || ''
    });

    this.paidAmount += paymentData.amount;
    await this.save();
    return this;
};

// Método de instancia: Marcar como emitida
invoiceSchema.methods.issue = async function() {
    if (this.status === 'draft') {
        this.status = 'issued';
        await this.save();
    }
    return this;
};

// Método de instancia: Cancelar factura
invoiceSchema.methods.cancel = async function() {
    this.status = 'cancelled';
    await this.save();
    return this;
};

// Método estático: Obtener resumen de facturas
invoiceSchema.statics.getSummary = async function(filters = {}) {
    const query = { ...filters };

    const summary = await this.aggregate([
        { $match: query },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$total' },
                paidAmount: { $sum: '$paidAmount' },
                pendingAmount: { $sum: '$pendingAmount' }
            }
        }
    ]);

    return summary;
};

// Configurar virtuals en JSON
invoiceSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Invoice', invoiceSchema);
