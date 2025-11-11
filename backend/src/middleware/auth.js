/**
 * Middleware de Autenticación JWT
 * Verifica y valida tokens JWT para proteger rutas
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// SECURITY: JWT_SECRET must be configured via environment variable
if (!process.env.JWT_SECRET) {
    throw new Error(
        '❌ JWT_SECRET no configurada.\n' +
        'Esta variable es REQUERIDA para producción.\n' +
        'Genera una con: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"\n' +
        'Y configúrala en Vercel → Settings → Environment Variables'
    );
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

/**
 * Genera un access token JWT
 */
const generateAccessToken = (userId, email, role) => {
    return jwt.sign(
        {
            userId,
            email,
            role,
            type: 'access'
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

/**
 * Genera un refresh token JWT
 */
const generateRefreshToken = (userId, email) => {
    return jwt.sign(
        {
            userId,
            email,
            type: 'refresh'
        },
        JWT_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );
};

/**
 * Middleware: Autenticar usuario con JWT
 * Uso: router.get('/protected', authenticate, (req, res) => { ... })
 */
const authenticate = async (req, res, next) => {
    try {
        // 1. Obtener token del header Authorization
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'No se proporcionó token de autenticación'
            });
        }

        const token = authHeader.substring(7); // Remover "Bearer "

        // 2. Verificar token
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token expirado',
                    code: 'TOKEN_EXPIRED'
                });
            }
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token inválido',
                    code: 'TOKEN_INVALID'
                });
            }
            throw error;
        }

        // 3. Verificar que sea un access token
        if (decoded.type !== 'access') {
            return res.status(401).json({
                success: false,
                error: 'Tipo de token inválido'
            });
        }

        // 4. Buscar usuario en la base de datos
        const user = await User.findById(decoded.userId).select('-password -refreshTokens');

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        // 5. Verificar que el usuario esté activo
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                error: 'Cuenta desactivada'
            });
        }

        // 6. Adjuntar usuario al request
        req.user = user;
        req.userId = user._id;
        req.userRole = user.role;

        next();
    } catch (error) {
        console.error('Error en middleware de autenticación:', error);
        res.status(500).json({
            success: false,
            error: 'Error al verificar autenticación'
        });
    }
};

/**
 * Middleware: Verificar que el usuario sea administrador
 * Uso: router.get('/admin', authenticate, requireAdmin, (req, res) => { ... })
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Autenticación requerida'
        });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Se requieren permisos de administrador'
        });
    }

    next();
};

/**
 * Middleware: Verificar que el usuario sea afiliado
 */
const requireAfiliado = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Autenticación requerida'
        });
    }

    if (req.user.role !== 'afiliado' && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Se requiere ser afiliado'
        });
    }

    next();
};

/**
 * Middleware: Verificar que la membresía esté activa
 */
const requireActiveMembership = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Autenticación requerida'
        });
    }

    if (!req.user.isMembershipActive()) {
        return res.status(403).json({
            success: false,
            error: 'Membresía no activa o expirada'
        });
    }

    next();
};

/**
 * Middleware opcional: Autenticar pero no requerir
 * Útil para rutas que tienen contenido público y privado
 */
const optionalAuthenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // No hay token, continuar sin autenticación
            req.user = null;
            return next();
        }

        const token = authHeader.substring(7);

        try {
            const decoded = jwt.verify(token, JWT_SECRET);

            if (decoded.type === 'access') {
                const user = await User.findById(decoded.userId).select('-password -refreshTokens');
                if (user && user.isActive) {
                    req.user = user;
                    req.userId = user._id;
                    req.userRole = user.role;
                }
            }
        } catch (error) {
            // Token inválido o expirado, continuar sin autenticación
            req.user = null;
        }

        next();
    } catch (error) {
        console.error('Error en middleware de autenticación opcional:', error);
        req.user = null;
        next();
    }
};

/**
 * Verificar token (sin buscar usuario en DB)
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

module.exports = {
    authenticate,
    requireAdmin,
    requireAfiliado,
    requireActiveMembership,
    optionalAuthenticate,
    generateAccessToken,
    generateRefreshToken,
    verifyToken,
    JWT_SECRET,
    JWT_EXPIRES_IN,
    JWT_REFRESH_EXPIRES_IN
};
