/**
 * Ruta para completar registro después del pago
 * El usuario recibe un email con un link para crear su contraseña
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Document = require('../models/Document');
const { generateAccessToken, generateRefreshToken } = require('../middleware/auth');
const { generateCertificadoAfiliado, generateFichaAfiliacion } = require('../services/pdfService');

/**
 * POST /api/complete-registration
 * Completar registro con contraseña después del pago
 */
router.post('/complete-registration',
    [
        body('email')
            .trim()
            .notEmpty().withMessage('El email es obligatorio')
            .isEmail().withMessage('Email inválido')
            .normalizeEmail(),
        body('password')
            .notEmpty().withMessage('La contraseña es obligatoria')
            .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
        body('sessionId')
            .notEmpty().withMessage('El ID de sesión es obligatorio')
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

            const { email, password, sessionId } = req.body;

            // 2. Verificar si ya existe un usuario con este email
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    error: 'Este email ya está registrado. Por favor inicia sesión.'
                });
            }

            // 3. Aquí deberías verificar que el sessionId corresponde a un pago exitoso
            // Por ahora, vamos a asumir que viene desde success.html después de un pago válido
            // En producción, deberías verificar con Stripe que el pago fue exitoso

            // 4. Buscar datos pendientes de registro en algún lugar temporal
            // (Esto lo implementaremos cuando modifiquemos el webhook)
            // Por ahora, vamos a requerir que vengan todos los datos

            // 5. Crear el usuario
            const { nombre, telefono, departamento } = req.body;

            if (!nombre) {
                return res.status(400).json({
                    success: false,
                    error: 'El nombre es obligatorio'
                });
            }

            const user = new User({
                nombre,
                email,
                password,
                telefono: telefono || '',
                departamento: departamento || '',
                role: 'afiliado',
                membershipStatus: 'activo', // Ya pagó
                membershipStartDate: new Date(),
                membershipExpiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // +1 año
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.headers['user-agent']
            });

            await user.save();

            // 6. Generar tokens
            const accessToken = generateAccessToken(user._id, user.email, user.role);
            const refreshToken = generateRefreshToken(user._id, user.email);

            // 7. Guardar refresh token
            const refreshTokenExpiry = new Date();
            refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 30);

            user.refreshTokens.push({
                token: refreshToken,
                expiresAt: refreshTokenExpiry
            });
            await user.save();

            // 8. Auto-generar documentos de afiliación
            try {
                console.log('📄 Generando documentos iniciales para nuevo afiliado...');

                // Generar Ficha de Afiliación
                const fichaResult = await generateFichaAfiliacion(user);
                const fichaDocument = new Document({
                    userId: user._id,
                    type: 'ficha-afiliacion',
                    title: 'Ficha de Afiliación',
                    description: `Ficha de afiliación de ${user.nombre}`,
                    fileData: fichaResult.fileData,
                    fileSize: fichaResult.fileSize
                });
                await fichaDocument.save();

                // Generar Certificado de Afiliado
                const certificadoResult = await generateCertificadoAfiliado(user);
                const certificadoDocument = new Document({
                    userId: user._id,
                    type: 'certificado-afiliado',
                    title: 'Certificado de Afiliación',
                    description: `Certificado de afiliación para ${user.nombre}`,
                    fileData: certificadoResult.fileData,
                    fileSize: certificadoResult.fileSize
                });
                await certificadoDocument.save();

                // Agregar documentos al usuario
                user.documents.push(fichaDocument._id, certificadoDocument._id);
                await user.save();

                console.log(`✅ Documentos generados: Ficha (${fichaDocument._id}) y Certificado (${certificadoDocument._id})`);

            } catch (docError) {
                console.error('⚠️ Error generando documentos iniciales:', docError.message);
                // No fallar el registro si hay error en documentos
            }

            // 9. Enviar respuesta
            res.status(201).json({
                success: true,
                message: '¡Registro completado! Ya puedes iniciar sesión',
                data: {
                    user: user.toPublicJSON(),
                    accessToken,
                    refreshToken,
                    tokenType: 'Bearer'
                }
            });

            console.log(`✅ Registro completado para: ${email} (Sesión Stripe: ${sessionId})`);

        } catch (error) {
            console.error('❌ Error al completar registro:', error);
            res.status(500).json({
                success: false,
                error: 'Error al completar el registro'
            });
        }
    }
);

module.exports = router;
