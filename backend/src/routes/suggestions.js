/**
 * Rutas para el sistema de sugerencias
 * Permite a afiliados enviar sugerencias y a admins gestionarlas
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { initializeEmailService, sendSuggestionConfirmation, sendAdminNotification, sendStatusUpdate } = require('../services/emailService');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');

// Inicializar servicio de email
initializeEmailService();

// Rate limiting para prevenir spam
const suggestionsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 3, // máximo 3 sugerencias por IP en 15 minutos
    message: {
        error: 'Demasiadas solicitudes',
        message: 'Por seguridad, solo puedes enviar 3 sugerencias cada 15 minutos. Intenta más tarde.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware de sanitización
router.use(mongoSanitize());

// Importar modelos (se cargarán después de configurar MongoDB)
let Suggestion;
let User;
try {
    Suggestion = require('../models/Suggestion');
    User = require('../models/User');
} catch (error) {
    console.log('⚠️ MongoDB no configurado aún - endpoints de sugerencias disponibles pero no funcionales');
}

// Middleware de autenticación simple para admin
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            error: 'No autorizado',
            message: 'Se requiere autenticación'
        });
    }

    // Autenticación básica: Bearer TOKEN
    const token = authHeader.replace('Bearer ', '');
    const adminPassword = process.env.ADMIN_PASSWORD || 'ugt2024admin';

    if (token !== adminPassword) {
        return res.status(401).json({
            error: 'No autorizado',
            message: 'Token inválido'
        });
    }

    next();
}

// ====================================
// ENDPOINTS PÚBLICOS (Sin autenticación)
// ====================================

/**
 * POST /api/suggestions
 * Crear una nueva sugerencia
 */
router.post('/suggestions', suggestionsLimiter,
    [
        body('type').isIn(['sugerencia', 'queja', 'propuesta', 'denuncia', 'consulta'])
            .withMessage('Tipo de sugerencia inválido'),
        body('subject').trim().isLength({ min: 5, max: 200 })
            .withMessage('El asunto debe tener entre 5 y 200 caracteres'),
        body('message').trim().isLength({ min: 10, max: 5000 })
            .withMessage('El mensaje debe tener entre 10 y 5000 caracteres'),
        body('urgency').optional().isIn(['baja', 'media', 'alta'])
            .withMessage('Urgencia inválida'),
        body('email').optional().isEmail()
            .withMessage('Email inválido'),
        body('isAnonymous').optional().isBoolean()
            .withMessage('isAnonymous debe ser verdadero o falso')
    ],
    async (req, res) => {
        try {
            console.log('📝 Recibida petición de nueva sugerencia');

            // Validar entrada
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                console.log('❌ Validación fallida:', errors.array());
                return res.status(400).json({
                    error: 'Datos inválidos',
                    details: errors.array()
                });
            }

            console.log('✅ Validación de datos OK');

            // Verificar si MongoDB está configurado
            if (!Suggestion) {
                console.log('❌ Modelo Suggestion no disponible');
                return res.status(503).json({
                    error: 'Base de datos no disponible',
                    message: 'El sistema de sugerencias está en mantenimiento. Por favor, contacta directamente con el sindicato.'
                });
            }

            console.log('✅ Modelo Suggestion disponible');

            const {
                name,
                email,
                department,
                type,
                subject,
                message,
                urgency,
                isAnonymous
            } = req.body;

            // Sanitizar datos para prevenir XSS
            const sanitizedData = {
                type: xss(type),
                subject: xss(subject),
                message: xss(message),
                urgency: urgency || 'media',
                isAnonymous: isAnonymous || false
            };

            if (!isAnonymous) {
                sanitizedData.name = xss(name) || 'Anónimo';
                sanitizedData.email = email || null;
                sanitizedData.department = xss(department) || null;
            }

            console.log('📦 Datos sanitizados:', JSON.stringify(sanitizedData, null, 2));

            // Crear sugerencia
            console.log('💾 Intentando crear documento en MongoDB...');
            const suggestion = new Suggestion(sanitizedData);

            console.log('💾 Documento creado, guardando en BD...');
            await suggestion.save();

            console.log('✅ Nueva sugerencia guardada correctamente:', {
                id: suggestion._id,
                type: suggestion.type,
                urgency: suggestion.urgency,
                isAnonymous: suggestion.isAnonymous
            });

            // Vincular sugerencia a usuario registrado si corresponde
            if (!suggestion.isAnonymous && suggestion.email && User) {
                try {
                    const user = await User.findByEmail(suggestion.email);
                    if (user) {
                        // Vincular sugerencia al usuario
                        suggestion.userId = user._id;
                        await suggestion.save();

                        // Agregar sugerencia al historial del usuario
                        user.suggestions.push(suggestion._id);
                        await user.save();

                        console.log(`✅ Sugerencia vinculada al usuario: ${user.email} (${user._id})`);
                    }
                } catch (linkError) {
                    console.error('⚠️ Error vinculando sugerencia a usuario:', linkError.message);
                    // No fallar el request si hay error en vinculación
                }
            }

            // Enviar notificaciones por email (en background, no bloquear)
            setImmediate(async () => {
                try {
                    // Email de confirmación al usuario (si no es anónimo y tiene email)
                    if (!suggestion.isAnonymous && suggestion.email) {
                        await sendSuggestionConfirmation(suggestion);
                    }

                    // Email de notificación a administradores
                    await sendAdminNotification(suggestion);
                } catch (emailError) {
                    console.error('❌ Error enviando emails:', emailError);
                    // No fallar el request si hay error en email
                }
            });

            // Responder (no devolver datos sensibles)
            res.status(201).json({
                success: true,
                message: 'Sugerencia enviada correctamente',
                data: {
                    id: suggestion._id,
                    type: suggestion.type,
                    createdAt: suggestion.createdAt,
                    trackingId: '#' + suggestion._id.toString().slice(-8)
                }
            });

        } catch (error) {
            console.error('❌ Error creando sugerencia:', error);
            console.error('❌ Tipo de error:', error.name);
            console.error('❌ Mensaje:', error.message);
            console.error('❌ Stack:', error.stack);

            // Si es error de validación de MongoDB, dar más detalles
            if (error.name === 'ValidationError') {
                console.error('❌ Errores de validación:', error.errors);
                return res.status(400).json({
                    error: 'Error de validación',
                    message: 'Los datos enviados no cumplen con los requisitos',
                    details: Object.keys(error.errors).map(key => ({
                        field: key,
                        message: error.errors[key].message
                    }))
                });
            }

            res.status(500).json({
                error: 'Error del servidor',
                message: 'No se pudo procesar tu sugerencia. Por favor, inténtalo de nuevo.',
                ...(process.env.NODE_ENV === 'development' && {
                    debug: {
                        errorName: error.name,
                        errorMessage: error.message
                    }
                })
            });
        }
    }
);

/**
 * GET /api/suggestions/stats
 * Estadísticas públicas (sin datos sensibles)
 */
router.get('/suggestions/stats', async (req, res) => {
    try {
        if (!Suggestion) {
            return res.status(503).json({
                error: 'Base de datos no disponible'
            });
        }

        const stats = await Suggestion.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    pendientes: {
                        $sum: { $cond: [{ $eq: ['$status', 'pendiente'] }, 1, 0] }
                    },
                    procesadas: {
                        $sum: { $cond: [{ $eq: ['$status', 'procesada'] }, 1, 0] }
                    }
                }
            }
        ]);

        res.json({
            total: stats[0]?.total || 0,
            pendientes: stats[0]?.pendientes || 0,
            procesadas: stats[0]?.procesadas || 0
        });

    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        res.status(500).json({
            error: 'Error del servidor'
        });
    }
});

// ====================================
// ENDPOINTS DE ADMINISTRACIÓN (Requieren autenticación)
// ====================================

/**
 * GET /api/suggestions/admin
 * Listar todas las sugerencias (admin)
 */
router.get('/suggestions/admin', requireAuth, async (req, res) => {
    try {
        if (!Suggestion) {
            return res.status(503).json({
                error: 'Base de datos no disponible'
            });
        }

        const {
            status,
            type,
            urgency,
            limit = 100,
            skip = 0,
            sort = '-createdAt'
        } = req.query;

        // Construir filtros
        const filters = {};
        if (status) filters.status = status;
        if (type) filters.type = type;
        if (urgency) filters.urgency = urgency;

        // Obtener sugerencias
        const suggestions = await Suggestion
            .find(filters)
            .sort(sort)
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .lean();

        // Contar total
        const total = await Suggestion.countDocuments(filters);

        res.json({
            success: true,
            data: suggestions,
            pagination: {
                total,
                limit: parseInt(limit),
                skip: parseInt(skip),
                hasMore: total > (parseInt(skip) + parseInt(limit))
            }
        });

    } catch (error) {
        console.error('❌ Error listando sugerencias:', error);
        res.status(500).json({
            error: 'Error del servidor'
        });
    }
});

/**
 * GET /api/suggestions/admin/:id
 * Obtener una sugerencia específica (admin)
 */
router.get('/suggestions/admin/:id', requireAuth, async (req, res) => {
    try {
        if (!Suggestion) {
            return res.status(503).json({
                error: 'Base de datos no disponible'
            });
        }

        const suggestion = await Suggestion.findById(req.params.id);

        if (!suggestion) {
            return res.status(404).json({
                error: 'No encontrada',
                message: 'Sugerencia no encontrada'
            });
        }

        res.json({
            success: true,
            data: suggestion
        });

    } catch (error) {
        console.error('❌ Error obteniendo sugerencia:', error);
        res.status(500).json({
            error: 'Error del servidor'
        });
    }
});

/**
 * PATCH /api/suggestions/admin/:id
 * Actualizar estado de una sugerencia (admin)
 */
router.patch('/suggestions/admin/:id', requireAuth,
    [
        body('status').optional().isIn(['pendiente', 'en-revision', 'procesada', 'archivada'])
            .withMessage('Estado inválido'),
        body('adminNotes').optional().trim().isLength({ max: 1000 })
            .withMessage('Notas demasiado largas (máx 1000 caracteres)')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Datos inválidos',
                    details: errors.array()
                });
            }

            if (!Suggestion) {
                return res.status(503).json({
                    error: 'Base de datos no disponible'
                });
            }

            const { status, adminNotes, processedBy } = req.body;

            const updateData = {};
            const oldStatus = (await Suggestion.findById(req.params.id))?.status;

            if (status) {
                updateData.status = status;
                if (status === 'procesada' && !updateData.processedAt) {
                    updateData.processedAt = new Date();
                    updateData.processedBy = processedBy || 'Admin';
                }
            }
            if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

            const suggestion = await Suggestion.findByIdAndUpdate(
                req.params.id,
                updateData,
                { new: true, runValidators: true }
            );

            if (!suggestion) {
                return res.status(404).json({
                    error: 'No encontrada',
                    message: 'Sugerencia no encontrada'
                });
            }

            console.log('📝 Sugerencia actualizada:', {
                id: suggestion._id,
                status: suggestion.status
            });

            // Enviar email de actualización (en background)
            if (status && status !== oldStatus) {
                setImmediate(async () => {
                    try {
                        await sendStatusUpdate(suggestion, status, adminNotes);
                    } catch (emailError) {
                        console.error('❌ Error enviando email de actualización:', emailError);
                    }
                });
            }

            res.json({
                success: true,
                message: 'Sugerencia actualizada correctamente',
                data: suggestion
            });

        } catch (error) {
            console.error('❌ Error actualizando sugerencia:', error);
            res.status(500).json({
                error: 'Error del servidor'
            });
        }
    }
);

/**
 * DELETE /api/suggestions/admin/:id
 * Eliminar una sugerencia (admin)
 */
router.delete('/suggestions/admin/:id', requireAuth, async (req, res) => {
    try {
        if (!Suggestion) {
            return res.status(503).json({
                error: 'Base de datos no disponible'
            });
        }

        const suggestion = await Suggestion.findByIdAndDelete(req.params.id);

        if (!suggestion) {
            return res.status(404).json({
                error: 'No encontrada',
                message: 'Sugerencia no encontrada'
            });
        }

        console.log('🗑️ Sugerencia eliminada:', req.params.id);

        res.json({
            success: true,
            message: 'Sugerencia eliminada correctamente'
        });

    } catch (error) {
        console.error('❌ Error eliminando sugerencia:', error);
        res.status(500).json({
            error: 'Error del servidor'
        });
    }
});

module.exports = router;
