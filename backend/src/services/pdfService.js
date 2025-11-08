/**
 * Servicio de Generación de PDFs
 * Genera documentos PDF para afiliados, recibos y certificados
 */

const PDFDocument = require('pdfkit');

/**
 * Genera un certificado de afiliado
 */
async function generateCertificadoAfiliado(userData) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(chunks);
                const base64 = pdfBuffer.toString('base64');
                resolve({
                    fileData: base64,
                    fileSize: pdfBuffer.length
                });
            });
            doc.on('error', reject);

            // Colores UGT
            const ugtRed = '#E30613';
            const darkGray = '#333333';

            // Encabezado
            doc.fontSize(24)
                .fillColor(ugtRed)
                .text('CERTIFICADO DE AFILIACIÓN', { align: 'center' })
                .moveDown(0.5);

            doc.fontSize(16)
                .fillColor(darkGray)
                .text('UGT-CLM-UGR Granada', { align: 'center' })
                .moveDown(2);

            // Contenido
            doc.fontSize(12)
                .fillColor(darkGray)
                .text('Mediante el presente documento, la Sección Sindical de UGT-CLM-UGR Granada certifica que:', { align: 'justify' })
                .moveDown(1.5);

            // Nombre del afiliado (destacado)
            doc.fontSize(16)
                .fillColor(ugtRed)
                .text(userData.nombre.toUpperCase(), { align: 'center' })
                .moveDown(1);

            doc.fontSize(12)
                .fillColor(darkGray)
                .text(`Con email: ${userData.email}`, { align: 'center' })
                .moveDown(0.5);

            if (userData.departamento) {
                doc.text(`Departamento: ${userData.departamento}`, { align: 'center' })
                    .moveDown(1.5);
            } else {
                doc.moveDown(1.5);
            }

            // Información de afiliación
            doc.fontSize(12)
                .text('Se encuentra afiliado/a a nuestra organización sindical desde:', { align: 'justify' })
                .moveDown(0.5);

            const startDate = userData.membershipStartDate
                ? new Date(userData.membershipStartDate).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })
                : new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

            doc.fontSize(14)
                .fillColor(ugtRed)
                .text(startDate, { align: 'center' })
                .moveDown(1.5);

            doc.fontSize(12)
                .fillColor(darkGray)
                .text('Con estado de membresía:', { align: 'justify' })
                .moveDown(0.5);

            const status = userData.membershipStatus === 'activo' ? 'ACTIVA' : userData.membershipStatus.toUpperCase();
            doc.fontSize(14)
                .fillColor(ugtRed)
                .text(status, { align: 'center' })
                .moveDown(2);

            // Pie de documento
            doc.fontSize(10)
                .fillColor(darkGray)
                .text('Este certificado es válido como acreditación de afiliación a UGT-CLM-UGR Granada.', { align: 'justify' })
                .moveDown(3);

            // Fecha de emisión
            const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
            doc.fontSize(10)
                .text(`Granada, ${today}`, { align: 'right' })
                .moveDown(2);

            // Firma
            doc.fontSize(10)
                .text('_________________________', { align: 'center' })
                .moveDown(0.3)
                .text('Sección Sindical UGT-CLM-UGR Granada', { align: 'center' });

            // Footer
            doc.fontSize(8)
                .fillColor('#666666')
                .text('Universidad de Granada | Email: ugtclmgranada@gmail.com', 50, doc.page.height - 50, { align: 'center' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Genera un recibo de pago
 */
async function generateReciboPago(userData, paymentData) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(chunks);
                const base64 = pdfBuffer.toString('base64');
                resolve({
                    fileData: base64,
                    fileSize: pdfBuffer.length
                });
            });
            doc.on('error', reject);

            const ugtRed = '#E30613';
            const darkGray = '#333333';

            // Encabezado
            doc.fontSize(24)
                .fillColor(ugtRed)
                .text('RECIBO DE PAGO', { align: 'center' })
                .moveDown(0.5);

            doc.fontSize(14)
                .fillColor(darkGray)
                .text('UGT-CLM-UGR Granada', { align: 'center' })
                .moveDown(2);

            // Número de recibo
            doc.fontSize(10)
                .text(`Nº Recibo: ${paymentData.stripeSessionId?.substring(0, 20) || 'N/A'}`, { align: 'right' })
                .moveDown(1);

            // Datos del afiliado
            doc.fontSize(12)
                .fillColor(darkGray)
                .text('DATOS DEL AFILIADO', { underline: true })
                .moveDown(0.5);

            doc.fontSize(10)
                .text(`Nombre: ${userData.nombre}`)
                .text(`Email: ${userData.email}`)
                .moveDown(1.5);

            // Detalle del pago
            doc.fontSize(12)
                .text('DETALLE DEL PAGO', { underline: true })
                .moveDown(0.5);

            doc.fontSize(10)
                .text(`Concepto: ${paymentData.description || 'Afiliación anual UGT-CLM-UGR'}`)
                .text(`Fecha: ${new Date(paymentData.date).toLocaleDateString('es-ES')}`)
                .text(`Estado: ${paymentData.status === 'completed' ? 'PAGADO' : paymentData.status}`)
                .moveDown(1);

            // Importe (destacado)
            doc.fontSize(16)
                .fillColor(ugtRed)
                .text(`IMPORTE: ${paymentData.amount.toFixed(2)} ${paymentData.currency.toUpperCase()}`, { align: 'center' })
                .moveDown(2);

            // Información adicional
            doc.fontSize(9)
                .fillColor(darkGray)
                .text('Este recibo es un comprobante de pago válido.', { align: 'justify' })
                .text('Para cualquier consulta, contacta con nosotros en ugtclmgranada@gmail.com', { align: 'justify' })
                .moveDown(2);

            // Fecha de emisión
            const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
            doc.fontSize(9)
                .text(`Emitido el: ${today}`, { align: 'right' });

            // Footer
            doc.fontSize(8)
                .fillColor('#666666')
                .text('Universidad de Granada | ugtclmgranada@gmail.com', 50, doc.page.height - 50, { align: 'center' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Genera un certificado de curso
 */
async function generateCertificadoCurso(userData, courseData) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 50, layout: 'landscape' });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(chunks);
                const base64 = pdfBuffer.toString('base64');
                resolve({
                    fileData: base64,
                    fileSize: pdfBuffer.length
                });
            });
            doc.on('error', reject);

            const ugtRed = '#E30613';
            const darkGray = '#333333';
            const gold = '#FFD700';

            // Borde decorativo
            doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
                .lineWidth(3)
                .strokeColor(ugtRed)
                .stroke();

            doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
                .lineWidth(1)
                .strokeColor(gold)
                .stroke();

            // Encabezado
            doc.fontSize(32)
                .fillColor(ugtRed)
                .text('CERTIFICADO DE CURSO', 0, 80, { align: 'center' })
                .moveDown(0.5);

            doc.fontSize(16)
                .fillColor(darkGray)
                .text('UGT-CLM-UGR Granada', { align: 'center' })
                .moveDown(2);

            // Texto certificación
            doc.fontSize(14)
                .fillColor(darkGray)
                .text('Certifica que', { align: 'center' })
                .moveDown(1);

            // Nombre del alumno (destacado)
            doc.fontSize(28)
                .fillColor(ugtRed)
                .text(userData.nombre.toUpperCase(), { align: 'center' })
                .moveDown(1);

            // Curso completado
            doc.fontSize(14)
                .fillColor(darkGray)
                .text('Ha completado satisfactoriamente el curso', { align: 'center' })
                .moveDown(0.5);

            doc.fontSize(20)
                .fillColor(ugtRed)
                .text(courseData.courseName, { align: 'center' })
                .moveDown(1);

            // Fecha de finalización
            const completionDate = courseData.completionDate
                ? new Date(courseData.completionDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
                : new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

            doc.fontSize(12)
                .fillColor(darkGray)
                .text(`Fecha de finalización: ${completionDate}`, { align: 'center' })
                .moveDown(2);

            // Firma
            const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
            doc.fontSize(11)
                .text(`Granada, ${today}`, { align: 'center' })
                .moveDown(2);

            doc.fontSize(10)
                .text('_________________________', { align: 'center' })
                .moveDown(0.3)
                .text('Sección Sindical UGT-CLM-UGR Granada', { align: 'center' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Genera una ficha de afiliación
 */
async function generateFichaAfiliacion(userData) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(chunks);
                const base64 = pdfBuffer.toString('base64');
                resolve({
                    fileData: base64,
                    fileSize: pdfBuffer.length
                });
            });
            doc.on('error', reject);

            const ugtRed = '#E30613';
            const darkGray = '#333333';

            // Encabezado
            doc.fontSize(20)
                .fillColor(ugtRed)
                .text('FICHA DE AFILIACIÓN', { align: 'center' })
                .moveDown(0.5);

            doc.fontSize(14)
                .fillColor(darkGray)
                .text('Sección Sindical UGT-CLM-UGR Granada', { align: 'center' })
                .moveDown(2);

            // Datos personales
            doc.fontSize(14)
                .fillColor(ugtRed)
                .text('DATOS PERSONALES', { underline: true })
                .moveDown(0.5);

            doc.fontSize(11)
                .fillColor(darkGray)
                .text(`Nombre completo: ${userData.nombre}`)
                .moveDown(0.3)
                .text(`Email: ${userData.email}`)
                .moveDown(0.3);

            if (userData.telefono) {
                doc.text(`Teléfono: ${userData.telefono}`)
                    .moveDown(0.3);
            }

            if (userData.departamento) {
                doc.text(`Departamento: ${userData.departamento}`)
                    .moveDown(0.3);
            }

            doc.moveDown(1.5);

            // Datos de afiliación
            doc.fontSize(14)
                .fillColor(ugtRed)
                .text('DATOS DE AFILIACIÓN', { underline: true })
                .moveDown(0.5);

            doc.fontSize(11)
                .fillColor(darkGray)
                .text(`Número de afiliado: ${userData._id}`)
                .moveDown(0.3);

            const startDate = userData.membershipStartDate
                ? new Date(userData.membershipStartDate).toLocaleDateString('es-ES')
                : new Date().toLocaleDateString('es-ES');

            doc.text(`Fecha de alta: ${startDate}`)
                .moveDown(0.3);

            const expiryDate = userData.membershipExpiryDate
                ? new Date(userData.membershipExpiryDate).toLocaleDateString('es-ES')
                : 'N/A';

            doc.text(`Fecha de expiración: ${expiryDate}`)
                .moveDown(0.3)
                .text(`Estado: ${userData.membershipStatus}`)
                .moveDown(0.3)
                .text(`Rol: ${userData.role}`)
                .moveDown(2);

            // Notas
            doc.fontSize(9)
                .fillColor('#666666')
                .text('Esta ficha es un documento interno de UGT-CLM-UGR Granada.', { align: 'justify' })
                .text('Contiene información confidencial y de uso exclusivo para la gestión sindical.', { align: 'justify' })
                .moveDown(2);

            // Fecha de generación
            const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
            doc.fontSize(9)
                .text(`Generado el: ${today}`, { align: 'right' });

            // Footer
            doc.fontSize(8)
                .fillColor('#666666')
                .text('UGT-CLM-UGR Granada | Universidad de Granada', 50, doc.page.height - 50, { align: 'center' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    generateCertificadoAfiliado,
    generateReciboPago,
    generateCertificadoCurso,
    generateFichaAfiliacion
};
