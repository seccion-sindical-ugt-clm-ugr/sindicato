/**
 * Rutas de Contabilidad
 * Gestión de transacciones, facturas y cuotas de afiliados
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const Invoice = require('../models/Invoice');
const MembershipFee = require('../models/MembershipFee');

// Todas las rutas requieren autenticación y rol de admin
router.use(authenticate);
router.use(requireAdmin);

// ===================================
// DASHBOARD FINANCIERO
// ===================================

/**
 * GET /api/accounting/dashboard
 * Obtener resumen general del estado financiero
 */
router.get('/dashboard', async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();

        // Balance general
        const balance = await Transaction.getBalance();

        // Balance del año actual
        const yearBalance = await Transaction.getBalance({ fiscalYear: currentYear });

        // Estadísticas de cuotas
        const membershipSummary = await MembershipFee.getSummary({
            'period.year': currentYear
        });

        // Facturas pendientes
        const pendingInvoices = await Invoice.getSummary({
            status: { $in: ['issued', 'partially_paid', 'overdue'] }
        });

        // Cuotas vencidas
        const overdueFeesCount = await MembershipFee.countDocuments({
            status: 'overdue'
        });

        // Transacciones recientes
        const recentTransactions = await Transaction.find()
            .sort({ transactionDate: -1 })
            .limit(10)
            .populate('registeredBy', 'nombre email');

        // Estadísticas mensuales del año
        const monthlyStats = await Transaction.getMonthlyStats(currentYear);

        res.json({
            success: true,
            data: {
                balance: {
                    total: balance,
                    currentYear: yearBalance
                },
                membershipFees: membershipSummary,
                invoices: {
                    pending: pendingInvoices
                },
                alerts: {
                    overdueFees: overdueFeesCount
                },
                recentTransactions,
                monthlyStats
            }
        });

    } catch (error) {
        console.error('Error obteniendo dashboard financiero:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener dashboard financiero'
        });
    }
});

// ===================================
// TRANSACCIONES
// ===================================

/**
 * GET /api/accounting/transactions
 * Listar transacciones con filtros
 */
router.get('/transactions', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Construir filtros
        const filters = {};
        if (req.query.type) filters.type = req.query.type;
        if (req.query.category) filters.category = req.query.category;
        if (req.query.status) filters.status = req.query.status;
        if (req.query.fiscalYear) filters.fiscalYear = parseInt(req.query.fiscalYear);
        if (req.query.startDate && req.query.endDate) {
            filters.transactionDate = {
                $gte: new Date(req.query.startDate),
                $lte: new Date(req.query.endDate)
            };
        }

        const transactions = await Transaction.find(filters)
            .sort({ transactionDate: -1 })
            .limit(limit)
            .skip(skip)
            .populate('registeredBy', 'nombre email')
            .populate('relatedUser', 'nombre email')
            .populate('relatedInvoice', 'invoiceNumber');

        const total = await Transaction.countDocuments(filters);

        res.json({
            success: true,
            data: {
                transactions,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Error listando transacciones:', error);
        res.status(500).json({
            success: false,
            error: 'Error al listar transacciones'
        });
    }
});

/**
 * POST /api/accounting/transactions
 * Crear nueva transacción
 */
router.post('/transactions', async (req, res) => {
    try {
        const {
            type,
            category,
            subcategory,
            amount,
            description,
            transactionDate,
            paymentMethod,
            paymentReference,
            expenseType,
            tags,
            notes,
            relatedUser,
            relatedInvoice
        } = req.body;

        // Validaciones
        if (!type || !category || !amount || !description) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos obligatorios'
            });
        }

        const transaction = new Transaction({
            type,
            category,
            subcategory,
            amount,
            description,
            transactionDate: transactionDate || new Date(),
            paymentMethod: paymentMethod || 'bank_transfer',
            paymentReference,
            expenseType: type === 'expense' ? (expenseType || 'ordinary') : undefined,
            tags: tags || [],
            notes,
            relatedUser,
            relatedInvoice,
            registeredBy: req.user._id,
            status: 'completed'
        });

        await transaction.save();

        console.log(`✅ Transacción creada: ${transaction.description} - €${transaction.amount}`);

        res.status(201).json({
            success: true,
            data: transaction,
            message: 'Transacción creada correctamente'
        });

    } catch (error) {
        console.error('Error creando transacción:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear transacción'
        });
    }
});

/**
 * GET /api/accounting/transactions/:id
 * Obtener detalles de una transacción
 */
router.get('/transactions/:id', async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id)
            .populate('registeredBy', 'nombre email')
            .populate('relatedUser', 'nombre email departamento')
            .populate('relatedInvoice', 'invoiceNumber total');

        if (!transaction) {
            return res.status(404).json({
                success: false,
                error: 'Transacción no encontrada'
            });
        }

        res.json({
            success: true,
            data: transaction
        });

    } catch (error) {
        console.error('Error obteniendo transacción:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener transacción'
        });
    }
});

/**
 * PUT /api/accounting/transactions/:id
 * Actualizar transacción
 */
router.put('/transactions/:id', async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                error: 'Transacción no encontrada'
            });
        }

        // Campos actualizables
        const allowedFields = [
            'category', 'subcategory', 'amount', 'description', 'transactionDate',
            'paymentMethod', 'paymentReference', 'expenseType', 'tags', 'notes', 'status'
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                transaction[field] = req.body[field];
            }
        });

        await transaction.save();

        res.json({
            success: true,
            data: transaction,
            message: 'Transacción actualizada correctamente'
        });

    } catch (error) {
        console.error('Error actualizando transacción:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar transacción'
        });
    }
});

/**
 * DELETE /api/accounting/transactions/:id
 * Eliminar transacción (cancelar)
 */
router.delete('/transactions/:id', async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                error: 'Transacción no encontrada'
            });
        }

        await transaction.cancel();

        res.json({
            success: true,
            message: 'Transacción cancelada correctamente'
        });

    } catch (error) {
        console.error('Error cancelando transacción:', error);
        res.status(500).json({
            success: false,
            error: 'Error al cancelar transacción'
        });
    }
});

/**
 * GET /api/accounting/transactions/stats/by-category
 * Obtener estadísticas por categoría
 */
router.get('/transactions/stats/by-category', async (req, res) => {
    try {
        const type = req.query.type || 'income';
        const year = parseInt(req.query.year) || new Date().getFullYear();

        const stats = await Transaction.getStatsByCategory(type, { fiscalYear: year });

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas'
        });
    }
});

// ===================================
// FACTURAS
// ===================================

/**
 * GET /api/accounting/invoices
 * Listar facturas
 */
router.get('/invoices', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const filters = {};
        if (req.query.type) filters.type = req.query.type;
        if (req.query.status) filters.status = req.query.status;
        if (req.query.fiscalYear) filters.fiscalYear = parseInt(req.query.fiscalYear);

        const invoices = await Invoice.find(filters)
            .sort({ issueDate: -1 })
            .limit(limit)
            .skip(skip)
            .populate('createdBy', 'nombre email')
            .populate('relatedUser', 'nombre email');

        const total = await Invoice.countDocuments(filters);

        res.json({
            success: true,
            data: {
                invoices,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Error listando facturas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al listar facturas'
        });
    }
});

/**
 * POST /api/accounting/invoices
 * Crear nueva factura
 */
router.post('/invoices', async (req, res) => {
    try {
        const {
            type,
            series,
            issueDate,
            dueDate,
            clientProvider,
            items,
            notes,
            relatedUser
        } = req.body;

        // Validaciones
        if (!type || !clientProvider || !items || items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos obligatorios'
            });
        }

        // Generar número de factura
        const invoiceNumber = await Invoice.generateInvoiceNumber(series,
            new Date(issueDate).getFullYear());

        const invoice = new Invoice({
            invoiceNumber,
            type,
            series: series || 'A',
            issueDate: issueDate || new Date(),
            dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 días
            clientProvider,
            items,
            notes,
            relatedUser,
            createdBy: req.user._id,
            status: 'draft'
        });

        await invoice.save();

        console.log(`✅ Factura creada: ${invoice.invoiceNumber} - €${invoice.total}`);

        res.status(201).json({
            success: true,
            data: invoice,
            message: 'Factura creada correctamente'
        });

    } catch (error) {
        console.error('Error creando factura:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear factura'
        });
    }
});

/**
 * GET /api/accounting/invoices/:id
 * Obtener detalles de una factura
 */
router.get('/invoices/:id', async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('createdBy', 'nombre email')
            .populate('relatedUser', 'nombre email');

        if (!invoice) {
            return res.status(404).json({
                success: false,
                error: 'Factura no encontrada'
            });
        }

        res.json({
            success: true,
            data: invoice
        });

    } catch (error) {
        console.error('Error obteniendo factura:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener factura'
        });
    }
});

/**
 * PUT /api/accounting/invoices/:id/issue
 * Emitir factura
 */
router.put('/invoices/:id/issue', async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({
                success: false,
                error: 'Factura no encontrada'
            });
        }

        await invoice.issue();

        res.json({
            success: true,
            data: invoice,
            message: 'Factura emitida correctamente'
        });

    } catch (error) {
        console.error('Error emitiendo factura:', error);
        res.status(500).json({
            success: false,
            error: 'Error al emitir factura'
        });
    }
});

/**
 * POST /api/accounting/invoices/:id/payments
 * Añadir pago a factura
 */
router.post('/invoices/:id/payments', async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({
                success: false,
                error: 'Factura no encontrada'
            });
        }

        await invoice.addPayment(req.body);

        res.json({
            success: true,
            data: invoice,
            message: 'Pago registrado correctamente'
        });

    } catch (error) {
        console.error('Error añadiendo pago:', error);
        res.status(500).json({
            success: false,
            error: 'Error al añadir pago'
        });
    }
});

// ===================================
// CUOTAS DE AFILIADOS
// ===================================

/**
 * GET /api/accounting/membership-fees
 * Listar cuotas de afiliados
 */
router.get('/membership-fees', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const filters = {};
        if (req.query.status) filters.status = req.query.status;
        if (req.query.year) filters['period.year'] = parseInt(req.query.year);
        if (req.query.month) filters['period.month'] = parseInt(req.query.month);

        const fees = await MembershipFee.find(filters)
            .sort({ dueDate: -1 })
            .limit(limit)
            .skip(skip)
            .populate('user', 'nombre email telefono departamento');

        const total = await MembershipFee.countDocuments(filters);

        res.json({
            success: true,
            data: {
                fees,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Error listando cuotas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al listar cuotas'
        });
    }
});

/**
 * POST /api/accounting/membership-fees/generate
 * Generar cuotas para un período
 */
router.post('/membership-fees/generate', async (req, res) => {
    try {
        const { year, month, amount } = req.body;

        if (!year || !month || !amount) {
            return res.status(400).json({
                success: false,
                error: 'Año, mes y monto son obligatorios'
            });
        }

        const result = await MembershipFee.createForAllActiveMembers(
            parseInt(year),
            parseInt(month),
            parseFloat(amount)
        );

        res.json({
            success: true,
            data: result,
            message: `Se generaron ${result.created} cuotas correctamente`
        });

    } catch (error) {
        console.error('Error generando cuotas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al generar cuotas'
        });
    }
});

/**
 * PUT /api/accounting/membership-fees/:id/mark-paid
 * Marcar cuota como pagada
 */
router.put('/membership-fees/:id/mark-paid', async (req, res) => {
    try {
        const fee = await MembershipFee.findById(req.params.id);

        if (!fee) {
            return res.status(404).json({
                success: false,
                error: 'Cuota no encontrada'
            });
        }

        await fee.markAsPaid(req.body);

        res.json({
            success: true,
            data: fee,
            message: 'Cuota marcada como pagada'
        });

    } catch (error) {
        console.error('Error marcando cuota como pagada:', error);
        res.status(500).json({
            success: false,
            error: 'Error al marcar cuota como pagada'
        });
    }
});

/**
 * GET /api/accounting/membership-fees/overdue
 * Obtener cuotas vencidas
 */
router.get('/membership-fees/overdue', async (req, res) => {
    try {
        const overdueFees = await MembershipFee.getOverdue();

        res.json({
            success: true,
            data: overdueFees
        });

    } catch (error) {
        console.error('Error obteniendo cuotas vencidas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener cuotas vencidas'
        });
    }
});

/**
 * GET /api/accounting/reports/annual
 * Generar reporte anual
 */
router.get('/reports/annual', async (req, res) => {
    try {
        const year = parseInt(req.query.year) || new Date().getFullYear();

        const summary = await Transaction.getAnnualSummary(year);

        res.json({
            success: true,
            data: summary
        });

    } catch (error) {
        console.error('Error generando reporte anual:', error);
        res.status(500).json({
            success: false,
            error: 'Error al generar reporte anual'
        });
    }
});

module.exports = router;
