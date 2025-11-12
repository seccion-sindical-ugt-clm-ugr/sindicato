const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Importar modelos y middleware
const User = require('../models/User');
const { authenticateToken, generateToken } = require('../middleware/auth');
const { validateLogin, validateRegister, validateChangePassword } = require('../middleware/validators');

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión de usuario
 * @access  Public
 */
router.post('/login', validateLogin, async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log(`🔐 Intento de login: ${email}`);

        // Buscar usuario por email
        const user = await User.findOne({ email });

        if (!user) {
            console.log(`❌ Login fallido: Usuario no encontrado - ${email}`);
            return res.status(401).json({
                success: false,
                error: 'Email o contraseña incorrectos'
            });
        }

        // Verificar estado del usuario
        if (user.status !== 'active') {
            console.log(`❌ Login fallido: Usuario inactivo - ${email}`);
            return res.status(401).json({
                success: false,
                error: 'Cuenta de usuario inactiva. Contacta con el administrador.'
            });
        }

        // Verificar contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            console.log(`❌ Login fallido: Contraseña incorrecta - ${email}`);
            return res.status(401).json({
                success: false,
                error: 'Email o contraseña incorrectos'
            });
        }

        // Generar token JWT
        const token = generateToken(user._id);

        // Preparar datos del usuario para respuesta
        const userResponse = {
            _id: user._id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            department: user.department,
            member: user.member,
            notifications: user.notifications,
            publicProfile: user.publicProfile,
            profilePhoto: user.profilePhoto,
            role: user.role,
            registrationDate: user.registrationDate,
            lastLogin: new Date()
        };

        // Actualizar último login
        await User.findByIdAndUpdate(user._id, {
            lastLogin: new Date(),
            loginCount: (user.loginCount || 0) + 1
        });

        console.log(`✅ Login exitoso: ${user.name} (${email})`);

        res.json({
            success: true,
            user: userResponse,
            token,
            message: 'Inicio de sesión exitoso'
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            error: 'Error al iniciar sesión'
        });
    }
});

/**
 * @route   POST /api/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Public
 */
router.post('/register', validateRegister, async (req, res) => {
    try {
        const {
            email,
            password,
            name,
            phone,
            department,
            notifications = true,
            publicProfile = false,
            registeredFrom = 'website'
        } = req.body;

        console.log(`📝 Intento de registro: ${email}`);

        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            console.log(`❌ Registro fallido: Email ya existe - ${email}`);
            return res.status(409).json({
                success: false,
                error: 'El email ya está registrado. Inicia sesión o usa otro email.'
            });
        }

        // Encriptar contraseña
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Crear nuevo usuario
        const newUser = new User({
            email,
            password: hashedPassword,
            name,
            phone,
            department,
            member: true,
            notifications,
            publicProfile,
            profilePhoto: null,
            role: 'member',
            status: 'active',
            registrationDate: new Date(),
            lastLogin: new Date(),
            registeredFrom,
            loginCount: 1
        });

        // Guardar usuario en la base de datos
        const savedUser = await newUser.save();

        // Generar token JWT
        const token = generateToken(savedUser._id);

        // Preparar respuesta
        const userResponse = {
            _id: savedUser._id,
            email: savedUser.email,
            name: savedUser.name,
            phone: savedUser.phone,
            department: savedUser.department,
            member: savedUser.member,
            notifications: savedUser.notifications,
            publicProfile: savedUser.publicProfile,
            profilePhoto: savedUser.profilePhoto,
            role: savedUser.role,
            registrationDate: savedUser.registrationDate,
            lastLogin: savedUser.lastLogin
        };

        console.log(`✅ Registro exitoso: ${savedUser.name} (${email})`);

        res.status(201).json({
            success: true,
            user: userResponse,
            token,
            message: 'Usuario registrado correctamente'
        });

    } catch (error) {
        console.error('Error en registro:', error);

        if (error.code === 11000) {
            // Error de duplicado (clave única)
            return res.status(409).json({
                success: false,
                error: 'El email ya está registrado'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error al registrar usuario'
        });
    }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Cerrar sesión (cliente debe eliminar el token)
 * @access  Private
 */
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        console.log(`🚪 Logout: ${req.user.email}`);

        // En JWT no se invalidan tokens del lado del servidor
        // El cliente debe eliminar el token

        res.json({
            success: true,
            message: 'Sesión cerrada correctamente'
        });

    } catch (error) {
        console.error('Error en logout:', error);
        res.status(500).json({
            success: false,
            error: 'Error al cerrar sesión'
        });
    }
});

/**
 * @route   GET /api/auth/verify
 * @desc    Verificar token y obtener datos del usuario
 * @access  Private
 */
router.get('/verify', authenticateToken, async (req, res) => {
    try {
        const user = req.user;

        // Preparar respuesta
        const userResponse = {
            _id: user._id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            department: user.department,
            member: user.member,
            notifications: user.notifications,
            publicProfile: user.publicProfile,
            profilePhoto: user.profilePhoto,
            role: user.role,
            registrationDate: user.registrationDate,
            lastLogin: user.lastLogin
        };

        console.log(`✅ Token verificado: ${user.email}`);

        res.json({
            success: true,
            user: userResponse,
            message: 'Token válido'
        });

    } catch (error) {
        console.error('Error en verificación:', error);
        res.status(500).json({
            success: false,
            error: 'Error al verificar token'
        });
    }
});

/**
 * @route   POST /api/auth/change-password
 * @desc    Cambiar contraseña del usuario
 * @access  Private
 */
router.post('/change-password', authenticateToken, validateChangePassword, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.userId;

        console.log(`🔐 Cambio de contraseña solicitado: ${req.user.email}`);

        // Obtener usuario con contraseña
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        // Verificar contraseña actual
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isCurrentPasswordValid) {
            console.log(`❌ Cambio de contraseña fallido: Contraseña actual incorrecta - ${req.user.email}`);
            return res.status(401).json({
                success: false,
                error: 'La contraseña actual es incorrecta'
            });
        }

        // Verificar que la nueva contraseña sea diferente
        const isSamePassword = await bcrypt.compare(newPassword, user.password);

        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                error: 'La nueva contraseña debe ser diferente a la actual'
            });
        }

        // Encriptar nueva contraseña
        const saltRounds = 12;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Actualizar contraseña
        await User.findByIdAndUpdate(userId, {
            password: hashedNewPassword,
            passwordChangedAt: new Date()
        });

        console.log(`✅ Contraseña actualizada: ${req.user.email}`);

        res.json({
            success: true,
            message: 'Contraseña actualizada correctamente'
        });

    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({
            success: false,
            error: 'Error al cambiar contraseña'
        });
    }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Solicitar recuperación de contraseña (placeholder para implementación futura)
 * @access  Public
 */
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        console.log(`📧 Solicitud de recuperación: ${email}`);

        // Por ahora, responder con mensaje genérico por seguridad
        res.json({
            success: true,
            message: 'Si el email está registrado, recibirás instrucciones para recuperar tu contraseña'
        });

        // TODO: Implementar sistema de recuperación por email
        // - Generar token temporal
        // - Enviar email con enlace
        // - Guardar token en base de datos con expiración

    } catch (error) {
        console.error('Error en recuperación:', error);
        res.status(500).json({
            success: false,
            error: 'Error al procesar la solicitud'
        });
    }
});

module.exports = router;