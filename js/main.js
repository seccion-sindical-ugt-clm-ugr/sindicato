// DOM Elements
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const loginBtn = document.querySelector('.btn-login');
const loginModal = document.querySelector('#loginModal');
const closeModal = document.querySelector('.close');
const loginForm = document.querySelector('#loginForm');
const affiliateForm = document.querySelector('#affiliateForm');
const contactForm = document.querySelector('#contactForm');

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

// Login Modal
loginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loginModal.style.display = 'block';
});

closeModal.addEventListener('click', () => {
    loginModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        loginModal.style.display = 'none';
    }
});

// Smooth scrolling for navigation links - Mejorado para hero buttons
function initSmoothScroll() {
    const anchors = document.querySelectorAll('a[href^="#"]');
    console.log(`✅ Smooth scroll inicializado para ${anchors.length} enlaces`);

    anchors.forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');

            // Ignorar enlaces que son solo "#" (modales, etc.)
            if (href === '#' || href === '#!' || !href) {
                return;
            }

            e.preventDefault();
            const target = document.querySelector(href);

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
        });
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

// Form handlers
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(loginForm);
    const email = formData.get('email') || loginForm.querySelector('input[type="email"]').value;
    const password = formData.get('password') || loginForm.querySelector('input[type="password"]').value;

    // Show loading state
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Iniciando sesión...';
    submitBtn.disabled = true;

    try {
        // Simulate API call - Replace with actual API endpoint
        await simulateAPICall();

        // Store login state
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', email);

        showMessage('success', '¡Inicio de sesión exitoso!');

        // Redirect to dashboard or update UI
        setTimeout(() => {
            loginModal.style.display = 'none';
            updateLoginState();
            // Redirect to member area
            window.location.href = '#member-dashboard';
        }, 1500);

    } catch (error) {
        showMessage('error', 'Email o contraseña incorrectos');
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
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const loginBtn = document.querySelector('.btn-login');

    if (isLoggedIn) {
        const userEmail = localStorage.getItem('userEmail');
        loginBtn.innerHTML = `<i class="fas fa-user"></i> ${userEmail}`;
        loginBtn.href = '#dashboard';
    }
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
    // Observe elements for scroll animations
    document.querySelectorAll('.about-card, .course-card, .contact-item').forEach(el => {
        el.classList.add('scroll-animate');
        observer.observe(el);
    });

    // Check login state on load
    updateLoginState();
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
