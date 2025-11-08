/**
 * Rutas de Autenticación
 * Maneja registro, login, logout y refresh de tokens
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const {
    generateAccessToken,
    generateRefreshToken,
    verifyToken,
    authenticate,
    JWT_REFRESH_EXPIRES_IN
} = require('../middleware/auth');

// Rate limiting para prevenir ataques de fuerza bruta
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // 10 intentos por ventana
    message: { success: false, error: 'Demasiados intentos, intenta de nuevo en 15 minutos' },
    standardHeaders: true,
    legacyHeaders: false,
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 5, // 5 registros por hora
    message: { success: false, error: 'Demasiados registros desde esta IP, intenta más tarde' }
});

/**
 * POST /api/auth/register
 * Registrar nuevo usuario
 */
router.post('/register',
    registerLimiter,
    [
        body('nombre')
            .trim()
            .notEmpty().withMessage('El nombre es obligatorio')
            .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
        body('email')
            .trim()
            .notEmpty().withMessage('El email es obligatorio')
            .isEmail().withMessage('Email inválido')
            .normalizeEmail(),
        body('password')
            .notEmpty().withMessage('La contraseña es obligatoria')
            .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
        body('telefono')
            .optional()
            .trim()
            .matches(/^[0-9]{9,15}$/).withMessage('Teléfono inválido'),
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

            const { nombre, email, password, telefono, departamento } = req.body;

            // 2. Verificar si el usuario ya existe
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    error: 'El email ya está registrado'
                });
            }

            // 3. Crear nuevo usuario
            const user = new User({
                nombre,
                email,
                password, // Se hasheará automáticamente por el middleware del modelo
                telefono,
                departamento,
                role: 'afiliado', // Por defecto todos son afiliados
                membershipStatus: 'pendiente', // Pendiente hasta que paguen
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.headers['user-agent']
            });

            await user.save();

            // 4. Generar tokens
            const accessToken = generateAccessToken(user._id, user.email, user.role);
            const refreshToken = generateRefreshToken(user._id, user.email);

            // 5. Guardar refresh token en el usuario
            const refreshTokenExpiry = new Date();
            refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 30); // 30 días

            user.refreshTokens.push({
                token: refreshToken,
                expiresAt: refreshTokenExpiry
            });
            await user.save();

            // 6. Enviar respuesta
            res.status(201).json({
                success: true,
                message: 'Usuario registrado exitosamente',
                data: {
                    user: user.toPublicJSON(),
                    accessToken,
                    refreshToken,
                    tokenType: 'Bearer'
                }
            });

            console.log(`✅ Nuevo usuario registrado: ${email}`);

        } catch (error) {
            console.error('❌ Error en registro:', error);
            res.status(500).json({
                success: false,
                error: 'Error al registrar usuario'
            });
        }
    }
);

/**
 * POST /api/auth/login
 * Iniciar sesión
 */
router.post('/login',
    authLimiter,
    [
        body('email')
            .trim()
            .notEmpty().withMessage('El email es obligatorio')
            .isEmail().withMessage('Email inválido')
            .normalizeEmail(),
        body('password')
            .notEmpty().withMessage('La contraseña es obligatoria')
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

            const { email, password } = req.body;

            // 2. Buscar usuario
            const user = await User.findByEmail(email);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Credenciales inválidas'
                });
            }

            // 3. Verificar que el usuario esté activo
            if (!user.isActive) {
                return res.status(403).json({
                    success: false,
                    error: 'Cuenta desactivada. Contacta con el administrador'
                });
            }

            // 4. Comparar contraseña
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    error: 'Credenciales inválidas'
                });
            }

            // 5. Generar tokens
            const accessToken = generateAccessToken(user._id, user.email, user.role);
            const refreshToken = generateRefreshToken(user._id, user.email);

            // 6. Guardar refresh token
            const refreshTokenExpiry = new Date();
            refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 30);

            user.refreshTokens.push({
                token: refreshToken,
                expiresAt: refreshTokenExpiry
            });

            // Limitar a 5 refresh tokens por usuario (limpiar antiguos)
            if (user.refreshTokens.length > 5) {
                user.refreshTokens = user.refreshTokens.slice(-5);
            }

            // 7. Actualizar último login
            await user.updateLastLogin();

            // 8. Enviar respuesta
            res.status(200).json({
                success: true,
                message: 'Login exitoso',
                data: {
                    user: user.toPublicJSON(),
                    accessToken,
                    refreshToken,
                    tokenType: 'Bearer'
                }
            });

            console.log(`✅ Login exitoso: ${email}`);

        } catch (error) {
            console.error('❌ Error en login:', error);
            res.status(500).json({
                success: false,
                error: 'Error al iniciar sesión'
            });
        }
    }
);

/**
 * POST /api/auth/refresh
 * Refrescar access token usando refresh token
 */
router.post('/refresh',
    [
        body('refreshToken')
            .notEmpty().withMessage('El refresh token es obligatorio')
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

            const { refreshToken } = req.body;

            // 2. Verificar token
            const decoded = verifyToken(refreshToken);
            if (!decoded || decoded.type !== 'refresh') {
                return res.status(401).json({
                    success: false,
                    error: 'Refresh token inválido'
                });
            }

            // 3. Buscar usuario
            const user = await User.findById(decoded.userId);
            if (!user || !user.isActive) {
                return res.status(401).json({
                    success: false,
                    error: 'Usuario no encontrado o inactivo'
                });
            }

            // 4. Verificar que el refresh token esté en la lista del usuario
            const tokenExists = user.refreshTokens.some(
                t => t.token === refreshToken && t.expiresAt > new Date()
            );

            if (!tokenExists) {
                return res.status(401).json({
                    success: false,
                    error: 'Refresh token inválido o expirado'
                });
            }

            // 5. Generar nuevo access token
            const newAccessToken = generateAccessToken(user._id, user.email, user.role);

            // 6. Enviar respuesta
            res.status(200).json({
                success: true,
                message: 'Token refrescado exitosamente',
                data: {
                    accessToken: newAccessToken,
                    tokenType: 'Bearer'
                }
            });

        } catch (error) {
            console.error('❌ Error en refresh:', error);
            res.status(500).json({
                success: false,
                error: 'Error al refrescar token'
            });
        }
    }
);

/**
 * POST /api/auth/logout
 * Cerrar sesión (invalidar refresh token)
 */
router.post('/logout',
    authenticate,
    [
        body('refreshToken')
            .notEmpty().withMessage('El refresh token es obligatorio')
    ],
    async (req, res) => {
        try {
            const { refreshToken } = req.body;
            const user = req.user;

            // Eliminar el refresh token específico
            user.refreshTokens = user.refreshTokens.filter(
                t => t.token !== refreshToken
            );

            await user.save();

            res.status(200).json({
                success: true,
                message: 'Logout exitoso'
            });

            console.log(`✅ Logout exitoso: ${user.email}`);

        } catch (error) {
            console.error('❌ Error en logout:', error);
            res.status(500).json({
                success: false,
                error: 'Error al cerrar sesión'
            });
        }
    }
);

/**
 * POST /api/auth/logout-all
 * Cerrar todas las sesiones (invalidar todos los refresh tokens)
 */
router.post('/logout-all',
    authenticate,
    async (req, res) => {
        try {
            const user = req.user;

            // Eliminar todos los refresh tokens
            user.refreshTokens = [];
            await user.save();

            res.status(200).json({
                success: true,
                message: 'Todas las sesiones cerradas exitosamente'
            });

            console.log(`✅ Logout de todas las sesiones: ${user.email}`);

        } catch (error) {
            console.error('❌ Error en logout-all:', error);
            res.status(500).json({
                success: false,
                error: 'Error al cerrar sesiones'
            });
        }
    }
);

/**
 * GET /api/auth/me
 * Obtener información del usuario autenticado
 */
router.get('/me',
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
            console.error('❌ Error en /me:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener usuario'
            });
        }
    }
);

/**
 * POST /api/auth/verify-token
 * Verificar si un token es válido (sin autenticación requerida)
 */
router.post('/verify-token',
    [
        body('token')
            .notEmpty().withMessage('El token es obligatorio')
    ],
    async (req, res) => {
        try {
            const { token } = req.body;

            const decoded = verifyToken(token);

            if (!decoded) {
                return res.status(401).json({
                    success: false,
                    error: 'Token inválido'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Token válido',
                data: {
                    userId: decoded.userId,
                    email: decoded.email,
                    role: decoded.role,
                    type: decoded.type,
                    exp: decoded.exp
                }
            });

        } catch (error) {
            console.error('❌ Error en verify-token:', error);
            res.status(500).json({
                success: false,
                error: 'Error al verificar token'
            });
        }
    }
);

module.exports = router;
