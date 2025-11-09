/**
 * Ruta para completar registro después del pago
 * El usuario viene desde success.html con sessionId de Stripe
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
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
        body('sessionId')
            .notEmpty().withMessage('El ID de sesión es obligatorio'),
        body('nombre')
            .trim()
            .notEmpty().withMessage('El nombre es obligatorio'),
        body('apellidos')
            .trim()
            .notEmpty().withMessage('Los apellidos son obligatorios'),
        body('password')
            .notEmpty().withMessage('La contraseña es obligatoria')
            .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
    ],
    async (req, res) => {
        try {
            // 1. Validar entrada
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                console.log('❌ Errores de validación:', errors.array());
                return res.status(400).json({
                    success: false,
                    error: 'Datos incompletos o inválidos',
                    errors: errors.array().map(err => ({
                        field: err.path,
                        message: err.msg
                    }))
                });
            }

            const { sessionId, nombre, apellidos, password } = req.body;

            console.log('🔄 Completando registro para sessionId:', sessionId);

            // 2. Obtener información de la sesión de Stripe
            let session;
            try {
                session = await stripe.checkout.sessions.retrieve(sessionId);
                console.log('✅ Sesión de Stripe recuperada:', session.customer_email);
            } catch (stripeError) {
                console.error('❌ Error obteniendo sesión de Stripe:', stripeError.message);
                return res.status(400).json({
                    success: false,
                    error: 'Sesión de pago inválida o expirada'
                });
            }

            const email = session.customer_email;
            const phone = session.customer_details?.phone || '';

            if (!email) {
                console.error('❌ No se pudo obtener email de la sesión');
                return res.status(400).json({
                    success: false,
                    error: 'No se pudo recuperar el email del pago'
                });
            }

            // 3. Verificar si ya existe un usuario con este email
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                console.log('⚠️ Usuario ya existe:', email);
                return res.status(409).json({
                    success: false,
                    error: 'Este email ya está registrado. Por favor inicia sesión.'
                });
            }

            // 4. Obtener metadata del pago
            const metadata = session.metadata || {};
            const paymentType = metadata.type || 'affiliation'; // 'affiliation' o 'course'
            const isMember = metadata.isMember === 'true';
            const departamento = metadata.department || session.custom_fields?.find(f => f.key === 'department')?.text?.value || '';

            // Determinar role y fechas según el tipo de pago
            let role, membershipStatus, membershipStartDate, membershipExpiryDate;

            if (paymentType === 'affiliation') {
                // Afiliación: crear usuario afiliado con membresía de 1 año
                role = 'afiliado';
                membershipStatus = 'activo';
                membershipStartDate = new Date();
                membershipExpiryDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
            } else if (paymentType === 'course' && isMember) {
                // Curso para afiliado: crear usuario afiliado
                role = 'afiliado';
                membershipStatus = 'activo';
                membershipStartDate = new Date();
                membershipExpiryDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
            } else {
                // Curso para externo: no debería llegar aquí, pero por si acaso
                console.log('⚠️ Intento de crear usuario para curso externo - redirigiendo');
                return res.status(400).json({
                    success: false,
                    error: 'Los cursos para externos no requieren registro de usuario'
                });
            }

            // 5. Crear el usuario
            const nombreCompleto = `${nombre} ${apellidos}`;

            const user = new User({
                nombre: nombreCompleto,
                email,
                password,
                telefono: phone,
                departamento,
                role,
                membershipStatus,
                membershipStartDate,
                membershipExpiryDate,
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.headers['user-agent']
            });

            await user.save();
            console.log(`✅ Usuario creado: ${email}`);

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
                console.log('📄 Generando documentos iniciales...');

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

                console.log(`✅ Documentos generados para ${email}`);

            } catch (docError) {
                console.error('⚠️ Error generando documentos:', docError.message);
                // No fallar el registro si hay error en documentos
            }

            // 9. Enviar respuesta
            res.status(201).json({
                success: true,
                message: '¡Registro completado! Ya puedes acceder a tu área personal',
                data: {
                    user: user.toPublicJSON(),
                    accessToken,
                    refreshToken,
                    tokenType: 'Bearer'
                }
            });

            console.log(`✅ Registro completado: ${email} (Sesión: ${sessionId})`);

        } catch (error) {
            console.error('❌ Error al completar registro:', error);
            res.status(500).json({
                success: false,
                error: 'Error al completar el registro. Por favor, contacta con soporte.'
            });
        }
    }
);

module.exports = router;
