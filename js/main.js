// DOM Elements
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const loginBtn = document.querySelector('.btn-login');
const loginModal = document.querySelector('#loginModal');
const closeModal = document.querySelector('.close');
const loginForm = document.querySelector('#loginForm');
const affiliateForm = document.querySelector('#affiliateForm');
const contactForm = document.querySelector('#contactForm');
const recoveryModal = document.querySelector('#recoveryModal');
const recoveryForm = document.querySelector('#recoveryForm');
const memberDashboard = document.querySelector('#memberDashboard');
const logoutBtn = document.querySelector('#logoutBtn');
const forgotPasswordLink = document.querySelector('#forgotPasswordLink');
const closeRecoveryBtn = document.querySelector('#closeRecovery');
const backToLoginBtn = document.querySelector('#backToLogin');

// Base de datos simulada de usuarios
const usersDatabase = [
    { email: 'afiliado@ugt.org', password: 'ugt2024', name: 'Juan Pérez', member: true },
    { email: 'test@ugt.org', password: 'test123', name: 'María García', member: true },
    { email: 'admin@ugt.org', password: 'admin123', name: 'Administrador', member: true, admin: true }
];

// Toggle Mobile Menu
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// SISTEMA DE NAVEGACIÓN INTELIGENTE
let isSingleSectionMode = false;
let originalSectionStates = new Map();

// Guardar estados originales de todas las secciones
function saveOriginalStates() {
    const allSections = document.querySelectorAll('section');
    allSections.forEach(section => {
        originalSectionStates.set(section.id, section.style.display || 'block');
    });
}

// Restaurar todos los estados originales
function restoreAllSections() {
    const allSections = document.querySelectorAll('section');
    allSections.forEach(section => {
        const originalDisplay = originalSectionStates.get(section.id) || 'block';
        section.style.display = originalDisplay;
    });
    isSingleSectionMode = false;
    console.log('🔄 Todos los estados restaurados');
}

// Mostrar una sola sección
function showSingleSection(sectionId, message = '') {
    if (isSingleSectionMode) {
        console.log('📍 Ya estamos en modo sección única, cambiando a:', sectionId);
    }

    // Ocultar todas las secciones menos la deseada
    const allSections = document.querySelectorAll('section');
    const targetSection = document.querySelector(`#${sectionId}`);

    allSections.forEach(section => {
        section.style.display = 'none';
    });

    // Mostrar sección objetivo
    if (targetSection) {
        targetSection.style.display = 'block';

        // Si es la sección de afiliación, ir específicamente al título "¿Por qué afiliarse?"
        if (sectionId === 'afiliate') {
            console.log('🎯 SECCIÓN AFILIACIÓN DETECTADA - Buscando ancla específica');
            const titleAnchor = document.querySelector('#por-que-afiliarse');
            console.log('📍 Ancla encontrada:', titleAnchor);

            if (titleAnchor) {
                const offset = 40; // Offset reducido para que el título esté más arriba
                const targetPosition = titleAnchor.getBoundingClientRect().top + window.pageYOffset - offset;
                console.log(`📐 Calculando scroll: anchor.getBoundingClientRect().top=${titleAnchor.getBoundingClientRect().top}, offset=${offset}, targetPosition=${targetPosition}`);

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'instant'
                });
                console.log('✅ Scroll ejecutado hacia el ancla #por-que-afiliarse con offset reducido');
            } else {
                console.log('❌ NO se encontró el ancla #por-que-afiliarse - usando fallback');
                // Fallback al método anterior si no encuentra el ancla
                const offset = 120;
                const targetPosition = targetSection.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'instant'
                });
                console.log('✅ Scroll ejecutado con método fallback');
            }
        } else {
            // Para otras secciones, usar el método normal
            const offset = 80;
            const targetPosition = targetSection.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({
                top: targetPosition,
                behavior: 'instant'
            });
        }

        targetSection.style.animation = 'fadeIn 0.5s ease-in';
        isSingleSectionMode = true;

        if (message) {
            showMessage('success', message);
        }

        console.log(`✅ Sección ${sectionId} mostrada en modo individual`);
    }
}

// SOLUCIÓN DEFINITIVA - Navegación directa con gestión de estado
function initHeroButtons() {
    const heroAffiliateBtn = document.getElementById('heroAffiliateBtn');
    const heroCoursesBtn = document.getElementById('heroCoursesBtn');

    // Hero Affiliate Button
    if (heroAffiliateBtn) {
        heroAffiliateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🎯 Hero: Afiliación - Navegación directa iniciada');

            showSingleSection('afiliate', 'Has llegado a la sección de afiliación 🎯');
            showBackToTopButton('afiliado');

            // NO enfocar el formulario inmediatamente
            // Dejar que el usuario lea primero el título y beneficios
            setTimeout(() => {
                // Solo resaltar suavemente el primer campo sin enfocar
                const firstInput = document.querySelector('#affiliateForm input[name="name"]');
                if (firstInput) {
                    firstInput.classList.add('highlight');
                    setTimeout(() => {
                        firstInput.classList.remove('highlight');
                    }, 3000);
                }
            }, 1500);
        });
    }

    // Hero Courses Button
    if (heroCoursesBtn) {
        heroCoursesBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🎯 Hero: Cursos - Navegación directa al curso de IA');

            showSingleSection('cursos', 'Descubre el curso de Inteligencia Artificial 🤖');
            showBackToTopButton('cursos');

            // Enfocar directamente en el curso de Inteligencia Artificial
            setTimeout(() => {
                const iaCourse = document.querySelector('#ia-course');
                if (iaCourse) {
                    console.log('🤖 Enfocando curso de Inteligencia Artificial');

                    // Scroll directo al curso de IA
                    iaCourse.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });

                    // Resaltado especial para el curso de IA
                    iaCourse.classList.add('highlight-ia-course');

                    setTimeout(() => {
                        iaCourse.classList.remove('highlight-ia-course');
                    }, 3000);

                    // Efecto adicional: animar la insignia "Nuevo"
                    const badge = iaCourse.querySelector('.course-badge');
                    if (badge) {
                        badge.style.animation = 'pulse 2s ease-in-out';
                        setTimeout(() => {
                            badge.style.animation = '';
                        }, 2000);
                    }
                }
            }, 300);
        });
    }
}

// Inicializar navegación del header y logo
function initHeaderNavigation() {
    // Navegación del logo y nombre (volver al inicio) - VERSIÓN MEJORADA
    const navBrand = document.getElementById('navBrand');
    if (navBrand) {
        // Estilos para asegurar clicabilidad
        navBrand.style.cursor = 'pointer';
        navBrand.style.position = 'relative';
        navBrand.style.zIndex = '1000';

        // Función para volver al inicio
        function goToHome() {
            console.log('🏠 Logo clicado - volviendo al inicio');

            // Restaurar todas las secciones
            restoreAllSections();

            // Scroll al inicio
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Eliminar botón de volver si existe
            const backBtn = document.getElementById('backToTopBtn');
            if (backBtn) backBtn.remove();

            // Cerrar menú móvil si está abierto
            const navMenu = document.querySelector('.nav-menu');
            const hamburger = document.querySelector('.hamburger');
            if (navMenu && hamburger) {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
            }

            showMessage('info', 'Bienvenido al inicio 🏠');
        }

        // Event listeners para todos los dispositivos
        navBrand.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            goToHome();
        });

        // Soporte táctil para móviles
        navBrand.addEventListener('touchstart', (e) => {
            e.preventDefault();
            console.log('📱 Touch detectado en logo');
        }, { passive: false });

        navBrand.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            goToHome();
        }, { passive: false });

        // Prevenir propagación desde elementos internos
        const logoImage = navBrand.querySelector('.logo');
        const brandText = navBrand.querySelector('.brand-text');

        [logoImage, brandText].forEach(element => {
            if (element) {
                element.addEventListener('click', (e) => {
                    e.stopPropagation();
                    goToHome();
                });

                element.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    goToHome();
                }, { passive: false });
            }
        });

        console.log('✅ Logo configurado para navegación completa');
    }

    // Navegación del menú principal
    const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');

            // Ignorar enlaces especiales como login
            if (href === '#login' || href === '#') {
                return;
            }

            e.preventDefault();
            console.log(`🧭 Navegación menú: ${href}`);

            const targetId = href.substring(1); // Quitar el #
            const targetSection = document.querySelector(href);

            if (targetSection) {
                // Restaurar todas las secciones si estamos en modo individual
                if (isSingleSectionMode) {
                    restoreAllSections();
                }

                // Scroll suave a la sección
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                // Eliminar botón de volver si existe
                const backBtn = document.getElementById('backToTopBtn');
                if (backBtn) backBtn.remove();

                // Efecto de resaltado
                targetSection.style.animation = 'highlightSection 0.5s ease-in';
                setTimeout(() => {
                    targetSection.style.animation = '';
                }, 500);

                console.log(`✅ Navegado a: ${targetId}`);
            }
        });
    });
}

// Botón para volver al inicio
function showBackToTopButton(context = 'default') {
    // Eliminar botón existente si lo hay
    const existingBtn = document.getElementById('backToTopBtn');
    if (existingBtn) {
        existingBtn.remove();
    }

    // Crear nuevo botón
    const backBtn = document.createElement('button');
    backBtn.id = 'backToTopBtn';
    backBtn.innerHTML = `<i class="fas fa-arrow-up"></i> Volver al inicio`;
    backBtn.className = 'btn btn-secondary back-to-top';
    backBtn.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        z-index: 1000;
        animation: slideInUp 0.3s ease-out;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    `;

    backBtn.addEventListener('click', () => {
        console.log('🔝 Botón volver clicado - restaurando vista completa');

        // Restaurar todas las secciones usando el nuevo sistema
        restoreAllSections();

        // Scroll al inicio
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Eliminar botón
        backBtn.remove();

        showMessage('info', 'Bienvenido de vuelta al inicio 🏠');
    });

    document.body.appendChild(backBtn);
}

// Animaciones mejoradas
const fadeInStyle = document.createElement('style');
fadeInStyle.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }

    @keyframes slideInUp {
        from { transform: translateY(100px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }

    @keyframes highlightSection {
        0% {
            background-color: transparent;
            transform: scale(1);
        }
        50% {
            background-color: rgba(227, 6, 19, 0.1);
            transform: scale(1.02);
            box-shadow: 0 0 30px rgba(227, 6, 19, 0.3);
        }
        100% {
            background-color: transparent;
            transform: scale(1);
        }
    }

    .back-to-top {
        border-radius: 25px;
        padding: 12px 20px;
        font-weight: 600;
        transition: all 0.3s ease;
    }

    .back-to-top:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 25px rgba(0,0,0,0.3);
    }

    .nav-brand {
        cursor: pointer;
        transition: transform 0.2s ease;
    }

    .nav-brand:hover {
        transform: scale(1.02);
    }
`;
document.head.appendChild(fadeInStyle);

// Función de scroll alternativo MÁS robusta
function smoothScrollTo(targetElement, offset = 0) {
    if (!targetElement) return;

    console.log('🚀 Iniciando scroll alternativo hacia:', targetElement.id);

    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset + offset;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    const duration = 1000; // 1 segundo
    let start = null;

    function animation(currentTime) {
        if (start === null) start = currentTime;
        const timeElapsed = currentTime - start;
        const run = easeInOutQuad(timeElapsed, startPosition, distance, duration);
        window.scrollTo(0, run);
        if (timeElapsed < duration) requestAnimationFrame(animation);
    }

    function easeInOutQuad(t, b, c, d) {
        t /= d/2;
        if (t < 1) return c/2*t*t + b;
        t--;
        return -c/2 * (t*(t-2) - 1) + b;
    }

    requestAnimationFrame(animation);
}

// Login Modal - Will be updated in updateLoginState function
function initLoginBtn() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    if (isLoggedIn) {
        const userName = localStorage.getItem('userName') || 'Afiliado';
        loginBtn.innerHTML = `<i class="fas fa-user"></i> ${userName.split(' ')[0]}`;
        loginBtn.onclick = (e) => {
            e.preventDefault();
            showMemberDashboard();
        };
    } else {
        loginBtn.innerHTML = '<i class="fas fa-user"></i> Acceso Afiliados';
        loginBtn.onclick = (e) => {
            e.preventDefault();
            loginModal.style.display = 'block';
        };
    }
}

closeModal.addEventListener('click', () => {
    loginModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        loginModal.style.display = 'none';
    }
    if (e.target === recoveryModal) {
        recoveryModal.style.display = 'none';
    }
});

// Recovery Modal handlers
forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginModal.style.display = 'none';
    recoveryModal.style.display = 'block';
});

closeRecoveryBtn.addEventListener('click', () => {
    recoveryModal.style.display = 'none';
});

backToLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    recoveryModal.style.display = 'none';
    loginModal.style.display = 'block';
});

// Logout handler
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    showMessage('success', 'Sesión cerrada correctamente');

    // Hide dashboard and show main site
    memberDashboard.style.display = 'none';
    document.querySelectorAll('.section').forEach(section => {
        if (section.id !== 'memberDashboard') {
            section.style.display = 'block';
        }
    });

    updateLoginState();
});

// Smooth scrolling for navigation links - Mejorado para hero buttons
function initSmoothScroll() {
    const anchors = document.querySelectorAll('a[href^="#"]');
    console.log(`✅ Smooth scroll inicializado para ${anchors.length} enlaces`);

    // Debug: verificar que los botones hero están incluidos
    const heroButtons = document.querySelectorAll('.hero-buttons a');
    console.log(`🎯 Botones hero detectados: ${heroButtons.length}`, heroButtons);

    anchors.forEach((anchor, index) => {
        console.log(`  ${index + 1}. ${anchor.getAttribute('href')} - ${anchor.textContent.trim().substring(0, 30)}`);

        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            console.log(`🖱️ Click detectado en: ${href}`);

            // Ignorar enlaces que son solo "#" (modales, etc.)
            if (href === '#' || href === '#!' || !href) {
                console.log(`⏭️ Ignorando enlace: ${href}`);
                return;
            }

            // Ignorar específicamente el botón principal de afiliación del hero
            // porque ya está manejado por initHeroButtons()
            if (this.id === 'heroAffiliateBtn') {
                console.log(`⏭️ Ignorando botón hero afiliado: ${href} - manejado por initHeroButtons`);
                return;
            }

            e.preventDefault();
            console.log(`🛑 preventDefault ejecutado para: ${href}`);

            const target = document.querySelector(href);
            console.log(`🎯 Target encontrado:`, target);

            if (target) {
                console.log(`📍 Navegando a: ${href}`);

                // Hacer scroll suave
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                // NO enfocar el formulario de afiliación automáticamente
                // El usuario debe poder leer primero el título y beneficios
            } else {
                console.warn(`⚠️ No se encontró el elemento: ${href}`);
            }
        }, true); // Usar capture phase
    });
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSmoothScroll);
} else {
    // DOM ya está listo, ejecutar inmediatamente
    initSmoothScroll();
}

// Header scroll effect
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.backdropFilter = 'blur(10px)';
    } else {
        header.style.background = 'white';
        header.style.backdropFilter = 'none';
    }
});

// Enhanced validation functions
function validateEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

function showError(input, message) {
    const formGroup = input.parentElement;
    const errorMessage = formGroup.querySelector('.error-message');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    input.classList.add('error');
}

function clearErrors() {
    document.querySelectorAll('.error-message').forEach(error => {
        error.textContent = '';
        error.style.display = 'none';
    });
    document.querySelectorAll('input.error').forEach(input => {
        input.classList.remove('error');
    });
}

// Enhanced login handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const emailInput = loginForm.querySelector('input[name="email"]');
    const passwordInput = loginForm.querySelector('input[name="password"]');
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // Client-side validation
    let isValid = true;

    if (!email) {
        showError(emailInput, 'El email es obligatorio');
        isValid = false;
    } else if (!validateEmail(email)) {
        showError(emailInput, 'Introduce un email válido');
        isValid = false;
    }

    if (!password) {
        showError(passwordInput, 'La contraseña es obligatoria');
        isValid = false;
    } else if (!validatePassword(password)) {
        showError(passwordInput, 'La contraseña debe tener al menos 6 caracteres');
        isValid = false;
    }

    if (!isValid) return;

    // Show loading state
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
    submitBtn.disabled = true;

    try {
        // Simulate API call with real authentication
        await simulateAPICall();

        // Check credentials against database
        const user = usersDatabase.find(u => u.email === email && u.password === password);

        if (user) {
            // Store login state
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userEmail', user.email);
            localStorage.setItem('userName', user.name);
            localStorage.setItem('isAdmin', user.admin || false);

            showMessage('success', `¡Bienvenido de nuevo, ${user.name}!`);

            // Close modal and show dashboard
            setTimeout(() => {
                loginModal.style.display = 'none';
                showMemberDashboard();
                loginForm.reset();
            }, 1500);

        } else {
            showMessage('error', 'Email o contraseña incorrectos');
            passwordInput.value = '';
            passwordInput.focus();
        }

    } catch (error) {
        showMessage('error', 'Error de conexión. Inténtalo de nuevo.');
        console.error('Login error:', error);
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

affiliateForm.addEventListener('submit', async (e) => {
    e.preventDefault();

// Extraer datos del formulario
    const nameInput = affiliateForm.querySelector('input[name="name"]');
    const emailInput = affiliateForm.querySelector('input[name="email"]');
    const phoneInput = affiliateForm.querySelector('input[name="phone"]');
    const departmentInput = affiliateForm.querySelector('input[name="department"]');

    const userData = {
        name: nameInput ? nameInput.value : '',
        email: emailInput ? emailInput.value : '',
        phone: phoneInput ? phoneInput.value : '',
        department: departmentInput ? departmentInput.value : ''
    };

    // Show loading state
    const submitBtn = affiliateForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Procesando...';
    submitBtn.disabled = true;

    try {
        // Simulate API call
        await simulateAPICall();

        // Show payment form or redirect to payment
        showPaymentForm({
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            department: userData.department,
            amount: 15,
            description: 'Cuota anual UGT-CLM-UGR'
        });

    } catch (error) {
        showMessage('error', 'Error al procesar la solicitud');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// SISTEMA DE CONTACTO WHATSAPP Y EMAIL
document.addEventListener('DOMContentLoaded', () => {
    const whatsappBtn = document.getElementById('whatsappBtn');

    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // Mensaje predefinido para WhatsApp
            const message = encodeURIComponent(
                '¡Hola! He visitado el sitio web de UGT-CLM Granada y me gustaría obtener más información sobre afiliación y los servicios que ofrecen.'
            );

          // Número de WhatsApp de UGT-CLM Granada
            const phoneNumber = '34690026370';

            // Construir URL de WhatsApp
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

            console.log('📱 Abriendo WhatsApp...');

            // Abrir WhatsApp en nueva pestaña
            window.open(whatsappUrl, '_blank');

            // Mensaje de confirmación
            showMessage('success', '📱 Abriendo WhatsApp... En breve te atenderemos.');

            // Registrar acción para estadísticas
            logWhatsAppClick();
        });
    }
});

// Función para registrar clics en WhatsApp
function logWhatsAppClick() {
    const click = {
        timestamp: new Date().toISOString(),
        action: 'whatsapp_click',
        userAgent: navigator.userAgent,
        page: window.location.href,
        referrer: document.referrer
    };

    // Guardar en localStorage
    const clicks = JSON.parse(localStorage.getItem('whatsappClicks') || '[]');
    clicks.push(click);
    localStorage.setItem('whatsappClicks', JSON.stringify(clicks));

    console.log('📊 Clic en WhatsApp registrado:', click);
}

// Función para registrar consultas del curso
function logCourseInquiry() {
    const inquiry = {
        timestamp: new Date().toISOString(),
        action: 'course_inquiry',
        course: 'IA Aplicada al Sector Educativo del CLM',
        userAgent: navigator.userAgent,
        page: window.location.href,
        referrer: document.referrer
    };

    // Guardar en localStorage
    const inquiries = JSON.parse(localStorage.getItem('courseInquiries') || '[]');
    inquiries.push(inquiry);
    localStorage.setItem('courseInquiries', JSON.stringify(inquiries));

    console.log('📚 Consulta del curso registrada:', inquiry);
}

// Password recovery handler
recoveryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const emailInput = recoveryForm.querySelector('input[name="recoveryEmail"]');
    const email = emailInput.value.trim();

    // Validation
    if (!email) {
        showError(emailInput, 'El email es obligatorio');
        return;
    } else if (!validateEmail(email)) {
        showError(emailInput, 'Introduce un email válido');
        return;
    }

    // Show loading state
    const submitBtn = recoveryForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    submitBtn.disabled = true;

    try {
        // Simulate API call
        await simulateAPICall();

        // Check if email exists in database
        const userExists = usersDatabase.some(user => user.email === email);

        if (userExists) {
            showMessage('success', 'Se han enviado instrucciones a tu email');
            setTimeout(() => {
                recoveryModal.style.display = 'none';
                loginModal.style.display = 'block';
                recoveryForm.reset();
            }, 2000);
        } else {
            // Security: Don't reveal if email exists or not
            showMessage('success', 'Si el email está registrado, recibirás instrucciones');
            setTimeout(() => {
                recoveryModal.style.display = 'none';
                loginModal.style.display = 'block';
                recoveryForm.reset();
            }, 2000);
        }

    } catch (error) {
        showMessage('error', 'Error al enviar el email. Inténtalo de nuevo.');
        console.error('Recovery error:', error);
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// Show member dashboard
function showMemberDashboard() {
    const userName = localStorage.getItem('userName') || 'Afiliado';
    document.getElementById('userName').textContent = userName;

    // Hide all sections except dashboard
    document.querySelectorAll('.section').forEach(section => {
        if (section.id !== 'memberDashboard') {
            section.style.display = 'none';
        }
    });

    // Show dashboard
    memberDashboard.style.display = 'block';

    // Update login button
    updateLoginState();

    // Scroll to top
    window.scrollTo(0, 0);
}

// Payment handler with Stripe integration
async function showPaymentForm(paymentData) {
    try {
        // Validate user data
        validateUserData(paymentData);

        // Show loading message
        showMessage('success', 'Preparando pago seguro con Stripe...');

        // Create checkout session
        const session = await createAffiliationCheckout(paymentData);

        // Redirect to Stripe Checkout
        await redirectToStripeCheckout(session.id);

    } catch (error) {
        console.error('Payment error:', error);

        // Mensaje más amigable para el usuario
        if (error.message.includes('BACKEND REQUERIDO')) {
            showMessage('error',
                '⚠️ Sistema de pagos en configuración. ' +
                'Por favor, contacta con el administrador del sitio para completar tu afiliación. ' +
                'Email: ugt.clm.ugr@ugt.org'
            );
        } else {
            showMessage('error', 'Error al procesar el pago: ' + error.message);
        }
    }
}

// Utility functions
function showMessage(type, text) {
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;

    document.body.appendChild(message);
    message.style.position = 'fixed';
    message.style.top = '20px';
    message.style.right = '20px';
    message.style.zIndex = '3000';

    setTimeout(() => {
        document.body.removeChild(message);
    }, 5000);
}

function simulateAPICall() {
    return new Promise((resolve) => {
        setTimeout(resolve, 1500);
    });
}

function updateLoginState() {
    initLoginBtn();
}

// Check if user is logged in on page load
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
        const userName = localStorage.getItem('userName') || 'Afiliado';
        document.getElementById('userName').textContent = userName;
        showMemberDashboard();
    }
    initLoginBtn();
}

// Scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando sistema de navegación completo');

    // 1. Guardar estados originales de todas las secciones
    saveOriginalStates();

    // 2. Inicializar botones del hero
    initHeroButtons();

    // 3. Inicializar navegación del header y logo
    initHeaderNavigation();

    // 4. Inicializar botón de login (si existe)
    initLoginBtn();

    // 5. Inicializar botón de inscripción del curso IA
    initCourseEnrollment();

    // 6. Observar elementos para animaciones de scroll
    document.querySelectorAll('.about-card, .course-card, .contact-item').forEach(el => {
        el.classList.add('scroll-animate');
        observer.observe(el);
    });

    // 7. Verificar estado de login
    checkLoginStatus();

    console.log('✅ Sistema de navegación completamente inicializado');
});

// Sistema de inscripción para cursos
function initCourseEnrollment() {
    const enrollIaBtn = document.getElementById('enrollIaBtn');
    const preinscribeIaBtn = document.getElementById('preinscribeIaBtn');

    // Botón "Ver Programa Completo"
    if (enrollIaBtn) {
        enrollIaBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('📚 Botón "Ver Programa Completo" clicado');

            // Mostrar modal de inscripción personalizado con programa completo
            showCourseEnrollmentModal();
        });
    }

    // Botón "Preinscribirse"
    if (preinscribeIaBtn) {
        preinscribeIaBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('📝 Botón "Preinscribirse" clicado');

            // Mostrar modal de preinscripción simplificado
            showCoursePreinscriptionModal();
        });
    }
}

// Modal de inscripción al curso
function showCourseEnrollmentModal() {
    // Crear modal dinámicamente
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'courseEnrollmentModal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" id="closeEnrollmentModal">&times;</span>
            <div class="enrollment-form">
                <div class="course-header">
                    <h3>🎓 IA Aplicada a la Enseñanza de Lenguas</h3>
                    <div class="course-summary">
                        <div class="summary-item">
                            <i class="fas fa-chalkboard-teacher"></i>
                            <span>30 sesiones prácticas de 40 min</span>
                        </div>
                        <div class="summary-item">
                            <i class="fas fa-calendar-check"></i>
                            <span>5 viernes (6 sesiones/día)</span>
                        </div>
                        <div class="summary-item">
                            <i class="fas fa-users"></i>
                            <span>Grupos reducidos (max 15)</span>
                        </div>
                    </div>
                </div>

                <div class="course-curriculum">
                    <h4>📚 Programa Detallado por Sesiones</h4>
                    <div class="curriculum-weeks">

                        <!-- Viernes 1 -->
                        <div class="week-module">
                            <div class="week-header">
                                <span class="week-number">Viernes 21 nov</span>
                                <i class="fas fa-rocket"></i>
                                <span class="week-hours">6 sesiones</span>
                            </div>
                            <h5>🚀 Jornadas de Introducción a la IA</h5>

                            <div class="day-sessions">
                                <div class="day">
                                    <strong>🌅 Mañana (3 sesiones)</strong>
                                    <ul>
                                        <li><strong>Sesión 1:</strong> Bienvenida e Introducción a la IA (40 min)</li>
                                        <li><strong>Sesión 2:</strong> Herramientas de IA Accesibles (40 min)</li>
                                        <li><strong>Sesión 3:</strong> Prompting Básico (40 min)</li>
                                    </ul>
                                </div>
                                <div class="day">
                                    <strong>🌆 Tarde (3 sesiones)</strong>
                                    <ul>
                                        <li><strong>Sesión 4:</strong> IA para Profesores de Idiomas I (40 min)</li>
                                        <li><strong>Sesión 5:</strong> IA para Personal Administrativo I (40 min)</li>
                                        <li><strong>Sesión 6:</strong> IA para Conserjería y Servicios I (40 min)</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <!-- Viernes 2 -->
                        <div class="week-module">
                            <div class="week-header">
                                <span class="week-number">Viernes 28 nov</span>
                                <i class="fas fa-cogs"></i>
                                <span class="week-hours">6 sesiones</span>
                            </div>
                            <h5>⚙️ Procesamiento y Aplicaciones Especializadas</h5>

                            <div class="day-sessions">
                                <div class="day">
                                    <strong>🌅 Mañana (3 sesiones)</strong>
                                    <ul>
                                        <li><strong>Sesión 7:</strong> Procesamiento de Lenguaje Natural (40 min)</li>
                                        <li><strong>Sesión 8:</strong> Generación de Imágenes con IA (40 min)</li>
                                        <li><strong>Sesión 9:</strong> IA para Profesores de Idiomas II (40 min)</li>
                                    </ul>
                                </div>
                                <div class="day">
                                    <strong>🌆 Tarde (3 sesiones)</strong>
                                    <ul>
                                        <li><strong>Sesión 10:</strong> IA para Personal Administrativo II (40 min)</li>
                                        <li><strong>Sesión 11:</strong> Ética y Responsabilidad en el Uso de la IA (40 min)</li>
                                        <li><strong>Sesión 12:</strong> Proyectos Colaborativos I (40 min)</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <!-- Viernes 3 -->
                        <div class="week-module">
                            <div class="week-header">
                                <span class="week-number">Viernes 5 dic</span>
                                <i class="fas fa-chart-line"></i>
                                <span class="week-hours">6 sesiones</span>
                            </div>
                            <h5>📈 Optimización y Herramientas Avanzadas</h5>

                            <div class="day-sessions">
                                <div class="day">
                                    <strong>🌅 Mañana (3 sesiones)</strong>
                                    <ul>
                                        <li><strong>Sesión 13:</strong> IA para Profesores de Idiomas III (40 min)</li>
                                        <li><strong>Sesión 14:</strong> IA para Personal Administrativo III (40 min)</li>
                                        <li><strong>Sesión 15:</strong> IA para Conserjería y Servicios II (40 min)</li>
                                    </ul>
                                </div>
                                <div class="day">
                                    <strong>🌆 Tarde (3 sesiones)</strong>
                                    <ul>
                                        <li><strong>Sesión 16:</strong> Herramientas Multimedia con IA (40 min)</li>
                                        <li><strong>Sesión 17:</strong> Traducción y Localización con IA (40 min)</li>
                                        <li><strong>Sesión 18:</strong> Proyectos Colaborativos II (40 min)</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <!-- Viernes 4 -->
                        <div class="week-module">
                            <div class="week-header">
                                <span class="week-number">Viernes 12 dic</span>
                                <i class="fas fa-robot"></i>
                                <span class="week-hours">6 sesiones</span>
                            </div>
                            <h5>🤖 Automatización y Proyectos</h5>

                            <div class="day-sessions">
                                <div class="day">
                                    <strong>🌅 Mañana (3 sesiones)</strong>
                                    <ul>
                                        <li><strong>Sesión 19:</strong> Asistentes Virtuales Personalizados (40 min)</li>
                                        <li><strong>Sesión 20:</strong> IA para Profesores de Idiomas IV (40 min)</li>
                                        <li><strong>Sesión 21:</strong> IA para Personal Administrativo IV (40 min)</li>
                                    </ul>
                                </div>
                                <div class="day">
                                    <strong>🌆 Tarde (3 sesiones)</strong>
                                    <ul>
                                        <li><strong>Sesión 22:</strong> Detección de Plagio y Uso Ético (40 min)</li>
                                        <li><strong>Sesión 23:</strong> Personalización del Aprendizaje con IA (40 min)</li>
                                        <li><strong>Sesión 24:</strong> Proyectos Colaborativos III (40 min)</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <!-- Viernes 5 -->
                        <div class="week-module">
                            <div class="week-header">
                                <span class="week-number">Viernes 19 dic</span>
                                <i class="fas fa-trophy"></i>
                                <span class="week-hours">6 sesiones</span>
                            </div>
                            <h5>🏆 Tendencias y Presentaciones Finales</h5>

                            <div class="day-sessions">
                                <div class="day">
                                    <strong>🌅 Mañana (3 sesiones)</strong>
                                    <ul>
                                        <li><strong>Sesión 25:</strong> Tendencias Futuras en IA Educativa (40 min)</li>
                                        <li><strong>Sesión 26:</strong> Integración de IA en el Plan Estratégico (40 min)</li>
                                        <li><strong>Sesión 27:</strong> Preparación de Presentaciones Finales (40 min)</li>
                                    </ul>
                                </div>
                                <div class="day">
                                    <strong>🌆 Tarde (3 sesiones)</strong>
                                    <ul>
                                        <li><strong>Sesión 28:</strong> Presentaciones de Proyectos I (40 min)</li>
                                        <li><strong>Sesión 29:</strong> Presentaciones de Proyectos II (40 min)</li>
                                        <li><strong>Sesión 30:</strong> Conclusiones y Plan de Acción (40 min)</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Materiales y Recursos -->
                <div class="course-materials">
                    <h4>🎯 Materiales y Recursos Incluidos</h4>
                    <div class="materials-grid">
                        <div class="material-item">
                            <i class="fas fa-laptop"></i>
                            <span>Acceso a plataformas de IA (ChatGPT, Gemini, Claude)</span>
                        </div>
                        <div class="material-item">
                            <i class="fas fa-book"></i>
                            <span>Documentación y guías de referencia rápida</span>
                        </div>
                        <div class="material-item">
                            <i class="fas fa-clipboard"></i>
                            <span>Plantillas de trabajo para actividades prácticas</span>
                        </div>
                        <div class="material-item">
                            <i class="fas fa-users"></i>
                            <span>Comunidad de práctica y seguimiento 6 meses</span>
                        </div>
                        <div class="material-item">
                            <i class="fas fa-certificate"></i>
                            <span>Certificado UGT-CLM Granada</span>
                        </div>
                        <div class="material-item">
                            <i class="fas fa-headset"></i>
                            <span>Mentorías individuales para proyectos específicos</span>
                        </div>
                    </div>
                </div>

                <form id="courseEnrollmentForm">
                    <div class="form-section">
                        <h4>👤 Datos Personales</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <input type="text" name="fullName" placeholder="Nombre completo" required>
                                <span class="error-message"></span>
                            </div>
                            <div class="form-group">
                                <input type="email" name="email" placeholder="Email" required>
                                <span class="error-message"></span>
                            </div>
                        </div>
                        <div class="form-group">
                            <input type="tel" name="phone" placeholder="Teléfono (opcional)">
                            <span class="error-message"></span>
                        </div>
                        <div class="form-group">
                            <select name="department" required>
                                <option value="">Selecciona tu departamento/rol</option>
                                <option value="profesor-ele">Profesor de Español (ELE)</option>
                                <option value="profesor-lenguas">Profesor de Lenguas Modernas</option>
                                <option value="administrativo">Personal Administrativo</option>
                                <option value="servicios">Personal de Servicios</option>
                                <option value="otro">Otro</option>
                            </select>
                            <span class="error-message"></span>
                        </div>
                    </div>

                    <div class="form-section">
                        <h4>📧 Información del Curso</h4>
                        <div class="course-options">
                            <label class="checkbox-option">
                                <input type="checkbox" name="isMember" id="isUGTMember">
                                <span class="checkmark"></span>
                                <span class="label-text">Soy afiliado/a a UGT</span>
                            </label>
                        </div>
                    </div>

                    <div class="price-display">
                        <div class="price-info">
                            <p class="current-price">Precio: <span id="coursePrice">160€</span></p>
                            <p class="discount-note" style="display: none;">Precio especial afiliados: <strong>15€</strong></p>
                        </div>
                    </div>

                    <button type="submit" class="btn btn-primary btn-full">
                        <i class="fas fa-graduation-cap"></i> Completar Inscripción
                    </button>
                </form>

                <div class="course-inquiries">
                    <div class="inquiry-divider">
                        <span>¿Tienes dudas?</span>
                    </div>
                    <a href="#" id="whatsappCourseBtn" class="btn-whatsapp-course">
                        <i class="fab fa-whatsapp"></i>
                        <span>Consultar por WhatsApp</span>
                        <small>Respuesta inmediata sobre el curso</small>
                    </a>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'block';

    // Event listeners del modal
    const closeBtn = document.getElementById('closeEnrollmentModal');
    const enrollmentForm = document.getElementById('courseEnrollmentForm');
    const memberCheckbox = document.getElementById('isUGTMember');

    // Cerrar modal
    closeBtn.addEventListener('click', () => {
        modal.remove();
    });

    // Click fuera del modal para cerrar
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    // Checkbox de afiliado
    if (memberCheckbox) {
        memberCheckbox.addEventListener('change', (e) => {
            const priceSpan = document.getElementById('coursePrice');
            const discountNote = document.querySelector('.discount-note');

            if (e.target.checked) {
                priceSpan.textContent = '15€';
                discountNote.style.display = 'block';
            } else {
                priceSpan.textContent = '160€';
                discountNote.style.display = 'none';
            }
        });
    }

    // Envío del formulario
    if (enrollmentForm) {
        enrollmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleCourseEnrollment(enrollmentForm);
        });
    }

    // WhatsApp course inquiries
    const whatsappCourseBtn = document.getElementById('whatsappCourseBtn');
    if (whatsappCourseBtn) {
        whatsappCourseBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // Mensaje predefinido para consultas del curso
            const message = encodeURIComponent(
                '¡Hola! Estoy interesado/a en el curso "Inteligencia Artificial Aplicada al Sector Educativo del CLM". Me gustaría recibir más información sobre el temario, horarios y el proceso de inscripción.'
            );

            // Número de WhatsApp de UGT-CLM Granada
            const phoneNumber = '34690026370';

            // Construir URL de WhatsApp
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

            console.log('📱 Abriendo WhatsApp para consulta del curso...');

            // Abrir WhatsApp en nueva pestaña
            window.open(whatsappUrl, '_blank');

            // Mensaje de confirmación
            showMessage('success', '📱 Abriendo WhatsApp... En breve te atenderemos.');

            // Registrar acción para estadísticas
            logCourseInquiry();
        });
    }

    console.log('📋 Modal de inscripción creado');
}

// Modal de preinscripción simplificado
function showCoursePreinscriptionModal() {
    // Crear modal dinámicamente
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'coursePreinscriptionModal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" id="closePreinscriptionModal">&times;</span>
            <div class="enrollment-form">
                <div class="course-header">
                    <h3>🚀 Preinscripción Rápida</h3>
                    <div class="course-summary">
                        <div class="summary-item">
                            <i class="fas fa-bolt"></i>
                            <span>Reserva tu plaza en 1 minuto</span>
                        </div>
                        <div class="summary-item">
                            <i class="fas fa-check-circle"></i>
                            <span>Sin compromiso</span>
                        </div>
                        <div class="summary-item">
                            <i class="fas fa-users"></i>
                            <span>Plazas limitadas CLM</span>
                        </div>
                    </div>
                </div>

                <form id="coursePreinscriptionForm">
                    <div class="form-section">
                        <h4>👤 Datos para Preinscripción</h4>
                        <div class="form-group">
                            <input type="text" name="fullName" placeholder="Nombre completo" required>
                            <span class="error-message"></span>
                        </div>
                        <div class="form-group">
                            <input type="email" name="email" placeholder="Email" required>
                            <span class="error-message"></span>
                        </div>
                        <div class="form-group">
                            <input type="tel" name="phone" placeholder="Teléfono (opcional)">
                            <span class="error-message"></span>
                        </div>
                        <div class="form-group">
                            <select name="department" required>
                                <option value="">Selecciona tu departamento/rol</option>
                                <option value="profesor-ele">Profesor de Español (ELE)</option>
                                <option value="profesor-lenguas">Profesor de Lenguas Modernas</option>
                                <option value="administrativo">Personal Administrativo</option>
                                <option value="servicios">Personal de Servicios</option>
                                <option value="otro">Otro</option>
                            </select>
                            <span class="error-message"></span>
                        </div>
                    </div>

                    <div class="preinscription-note">
                        <i class="fas fa-info-circle"></i>
                        <p>Al completar la preinscripción, recibirás por email toda la información del curso, fechas de inicio y formulario de inscripción definitiva.</p>
                    </div>

                    <button type="submit" class="btn btn-primary btn-full">
                        <i class="fas fa-user-plus"></i> Completar Preinscripción
                    </button>
                </form>

                <div class="course-inquiries">
                    <div class="inquiry-divider">
                        <span>¿Dudas urgentes?</span>
                    </div>
                    <a href="#" id="whatsappPreinscribeBtn" class="btn-whatsapp-course">
                        <i class="fab fa-whatsapp"></i>
                        <span>Consultar por WhatsApp</span>
                        <small>Respuesta inmediata</small>
                    </a>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'block';

    // Event listeners del modal
    const closeBtn = document.getElementById('closePreinscriptionModal');
    const preinscribeForm = document.getElementById('coursePreinscriptionForm');
    const whatsappBtn = document.getElementById('whatsappPreinscribeBtn');

    // Cerrar modal
    closeBtn.addEventListener('click', () => {
        modal.remove();
    });

    // Click fuera del modal para cerrar
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    // WhatsApp preinscripción
    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', (e) => {
            e.preventDefault();

            const message = encodeURIComponent(
                '¡Hola! Estoy interesado/a en preinscribirme al curso "Inteligencia Artificial Aplicada al Sector Educativo del CLM". Me gustaría saber más sobre las fechas de inicio.'
            );

            const phoneNumber = '34690026370';
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

            window.open(whatsappUrl, '_blank');
            showMessage('success', '📱 Abriendo WhatsApp... En breve te atenderemos.');
            logCourseInquiry();
        });
    }

    // Envío del formulario de preinscripción
    if (preinscribeForm) {
        preinscribeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleCoursePreinscription(preinscribeForm);
        });
    }

    console.log('📋 Modal de preinscripción creado');
}

// Manejar preinscripción al curso
async function handleCoursePreinscription(form) {
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    // Validación básica
    const fullName = formData.get('fullName')?.trim();
    const email = formData.get('email')?.trim();

    if (!fullName || !email) {
        showMessage('error', 'Por favor, completa los campos obligatorios');
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('error', 'Por favor, introduce un email válido');
        return;
    }

    // Estado de carga
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando preinscripción...';
    submitBtn.disabled = true;

    try {
        // Simular envío
        await simulateAPICall();

        // Datos de preinscripción
        const preinscribeData = {
            name: fullName,
            email: email,
            phone: formData.get('phone')?.trim() || '',
            department: formData.get('department') || '',
            courseType: 'Inteligencia Artificial Aplicada al Sector Educativo del CLM',
            timestamp: new Date().toISOString(),
            type: 'preinscripcion'
        };

        console.log('📝 Datos de preinscripción:', preinscribeData);

        // Guardar en localStorage
        const preinscriptions = JSON.parse(localStorage.getItem('coursePreinscriptions') || '[]');
        preinscriptions.push(preinscribeData);
        localStorage.setItem('coursePreinscriptions', JSON.stringify(preinscriptions));

        // Cerrar modal
        document.getElementById('coursePreinscriptionModal').remove();

        // Mostrar mensaje de éxito
        showMessage('success', '✅ ¡Preinscripción completada! Recibirás un email con toda la información del curso.');

        // Abrir WhatsApp para confirmación
        setTimeout(() => {
            const message = encodeURIComponent(
                `¡Hola! He completado mi preinscripción al curso de IA para el CLM Granada. Mi nombre es ${fullName} y mi email es ${email}.`
            );
            const phoneNumber = '34690026370';
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
            window.open(whatsappUrl, '_blank');
        }, 2000);

    } catch (error) {
        showMessage('error', 'Error al procesar la preinscripción. Inténtalo de nuevo.');
        console.error('Preinscripción error:', error);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Manejar inscripción al curso
async function handleCourseEnrollment(form) {
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    // Validación básica
    const fullName = formData.get('fullName')?.trim();
    const email = formData.get('email')?.trim();
    const isMember = formData.get('isMember') === 'on';

    if (!fullName || !email) {
        showMessage('error', 'Por favor, completa los campos obligatorios');
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('error', 'Por favor, introduce un email válido');
        return;
    }

    // Estado de carga
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    submitBtn.disabled = true;

    try {
        // Simular envío (aquí iría la integración con backend real)
        await simulateAPICall();

        // Datos para el formulario de afiliación
        const affiliateData = {
            name: fullName,
            email: email,
            phone: formData.get('phone')?.trim() || '',
            department: formData.get('department') || '',
            courseType: 'Inteligencia Artificial para Profesores',
            isMember: isMember,
            amount: isMember ? 15 : 160,
            description: `Inscripción al curso especializado para el CLM Granada`
        };

        console.log('📚 Datos de inscripción:', affiliateData);

        // Cerrar modal
        document.getElementById('courseEnrollmentModal').remove();

        // Mostrar formulario de afiliación para pago
        showPaymentForm(affiliateData);

    } catch (error) {
        showMessage('error', 'Error al procesar la inscripción');
        console.error('Error en inscripción:', error);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Course enrollment handler
function enrollInCourse(courseId, isMember = false) {
    const price = isMember ? 15 : 160;

    showPaymentForm({
        name: 'Curso de Formación',
        email: 'user@example.com',
        amount: price,
        description: `Inscripción al curso ${courseId}`
    });
}

// Analytics tracking (placeholder)
function trackEvent(eventName, data) {
    console.log('Event tracked:', eventName, data);
    // Implement actual analytics tracking here
}

// Initialize tooltips and other interactive elements
document.addEventListener('DOMContentLoaded', () => {
    // Add tooltips
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(element => {
        element.addEventListener('mouseenter', (e) => {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = e.target.getAttribute('data-tooltip');
            document.body.appendChild(tooltip);

            const rect = e.target.getBoundingClientRect();
            tooltip.style.left = rect.left + 'px';
            tooltip.style.top = (rect.top - 40) + 'px';
        });

        element.addEventListener('mouseleave', () => {
            const tooltip = document.querySelector('.tooltip');
            if (tooltip) {
                document.body.removeChild(tooltip);
            }
        });
    });
});

// Course filtering
function filterCourses(category) {
    const courses = document.querySelectorAll('.course-card');

    courses.forEach(course => {
        if (category === 'all' || course.dataset.category === category) {
            course.style.display = 'block';
        } else {
            course.style.display = 'none';
        }
    });
}

// Search functionality
function searchCourses(query) {
    const courses = document.querySelectorAll('.course-card');
    const lowerQuery = query.toLowerCase();

    courses.forEach(course => {
        const title = course.querySelector('h4').textContent.toLowerCase();
        const description = course.querySelector('p').textContent.toLowerCase();

        if (title.includes(lowerQuery) || description.includes(lowerQuery)) {
            course.style.display = 'block';
        } else {
            course.style.display = 'none';
        }
    });
}

// Form validation
function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.classList.add('error');
        } else {
            field.classList.remove('error');
        }

        // Email validation
        if (field.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(field.value)) {
                isValid = false;
                field.classList.add('error');
            }
        }
    });

    return isValid;
}

// Add CSS for form errors
const style = document.createElement('style');
style.textContent = `
    .form-group input.error,
    .form-group textarea.error {
        border-color: #dc3545;
        box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
    }

    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }

    .payment-summary {
        background: #f8f9fa;
        padding: 1.5rem;
        border-radius: 10px;
        margin-bottom: 2rem;
    }

    .payment-total {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #dee2e6;
        font-weight: bold;
        font-size: 1.2rem;
    }

    .course-summary {
        background: linear-gradient(135deg, #f8f9fa, #e9ecef);
        padding: 1.5rem;
        border-radius: 10px;
        margin-bottom: 2rem;
        border-left: 4px solid var(--primary-color);
    }

    .price-total {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #dee2e6;
    }

    .enrollment-form label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        margin-bottom: 1rem;
    }

    .enrollment-form input[type="checkbox"] {
        width: auto;
        margin: 0;
    }

    .loading {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255,255,255,0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 1s ease-in-out infinite;
        margin-right: 0.5rem;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .stripe-badge {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        margin-top: 1rem;
        padding: 0.5rem;
        background: rgba(0,0,0,0.05);
        border-radius: 5px;
        font-size: 0.85rem;
        color: var(--text-light);
    }

    .stripe-badge i {
        color: #635BFF;
    }
`;
document.head.appendChild(style);

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Cargar datos dinámicos (funciones por implementar)
    // loadMembers();
    // loadCourses();
    // loadAnalytics();

    // Nota: La configuración de Stripe ahora se maneja en stripe-config.js
    // Ver advertencias en la consola sobre requisitos de backend
});
// Estilos para resaltado de campos
const highlightStyle = document.createElement('style');
highlightStyle.textContent = `
    .highlight {
        border-color: var(--primary-color) !important;
        box-shadow: 0 0 15px rgba(227, 6, 19, 0.2) !important;
        transform: scale(1.02);
        transition: all 0.3s ease;
    }
`;
document.head.appendChild(highlightStyle);

// Última actualización: sábado,  8 de noviembre de 2025, 01:31:50 CET
