/**
 * Rutas de Documentos
 * Gestión de documentos PDF para usuarios autenticados
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Document = require('../models/Document');
const User = require('../models/User');
const {
    generateCertificadoAfiliado,
    generateReciboPago,
    generateCertificadoCurso,
    generateFichaAfiliacion
} = require('../services/pdfService');

/**
 * GET /api/user/documents
 * Listar todos los documentos del usuario autenticado
 */
router.get('/user/documents', authenticate, async (req, res) => {
    try {
        const userId = req.user._id;

        // Buscar documentos del usuario
        const documents = await Document.find({ userId })
            .select('-fileData') // No incluir el contenido del archivo para listar
            .sort({ generatedAt: -1 })
            .lean();

        res.json({
            success: true,
            data: {
                documents,
                total: documents.length
            }
        });

    } catch (error) {
        console.error('❌ Error listando documentos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener documentos'
        });
    }
});

/**
 * GET /api/user/documents/:id
 * Obtener un documento específico (con contenido para descargar)
 */
router.get('/user/documents/:id', authenticate, async (req, res) => {
    try {
        const userId = req.user._id;
        const documentId = req.params.id;

        // Buscar documento y verificar pertenencia
        const document = await Document.findOne({
            _id: documentId,
            userId: userId
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                error: 'Documento no encontrado'
            });
        }

        res.json({
            success: true,
            data: {
                document
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo documento:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener documento'
        });
    }
});

/**
 * POST /api/user/documents/generate
 * Generar un documento manualmente
 */
router.post('/user/documents/generate', authenticate, async (req, res) => {
    try {
        const userId = req.user._id;
        const { type, courseData, paymentData } = req.body;

        // Validar tipo de documento
        const validTypes = ['certificado-afiliado', 'recibo-pago', 'certificado-curso', 'ficha-afiliacion'];
        if (!type || !validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                error: 'Tipo de documento inválido'
            });
        }

        // Obtener usuario completo
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        let pdfResult;
        let documentTitle;
        let documentDescription;
        let metadata = {};

        // Generar según tipo
        switch (type) {
            case 'certificado-afiliado':
                pdfResult = await generateCertificadoAfiliado(user);
                documentTitle = 'Certificado de Afiliación';
                documentDescription = `Certificado de afiliación para ${user.nombre}`;
                break;

            case 'recibo-pago':
                if (!paymentData) {
                    return res.status(400).json({
                        success: false,
                        error: 'Se requieren datos de pago para generar recibo'
                    });
                }
                pdfResult = await generateReciboPago(user, paymentData);
                documentTitle = 'Recibo de Pago';
                documentDescription = `Recibo de pago de ${paymentData.amount} ${paymentData.currency}`;
                metadata = {
                    amount: paymentData.amount,
                    stripeSessionId: paymentData.stripeSessionId
                };
                break;

            case 'certificado-curso':
                if (!courseData || !courseData.courseName) {
                    return res.status(400).json({
                        success: false,
                        error: 'Se requieren datos del curso para generar certificado'
                    });
                }
                pdfResult = await generateCertificadoCurso(user, courseData);
                documentTitle = 'Certificado de Curso';
                documentDescription = `Certificado del curso: ${courseData.courseName}`;
                metadata = {
                    courseId: courseData.courseId || null,
                    courseName: courseData.courseName
                };
                break;

            case 'ficha-afiliacion':
                pdfResult = await generateFichaAfiliacion(user);
                documentTitle = 'Ficha de Afiliación';
                documentDescription = `Ficha de afiliación de ${user.nombre}`;
                break;

            default:
                return res.status(400).json({
                    success: false,
                    error: 'Tipo de documento no soportado'
                });
        }

        // Crear documento en BD
        const document = new Document({
            userId: user._id,
            type,
            title: documentTitle,
            description: documentDescription,
            fileData: pdfResult.fileData,
            fileSize: pdfResult.fileSize,
            metadata
        });

        await document.save();

        // Agregar a documentos del usuario
        user.documents.push(document._id);
        await user.save();

        console.log(`✅ Documento generado: ${type} para usuario ${user.email}`);

        // Responder sin el contenido del archivo (solo metadata)
        res.status(201).json({
            success: true,
            message: 'Documento generado correctamente',
            data: {
                document: {
                    _id: document._id,
                    type: document.type,
                    title: document.title,
                    description: document.description,
                    fileSize: document.fileSize,
                    generatedAt: document.generatedAt,
                    metadata: document.metadata
                }
            }
        });

    } catch (error) {
        console.error('❌ Error generando documento:', error);
        res.status(500).json({
            success: false,
            error: 'Error al generar documento',
            ...(process.env.NODE_ENV === 'development' && {
                debug: error.message
            })
        });
    }
});

/**
 * DELETE /api/user/documents/:id
 * Eliminar un documento (solo el propio usuario)
 */
router.delete('/user/documents/:id', authenticate, async (req, res) => {
    try {
        const userId = req.user._id;
        const documentId = req.params.id;

        // Buscar y eliminar documento
        const document = await Document.findOneAndDelete({
            _id: documentId,
            userId: userId
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                error: 'Documento no encontrado'
            });
        }

        // Remover referencia del usuario
        await User.findByIdAndUpdate(userId, {
            $pull: { documents: documentId }
        });

        console.log(`🗑️ Documento eliminado: ${documentId} del usuario ${req.user.email}`);

        res.json({
            success: true,
            message: 'Documento eliminado correctamente'
        });

    } catch (error) {
        console.error('❌ Error eliminando documento:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar documento'
        });
    }
});

module.exports = router;
