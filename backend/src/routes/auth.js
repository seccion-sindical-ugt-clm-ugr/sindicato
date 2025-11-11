/**
 * Rutas de Autenticación
 * Maneja registro, login, logout y refresh de tokens
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const User = require('../models/User');
const {
    generateAccessToken,
    generateRefreshToken,
    verifyToken,
    authenticate,
    JWT_REFRESH_EXPIRES_IN
} = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../services/emailService');

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
            .custom((value) => {
                if (!value) return true; // Es opcional
                // Permitir espacios, guiones, paréntesis, puntos y +
                // Extraer solo dígitos
                const digitsOnly = value.replace(/[\s\-().+]/g, '');
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

/**
 * GET /api/auth/check-email
 * Verificar si un email ya está registrado (antes del pago)
 */
router.get('/check-email',
    async (req, res) => {
        try {
            const { email } = req.query;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    error: 'El email es obligatorio'
                });
            }

            const existingUser = await User.findByEmail(email);

            res.status(200).json({
                success: true,
                data: {
                    exists: !!existingUser,
                    email: email.toLowerCase()
                }
            });

        } catch (error) {
            console.error('❌ Error en check-email:', error);
            res.status(500).json({
                success: false,
                error: 'Error al verificar email'
            });
        }
    }
);

/**
 * POST /api/auth/forgot-password
 * Solicitar recuperación de contraseña
 */
router.post('/forgot-password',
    authLimiter,
    [
        body('email')
            .trim()
            .notEmpty().withMessage('El email es obligatorio')
            .isEmail().withMessage('Email inválido')
            .normalizeEmail()
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

            const { email } = req.body;

            // 2. Buscar usuario
            const user = await User.findByEmail(email);

            // Por seguridad, SIEMPRE devolver el mismo mensaje
            // (no revelar si el email existe o no)
            const securityMessage = 'Si el email está registrado, recibirás instrucciones para recuperar tu contraseña';

            if (!user) {
                console.log(`⚠️ Intento de recuperación para email no registrado: ${email}`);
                return res.status(200).json({
                    success: true,
                    message: securityMessage
                });
            }

            // 3. Generar token de reseteo
            const resetToken = crypto.randomBytes(32).toString('hex');

            // 4. Guardar token hasheado en la base de datos
            const resetTokenHash = crypto
                .createHash('sha256')
                .update(resetToken)
                .digest('hex');

            user.resetPasswordToken = resetTokenHash;
            user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

            await user.save();

            // 5. Enviar email con el token sin hashear
            try {
                await sendPasswordResetEmail(user, resetToken);
                console.log(`✅ Email de recuperación enviado a: ${email}`);
            } catch (emailError) {
                console.error('❌ Error enviando email:', emailError);
                // Limpiar token si el email falla
                user.resetPasswordToken = null;
                user.resetPasswordExpires = null;
                await user.save();

                return res.status(500).json({
                    success: false,
                    error: 'Error al enviar el email. Inténtalo de nuevo más tarde.'
                });
            }

            // 6. Respuesta
            res.status(200).json({
                success: true,
                message: securityMessage
            });

        } catch (error) {
            console.error('❌ Error en forgot-password:', error);
            res.status(500).json({
                success: false,
                error: 'Error al procesar la solicitud'
            });
        }
    }
);

/**
 * POST /api/auth/reset-password
 * Restablecer contraseña usando el token
 */
router.post('/reset-password',
    [
        body('token')
            .notEmpty().withMessage('El token es obligatorio'),
        body('newPassword')
            .notEmpty().withMessage('La nueva contraseña es obligatoria')
            .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
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

            const { token, newPassword } = req.body;

            // 2. Hashear token para comparar con la BD
            const resetTokenHash = crypto
                .createHash('sha256')
                .update(token)
                .digest('hex');

            // 3. Buscar usuario con token válido
            const user = await User.findOne({
                resetPasswordToken: resetTokenHash,
                resetPasswordExpires: { $gt: Date.now() }
            });

            if (!user) {
                return res.status(400).json({
                    success: false,
                    error: 'Token inválido o expirado'
                });
            }

            // 4. Actualizar contraseña
            user.password = newPassword; // Se hasheará automáticamente
            user.resetPasswordToken = null;
            user.resetPasswordExpires = null;

            // 5. Invalidar todos los refresh tokens por seguridad
            user.refreshTokens = [];

            await user.save();

            console.log(`✅ Contraseña restablecida para: ${user.email}`);

            // 6. Respuesta
            res.status(200).json({
                success: true,
                message: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión.'
            });

        } catch (error) {
            console.error('❌ Error en reset-password:', error);
            res.status(500).json({
                success: false,
                error: 'Error al restablecer contraseña'
            });
        }
    }
);

module.exports = router;
