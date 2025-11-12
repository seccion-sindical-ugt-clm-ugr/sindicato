/**
 * Rutas de Administración
 * Endpoints protegidos para administradores
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Document = require('../models/Document');

// Todas las rutas requieren autenticación y rol de admin
router.use(authenticate);
router.use(requireAdmin);

/**
 * GET /api/admin/stats
 * Obtener estadísticas generales del sistema
 */
router.get('/stats', async (req, res) => {
    try {
        // 1. Estadísticas de usuarios
        const userStats = await User.getStats();

        // 2. Calcular inscripciones a cursos
        const allUsers = await User.find({}).select('coursesEnrolled paymentHistory');

        let totalEnrollments = 0;
        const courseEnrollments = {};

        allUsers.forEach(user => {
            if (user.coursesEnrolled && user.coursesEnrolled.length > 0) {
                user.coursesEnrolled.forEach(course => {
                    totalEnrollments++;

                    // Contar por tipo de curso
                    const courseName = course.courseName || 'Sin nombre';
                    if (!courseEnrollments[courseName]) {
                        courseEnrollments[courseName] = {
                            name: courseName,
                            count: 0,
                            enrolled: 0,
                            inProgress: 0,
                            completed: 0
                        };
                    }

                    courseEnrollments[courseName].count++;

                    // Contar por estado
                    if (course.status === 'enrolled') courseEnrollments[courseName].enrolled++;
                    else if (course.status === 'in-progress') courseEnrollments[courseName].inProgress++;
                    else if (course.status === 'completed') courseEnrollments[courseName].completed++;
                });
            }
        });

        // 3. Calcular ingresos totales y mensuales
        let totalRevenue = 0;
        let monthlyRevenue = 0;
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        allUsers.forEach(user => {
            if (user.paymentHistory && user.paymentHistory.length > 0) {
                user.paymentHistory.forEach(payment => {
                    if (payment.status === 'completed' && payment.amount) {
                        totalRevenue += payment.amount;

                        // Solo sumar pagos del mes actual
                        if (payment.date && new Date(payment.date) >= firstDayOfMonth) {
                            monthlyRevenue += payment.amount;
                        }
                    }
                });
            }
        });

        // 4. Calcular crecimiento mensual (afiliados)
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const usersThisMonth = await User.countDocuments({
            createdAt: { $gte: firstDayOfMonth }
        });

        const usersLastMonth = await User.countDocuments({
            createdAt: {
                $gte: lastMonth,
                $lt: firstDayOfMonth
            }
        });

        let growthPercentage = 0;
        if (usersLastMonth > 0) {
            growthPercentage = Math.round(((usersThisMonth - usersLastMonth) / usersLastMonth) * 100);
        } else if (usersThisMonth > 0) {
            growthPercentage = 100;
        }

        // 5. Obtener usuarios recientes (últimos 30 días)
        const recentUsers = await User.getByPeriod(30);

        res.json({
            success: true,
            data: {
                users: {
                    total: userStats.total || 0,
                    active: userStats.activos || 0,
                    affiliates: userStats.afiliados || 0,
                    admins: userStats.admins || 0,
                    activeMembers: userStats.membershipActivo || 0,
                    pendingMembers: userStats.membershipPendiente || 0,
                    emailVerified: userStats.emailVerificados || 0,
                    newThisMonth: usersThisMonth,
                    newLastMonth: usersLastMonth
                },
                courses: {
                    totalEnrollments,
                    byType: Object.values(courseEnrollments)
                },
                revenue: {
                    total: totalRevenue,
                    monthly: monthlyRevenue,
                    currency: 'EUR'
                },
                growth: {
                    percentage: growthPercentage,
                    direction: growthPercentage >= 0 ? 'up' : 'down'
                },
                recentUsers: recentUsers.length
            }
        });

    } catch (error) {
        console.error('Error obteniendo estadísticas admin:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas'
        });
    }
});

/**
 * GET /api/admin/users
 * Listar todos los usuarios con paginación
 */
router.get('/users', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Filtros opcionales
        const filters = {};
        if (req.query.role) filters.role = req.query.role;
        if (req.query.membershipStatus) filters.membershipStatus = req.query.membershipStatus;
        if (req.query.isActive !== undefined) filters.isActive = req.query.isActive === 'true';

        const users = await User.find(filters)
            .select('-password -refreshTokens -resetPasswordToken -resetPasswordExpires -emailVerificationToken')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);

        const total = await User.countDocuments(filters);

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Error listando usuarios:', error);
        res.status(500).json({
            success: false,
            error: 'Error al listar usuarios'
        });
    }
});

/**
 * GET /api/admin/users/:id
 * Obtener detalles de un usuario específico
 */
router.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password -refreshTokens')
            .populate('documents');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error('Error obteniendo usuario:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener usuario'
        });
    }
});

/**
 * GET /api/admin/enrollments
 * Obtener todas las inscripciones a cursos
 */
router.get('/enrollments', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;

        // Obtener todos los usuarios con inscripciones
        const usersWithEnrollments = await User.find({
            'coursesEnrolled.0': { $exists: true }
        })
        .select('nombre email departamento coursesEnrolled paymentHistory')
        .sort({ 'coursesEnrolled.enrollmentDate': -1 });

        // Transformar a lista plana de inscripciones
        const enrollments = [];
        usersWithEnrollments.forEach(user => {
            user.coursesEnrolled.forEach(course => {
                // Buscar el pago asociado a este curso
                const payment = user.paymentHistory.find(p =>
                    p.description && p.description.includes(course.courseName)
                );

                enrollments.push({
                    enrollmentId: course._id,
                    user: {
                        id: user._id,
                        name: user.nombre,
                        email: user.email,
                        department: user.departamento
                    },
                    course: {
                        id: course.courseId,
                        name: course.courseName,
                        enrollmentDate: course.enrollmentDate,
                        status: course.status
                    },
                    payment: payment ? {
                        amount: payment.amount,
                        currency: payment.currency,
                        date: payment.date,
                        status: payment.status
                    } : null
                });
            });
        });

        // Paginar los resultados
        const total = enrollments.length;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedEnrollments = enrollments.slice(startIndex, endIndex);

        res.json({
            success: true,
            data: {
                enrollments: paginatedEnrollments,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Error obteniendo inscripciones:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener inscripciones'
        });
    }
});

/**
 * GET /api/admin/recent
 * Obtener actividad reciente (afiliados y cursos)
 */
router.get('/recent', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;

        // Usuarios recientes
        const recentUsers = await User.getByPeriod(days);

        // Inscripciones recientes
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const usersWithRecentEnrollments = await User.find({
            'coursesEnrolled.enrollmentDate': { $gte: startDate }
        })
        .select('nombre email coursesEnrolled')
        .sort({ 'coursesEnrolled.enrollmentDate': -1 });

        const recentEnrollments = [];
        usersWithRecentEnrollments.forEach(user => {
            user.coursesEnrolled.forEach(course => {
                if (course.enrollmentDate >= startDate) {
                    recentEnrollments.push({
                        user: {
                            name: user.nombre,
                            email: user.email
                        },
                        course: {
                            name: course.courseName,
                            enrollmentDate: course.enrollmentDate,
                            status: course.status
                        }
                    });
                }
            });
        });

        // Ordenar por fecha
        recentEnrollments.sort((a, b) =>
            new Date(b.course.enrollmentDate) - new Date(a.course.enrollmentDate)
        );

        res.json({
            success: true,
            data: {
                users: recentUsers.slice(0, 10).map(u => u.toPublicJSON()),
                enrollments: recentEnrollments.slice(0, 10)
            }
        });

    } catch (error) {
        console.error('Error obteniendo actividad reciente:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener actividad reciente'
        });
    }
});

module.exports = router;
