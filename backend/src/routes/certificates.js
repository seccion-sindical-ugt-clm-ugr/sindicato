/**
 * Rutas de Certificados
 * Generación de certificados personalizados para cursos
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');

// ====================================
// VALIDADORES
// ====================================

const certificateValidators = [
    body('courseType').trim().notEmpty().withMessage('El tipo de curso es requerido'),
    body('participantName').trim().notEmpty().withMessage('El nombre del participante es requerido'),
    body('participantEmail').isEmail().withMessage('Email inválido'),
    body('duration').optional().trim(),
    body('completionDate').optional().isISO8601().withMessage('Fecha de completion inválida')
];

// ====================================
// ENDPOINT: Generar certificado
// ====================================

router.post('/generate', authenticate, certificateValidators, async (req, res) => {
    try {
        // Validar datos
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Datos inválidos',
                details: errors.array()
            });
        }

        const {
            courseType,
            participantName,
            participantEmail,
            duration = '20 horas',
            completionDate = new Date().toISOString().split('T')[0]
        } = req.body;

        const user = req.user;

        console.log('📜 Generando certificado:', {
            courseType,
            participantName,
            participantEmail,
            userRole: user.role,
            membershipStatus: user.membershipStatus
        });

        // Verificar que el usuario esté afiliado o tenga el curso completado
        if (user.membershipStatus !== 'activo') {
            return res.status(403).json({
                success: false,
                error: 'Debes estar afiliado y haber completado el curso para generar el certificado'
            });
        }

        // Generar certificado PDF
        const pdfBuffer = await generateCourseCertificate({
            courseType,
            participantName,
            participantEmail,
            duration,
            completionDate,
            userId: user._id,
            membershipId: user.membershipId
        });

        // Configurar headers para descarga
        const filename = `certificado-${courseType}-${participantName.replace(/\s+/g, '-').toLowerCase()}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        res.send(pdfBuffer);

        console.log('✅ Certificado generado exitosamente:', filename);

    } catch (error) {
        console.error('❌ Error generando certificado:', error);
        res.status(500).json({
            success: false,
            error: 'Error al generar el certificado',
            message: error.message
        });
    }
});

// ====================================
// ENDPOINT: Verificar elegibilidad para certificado
// ====================================

router.get('/check-eligibility/:courseType', authenticate, async (req, res) => {
    try {
        const { courseType } = req.params;
        const user = req.user;

        // Verificar si el usuario es elegible para el certificado
        const isEligible = await checkCertificateEligibility(user._id, courseType);

        res.json({
            success: true,
            eligible: isEligible,
            courseType,
            user: {
                name: user.nombre,
                email: user.email,
                membershipStatus: user.membershipStatus,
                role: user.role
            }
        });

    } catch (error) {
        console.error('❌ Error verificando elegibilidad:', error);
        res.status(500).json({
            success: false,
            error: 'Error al verificar elegibilidad',
            message: error.message
        });
    }
});

// ====================================
// FUNCIONES AUXILIARES
// ====================================

/**
 * Genera un certificado PDF personalizado (versión con jsPDF)
 */
async function generateCourseCertificate(data) {
    try {
        // Importar jsPDF dinámicamente para evitar problemas de dependencia
        const { jsPDF } = require('jspdf');

        // Crear documento PDF
        const doc = new jsPDF('p', 'mm', 'a4');

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        let yPosition = margin;

        // Colores institucionales
        const primaryColor = [16, 42, 67];    // Azul oscuro
        const accentColor = [102, 126, 234];  // Azul brillante
        const goldColor = [255, 184, 0];      // Dorado

        // Función para agregar texto centrado
        const addCenteredText = (text, fontSize = 12, color = [0, 0, 0], fontStyle = 'normal') => {
            doc.setFontSize(fontSize);
            doc.setFont('helvetica', fontStyle);
            doc.setTextColor(...color);
            const textWidth = doc.getTextWidth(text);
            const x = (pageWidth - textWidth) / 2;
            doc.text(text, x, yPosition);
            yPosition += fontSize + 3;
            return yPosition;
        };

        // Función para agregar línea decorativa
        const addDecorativeLine = (width = 100) => {
            const lineWidth = width;
            const x = (pageWidth - lineWidth) / 2;
            doc.setDrawColor(...accentColor);
            doc.setLineWidth(0.5);
            doc.line(x, yPosition, x + lineWidth, yPosition);
            yPosition += 8;
            return yPosition;
        };

        // ====================================
        // DISEÑO DEL CERTIFICADO
        // ====================================

        // Borde decorativo
        doc.setDrawColor(...accentColor);
        doc.setLineWidth(1);
        doc.rect(15, 15, pageWidth - 30, pageHeight - 30);
        doc.rect(17, 17, pageWidth - 34, pageHeight - 34);

        // Título principal
        yPosition = 40;
        addCenteredText('CERTIFICADO DE PARTICIPACIÓN', 24, primaryColor, 'bold');

        // Línea decorativa
        addDecorativeLine(80);

        // Subtítulo del curso
        addCenteredText('Jornadas de Inteligencia Artificial', 16, primaryColor, 'bold');
        addCenteredText('Para el Centro de Lenguas Modernas', 14, [74, 85, 104]);

        // Línea decorativa
        addDecorativeLine(60);

        // Texto de certificación
        yPosition += 10;
        addCenteredText('Por la presente se certifica que:', 12, [74, 85, 104]);

        // Nombre del participante
        yPosition += 15;
        addCenteredText(data.participantName.toUpperCase(), 18, primaryColor, 'bold');

        // Detalles del curso
        yPosition += 15;
        const courseDetails = [
            'Ha participado exitosamente en las',
            'Jornadas de Inteligencia Artificial',
            'desarrolladas en el Centro de Lenguas Modernas',
            'de la Universidad de Granada,',
            'completando un total de ' + data.duration + ' de formación.'
        ];

        courseDetails.forEach(detail => {
            addCenteredText(detail, 11, [74, 85, 104]);
        });

        // Fechas
        yPosition += 15;
        const formattedDate = new Date(data.completionDate).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        addCenteredText('Granada, ' + formattedDate, 10, [113, 128, 150], 'italic');

        // Sección de habilidades adquiridas
        yPosition += 20;
        addCenteredText('Competencias Desarrolladas:', 12, primaryColor, 'bold');

        const skills = [
            '• Comprensión de conceptos fundamentales de Inteligencia Artificial',
            '• Aplicación práctica de herramientas de IA generativa',
            '• Automatización de tareas administrativas con IA',
            '• Creación de contenidos educativos asistidos por IA',
            '• Gestión documental inteligente',
            '• Ética y responsabilidad en el uso de la IA'
        ];

        yPosition += 8;
        skills.forEach(skill => {
            const lines = doc.splitTextToSize(skill, pageWidth - 60);
            lines.forEach(line => {
                addCenteredText(line, 9, [74, 85, 104]);
            });
        });

        // Sección de firmas
        yPosition += 20;
        addCenteredText('Firmas de Acreditación:', 12, primaryColor, 'bold');

        yPosition += 15;

        // Firma 1 - Director/a
        const signature1Y = yPosition;
        addCenteredText('_________________________', 10, [74, 85, 104]);
        addCenteredText('Director/a CLM', 9, [74, 85, 104]);
        addCenteredText('Universidad de Granada', 8, [113, 128, 150]);

        // Firma 2 - Representante UGT (en el lado derecho)
        yPosition = signature1Y;
        addCenteredText('_________________________', 10, [74, 85, 104]);
        addCenteredText('Representante UGT-CLM', 9, [74, 85, 104]);
        addCenteredText('Sección Sindical UGR', 8, [113, 128, 150]);

        // Número de verificación
        yPosition = pageHeight - 40;
        const verificationCode = `UGT-CLM-IA-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        addCenteredText('Código de Verificación:', 8, [113, 128, 150]);
        addCenteredText(verificationCode, 10, accentColor, 'bold');

        // Footer
        yPosition = pageHeight - 25;
        addCenteredText('Este certificado es válido y puede ser verificado en www.ugtclmgranada.org', 7, [160, 174, 192]);

        // Sello de agua (fondo) - versión simple
        doc.setTextColor(226, 232, 240);
        doc.setFontSize(40);
        doc.setFont('helvetica', 'bold');
        doc.setTextOpacity(0.1);
        doc.text('UGT-CLM', pageWidth / 2, pageHeight / 2, { align: 'center' });
        doc.setTextOpacity(1);

        // Generar buffer
        return Buffer.from(doc.output('arraybuffer'));

    } catch (error) {
        console.error('Error generando certificado con jsPDF:', error);
        throw error;
    }
}

/**
 * Verifica si un usuario es elegible para un certificado
 */
async function checkCertificateEligibility(userId, courseType) {
    try {
        // Aquí iría la lógica para verificar en la base de datos
        // si el usuario completó el curso específico

        // Por ahora, asumimos que si está afiliado es elegible
        const user = await User.findById(userId);

        if (!user) {
            return false;
        }

        // Verificar membresía activa
        if (user.membershipStatus !== 'activo') {
            return false;
        }

        // Aquí podrías agregar más validaciones:
        // - Verificar si completó el curso específico
        // - Verificar si no hay morosidad
        // - Verificar fechas de realización del curso

        return true;

    } catch (error) {
        console.error('Error verificando elegibilidad:', error);
        return false;
    }
}

module.exports = router;