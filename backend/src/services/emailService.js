/**
 * Servicio de Notificaciones por Email
 * UGT-CLM-UGR Granada
 */

const nodemailer = require('nodemailer');

// Configuración del transporter
let transporter = null;

/**
 * Inicializar el servicio de email
 */
function initializeEmailService() {
    try {
        // Configurar transporter basado en variables de entorno
        const emailConfig = {
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT) || 587,
            secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        };

        // Si no hay configuración, usar modo desarrollo
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('⚠️ Email no configurado - Modo desarrollo activado');
            transporter = {
                sendMail: async (options) => {
                    console.log('📧 EMAIL SIMULADO:', {
                        to: options.to,
                        subject: options.subject,
                        text: options.text?.substring(0, 100) + '...'
                    });
                    return { messageId: 'dev-mode-' + Date.now() };
                }
            };
            return;
        }

        transporter = nodemailer.createTransporter(emailConfig);
        
        // Verificar conexión
        transporter.verify((error, success) => {
            if (error) {
                console.error('❌ Error configurando email:', error);
            } else {
                console.log('✅ Servicio de email configurado correctamente');
            }
        });

    } catch (error) {
        console.error('❌ Error inicializando servicio de email:', error);
    }
}

/**
 * Enviar email de confirmación de sugerencia
 */
async function sendSuggestionConfirmation(suggestion) {
    try {
        const subject = `✅ Sugerencia recibida - ${suggestion.type.toUpperCase()}`;
        
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .header { background: #E30613; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9f9f9; }
                    .footer { background: #333; color: white; padding: 15px; text-align: center; font-size: 12px; }
                    .urgency { padding: 10px; border-radius: 5px; margin: 10px 0; }
                    .urgency-alta { background: #ffebee; color: #c62828; border-left: 4px solid #c62828; }
                    .urgency-media { background: #fff3e0; color: #f57c00; border-left: 4px solid #f57c00; }
                    .urgency-baja { background: #e8f5e8; color: #2e7d32; border-left: 4px solid #2e7d32; }
                    .details { background: white; padding: 15px; border-radius: 5px; margin: 10px 0; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🏛️ UGT-CLM-UGR Granada</h1>
                    <h2>Sistema de Sugerencias</h2>
                </div>
                
                <div class="content">
                    <h2>✅ Tu sugerencia ha sido recibida</h2>
                    <p>Gracias por tu participación. Hemos recibido tu sugerencia y la gestionaremos adecuadamente.</p>
                    
                    <div class="urgency urgency-${suggestion.urgency}">
                        <strong>Urgencia:</strong> ${suggestion.urgency.toUpperCase()}
                    </div>
                    
                    <div class="details">
                        <h3>📋 Detalles de tu sugerencia:</h3>
                        <p><strong>Tipo:</strong> ${suggestion.type}</p>
                        <p><strong>Asunto:</strong> ${suggestion.subject}</p>
                        <p><strong>ID de seguimiento:</strong> #${suggestion._id.toString().slice(-8)}</p>
                        <p><strong>Fecha de recepción:</strong> ${new Date(suggestion.createdAt).toLocaleString('es-ES')}</p>
                    </div>
                    
                    <h3>📈 ¿Qué pasa ahora?</h3>
                    <ul>
                        <li>Tu sugerencia será revisada por el comité correspondiente</li>
                        <li>Recibirás una respuesta en un plazo máximo de 7 días hábiles</li>
                        <li>Puedes hacer seguimiento usando tu ID: #${suggestion._id.toString().slice(-8)}</li>
                    </ul>
                    
                    <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3>📞 Contacto Directo</h3>
                        <p>Si tu sugerencia es urgente, puedes contactarnos directamente:</p>
                        <p><strong>Email:</strong> ugtclmgranada@gmail.com</p>
                        <p><strong>Teléfono:</strong> 958 XXX XXX</p>
                    </div>
                </div>
                
                <div class="footer">
                    <p>© 2024 UGT-CLM-UGR Granada | Todos los derechos reservados</p>
                    <p>Este es un mensaje automático, por favor no responder a este email</p>
                </div>
            </body>
            </html>
        `;

        const mailOptions = {
            from: `"UGT-CLM-UGR Granada" <${process.env.EMAIL_FROM || 'ugtclmgranada@gmail.com'}>`,
            to: suggestion.email,
            subject: subject,
            html: htmlContent,
            text: `
                UGT-CLM-UGR Granada - Sistema de Sugerencias
                
                Tu sugerencia ha sido recibida
                
                Tipo: ${suggestion.type}
                Asunto: ${suggestion.subject}
                Urgencia: ${suggestion.urgency}
                ID: #${suggestion._id.toString().slice(-8)}
                Fecha: ${new Date(suggestion.createdAt).toLocaleString('es-ES')}
                
                Tu sugerencia será revisada y recibirás respuesta en 7 días hábiles.
                
                Para consultas urgentes: ugtclmgranada@gmail.com | 958 XXX XXX
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('📧 Email de confirmación enviado:', result.messageId);
        
        return result;

    } catch (error) {
        console.error('❌ Error enviando email de confirmación:', error);
        // No propagar error - el email es secundario
        return null;
    }
}

/**
 * Enviar notificación a administradores
 */
async function sendAdminNotification(suggestion) {
    try {
        const subject = `🚨 Nueva sugerencia - ${suggestion.type.toUpperCase()} [${suggestion.urgency.toUpperCase()}]`;
        
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .header { background: #E30613; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9f9f9; }
                    .alert { padding: 15px; border-radius: 5px; margin: 10px 0; }
                    .alert-alta { background: #ffebee; color: #c62828; border-left: 4px solid #c62828; }
                    .alert-media { background: #fff3e0; color: #f57c00; border-left: 4px solid #f57c00; }
                    .alert-baja { background: #e8f5e8; color: #2e7d32; border-left: 4px solid #2e7d32; }
                    .details { background: white; padding: 15px; border-radius: 5px; margin: 10px 0; }
                    .actions { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🏛️ UGT-CLM-UGR Granada</h1>
                    <h2>Panel de Administración</h2>
                </div>
                
                <div class="content">
                    <div class="alert alert-${suggestion.urgency}">
                        <h2>🚨 Nueva sugerencia recibida</h2>
                        <p><strong>Tipo:</strong> ${suggestion.type}</p>
                        <p><strong>Urgencia:</strong> ${suggestion.urgency.toUpperCase()}</p>
                    </div>
                    
                    <div class="details">
                        <h3>📋 Detalles:</h3>
                        <p><strong>De:</strong> ${suggestion.isAnonymous ? 'ANÓNIMO' : suggestion.name}</p>
                        ${!suggestion.isAnonymous && suggestion.email ? `<p><strong>Email:</strong> ${suggestion.email}</p>` : ''}
                        ${suggestion.department ? `<p><strong>Departamento:</strong> ${suggestion.department}</p>` : ''}
                        <p><strong>Asunto:</strong> ${suggestion.subject}</p>
                        <p><strong>ID:</strong> #${suggestion._id.toString().slice(-8)}</p>
                        <p><strong>Fecha:</strong> ${new Date(suggestion.createdAt).toLocaleString('es-ES')}</p>
                    </div>
                    
                    <div class="details">
                        <h3>💬 Mensaje:</h3>
                        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${suggestion.message}</div>
                    </div>
                    
                    <div class="actions">
                        <h3>⚡ Acciones recomendadas:</h3>
                        ${suggestion.urgency === 'alta' ? `
                            <p style="color: #c62828;"><strong>⚠️ URGENCIA ALTA - Requerida acción inmediata</strong></p>
                            <ul>
                                <li>Revisar en las próximas 2 horas</li>
                                <li>Contactar al remitente si no es anónimo</li>
                                <li>Escalar a dirección si es necesario</li>
                            </ul>
                        ` : suggestion.urgency === 'media' ? `
                            <p style="color: #f57c00;"><strong>⏰ URGENCIA MEDIA - Revisar hoy</strong></p>
                            <ul>
                                <li>Revisar durante el día</li>
                                <li>Asignar al departamento correspondiente</li>
                                <li>Responder en 48 horas</li>
                            </ul>
                        ` : `
                            <p style="color: #2e7d32;"><strong>📅 URGENCIA BAJA - Revisar esta semana</strong></p>
                            <ul>
                                <li>Incluir en la próxima revisión semanal</li>
                                <li>Procesar según orden de llegada</li>
                                <li>Responder en 7 días</li>
                            </ul>
                        `}
                    </div>
                    
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="${process.env.ADMIN_URL || 'https://sindicato-mu.vercel.app/admin'}" 
                           style="background: #E30613; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            📊 Ir al Panel de Administración
                        </a>
                    </div>
                </div>
            </body>
            </html>
        `;

        const adminEmails = process.env.ADMIN_EMAILS ? 
            process.env.ADMIN_EMAILS.split(',') : 
            ['ugtclmgranada@gmail.com'];

        const mailOptions = {
            from: `"Sistema UGT" <${process.env.EMAIL_FROM || 'ugtclmgranada@gmail.com'}>`,
            to: adminEmails,
            subject: subject,
            html: htmlContent,
            priority: suggestion.urgency === 'alta' ? 'high' : 'normal'
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('📧 Notificación de admin enviada:', result.messageId);
        
        return result;

    } catch (error) {
        console.error('❌ Error enviando notificación a admin:', error);
        // No propagar error - el email es secundario
        return null;
    }
}

/**
 * Enviar email de actualización de estado
 */
async function sendStatusUpdate(suggestion, newStatus, adminNotes = '') {
    try {
        if (suggestion.isAnonymous || !suggestion.email) {
            console.log('📧 Omitiendo email de actualización (sugerencia anónima o sin email)');
            return null;
        }

        const statusMessages = {
            'en-revision': 'Tu sugerencia está siendo revisada',
            'procesada': 'Tu sugerencia ha sido procesada',
            'archivada': 'Tu sugerencia ha sido archivada'
        };

        const subject = `📈 Actualización - Sugerencia #${suggestion._id.toString().slice(-8)}`;
        
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .header { background: #E30613; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9f9f9; }
                    .status { padding: 15px; border-radius: 5px; margin: 10px 0; }
                    .status-en-revision { background: #fff3e0; color: #f57c00; border-left: 4px solid #f57c00; }
                    .status-procesada { background: #e8f5e8; color: #2e7d32; border-left: 4px solid #2e7d32; }
                    .status-archivada { background: #f5f5f5; color: #666; border-left: 4px solid #666; }
                    .details { background: white; padding: 15px; border-radius: 5px; margin: 10px 0; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🏛️ UGT-CLM-UGR Granada</h1>
                    <h2>Sistema de Sugerencias</h2>
                </div>
                
                <div class="content">
                    <h2>📈 Actualización de tu sugerencia</h2>
                    
                    <div class="status status-${newStatus}">
                        <h3>${statusMessages[newStatus] || 'Estado actualizado'}</h3>
                        <p><strong>Nuevo estado:</strong> ${newStatus}</p>
                    </div>
                    
                    <div class="details">
                        <h3>📋 Detalles:</h3>
                        <p><strong>ID de seguimiento:</strong> #${suggestion._id.toString().slice(-8)}</p>
                        <p><strong>Asunto:</strong> ${suggestion.subject}</p>
                        <p><strong>Fecha de actualización:</strong> ${new Date().toLocaleString('es-ES')}</p>
                    </div>
                    
                    ${adminNotes ? `
                        <div class="details">
                            <h3>📝 Notas del administrador:</h3>
                            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">${adminNotes}</div>
                        </div>
                    ` : ''}
                    
                    <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3>📞 ¿Necesitas algo más?</h3>
                        <p>Si tienes alguna pregunta o necesitas información adicional, no dudes en contactarnos:</p>
                        <p><strong>Email:</strong> ugtclmgranada@gmail.com</p>
                        <p><strong>Teléfono:</strong> 958 XXX XXX</p>
                    </div>
                </div>
                
                <div class="footer">
                    <p>© 2024 UGT-CLM-UGR Granada | Todos los derechos reservados</p>
                    <p>Este es un mensaje automático, por favor no responder a este email</p>
                </div>
            </body>
            </html>
        `;

        const mailOptions = {
            from: `"UGT-CLM-UGR Granada" <${process.env.EMAIL_FROM || 'ugtclmgranada@gmail.com'}>`,
            to: suggestion.email,
            subject: subject,
            html: htmlContent
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('📧 Email de actualización enviado:', result.messageId);
        
        return result;

    } catch (error) {
        console.error('❌ Error enviando email de actualización:', error);
        // No propagar error - el email es secundario
        return null;
    }
}

/**
 * Enviar email de recuperación de contraseña
 */
async function sendPasswordResetEmail(user, resetToken) {
    try {
        // Verificar que el transporter está inicializado
        if (!transporter) {
            const error = new Error(
                'Servicio de email no configurado. ' +
                'Variables requeridas: EMAIL_USER, EMAIL_PASS, EMAIL_HOST, EMAIL_PORT. ' +
                `Configuradas: EMAIL_USER=${!!process.env.EMAIL_USER}, EMAIL_PASS=${!!process.env.EMAIL_PASS}, ` +
                `EMAIL_HOST=${!!process.env.EMAIL_HOST}, EMAIL_PORT=${!!process.env.EMAIL_PORT}`
            );
            console.error('❌', error.message);
            throw error;
        }

        const resetUrl = `${process.env.FRONTEND_URL || 'https://ugtclmgranada.org'}/reset-password.html?token=${resetToken}`;

        const subject = '🔐 Recuperación de contraseña - UGT-CLM-UGR Granada';

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .header { background: #E30613; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9f9f9; }
                    .footer { background: #333; color: white; padding: 15px; text-align: center; font-size: 12px; }
                    .button {
                        background: #E30613;
                        color: white;
                        padding: 12px 24px;
                        text-decoration: none;
                        border-radius: 5px;
                        display: inline-block;
                        margin: 20px 0;
                    }
                    .alert {
                        background: #fff3e0;
                        color: #f57c00;
                        padding: 15px;
                        border-radius: 5px;
                        margin: 20px 0;
                        border-left: 4px solid #f57c00;
                    }
                    .code-box {
                        background: #f5f5f5;
                        padding: 15px;
                        border-radius: 5px;
                        font-family: monospace;
                        font-size: 16px;
                        text-align: center;
                        margin: 20px 0;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🏛️ UGT-CLM-UGR Granada</h1>
                    <h2>Recuperación de Contraseña</h2>
                </div>

                <div class="content">
                    <h2>Hola ${user.nombre},</h2>
                    <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>

                    <p>Si no realizaste esta solicitud, puedes ignorar este email. Tu contraseña no será cambiada.</p>

                    <div class="alert">
                        <strong>⚠️ Importante:</strong> Este enlace expirará en 1 hora por seguridad.
                    </div>

                    <p>Para restablecer tu contraseña, haz clic en el siguiente botón:</p>

                    <div style="text-align: center;">
                        <a href="${resetUrl}" class="button">🔐 Restablecer mi contraseña</a>
                    </div>

                    <p>O copia y pega este enlace en tu navegador:</p>
                    <div class="code-box">${resetUrl}</div>

                    <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3>🔒 Consejos de seguridad:</h3>
                        <ul>
                            <li>Nunca compartas tu contraseña con nadie</li>
                            <li>Usa una contraseña única y segura</li>
                            <li>Si no solicitaste este cambio, contacta con soporte inmediatamente</li>
                        </ul>
                        <p><strong>Contacto:</strong> ugtclmgranada@gmail.com</p>
                    </div>
                </div>

                <div class="footer">
                    <p>© 2024 UGT-CLM-UGR Granada | Todos los derechos reservados</p>
                    <p>Este es un mensaje automático, por favor no responder a este email</p>
                </div>
            </body>
            </html>
        `;

        const mailOptions = {
            from: `"UGT-CLM-UGR Granada" <${process.env.EMAIL_FROM || 'ugtclmgranada@gmail.com'}>`,
            to: user.email,
            subject: subject,
            html: htmlContent,
            text: `
                UGT-CLM-UGR Granada - Recuperación de Contraseña

                Hola ${user.nombre},

                Hemos recibido una solicitud para restablecer tu contraseña.

                Para restablecer tu contraseña, visita el siguiente enlace:
                ${resetUrl}

                Este enlace expirará en 1 hora.

                Si no realizaste esta solicitud, ignora este email.

                Contacto: ugtclmgranada@gmail.com
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('📧 Email de recuperación enviado:', result.messageId);

        return result;

    } catch (error) {
        console.error('❌ Error enviando email de recuperación:', error);
        throw error; // Propagar error para que el endpoint maneje la respuesta
    }
}

module.exports = {
    initializeEmailService,
    sendSuggestionConfirmation,
    sendAdminNotification,
    sendStatusUpdate,
    sendPasswordResetEmail
};
