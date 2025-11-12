const jwt = require('jsonwebtoken');
const User = require('../../models').User;

/**
 * Middleware de autenticación JWT
 * Verifica el token y añade el usuario al request
 */
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token de autenticación requerido'
            });
        }

        // Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ugt-secret-2024');

        // Buscar usuario en la base de datos
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        if (user.status !== 'active') {
            return res.status(401).json({
                success: false,
                error: 'Cuenta de usuario inactiva'
            });
        }

        // Añadir usuario al request
        req.user = user;
        req.userId = user._id;

        next();
    } catch (error) {
        console.error('Error en autenticación:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Token inválido'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expirado'
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Error en autenticación'
        });
    }
};

/**
 * Middleware para verificar si es admin
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Usuario no autenticado'
        });
    }

    if (!req.user.admin && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Se requieren privilegios de administrador'
        });
    }

    next();
};

/**
 * Middleware opcional (no lanza error si no hay token)
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ugt-secret-2024');
            const user = await User.findById(decoded.userId).select('-password');

            if (user && user.status === 'active') {
                req.user = user;
                req.userId = user._id;
            }
        }

        next();
    } catch (error) {
        // Ignorar errores de autenticación opcional
        next();
    }
};

/**
 * Generar token JWT
 */
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET || 'ugt-secret-2024',
        { expiresIn: '24h' }
    );
};

/**
 * Verificar token sin middleware
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET || 'ugt-secret-2024');
    } catch (error) {
        return null;
    }
};

module.exports = {
    authenticateToken,
    requireAdmin,
    optionalAuth,
    generateToken,
    verifyToken
};