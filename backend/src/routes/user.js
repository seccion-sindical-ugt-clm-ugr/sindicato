/**
 * Rutas de Usuario
 * Maneja perfiles, fotos, actualización de datos y estadísticas
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const {
    authenticate,
    requireAdmin
} = require('../middleware/auth');

/**
 * GET /api/user/profile
 * Obtener perfil del usuario autenticado
 */
router.get('/profile',
    authenticate,
    async (req, res) => {
        try {
            res.status(200).json({
                success: true,
                data: {
                    user: req.user.toPublicJSON()
                }
            });
        } catch (error) {
            console.error('❌ Error al obtener perfil:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener perfil'
            });
        }
    }
);

/**
 * PUT /api/user/profile
 * Actualizar perfil del usuario
 */
router.put('/profile',
    authenticate,
    [
        body('nombre')
            .optional()
            .trim()
            .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
        body('telefono')
            .optional()
            .trim()
            .custom((value) => {
                if (!value) return true; // Es opcional
                // Permitir formatos flexibles: +34 123 456 789, 123-456-789, etc.
                // Extraer solo dígitos
                const digitsOnly = value.replace(/[\s\-().]/g, '').replace(/^\+/, '');
                if (!/^[0-9]{9,15}$/.test(digitsOnly)) {
                    throw new Error('Teléfono inválido (debe tener entre 9 y 15 dígitos)');
                }
                return true;
            }),
        body('departamento')
            .optional()
            .trim()
            .isLength({ max: 100 }).withMessage('El departamento no puede exceder 100 caracteres')
    ],
    async (req, res) => {
        try {
            // 1. Validar entrada
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array().map(err => ({
                        field: err.path,
                        message: err.msg
                    }))
                });
            }

            const { nombre, telefono, departamento } = req.body;
            const user = req.user;

            // 2. Actualizar campos permitidos
            if (nombre !== undefined) user.nombre = nombre;
            if (telefono !== undefined) user.telefono = telefono;
            if (departamento !== undefined) user.departamento = departamento;

            await user.save();

            // 3. Enviar respuesta
            res.status(200).json({
                success: true,
                message: 'Perfil actualizado exitosamente',
                data: {
                    user: user.toPublicJSON()
                }
            });

            console.log(`✅ Perfil actualizado: ${user.email}`);

        } catch (error) {
            console.error('❌ Error al actualizar perfil:', error);
            res.status(500).json({
                success: false,
                error: 'Error al actualizar perfil'
            });
        }
    }
);

/**
 * POST /api/user/photo
 * Subir o actualizar foto de perfil (Base64)
 */
router.post('/photo',
    authenticate,
    [
        body('photo')
            .notEmpty().withMessage('La foto es obligatoria')
            .isString().withMessage('La foto debe ser una cadena Base64')
            .custom((value) => {
                // Verificar que sea Base64 válido
                const base64Regex = /^data:image\/(png|jpg|jpeg|gif|webp);base64,/;
                if (!base64Regex.test(value)) {
                    throw new Error('Formato de imagen inválido. Usa: data:image/png;base64,...');
                }

                // Verificar tamaño (max 2MB en Base64 ≈ 2.7MB)
                if (value.length > 2700000) {
                    throw new Error('La imagen es demasiado grande (máx 2MB)');
                }

                return true;
            })
    ],
    async (req, res) => {
        try {
            // 1. Validar entrada
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array().map(err => ({
                        field: err.path,
                        message: err.msg
                    }))
                });
            }

            const { photo } = req.body;
            const user = req.user;

            // 2. Guardar foto
            user.profilePhoto = photo;
            await user.save();

            // 3. Enviar respuesta
            res.status(200).json({
                success: true,
                message: 'Foto de perfil actualizada exitosamente',
                data: {
                    profilePhoto: user.profilePhoto
                }
            });

            console.log(`✅ Foto de perfil actualizada: ${user.email}`);

        } catch (error) {
            console.error('❌ Error al actualizar foto:', error);
            res.status(500).json({
                success: false,
                error: 'Error al actualizar foto de perfil'
            });
        }
    }
);

/**
 * DELETE /api/user/photo
 * Eliminar foto de perfil
 */
router.delete('/photo',
    authenticate,
    async (req, res) => {
        try {
            const user = req.user;

            // Eliminar foto
            user.profilePhoto = null;
            await user.save();

            res.status(200).json({
                success: true,
                message: 'Foto de perfil eliminada exitosamente'
            });

            console.log(`✅ Foto de perfil eliminada: ${user.email}`);

        } catch (error) {
            console.error('❌ Error al eliminar foto:', error);
            res.status(500).json({
                success: false,
                error: 'Error al eliminar foto de perfil'
            });
        }
    }
);

/**
 * PUT /api/user/password
 * Cambiar contraseña del usuario
 */
router.put('/password',
    authenticate,
    [
        body('currentPassword')
            .notEmpty().withMessage('La contraseña actual es obligatoria'),
        body('newPassword')
            .notEmpty().withMessage('La nueva contraseña es obligatoria')
            .isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres')
            .custom((value, { req }) => {
                if (value === req.body.currentPassword) {
                    throw new Error('La nueva contraseña debe ser diferente a la actual');
                }
                return true;
            })
    ],
    async (req, res) => {
        try {
            // 1. Validar entrada
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array().map(err => ({
                        field: err.path,
                        message: err.msg
                    }))
                });
            }

            const { currentPassword, newPassword } = req.body;
            const user = req.user;

            // 2. Verificar contraseña actual
            const isPasswordValid = await user.comparePassword(currentPassword);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    error: 'Contraseña actual incorrecta'
                });
            }

            // 3. Actualizar contraseña
            user.password = newPassword; // Se hasheará automáticamente

            // 4. Invalidar todos los refresh tokens por seguridad
            user.refreshTokens = [];

            await user.save();

            res.status(200).json({
                success: true,
                message: 'Contraseña actualizada exitosamente. Por favor inicia sesión nuevamente.'
            });

            console.log(`✅ Contraseña actualizada: ${user.email}`);

        } catch (error) {
            console.error('❌ Error al cambiar contraseña:', error);
            res.status(500).json({
                success: false,
                error: 'Error al cambiar contraseña'
            });
        }
    }
);

/**
 * GET /api/user/courses
 * Obtener cursos del usuario
 */
router.get('/courses',
    authenticate,
    async (req, res) => {
        try {
            const user = req.user;

            res.status(200).json({
                success: true,
                data: {
                    courses: user.coursesEnrolled || [],
                    total: user.coursesEnrolled?.length || 0
                }
            });

        } catch (error) {
            console.error('❌ Error al obtener cursos:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener cursos'
            });
        }
    }
);

/**
 * POST /api/user/enroll
 * Enrollar usuario en un curso
 */
router.post('/enroll',
    authenticate,
    [
        body('courseId')
            .notEmpty().withMessage('El ID del curso es obligatorio'),
        body('courseName')
            .notEmpty().withMessage('El nombre del curso es obligatorio')
    ],
    async (req, res) => {
        try {
            // 1. Validar entrada
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array().map(err => ({
                        field: err.path,
                        message: err.msg
                    }))
                });
            }

            const { courseId, courseName } = req.body;
            const user = req.user;

            // 2. Enrollar en curso
            try {
                await user.enrollInCourse(courseId, courseName);
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }

            res.status(200).json({
                success: true,
                message: 'Inscripción exitosa',
                data: {
                    courses: user.coursesEnrolled
                }
            });

            console.log(`✅ Usuario inscrito en curso: ${user.email} → ${courseName}`);

        } catch (error) {
            console.error('❌ Error al enrollar en curso:', error);
            res.status(500).json({
                success: false,
                error: 'Error al inscribirse en el curso'
            });
        }
    }
);

/**
 * GET /api/user/membership
 * Obtener información de membresía
 */
router.get('/membership',
    authenticate,
    async (req, res) => {
        try {
            const user = req.user;

            res.status(200).json({
                success: true,
                data: {
                    status: user.membershipStatus,
                    isActive: user.isMembershipActive(),
                    startDate: user.membershipStartDate,
                    expiryDate: user.membershipExpiryDate,
                    daysUntilExpiry: user.daysUntilExpiry
                }
            });

        } catch (error) {
            console.error('❌ Error al obtener membresía:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener información de membresía'
            });
        }
    }
);

/**
 * POST /api/user/renew-membership
 * Renovar membresía (normalmente se hace via pago Stripe)
 */
router.post('/renew-membership',
    authenticate,
    async (req, res) => {
        try {
            const user = req.user;
            const { durationMonths = 12 } = req.body;

            await user.renewMembership(durationMonths);

            res.status(200).json({
                success: true,
                message: 'Membresía renovada exitosamente',
                data: {
                    status: user.membershipStatus,
                    expiryDate: user.membershipExpiryDate
                }
            });

            console.log(`✅ Membresía renovada: ${user.email}`);

        } catch (error) {
            console.error('❌ Error al renovar membresía:', error);
            res.status(500).json({
                success: false,
                error: 'Error al renovar membresía'
            });
        }
    }
);

// ==================== RUTAS DE ADMINISTRADOR ====================

/**
 * GET /api/user/all
 * Obtener todos los usuarios (solo admin)
 */
router.get('/all',
    authenticate,
    requireAdmin,
    async (req, res) => {
        try {
            const { page = 1, limit = 50, role, membershipStatus } = req.query;

            // Construir filtro
            const filter = {};
            if (role) filter.role = role;
            if (membershipStatus) filter.membershipStatus = membershipStatus;

            // Paginación
            const skip = (page - 1) * limit;

            const users = await User.find(filter)
                .select('-password -refreshTokens')
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .skip(skip);

            const total = await User.countDocuments(filter);

            res.status(200).json({
                success: true,
                data: {
                    users: users.map(u => u.toPublicJSON()),
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            });

        } catch (error) {
            console.error('❌ Error al obtener usuarios:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener usuarios'
            });
        }
    }
);

/**
 * GET /api/user/stats
 * Obtener estadísticas de usuarios (solo admin)
 */
router.get('/stats',
    authenticate,
    requireAdmin,
    async (req, res) => {
        try {
            const stats = await User.getStats();

            res.status(200).json({
                success: true,
                data: stats
            });

        } catch (error) {
            console.error('❌ Error al obtener estadísticas:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener estadísticas'
            });
        }
    }
);

/**
 * PUT /api/user/:userId/role
 * Actualizar rol de usuario (solo admin)
 */
router.put('/:userId/role',
    authenticate,
    requireAdmin,
    [
        body('role')
            .notEmpty().withMessage('El rol es obligatorio')
            .isIn(['afiliado', 'admin']).withMessage('Rol inválido')
    ],
    async (req, res) => {
        try {
            const { userId } = req.params;
            const { role } = req.body;

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'Usuario no encontrado'
                });
            }

            user.role = role;
            await user.save();

            res.status(200).json({
                success: true,
                message: 'Rol actualizado exitosamente',
                data: {
                    user: user.toPublicJSON()
                }
            });

            console.log(`✅ Rol actualizado: ${user.email} → ${role}`);

        } catch (error) {
            console.error('❌ Error al actualizar rol:', error);
            res.status(500).json({
                success: false,
                error: 'Error al actualizar rol'
            });
        }
    }
);

/**
 * PUT /api/user/:userId/status
 * Activar/Desactivar usuario (solo admin)
 */
router.put('/:userId/status',
    authenticate,
    requireAdmin,
    [
        body('isActive')
            .isBoolean().withMessage('isActive debe ser un booleano')
    ],
    async (req, res) => {
        try {
            const { userId } = req.params;
            const { isActive } = req.body;

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'Usuario no encontrado'
                });
            }

            user.isActive = isActive;

            // Si se desactiva, invalidar todos los tokens
            if (!isActive) {
                user.refreshTokens = [];
            }

            await user.save();

            res.status(200).json({
                success: true,
                message: `Usuario ${isActive ? 'activado' : 'desactivado'} exitosamente`,
                data: {
                    user: user.toPublicJSON()
                }
            });

            console.log(`✅ Usuario ${isActive ? 'activado' : 'desactivado'}: ${user.email}`);

        } catch (error) {
            console.error('❌ Error al actualizar estado:', error);
            res.status(500).json({
                success: false,
                error: 'Error al actualizar estado del usuario'
            });
        }
    }
);

/**
 * DELETE /api/user/:userId
 * Eliminar usuario (solo admin)
 */
router.delete('/:userId',
    authenticate,
    requireAdmin,
    async (req, res) => {
        try {
            const { userId } = req.params;

            // No permitir auto-eliminación
            if (userId === req.user._id.toString()) {
                return res.status(400).json({
                    success: false,
                    error: 'No puedes eliminar tu propia cuenta'
                });
            }

            const user = await User.findByIdAndDelete(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'Usuario no encontrado'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Usuario eliminado exitosamente'
            });

            console.log(`✅ Usuario eliminado: ${user.email}`);

        } catch (error) {
            console.error('❌ Error al eliminar usuario:', error);
            res.status(500).json({
                success: false,
                error: 'Error al eliminar usuario'
            });
        }
    }
);

module.exports = router;
