/**
 * User Dashboard Injector
 * Inyecta automáticamente el HTML del dashboard de usuario en cualquier página
 * Esto permite que todas las páginas (actuales y futuras) tengan acceso al dashboard
 */

(function() {
    'use strict';

    // HTML completo del dashboard y todos sus modales
    const dashboardHTML = `
    <!-- Member Dashboard (Hidden by default) -->
    <section id="memberDashboard" class="section" style="display: none;">
        <div class="container">
            <div class="dashboard-header">
                <h2>Bienvenido, <span id="userName">Afiliado</span></h2>
                <button id="logoutBtn" class="btn btn-secondary">Cerrar Sesión</button>
            </div>

            <div class="dashboard-content">
                <div class="dashboard-grid">
                    <div class="dashboard-card">
                        <div class="card-icon">
                            <i class="fas fa-user"></i>
                        </div>
                        <h3>Mis Datos</h3>
                        <p>Gestiona tu información personal</p>
                        <button class="btn btn-outline">Ver Perfil</button>
                    </div>

                    <div class="dashboard-card">
                        <div class="card-icon">
                            <i class="fas fa-graduation-cap"></i>
                        </div>
                        <h3>Mis Cursos</h3>
                        <p>Consulta tus inscripciones y certificados</p>
                        <button class="btn btn-outline">Ver Cursos</button>
                    </div>

                    <div class="dashboard-card">
                        <div class="card-icon">
                            <i class="fas fa-file-alt"></i>
                        </div>
                        <h3>Documentos</h3>
                        <p>Accede a tu documentación sindical</p>
                        <button class="btn btn-outline">Ver Documentos</button>
                    </div>

                    <div class="dashboard-card">
                        <div class="card-icon">
                            <i class="fas fa-calendar"></i>
                        </div>
                        <h3>Eventos</h3>
                        <p>Próximas actividades y reuniones</p>
                        <button class="btn btn-outline">Ver Eventos</button>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Edit Profile Modal -->
    <div id="editProfileModal" class="modal">
        <div class="modal-content">
            <span class="close" id="closeEditProfile">&times;</span>
            <div class="edit-profile-form">
                <h3>👤 Editar Mi Perfil</h3>
                <p>Actualiza tu información personal</p>

                <form id="editProfileForm">
                    <div class="form-section">
                        <h4>Información Personal</h4>

                        <div class="form-group">
                            <label for="profilePhoto">Foto de Perfil</label>
                            <div class="photo-upload-container">
                                <div class="photo-preview" id="photoPreview">
                                    <div class="default-avatar" id="defaultAvatar">
                                        <i class="fas fa-user"></i>
                                    </div>
                                    <img id="profileImagePreview" src="" alt="Foto de perfil" style="display: none;">
                                    <div class="photo-overlay">
                                        <i class="fas fa-camera"></i>
                                        <span>Cambiar foto</span>
                                    </div>
                                </div>
                                <input type="file" id="profilePhoto" name="photo" accept="image/*" style="display: none;">
                                <button type="button" class="btn btn-outline btn-sm" id="changePhotoBtn">
                                    <i class="fas fa-upload"></i> Subir Foto
                                </button>
                                <button type="button" class="btn btn-outline btn-sm btn-danger" id="removePhotoBtn" style="display: none;">
                                    <i class="fas fa-trash"></i> Eliminar
                                </button>
                            </div>
                            <small style="color: var(--text-light);">Formatos aceptados: JPG, PNG, GIF (Máx. 5MB)</small>
                            <span class="error-message"></span>
                        </div>

                        <div class="form-group">
                            <label for="profileName">Nombre Completo</label>
                            <input type="text" id="profileName" name="name" required>
                            <span class="error-message"></span>
                        </div>

                        <div class="form-group">
                            <label for="profileEmail">Email</label>
                            <input type="email" id="profileEmail" name="email" required readonly>
                            <small>El email no se puede modificar</small>
                            <span class="error-message"></span>
                        </div>

                        <div class="form-group">
                            <label for="profilePhone">Teléfono</label>
                            <input type="tel" id="profilePhone" name="phone" placeholder="Tu teléfono">
                            <span class="error-message"></span>
                        </div>

                        <div class="form-group">
                            <label for="profileDepartment">Departamento/Centro</label>
                            <input type="text" id="profileDepartment" name="department" placeholder="Tu departamento o centro">
                            <span class="error-message"></span>
                        </div>
                    </div>

                    <div class="form-section">
                        <h4>⚙️ Preferencias de comunicación</h4>
                        <p style="color: var(--text-light); margin-bottom: 1.5rem; font-size: 0.95rem;">
                            Configura cómo deseas recibir comunicaciones y compartir tu información
                        </p>

                        <div class="form-group">
                            <label class="checkbox-option">
                                <input type="checkbox" id="notificationsEnabled" name="notifications">
                                <span class="checkmark"></span>
                                <div class="label-content">
                                    <div class="label-text">📧 Recibir notificaciones por email</div>
                                    <small style="color: var(--text-light); display: block; margin-top: 4px;">
                                        Mantente informado sobre cursos, eventos y noticias importantes
                                    </small>
                                </div>
                            </label>
                        </div>

                        <div class="form-group">
                            <label class="checkbox-option">
                                <input type="checkbox" id="publicProfile" name="publicProfile">
                                <span class="checkmark"></span>
                                <div class="label-content">
                                    <div class="label-text">👥 Perfil público visible para otros afiliados</div>
                                    <small style="color: var(--text-light); display: block; margin-top: 4px;">
                                        Permite que otros afiliados puedan ver tu información básica
                                    </small>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" id="cancelEdit">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Guardar Cambios</button>
                    </div>

                    <div class="form-footer" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
                        <a href="#" id="changePasswordLink" style="color: var(--primary-color); text-decoration: none;">
                            🔐 Cambiar contraseña
                        </a>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Change Password Modal -->
    <div id="changePasswordModal" class="modal">
        <div class="modal-content">
            <span class="close" id="closeChangePassword">&times;</span>
            <div class="login-form">
                <h3>🔐 Cambiar Contraseña</h3>
                <p style="margin-bottom: 20px; color: #666;">Ingresa tu contraseña actual y elige una nueva</p>
                <form id="changePasswordForm">
                    <div class="form-group">
                        <input type="password" name="currentPassword" placeholder="Contraseña actual" required>
                        <span class="error-message"></span>
                    </div>
                    <div class="form-group">
                        <input type="password" name="newPassword" placeholder="Nueva contraseña (mínimo 6 caracteres)" required minlength="6">
                        <span class="error-message"></span>
                    </div>
                    <div class="form-group">
                        <input type="password" name="confirmPassword" placeholder="Confirmar nueva contraseña" required minlength="6">
                        <span class="error-message"></span>
                    </div>
                    <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 12px; border-radius: 4px; margin-bottom: 15px; font-size: 0.9rem;">
                        ⚠️ <strong>Importante:</strong> Al cambiar tu contraseña, cerrarás sesión en todos tus dispositivos por seguridad.
                    </div>
                    <button type="submit" class="btn btn-primary btn-full">Cambiar Contraseña</button>
                </form>
                <div class="login-footer">
                    <p><a href="#" id="backToProfile">Volver al perfil</a></p>
                </div>
            </div>
        </div>
    </div>

    <!-- My Courses Modal -->
    <div id="myCoursesModal" class="modal">
        <div class="modal-content modal-large">
            <span class="close" id="closeMyCourses">&times;</span>
            <div class="courses-modal">
                <h3>📚 Mis Cursos</h3>
                <p>Tus inscripciones y progreso de formación</p>

                <div class="courses-content">
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="fas fa-graduation-cap"></i>
                        </div>
                        <h4>Aún no tienes cursos inscritos</h4>
                        <p>Explora nuestro catálogo de cursos y comienza tu formación profesional</p>
                        <button class="btn btn-primary" onclick="closeModalAndNavigateToCourses()">
                            <i class="fas fa-search"></i> Explorar Cursos
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- My Documents Modal -->
    <div id="myDocumentsModal" class="modal">
        <div class="modal-content modal-large">
            <span class="close" id="closeMyDocuments">&times;</span>
            <div class="documents-modal">
                <h3>📁 Mis Documentos</h3>
                <p>Accede a tu documentación sindical</p>

                <div id="documentsContainer" class="documents-content">
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="fas fa-file-alt"></i>
                        </div>
                        <h4>No hay documentos disponibles</h4>
                        <p>Los documentos sindicales estarán disponibles próximamente</p>
                        <div class="coming-soon-info">
                            <p><i class="fas fa-info-circle"></i> Estamos trabajando en preparar tu documentación</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- My Events Modal -->
    <div id="myEventsModal" class="modal">
        <div class="modal-content modal-large">
            <span class="close" id="closeMyEvents">&times;</span>
            <div class="events-modal">
                <h3>📅 Mis Eventos</h3>
                <p>Próximas actividades y reuniones sindicales</p>

                <div id="eventsContainer" class="events-content">
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="fas fa-calendar"></i>
                        </div>
                        <h4>No hay eventos programados</h4>
                        <p>Pronto anunciaremos nuestras próximas actividades</p>
                        <div class="upcoming-info">
                            <h5>Mantente atento a:</h5>
                            <ul>
                                <li><i class="fas fa-users"></i> Asambleas generales</li>
                                <li><i class="fas fa-graduation-cap"></i> Cursos de formación</li>
                                <li><i class="fas fa-handshake"></i> Reuniones sindicales</li>
                                <li><i class="fas fa-microphone"></i> Charlas informativas</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;

    // Inyectar el HTML cuando el DOM esté listo
    function injectDashboard() {
        // Verificar si ya existe el dashboard (para evitar duplicados)
        if (document.getElementById('memberDashboard')) {
            console.log('ℹ️ Dashboard ya existe en esta página');
            return;
        }

        // Crear un contenedor temporal
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = dashboardHTML;

        // Inyectar antes del footer (o al final del body si no hay footer)
        const footer = document.querySelector('.footer') || document.querySelector('footer');
        if (footer) {
            footer.parentNode.insertBefore(tempContainer.firstElementChild, footer);
            // Insertar el resto de los elementos
            while (tempContainer.firstElementChild) {
                footer.parentNode.insertBefore(tempContainer.firstElementChild, footer);
            }
        } else {
            // Si no hay footer, añadir al final del body
            while (tempContainer.firstElementChild) {
                document.body.appendChild(tempContainer.firstElementChild);
            }
        }

        console.log('✅ Dashboard de usuario inyectado correctamente');
    }

    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectDashboard);
    } else {
        // DOM ya está listo
        injectDashboard();
    }
})();
