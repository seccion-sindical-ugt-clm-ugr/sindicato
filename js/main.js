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
        targetSection.scrollIntoView({ behavior: 'instant', block: 'start' });
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

            showSingleSection('afiliate', 'Has llegado al formulario de afiliación 🎯');
            showBackToTopButton('afiliado');

            // Enfocar formulario inmediatamente
            setTimeout(() => {
                const firstInput = document.querySelector('#affiliateForm input[name="name"]');
                if (firstInput) {
                    firstInput.focus();
                    firstInput.classList.add('highlight');
                    setTimeout(() => {
                        firstInput.classList.remove('highlight');
                    }, 2000);
                }
            }, 300);
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
    // Navegación del logo y nombre (volver al inicio)
    const navBrand = document.getElementById('navBrand');
    if (navBrand) {
        navBrand.style.cursor = 'pointer';
        navBrand.addEventListener('click', () => {
            console.log('🏠 Logo clicado - volviendo al inicio');

            // Restaurar todas las secciones
            restoreAllSections();

            // Scroll al inicio
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Eliminar botón de volver si existe
            const backBtn = document.getElementById('backToTopBtn');
            if (backBtn) backBtn.remove();

            showMessage('info', 'Bienvenido al inicio 🏠');
        });
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

                // Si es el formulario de afiliación, enfocar el primer campo después del scroll
                if (href === '#afiliate') {
                    setTimeout(() => {
                        const firstInput = document.querySelector('#affiliateForm input[name="name"]');
                        if (firstInput) {
                            firstInput.focus();
                            console.log('✅ Formulario de afiliación enfocado');
                        }
                    }, 800); // Esperar a que termine el scroll
                }
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

contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(contactForm);

    // Show loading state
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Enviando...';
    submitBtn.disabled = true;

    try {
        // Simulate API call
        await simulateAPICall();

        showMessage('success', 'Mensaje enviado correctamente. Te responderemos pronto.');
        contactForm.reset();

    } catch (error) {
        showMessage('error', 'Error al enviar el mensaje');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

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

    // 5. Observar elementos para animaciones de scroll
    document.querySelectorAll('.about-card, .course-card, .contact-item').forEach(el => {
        el.classList.add('scroll-animate');
        observer.observe(el);
    });

    // 6. Verificar estado de login
    checkLoginStatus();

    console.log('✅ Sistema de navegación completamente inicializado');
});

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
