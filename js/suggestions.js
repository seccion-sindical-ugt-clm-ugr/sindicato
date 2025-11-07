/**
 * Sistema de Sugerencias - UGT-CLM-UGR
 * Gestiona el envío de sugerencias de afiliados
 */

// Configuración
const SUGGESTIONS_CONFIG = {
    get apiUrl() {
        return window.BACKEND_CONFIG ? window.BACKEND_CONFIG.apiUrl : 'https://sindicato-mu.vercel.app';
    },
    endpoints: {
        create: '/api/suggestions',
        stats: '/api/suggestions/stats'
    }
};

/**
 * Enviar sugerencia al backend
 */
async function submitSuggestion(formData) {
    try {
        const response = await fetch(`${SUGGESTIONS_CONFIG.apiUrl}${SUGGESTIONS_CONFIG.endpoints.create}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Error del servidor: ${response.status}`);
        }

        const result = await response.json();
        return result;

    } catch (error) {
        console.error('❌ Error enviando sugerencia:', error);
        throw error;
    }
}

/**
 * Mostrar modal de sugerencias
 */
function showSuggestionsModal() {
    // Comprobar si ya existe el modal
    let modal = document.getElementById('suggestions-modal');

    if (!modal) {
        // Crear modal
        modal = createSuggestionsModal();
        document.body.appendChild(modal);
    }

    // Mostrar modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Evitar scroll del body
}

/**
 * Ocultar modal de sugerencias
 */
function hideSuggestionsModal() {
    const modal = document.getElementById('suggestions-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // Restaurar scroll

        // Limpiar formulario
        const form = document.getElementById('suggestions-form');
        if (form) form.reset();

        // Limpiar checkbox anónimo
        const anonymousCheckbox = document.getElementById('isAnonymous');
        if (anonymousCheckbox) {
            anonymousCheckbox.checked = false;
            toggleAnonymousFields(false);
        }
    }
}

/**
 * Crear estructura HTML del modal
 */
function createSuggestionsModal() {
    const modal = document.createElement('div');
    modal.id = 'suggestions-modal';
    modal.className = 'suggestions-modal';

    modal.innerHTML = `
        <div class="suggestions-modal-content">
            <div class="suggestions-modal-header">
                <h2>
                    <i class="fas fa-lightbulb"></i>
                    Buzón de Sugerencias
                </h2>
                <button type="button" class="suggestions-close-btn" onclick="hideSuggestionsModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="suggestions-modal-body">
                <p class="suggestions-intro">
                    Tu opinión es importante. Comparte tus sugerencias, quejas o propuestas
                    con el comité y la dirección de la empresa.
                </p>

                <form id="suggestions-form" class="suggestions-form">
                    <!-- Tipo de sugerencia -->
                    <div class="form-group">
                        <label for="type">
                            <i class="fas fa-tag"></i> Tipo *
                        </label>
                        <select id="type" name="type" required>
                            <option value="">Selecciona un tipo</option>
                            <option value="sugerencia">💡 Sugerencia</option>
                            <option value="queja">⚠️ Queja</option>
                            <option value="propuesta">🎯 Propuesta</option>
                            <option value="denuncia">🚨 Denuncia</option>
                            <option value="consulta">❓ Consulta</option>
                        </select>
                    </div>

                    <!-- Urgencia -->
                    <div class="form-group">
                        <label for="urgency">
                            <i class="fas fa-exclamation-triangle"></i> Urgencia *
                        </label>
                        <select id="urgency" name="urgency" required>
                            <option value="baja">🟢 Baja</option>
                            <option value="media" selected>🟡 Media</option>
                            <option value="alta">🔴 Alta</option>
                        </select>
                    </div>

                    <!-- Anónimo -->
                    <div class="form-group checkbox-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="isAnonymous" name="isAnonymous" onchange="toggleAnonymousFields(this.checked)">
                            <span>Enviar de forma anónima</span>
                        </label>
                        <small>Si marcas esta opción, no se guardará tu información personal</small>
                    </div>

                    <!-- Campos personales (ocultos si es anónimo) -->
                    <div id="personal-fields">
                        <div class="form-group">
                            <label for="name">
                                <i class="fas fa-user"></i> Nombre
                            </label>
                            <input type="text" id="name" name="name" placeholder="Tu nombre (opcional)">
                        </div>

                        <div class="form-group">
                            <label for="email">
                                <i class="fas fa-envelope"></i> Email
                            </label>
                            <input type="email" id="email" name="email" placeholder="tu@email.com (opcional)">
                        </div>

                        <div class="form-group">
                            <label for="department">
                                <i class="fas fa-building"></i> Departamento
                            </label>
                            <input type="text" id="department" name="department" placeholder="Tu departamento (opcional)">
                        </div>
                    </div>

                    <!-- Asunto -->
                    <div class="form-group">
                        <label for="subject">
                            <i class="fas fa-heading"></i> Asunto *
                        </label>
                        <input type="text" id="subject" name="subject" required
                               placeholder="Resumen breve del tema"
                               minlength="5" maxlength="200">
                        <small>Mínimo 5 caracteres</small>
                    </div>

                    <!-- Mensaje -->
                    <div class="form-group">
                        <label for="message">
                            <i class="fas fa-comment-alt"></i> Mensaje *
                        </label>
                        <textarea id="message" name="message" required
                                  placeholder="Describe tu sugerencia con detalle..."
                                  rows="6" minlength="10" maxlength="5000"></textarea>
                        <small>Mínimo 10 caracteres - Máximo 5000</small>
                    </div>

                    <!-- Botones -->
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="hideSuggestionsModal()">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-paper-plane"></i> Enviar Sugerencia
                        </button>
                    </div>
                </form>

                <!-- Mensaje de éxito/error -->
                <div id="suggestions-message" class="suggestions-message" style="display: none;"></div>
            </div>
        </div>
    `;

    // Agregar event listener al formulario
    const form = modal.querySelector('#suggestions-form');
    form.addEventListener('submit', handleSuggestionSubmit);

    // Cerrar al hacer click fuera del modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideSuggestionsModal();
        }
    });

    return modal;
}

/**
 * Toggle campos personales cuando se marca/desmarca anónimo
 */
function toggleAnonymousFields(isAnonymous) {
    const personalFields = document.getElementById('personal-fields');
    const nameField = document.getElementById('name');
    const emailField = document.getElementById('email');
    const departmentField = document.getElementById('department');

    if (isAnonymous) {
        personalFields.style.display = 'none';
        // Limpiar campos
        if (nameField) nameField.value = '';
        if (emailField) emailField.value = '';
        if (departmentField) departmentField.value = '';
    } else {
        personalFields.style.display = 'block';
    }
}

/**
 * Manejar envío del formulario
 */
async function handleSuggestionSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const messageDiv = document.getElementById('suggestions-message');

    // Obtener datos del formulario
    const formData = {
        type: form.type.value,
        urgency: form.urgency.value,
        subject: form.subject.value,
        message: form.message.value,
        isAnonymous: form.isAnonymous.checked
    };

    // Si no es anónimo, añadir datos personales
    if (!formData.isAnonymous) {
        formData.name = form.name.value || 'Anónimo';
        formData.email = form.email.value || null;
        formData.department = form.department.value || null;
    }

    try {
        // Deshabilitar botón mientras se envía
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

        // Enviar sugerencia
        const result = await submitSuggestion(formData);

        // Ocultar formulario completamente
        form.style.display = 'none';

        // Limpiar mensaje anterior si existe
        messageDiv.style.display = 'none';

        // Pequeño delay para asegurar que el DOM se actualiza
        setTimeout(() => {
            // Mostrar mensaje de éxito prominente
            showMessage(messageDiv, 'success',
                '✅ ¡Sugerencia recibida! Gracias por tu participación. Tu opinión es muy importante para nosotros.');
        }, 100);

        // Cerrar modal después de 4 segundos (dar más tiempo para leer)
        setTimeout(() => {
            hideSuggestionsModal();
            // Restaurar formulario
            form.style.display = 'block';
            form.reset();
        }, 4000);

    } catch (error) {
        // Mostrar mensaje de error
        showMessage(messageDiv, 'error',
            `❌ Error: ${error.message}. Por favor, inténtalo de nuevo.`);
        // Rehabilitar botón en caso de error
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Sugerencia';
    }
}

/**
 * Mostrar mensaje de éxito/error
 */
function showMessage(element, type, message) {
    element.className = `suggestions-message ${type}`;
    element.textContent = message;
    element.style.display = 'block';

    // Ocultar después de 5 segundos
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

// Exportar funciones al scope global
window.showSuggestionsModal = showSuggestionsModal;
window.hideSuggestionsModal = hideSuggestionsModal;
window.toggleAnonymousFields = toggleAnonymousFields;

console.log('✅ Sistema de sugerencias cargado');
