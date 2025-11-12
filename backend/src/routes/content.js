const express = require('express');
const router = express.Router();

// Importar modelos y middleware
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { validateContact, validateCoursePreinscription } = require('../middleware/validators');

/**
 * @route   GET /api/courses
 * @desc    Obtener lista de cursos disponibles
 * @access  Public
 */
router.get('/courses', async (req, res) => {
    try {
        // Por ahora, cursos de ejemplo. En producción, vendrían de la base de datos
        const courses = [
            {
                _id: '1',
                title: 'Inteligencia Artificial Aplicada al Sector Educativo del CLM',
                description: 'Curso intensivo sobre las últimas tendencias en IA aplicadas a la educación en Castilla-La Mancha',
                startDate: new Date('2024-12-15T09:00:00Z'),
                endDate: new Date('2024-12-17T18:00:00Z'),
                status: 'active',
                price: 0,
                maxStudents: 30,
                currentStudents: 15,
                location: 'Sede UGT Granada',
                instructor: 'Dr. Antonio López Martínez',
                category: 'Tecnología Educativa',
                duration: '20 horas',
                requirements: 'Ser afiliado a UGT-CLM',
                image: 'https://via.placeholder.com/400x200/4CAF50/white?text=IA+para+CLM'
            },
            {
                _id: '2',
                title: 'Negociación Colectiva y Derechos Laborales',
                description: 'Curso práctico sobre técnicas de negociación y normativa laboral vigente',
                startDate: new Date('2024-12-20T16:00:00Z'),
                endDate: new Date('2024-12-20T20:00:00Z'),
                status: 'active',
                price: 0,
                maxStudents: 25,
                currentStudents: 8,
                location: 'Online - Zoom',
                instructor: 'María González Gómez',
                category: 'Formación Sindical',
                duration: '4 horas',
                requirements: 'Ninguno',
                image: 'https://via.placeholder.com/400x200/2196F3/white?text=Negociación+Laboral'
            },
            {
                _id: '3',
                title: 'Prevención de Riesgos Laborales en el Sector Educativo',
                description: 'Formación obligatoria en prevención de riesgos específica para centros educativos',
                startDate: new Date('2025-01-10T09:00:00Z'),
                endDate: new Date('2025-01-10T14:00:00Z'),
                status: 'upcoming',
                price: 0,
                maxStudents: 40,
                currentStudents: 5,
                location: 'Centro de Formación UGT Granada',
                instructor: 'Carlos Rodríguez Pérez',
                category: 'Prevención',
                duration: '5 horas',
                requirements: 'Ser personal docente o administrativo',
                image: 'https://via.placeholder.com/400x200/FF9800/white?text=Prevención+de+Riesgos'
            }
        ];

        // Filtrar cursos activos o futuros
        const activeCourses = courses.filter(course =>
            course.status === 'active' || course.status === 'upcoming'
        );

        console.log(`📚 Lista de cursos enviados: ${activeCourses.length} cursos`);

        res.json({
            success: true,
            courses: activeCourses,
            total: activeCourses.length
        });

    } catch (error) {
        console.error('Error al obtener cursos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener los cursos'
        });
    }
});

/**
 * @route   POST /api/courses/preinscription
 * @desc    Enviar preinscripción a curso
 * @access  Public
 */
router.post('/courses/preinscription', validateCoursePreinscription, async (req, res) => {
    try {
        const { courseId, userData, comments } = req.body;

        console.log(`📝 Preinscripción recibida: ${userData.email} - Curso ${courseId}`);

        // Verificar si el curso existe (simulado)
        const courseExists = ['1', '2', '3'].includes(courseId);

        if (!courseExists) {
            return res.status(404).json({
                success: false,
                error: 'Curso no encontrado'
            });
        }

        // Guardar preinscripción (simulado - en producción iría a la base de datos)
        const preinscriptionData = {
            _id: Date.now().toString(),
            courseId,
            userData,
            comments: comments || '',
            timestamp: new Date(),
            status: 'pending',
            ip: req.ip,
            userAgent: req.get('User-Agent')
        };

        // Aquí iría el guardado en MongoDB:
        // await Preinscription.create(preinscriptionData);

        console.log(`✅ Preinscripción guardada: ${userData.email}`);

        // En producción, aquí se podría enviar email de confirmación
        // y notificación al administrador

        res.status(201).json({
            success: true,
            preinscriptionId: preinscriptionData._id,
            message: 'Preinscripción enviada correctamente'
        });

    } catch (error) {
        console.error('Error en preinscripción:', error);
        res.status(500).json({
            success: false,
            error: 'Error al procesar la preinscripción'
        });
    }
});

/**
 * @route   GET /api/events
 * @desc    Obtener lista de eventos
 * @access  Public
 */
router.get('/events', async (req, res) => {
    try {
        // Por ahora, eventos de ejemplo
        const events = [
            {
                _id: '1',
                title: 'Asamblea General UGT-CLM Granada',
                description: 'Asamblea ordinaria trimestral para presentar actividades y discutir propuestas',
                date: new Date('2024-12-20T18:00:00Z'),
                location: 'Sede Central UGT Granada - Calle Reyes Católicos, 15',
                status: 'active',
                type: 'asamblea',
                attendees: 45,
                maxCapacity: 100,
                organizer: 'UGT-CLM Granada',
                registrationRequired: true,
                registrationDeadline: new Date('2024-12-18T23:59:59Z')
            },
            {
                _id: '2',
                title: 'Jornada sobre Derechos Laborales 2025',
                description: 'Actualización sobre nuevos derechos y obligaciones laborales para 2025',
                date: new Date('2025-01-15T10:00:00Z'),
                location: 'Auditorio Facultad de Derecho UGR',
                status: 'upcoming',
                type: 'jornada',
                attendees: 0,
                maxCapacity: 200,
                organizer: 'UGT-CLM Granada + Universidad de Granada',
                registrationRequired: true,
                registrationDeadline: new Date('2025-01-13T23:59:59Z')
            },
            {
                _id: '3',
                title: 'Reunión de Sección - Balance 2024',
                description: 'Presentación de balance anual y planificación 2025',
                date: new Date('2024-12-27T17:00:00Z'),
                location: 'Sede UGT Granada',
                status: 'active',
                type: 'reunion',
                attendees: 12,
                maxCapacity: 50,
                organizer: 'Comité Seccional UGT-CLM-UGR',
                registrationRequired: false,
                registrationDeadline: null
            }
        ];

        // Filtrar eventos activos y futuros
        const activeEvents = events.filter(event =>
            event.status === 'active' || event.status === 'upcoming'
        );

        console.log(`📅 Lista de eventos enviados: ${activeEvents.length} eventos`);

        res.json({
            success: true,
            events: activeEvents,
            total: activeEvents.length
        });

    } catch (error) {
        console.error('Error al obtener eventos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener los eventos'
        });
    }
});

/**
 * @route   GET /api/documents
 * @desc    Obtener lista de documentos disponibles
 * @access  Private (solo para afiliados)
 */
router.get('/documents', authenticateToken, async (req, res) => {
    try {
        // Documentos de ejemplo para afiliados
        const documents = [
            {
                _id: '1',
                title: 'Estatutos UGT-CLM',
                description: 'Documentos estatutarios actualizados de UGT Castilla-La Mancha',
                type: 'PDF',
                url: '/documents/estatutos-ugt-clm.pdf',
                category: 'legal',
                uploadDate: new Date('2024-01-10T10:00:00Z'),
                size: '2.5 MB',
                required: true,
                downloadCount: 156
            },
            {
                _id: '2',
                title: 'Guía de Derechos Laborales 2024',
                description: 'Guía completa de derechos y obligaciones laborales para 2024',
                type: 'PDF',
                url: '/documents/guia-derechos-2024.pdf',
                category: 'legal',
                uploadDate: new Date('2024-03-15T14:30:00Z'),
                size: '4.8 MB',
                required: false,
                downloadCount: 89
            },
            {
                _id: '3',
                title: 'Modelo de Solicitud de Bajas Laborales',
                description: 'Formulario oficial para solicitar bajas laborales',
                type: 'PDF',
                url: '/documents/solicitud-bajas.pdf',
                category: 'formularios',
                uploadDate: new Date('2024-06-20T09:15:00Z'),
                size: '156 KB',
                required: false,
                downloadCount: 234
            },
            {
                _id: '4',
                title: 'Convenio Colectivo Educación CLM 2023-2025',
                description: 'Texto completo del convenio colectivo para personal educativo',
                type: 'PDF',
                url: '/documents/convenio-educacion-clm.pdf',
                category: 'convenios',
                uploadDate: new Date('2023-12-01T11:00:00Z'),
                size: '8.2 MB',
                required: false,
                downloadCount: 412
            }
        ];

        console.log(`📁 Lista de documentos enviados: ${documents.length} documentos para ${req.user.email}`);

        res.json({
            success: true,
            documents,
            total: documents.length
        });

    } catch (error) {
        console.error('Error al obtener documentos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener los documentos'
        });
    }
});

/**
 * @route   POST /api/contact/submit
 * @desc    Enviar formulario de contacto
 * @access  Public
 */
router.post('/contact/submit', validateContact, async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        console.log(`📧 Contacto recibido: ${name} (${email})`);

        // Guardar solicitud de contacto (simulado)
        const contactData = {
            _id: Date.now().toString(),
            name,
            email,
            phone,
            subject: subject || 'Consulta general',
            message,
            timestamp: new Date(),
            status: 'pending',
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            source: 'website'
        };

        // Aquí iría el guardado en MongoDB:
        // await ContactRequest.create(contactData);

        console.log(`✅ Solicitud de contacto guardada: ${email}`);

        // En producción, aquí se enviaría email:
        // - Email de confirmación al usuario
        // - Notificación al administrador
        // - Posible integración con CRM

        res.status(201).json({
            success: true,
            message: 'Mensaje enviado correctamente. Nos pondremos en contacto contigo pronto.'
        });

    } catch (error) {
        console.error('Error en contacto:', error);
        res.status(500).json({
            success: false,
            error: 'Error al enviar el mensaje'
        });
    }
});

/**
 * @route   POST /api/affiliations/submit
 * @desc    Enviar solicitud de afiliación (sin pago)
 * @access  Public
 */
router.post('/affiliations/submit', async (req, res) => {
    try {
        const { name, email, phone, department, comments } = req.body;

        console.log(`🤝 Solicitud de afiliación: ${name} (${email})`);

        // Validar datos básicos
        if (!name || !email) {
            return res.status(400).json({
                success: false,
                error: 'Nombre y email son requeridos'
            });
        }

        // Guardar solicitud (simulado)
        const affiliationData = {
            _id: Date.now().toString(),
            name,
            email,
            phone,
            department,
            comments: comments || '',
            timestamp: new Date(),
            status: 'pending',
            type: 'request',
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            source: 'website'
        };

        // Aquí iría el guardado en MongoDB:
        // await AffiliationRequest.create(affiliationData);

        console.log(`✅ Solicitud de afiliación guardada: ${email}`);

        // En producción:
        // - Enviar email de bienvenida
        // - Notificar al equipo de afiliación
        // - Crear tarea de seguimiento

        res.status(201).json({
            success: true,
            affiliationId: affiliationData._id,
            message: 'Solicitud de afiliación recibida. Nos contactaremos pronto con los siguientes pasos.'
        });

    } catch (error) {
        console.error('Error en afiliación:', error);
        res.status(500).json({
            success: false,
            error: 'Error al procesar la solicitud de afiliación'
        });
    }
});

module.exports = router;