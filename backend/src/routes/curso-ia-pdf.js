const express = require('express');
const router = express.Router();
const { generateProgramaCursoIA } = require('../services/pdfService');

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
