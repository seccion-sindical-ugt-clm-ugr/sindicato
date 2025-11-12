const { body, validationResult } = require('express-validator');

/**
 * Validadores para endpoints de autenticación
 */

// Validador para login
const validateLogin = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email inválido'),

    body('password')
        .isLength({ min: 6 })
        .withMessage('La contraseña debe tener al menos 6 caracteres'),

    // Middleware para manejar errores de validación
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Datos inválidos',
                details: errors.array().map(err => ({
                    field: err.path,
                    message: err.msg
                }))
            });
        }
        next();
    }
];

// Validador para registro
const validateRegister = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email inválido'),

    body('password')
        .isLength({ min: 6 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('La contraseña debe tener al menos 6 caracteres, incluir mayúscula, minúscula y número'),

    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres'),

    body('phone')
        .optional()
        .isMobilePhone('es-ES')
        .withMessage('Formato de teléfono inválido'),

    body('department')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('El departamento no puede exceder 100 caracteres'),

    // Middleware para manejar errores
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Datos inválidos',
                details: errors.array().map(err => ({
                    field: err.path,
                    message: err.msg
                }))
            });
        }
        next();
    }
];

// Validador para cambio de contraseña
const validateChangePassword = [
    body('currentPassword')
        .notEmpty()
        .withMessage('La contraseña actual es requerida'),

    body('newPassword')
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('La nueva contraseña debe tener al menos 8 caracteres, incluir mayúscula, minúscula, número y carácter especial'),

    // Middleware para manejar errores
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Datos inválidos',
                details: errors.array().map(err => ({
                    field: err.path,
                    message: err.msg
                }))
            });
        }
        next();
    }
];

// Validador para actualización de perfil
const validateProfileUpdate = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres'),

    body('phone')
        .optional()
        .isMobilePhone('es-ES')
        .withMessage('Formato de teléfono inválido'),

    body('department')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('El departamento no puede exceder 100 caracteres'),

    body('notifications')
        .optional()
        .isBoolean()
        .withMessage('El valor de notificaciones debe ser verdadero o falso'),

    body('publicProfile')
        .optional()
        .isBoolean()
        .withMessage('El valor de perfil público debe ser verdadero o falso'),

    // Middleware para manejar errores
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Datos inválidos',
                details: errors.array().map(err => ({
                    field: err.path,
                    message: err.msg
                }))
            });
        }
        next();
    }
];

// Validador para contacto
const validateContact = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres'),

    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email inválido'),

    body('message')
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage('El mensaje debe tener entre 10 y 2000 caracteres'),

    body('phone')
        .optional()
        .isMobilePhone('es-ES')
        .withMessage('Formato de teléfono inválido'),

    body('subject')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('El asunto no puede exceder 200 caracteres'),

    // Middleware para manejar errores
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Datos inválidos',
                details: errors.array().map(err => ({
                    field: err.path,
                    message: err.msg
                }))
            });
        }
        next();
    }
];

// Validador para preinscripción a cursos
const validateCoursePreinscription = [
    body('courseId')
        .notEmpty()
        .withMessage('El ID del curso es requerido'),

    body('userData.name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres'),

    body('userData.email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email inválido'),

    body('userData.phone')
        .optional()
        .isMobilePhone('es-ES')
        .withMessage('Formato de teléfono inválido'),

    body('userData.department')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('El departamento no puede exceder 100 caracteres'),

    // Middleware para manejar errores
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Datos inválidos',
                details: errors.array().map(err => ({
                    field: err.path,
                    message: err.msg
                }))
            });
        }
        next();
    }
];

module.exports = {
    validateLogin,
    validateRegister,
    validateChangePassword,
    validateProfileUpdate,
    validateContact,
    validateCoursePreinscription
};