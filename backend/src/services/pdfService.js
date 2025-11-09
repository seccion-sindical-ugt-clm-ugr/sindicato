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
            const doc = new PDFDocument({ size: 'A4', margin: 40 });
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
            doc.fontSize(20)
                .fillColor(ugtRed)
                .text('CERTIFICADO DE AFILIACIÓN', { align: 'center' })
                .moveDown(0.2);

            doc.fontSize(13)
                .fillColor(darkGray)
                .text('UGT-CLM-UGR Granada', { align: 'center' })
                .moveDown(0.6);

            // Contenido
            doc.fontSize(10)
                .fillColor(darkGray)
                .text('Mediante el presente documento, la Sección Sindical de UGT-CLM-UGR Granada certifica que:', { align: 'justify' })
                .moveDown(0.6);

            // Nombre del afiliado (destacado)
            doc.fontSize(14)
                .fillColor(ugtRed)
                .text(userData.nombre.toUpperCase(), { align: 'center' })
                .moveDown(0.4);

            doc.fontSize(10)
                .fillColor(darkGray)
                .text(`Con email: ${userData.email}`, { align: 'center' })
                .moveDown(0.2);

            if (userData.departamento) {
                doc.text(`Departamento: ${userData.departamento}`, { align: 'center' })
                    .moveDown(0.6);
            } else {
                doc.moveDown(0.6);
            }

            // Información de afiliación
            doc.fontSize(10)
                .text('Se encuentra afiliado/a a nuestra organización sindical desde:', { align: 'justify' })
                .moveDown(0.2);

            const startDate = userData.membershipStartDate
                ? new Date(userData.membershipStartDate).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })
                : new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

            doc.fontSize(12)
                .fillColor(ugtRed)
                .text(startDate, { align: 'center' })
                .moveDown(0.6);

            doc.fontSize(10)
                .fillColor(darkGray)
                .text('Con estado de membresía:', { align: 'justify' })
                .moveDown(0.2);

            const status = userData.membershipStatus === 'activo' ? 'ACTIVA' : userData.membershipStatus.toUpperCase();
            doc.fontSize(12)
                .fillColor(ugtRed)
                .text(status, { align: 'center' })
                .moveDown(0.6);

            // Pie de documento
            doc.fontSize(9)
                .fillColor(darkGray)
                .text('Este certificado es válido como acreditación de afiliación a UGT-CLM-UGR Granada.', { align: 'justify' })
                .moveDown(0.6);

            // Fecha de emisión
            const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
            doc.fontSize(9)
                .text(`Granada, ${today}`, { align: 'right' })
                .moveDown(0.5);

            // Firma
            doc.fontSize(9)
                .text('_________________________', { align: 'center' })
                .moveDown(0.1)
                .text('Sección Sindical UGT-CLM-UGR Granada', { align: 'center' });

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
                .moveDown(2);

            // Fecha de emisión
            const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
            doc.fontSize(9)
                .text(`Emitido el: ${today}`, { align: 'right' });

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
            const doc = new PDFDocument({ size: 'A4', margin: 40 });
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
            doc.fontSize(16)
                .fillColor(ugtRed)
                .text('FICHA DE AFILIACIÓN', { align: 'center' })
                .moveDown(0.2);

            doc.fontSize(11)
                .fillColor(darkGray)
                .text('Sección Sindical UGT-CLM-UGR Granada', { align: 'center' })
                .moveDown(0.6);

            // Datos personales
            doc.fontSize(12)
                .fillColor(ugtRed)
                .text('DATOS PERSONALES', { underline: true })
                .moveDown(0.3);

            doc.fontSize(9)
                .fillColor(darkGray)
                .text(`Nombre completo: ${userData.nombre}`)
                .moveDown(0.15)
                .text(`Email: ${userData.email}`)
                .moveDown(0.15);

            if (userData.telefono) {
                doc.text(`Teléfono: ${userData.telefono}`)
                    .moveDown(0.15);
            }

            if (userData.departamento) {
                doc.text(`Departamento: ${userData.departamento}`)
                    .moveDown(0.15);
            }

            doc.moveDown(0.5);

            // Datos de afiliación
            doc.fontSize(12)
                .fillColor(ugtRed)
                .text('DATOS DE AFILIACIÓN', { underline: true })
                .moveDown(0.3);

            doc.fontSize(9)
                .fillColor(darkGray)
                .text(`Número de afiliado: ${userData._id}`)
                .moveDown(0.15);

            const startDate = userData.membershipStartDate
                ? new Date(userData.membershipStartDate).toLocaleDateString('es-ES')
                : new Date().toLocaleDateString('es-ES');

            doc.text(`Fecha de alta: ${startDate}`)
                .moveDown(0.15);

            const expiryDate = userData.membershipExpiryDate
                ? new Date(userData.membershipExpiryDate).toLocaleDateString('es-ES')
                : 'N/A';

            doc.text(`Fecha de expiración: ${expiryDate}`)
                .moveDown(0.15)
                .text(`Estado: ${userData.membershipStatus}`)
                .moveDown(0.15)
                .text(`Rol: ${userData.role}`)
                .moveDown(0.5);

            // Notas
            doc.fontSize(8)
                .fillColor('#666666')
                .text('Esta ficha es un documento interno de UGT-CLM-UGR Granada.', { align: 'justify' })
                .text('Contiene información confidencial y de uso exclusivo para la gestión sindical.', { align: 'justify' })
                .moveDown(0.5);

            // Fecha de generación
            const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
            doc.fontSize(8)
                .text(`Generado el: ${today}`, { align: 'right' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Genera el programa completo del curso de IA
 */
async function generateProgramaCursoIA() {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 60,
                bufferPages: true
            });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(chunks);
                const base64 = pdfBuffer.toString('base64');
                resolve({
                    buffer: pdfBuffer,
                    base64: base64,
                    filename: 'Programa_Jornadas_IA_UGT.pdf'
                });
            });

            // Colores
            const darkBlue = '#1a237e';
            const lightBlue = '#0d47a1';
            const ugtRed = '#E30613';
            const darkGray = '#333333';
            const lightGray = '#666666';

            // ===== PORTADA =====
            doc.rect(0, 0, doc.page.width, doc.page.height)
                .fill(darkBlue);

            doc.image('assets/logo-ugt.png', (doc.page.width - 120) / 2, 100, { width: 120 })
                .catch(() => {
                    // Si no existe el logo, continuamos sin él
                });

            doc.fillColor('white')
                .fontSize(28)
                .font('Helvetica-Bold')
                .text('JORNADAS DE INTRODUCCIÓN A LA IA', 60, 280, {
                    width: doc.page.width - 120,
                    align: 'center'
                })
                .moveDown(1);

            doc.fontSize(36)
                .text('IA en Acción:', { align: 'center' })
                .moveDown(0.3)
                .fontSize(24)
                .text('Transformando el Centro de Lenguas Modernas', {
                    width: doc.page.width - 120,
                    align: 'center'
                })
                .moveDown(3);

            doc.fontSize(14)
                .font('Helvetica')
                .text('Formación práctica en Inteligencia Artificial', { align: 'center' })
                .text('Universidad de Granada', { align: 'center' })
                .moveDown(2);

            doc.fontSize(12)
                .text('20 horas | 30 sesiones | Por Zoom', { align: 'center' })
                .moveDown(1);

            doc.fontSize(10)
                .fillColor('#cccccc')
                .text('UGT-CLM-UGR Granada', { align: 'center' })
                .text(new Date().getFullYear().toString(), { align: 'center' });

            // ===== PÁGINA 2: INFORMACIÓN GENERAL =====
            doc.addPage();
            doc.fillColor(darkGray);

            doc.fontSize(24)
                .font('Helvetica-Bold')
                .fillColor(ugtRed)
                .text('Información General', { align: 'left' })
                .moveDown(1.5);

            doc.fontSize(12)
                .fillColor(darkGray)
                .font('Helvetica');

            // Descripción
            doc.fontSize(11)
                .fillColor(lightGray)
                .text('DESCRIPCIÓN', { underline: true })
                .moveDown(0.5);

            doc.fontSize(11)
                .fillColor(darkGray)
                .text(
                    'Las Jornadas de Introducción a la IA están diseñadas específicamente para el personal del Centro de Lenguas Modernas de la Universidad de Granada, con el objetivo de proporcionar una formación práctica y útil en el uso de herramientas de Inteligencia Artificial adaptadas a las necesidades específicas de cada departamento.',
                    { align: 'justify', lineGap: 4 }
                )
                .moveDown(1.5);

            // Características del curso
            doc.fontSize(11)
                .fillColor(lightGray)
                .text('CARACTERÍSTICAS DEL CURSO', { underline: true })
                .moveDown(0.5);

            const caracteristicas = [
                { icon: '⏱', label: 'Duración:', valor: '20 horas (30 sesiones de 40 minutos)' },
                { icon: '📅', label: 'Calendario:', valor: '5 semanas (5 viernes)' },
                { icon: '🎥', label: 'Modalidad:', valor: 'Online por Zoom' },
                { icon: '🕐', label: 'Horario:', valor: '6 sesiones por viernes (mañana y tarde)' },
                { icon: '📜', label: 'Certificación:', valor: 'Certificado UGT-CLM-UGR' },
                { icon: '👥', label: 'Plazas:', valor: 'Limitadas' }
            ];

            caracteristicas.forEach(item => {
                doc.fontSize(11)
                    .fillColor(darkBlue)
                    .font('Helvetica-Bold')
                    .text(`${item.icon} ${item.label}`, { continued: true })
                    .font('Helvetica')
                    .fillColor(darkGray)
                    .text(` ${item.valor}`)
                    .moveDown(0.8);
            });

            // ===== PÁGINA 3: PERFILES PROFESIONALES =====
            doc.addPage();

            doc.fontSize(24)
                .font('Helvetica-Bold')
                .fillColor(ugtRed)
                .text('¿A quién va dirigido?', { align: 'left' })
                .moveDown(1);

            doc.fontSize(11)
                .fillColor(darkGray)
                .font('Helvetica')
                .text('Diseñado para todos los perfiles del Centro de Lenguas Modernas:', { align: 'justify' })
                .moveDown(1.5);

            const perfiles = [
                {
                    titulo: '👨‍🏫 Profesores de Español',
                    descripcion: 'Enseñanza de español como lengua extranjera, creación de materiales didácticos y evaluación de competencias.'
                },
                {
                    titulo: '🌍 Profesores de Otras Lenguas',
                    descripcion: 'Enseñanza multilingüe, traducción y actividades interculturales.'
                },
                {
                    titulo: '💼 Personal de Administración',
                    descripcion: 'Gestión de matrículas, atención multilingüe y trámites administrativos.'
                },
                {
                    titulo: '🚪 Personal de Conserjería',
                    descripcion: 'Control de accesos, información y atención presencial a estudiantes.'
                },
                {
                    titulo: '🔧 Personal de Servicios',
                    descripcion: 'Mantenimiento, gestión de recursos tecnológicos y apoyo logístico.'
                }
            ];

            perfiles.forEach(perfil => {
                doc.fontSize(12)
                    .font('Helvetica-Bold')
                    .fillColor(darkBlue)
                    .text(perfil.titulo)
                    .moveDown(0.3);

                doc.fontSize(10)
                    .font('Helvetica')
                    .fillColor(darkGray)
                    .text(perfil.descripcion, { align: 'justify', lineGap: 3 })
                    .moveDown(1.2);
            });

            // ===== PÁGINA 4-5: BLOQUES TEMÁTICOS =====
            doc.addPage();

            doc.fontSize(24)
                .font('Helvetica-Bold')
                .fillColor(ugtRed)
                .text('Programa: Bloques Temáticos', { align: 'left' })
                .moveDown(1.5);

            const bloques = [
                {
                    numero: '1',
                    titulo: 'Fundamentos de la IA',
                    duracion: '4 horas · 6 sesiones',
                    temas: [
                        'Introducción a la IA: conceptos básicos y evolución',
                        'Tipos de IA: débil vs. fuerte, estrecha vs. general',
                        'Principales tecnologías: machine learning, procesamiento de lenguaje natural, visión artificial',
                        'Herramientas de IA accesibles: panorama actual',
                        'Ética y responsabilidad en el uso de la IA',
                        'Enfoque práctico: Primeros pasos con ChatGPT y otras herramientas básicas'
                    ]
                },
                {
                    numero: '2',
                    titulo: 'IA en el Ámbito Educativo',
                    duracion: '6 horas · 9 sesiones',
                    temas: [
                        'IA para la creación de contenidos educativos',
                        'Herramientas de IA para la enseñanza de idiomas',
                        'Evaluación y feedback automático',
                        'Personalización del aprendizaje mediante IA',
                        'Traducción y adaptación de materiales',
                        'Creación de recursos multimedia con IA',
                        'Detección de plagio y uso ético',
                        'Asistentes virtuales para estudiantes',
                        'Enfoque práctico: Talleres específicos para profesores'
                    ]
                },
                {
                    numero: '3',
                    titulo: 'IA en la Gestión Administrativa',
                    duracion: '4 horas · 6 sesiones',
                    temas: [
                        'Automatización de procesos administrativos',
                        'IA para la atención multilingüe',
                        'Gestión documental inteligente',
                        'Análisis de datos para la toma de decisiones',
                        'Optimización de recursos mediante IA',
                        'Enfoque práctico: Talleres específicos para personal administrativo'
                    ]
                }
            ];

            bloques.forEach(bloque => {
                // Encabezado del bloque
                doc.roundedRect(60, doc.y, doc.page.width - 120, 60, 8)
                    .fillAndStroke(darkBlue, darkBlue);

                const bloqueY = doc.y + 15;

                doc.fontSize(14)
                    .fillColor('white')
                    .font('Helvetica-Bold')
                    .text(`BLOQUE ${bloque.numero}`, 80, bloqueY, { continued: true })
                    .fontSize(10)
                    .font('Helvetica')
                    .text(`  •  ${bloque.duracion}`, { align: 'left' });

                doc.fontSize(13)
                    .font('Helvetica-Bold')
                    .text(bloque.titulo, 80, bloqueY + 20);

                doc.moveDown(3.5);

                // Temas
                bloque.temas.forEach(tema => {
                    doc.fontSize(10)
                        .fillColor('#4CAF50')
                        .text('✓', 80, doc.y, { continued: true, width: 20 })
                        .fillColor(darkGray)
                        .text(` ${tema}`, { width: doc.page.width - 160, align: 'left', lineGap: 2 })
                        .moveDown(0.6);
                });

                doc.moveDown(1);

                // Si no hay espacio para el siguiente bloque, agregar página
                if (doc.y > doc.page.height - 200) {
                    doc.addPage();
                }
            });

            // Continuación de bloques en nueva página si es necesario
            doc.addPage();

            const bloques2 = [
                {
                    numero: '4',
                    titulo: 'IA en Servicios y Conserjería',
                    duracion: '2 horas · 3 sesiones',
                    temas: [
                        'Sistemas de información inteligentes',
                        'Gestión de espacios y recursos',
                        'Asistencia multilingüe automatizada',
                        'Enfoque práctico: Talleres específicos para personal de conserjería y servicios'
                    ]
                },
                {
                    numero: '5',
                    titulo: 'Proyectos Colaborativos Interdepartamentales',
                    duracion: '4 horas · 6 sesiones',
                    temas: [
                        'Diseño de soluciones basadas en IA para el centro',
                        'Implementación de casos prácticos',
                        'Presentación de proyectos y retroalimentación',
                        'Evaluación de impacto y sostenibilidad',
                        'Plan de acción futuro',
                        'Enfoque práctico: Trabajo en equipos mixtos para resolver problemas reales del centro'
                    ]
                }
            ];

            bloques2.forEach(bloque => {
                doc.roundedRect(60, doc.y, doc.page.width - 120, 60, 8)
                    .fillAndStroke(darkBlue, darkBlue);

                const bloqueY = doc.y + 15;

                doc.fontSize(14)
                    .fillColor('white')
                    .font('Helvetica-Bold')
                    .text(`BLOQUE ${bloque.numero}`, 80, bloqueY, { continued: true })
                    .fontSize(10)
                    .font('Helvetica')
                    .text(`  •  ${bloque.duracion}`, { align: 'left' });

                doc.fontSize(13)
                    .font('Helvetica-Bold')
                    .text(bloque.titulo, 80, bloqueY + 20);

                doc.moveDown(3.5);

                bloque.temas.forEach(tema => {
                    doc.fontSize(10)
                        .fillColor('#4CAF50')
                        .text('✓', 80, doc.y, { continued: true, width: 20 })
                        .fillColor(darkGray)
                        .text(` ${tema}`, { width: doc.page.width - 160, align: 'left', lineGap: 2 })
                        .moveDown(0.6);
                });

                doc.moveDown(1);
            });

            // ===== PÁGINA: METODOLOGÍA =====
            doc.addPage();

            doc.fontSize(24)
                .font('Helvetica-Bold')
                .fillColor(ugtRed)
                .text('Metodología', { align: 'left' })
                .moveDown(1);

            doc.fontSize(11)
                .fillColor(darkGray)
                .font('Helvetica')
                .text('Aprendizaje activo y práctico desde el primer momento', { align: 'justify' })
                .moveDown(1.5);

            // Principios metodológicos
            doc.fontSize(11)
                .fillColor(lightGray)
                .text('PRINCIPIOS METODOLÓGICOS', { underline: true })
                .moveDown(0.8);

            const principios = [
                { icono: '🤝', titulo: 'Aprendizaje Activo', desc: 'Utilizarás herramientas de IA desde la primera sesión' },
                { icono: '💻', titulo: 'Enfoque Práctico', desc: 'Mínimo contenido teórico, máxima aplicación práctica' },
                { icono: '⚙️', titulo: 'Personalización', desc: 'Actividades adaptadas a cada perfil profesional' },
                { icono: '👥', titulo: 'Colaboración', desc: 'Fomento del trabajo en equipo e intercambio de experiencias' },
                { icono: '📈', titulo: 'Progresión', desc: 'De lo simple a lo complejo, construyendo sobre lo aprendido' }
            ];

            principios.forEach(p => {
                doc.fontSize(11)
                    .fillColor(darkBlue)
                    .font('Helvetica-Bold')
                    .text(`${p.icono} ${p.titulo}`, { continued: false })
                    .moveDown(0.3);

                doc.fontSize(10)
                    .font('Helvetica')
                    .fillColor(darkGray)
                    .text(p.desc, { indent: 30 })
                    .moveDown(1);
            });

            doc.moveDown(1);

            // Estructura de sesiones
            doc.fontSize(11)
                .fillColor(lightGray)
                .text('ESTRUCTURA DE LAS SESIONES (40 minutos)', { underline: true })
                .moveDown(0.8);

            const estructura = [
                { paso: '1', titulo: 'Introducción (5 min)', desc: 'Presentación del tema y objetivos de la sesión' },
                { paso: '2', titulo: 'Demostración (10 min)', desc: 'Ejemplo práctico de aplicación con herramientas reales' },
                { paso: '3', titulo: 'Práctica Guiada (15 min)', desc: 'Los participantes aplican lo aprendido con apoyo del formador' },
                { paso: '4', titulo: 'Reflexión y Dudas (10 min)', desc: 'Discusión sobre aplicaciones específicas y resolución de problemas' }
            ];

            estructura.forEach(e => {
                doc.fontSize(11)
                    .fillColor(darkBlue)
                    .font('Helvetica-Bold')
                    .text(`${e.paso}. ${e.titulo}`, { continued: false })
                    .moveDown(0.3);

                doc.fontSize(10)
                    .font('Helvetica')
                    .fillColor(darkGray)
                    .text(e.desc, { indent: 20 })
                    .moveDown(0.8);
            });

            // ===== PÁGINA: CALENDARIO =====
            doc.addPage();

            doc.fontSize(24)
                .font('Helvetica-Bold')
                .fillColor(ugtRed)
                .text('Calendario de las Jornadas', { align: 'left' })
                .moveDown(1);

            doc.fontSize(11)
                .fillColor(darkGray)
                .font('Helvetica')
                .text('5 semanas intensivas de formación práctica', { align: 'justify' })
                .moveDown(1.5);

            const calendario = [
                { semana: '1', tema: 'Fundamentos de IA', sesiones: '6 sesiones' },
                { semana: '2', tema: 'IA Educativa (Parte 1)', sesiones: '6 sesiones' },
                { semana: '3', tema: 'IA Educativa (Parte 2)', sesiones: '6 sesiones' },
                { semana: '4', tema: 'IA Administrativa + Servicios', sesiones: '6 sesiones' },
                { semana: '5', tema: 'Proyectos Colaborativos', sesiones: '6 sesiones' }
            ];

            calendario.forEach(c => {
                doc.roundedRect(60, doc.y, doc.page.width - 120, 50, 5)
                    .fillAndStroke('#f0f0f0', '#cccccc');

                const cardY = doc.y + 10;

                doc.fontSize(12)
                    .fillColor(darkBlue)
                    .font('Helvetica-Bold')
                    .text(`SEMANA ${c.semana}`, 80, cardY);

                doc.fontSize(11)
                    .fillColor(darkGray)
                    .font('Helvetica')
                    .text(c.tema, 80, cardY + 18);

                doc.fontSize(9)
                    .fillColor(lightGray)
                    .text(`📅 Viernes  |  🕐 ${c.sesiones}`, 80, cardY + 33);

                doc.moveDown(3.5);
            });

            doc.moveDown(1);
            doc.fontSize(10)
                .fillColor('#856404')
                .fillOpacity(0.1)
                .roundedRect(60, doc.y, doc.page.width - 120, 40, 5)
                .fill()
                .fillOpacity(1);

            doc.fillColor('#856404')
                .text('ℹ️ Nota: Cada día incluye 6 sesiones de 40 minutos con descansos de 10 minutos entre sesiones (3 horas por franja).',
                    70, doc.y - 25, { width: doc.page.width - 140, align: 'left', lineGap: 3 });

            // ===== PÁGINA FINAL: CONTACTO E INSCRIPCIÓN =====
            doc.addPage();

            doc.fontSize(24)
                .font('Helvetica-Bold')
                .fillColor(ugtRed)
                .text('Información de Contacto e Inscripción', { align: 'left' })
                .moveDown(2);

            doc.fontSize(11)
                .fillColor(darkGray)
                .font('Helvetica')
                .text('Para más información o inscripción, contacta con:', { align: 'left' })
                .moveDown(1.5);

            doc.fontSize(12)
                .fillColor(darkBlue)
                .font('Helvetica-Bold')
                .text('UGT-CLM-UGR Granada')
                .moveDown(0.5);

            doc.fontSize(11)
                .font('Helvetica')
                .fillColor(darkGray)
                .text('📧 Email: ugtclmgranada@gmail.com')
                .text('🌐 Web: https://ugtclmgranada.org')
                .text('📱 WhatsApp: +34 690 026 370')
                .moveDown(2);

            // Precio en caja destacada
            doc.roundedRect(60, doc.y, doc.page.width - 120, 120, 10)
                .fillAndStroke('#e8f4f8', '#2196F3');

            const priceBoxY = doc.y + 20;

            doc.fontSize(13)
                .fillColor(darkBlue)
                .font('Helvetica-Bold')
                .text('TARIFAS', 80, priceBoxY, { align: 'left' })
                .moveDown(0.8);

            doc.fontSize(11)
                .font('Helvetica')
                .fillColor(darkGray)
                .text('👥 Afiliados UGT: ', 80, doc.y, { continued: true })
                .fontSize(14)
                .fillColor(ugtRed)
                .font('Helvetica-Bold')
                .text('15€')
                .moveDown(0.5);

            doc.fontSize(11)
                .font('Helvetica')
                .fillColor(darkGray)
                .text('👤 No afiliados: ', 80, doc.y, { continued: true })
                .fontSize(14)
                .fillColor(darkGray)
                .font('Helvetica-Bold')
                .text('160€')
                .moveDown(1);

            doc.fontSize(9)
                .fillColor(lightGray)
                .font('Helvetica-Oblique')
                .text('* Los afiliados UGT disfrutan de un 90% de descuento', 80);

            // Footer final
            doc.fontSize(8)
                .fillColor(lightGray)
                .font('Helvetica')
                .text(`Documento generado el ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`,
                    60, doc.page.height - 50, { align: 'center' });

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
    generateFichaAfiliacion,
    generateProgramaCursoIA
};
