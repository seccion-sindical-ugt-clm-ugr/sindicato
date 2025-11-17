const express = require('express');
const router = express.Router();
const { generateProgramaCursoIA } = require('../services/pdfService');
const User = require('../models/User');

/**
 * GET /api/curso-ia/enrollment-stats
 * Obtiene estadísticas de inscripciones al curso de IA
 */
router.get('/enrollment-stats', async (req, res) => {
    try {
        console.log('📊 Obteniendo estadísticas de inscripciones curso IA...');

        // Contar usuarios inscritos en el curso de IA
        const enrolledUsers = await User.countDocuments({
            'coursesEnrolled.courseId': { $in: ['ia-clm', 'curso-ia'] }
        });

        res.status(200).json({
            success: true,
            data: {
                totalEnrolled: enrolledUsers,
                courseName: 'Jornadas de Introducción a la IA',
                courseId: 'ia-clm'
            }
        });

        console.log('✅ Estadísticas enviadas:', enrolledUsers, 'inscritos');
    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        res.status(200).json({
            success: true,
            data: {
                totalEnrolled: 0,
                courseName: 'Jornadas de Introducción a la IA',
                courseId: 'ia-clm'
            }
        });
    }
});

/**
 * GET /api/curso-ia/programa-pdf
 * Descarga el programa completo del curso de IA en PDF
 */
router.get('/programa-pdf', async (req, res) => {
    try {
        console.log('📄 Generando PDF del programa de IA...');

        const pdfData = await generateProgramaCursoIA();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${pdfData.filename}"`);
        res.setHeader('Content-Length', pdfData.buffer.length);

        res.send(pdfData.buffer);

        console.log('✅ PDF del programa generado y enviado');
    } catch (error) {
        console.error('❌ Error generando PDF del programa:', error);
        res.status(500).json({
            success: false,
            error: 'Error al generar el PDF del programa'
        });
    }
});

module.exports = router;
