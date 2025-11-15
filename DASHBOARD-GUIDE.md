# Guía: Dashboard de Usuario en Todas las Páginas

## 📋 Descripción

El dashboard de usuario se inyecta automáticamente en **todas las páginas** del sitio mediante el archivo `js/user-dashboard-inject.js`. Esto significa que:

- Los usuarios logueados verán su nombre en el botón de login en **cualquier página**
- El panel de usuario está disponible en **todas las páginas** (actuales y futuras)
- No hay que duplicar código HTML del dashboard en cada página
- Mantenimiento centralizado en un solo archivo

## 🚀 Cómo añadir el dashboard a una página nueva

Para que una página nueva tenga el dashboard del usuario, solo necesitas incluir el script ANTES de `main.js`:

```html
<!-- Otros scripts -->
<script src="js/backend-config.js"></script>
<script src="js/auth-api.js"></script>

<!-- IMPORTANTE: Incluir ANTES de main.js -->
<script src="js/user-dashboard-inject.js"></script>

<!-- Main debe ir después -->
<script src="js/main.js"></script>
```

### Para páginas en subcarpetas (ej: pages/)

Ajusta la ruta con `../`:

```html
<script src="../js/user-dashboard-inject.js"></script>
<script src="../js/main.js"></script>
```

## ✅ Páginas que ya tienen el dashboard

- ✓ `index.html`
- ✓ `pages/curso-ia.html`
- ✓ `pages/curso-negociacion-laboral.html`
- ✓ `admin/dashboard.html` (tiene su propio dashboard)

## 📦 Qué incluye el dashboard inyectado

El script `user-dashboard-inject.js` añade automáticamente:

1. **Section principal**: `#memberDashboard` con las 4 tarjetas:
   - Mis Datos
   - Mis Cursos
   - Documentos
   - Eventos

2. **Modales**:
   - `#editProfileModal` - Editar perfil del usuario
   - `#changePasswordModal` - Cambiar contraseña
   - `#myCoursesModal` - Ver cursos inscritos
   - `#myDocumentsModal` - Ver documentos sindicales
   - `#myEventsModal` - Ver eventos y mensajes

## 🔧 Mantenimiento

Si necesitas modificar el dashboard:

1. Edita SOLO el archivo: `js/user-dashboard-inject.js`
2. Los cambios se aplicarán automáticamente a **todas las páginas**
3. No necesitas editar cada página HTML individualmente

## 💡 Ejemplo de página nueva completa

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nueva Página - UGT-CLM-UGR</title>
    <link rel="stylesheet" href="../css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
    <!-- Header con botón de login -->
    <header class="header">
        <nav class="navbar">
            <div class="container">
                <div class="nav-brand">
                    <img src="../images/brand/ugt-logo.PNG" alt="UGT Logo" class="logo">
                    <h1>UGT-CLM-UGR Granada</h1>
                </div>
                <ul class="nav-menu">
                    <li><a href="../index.html">Inicio</a></li>
                    <!-- Botón de login - se actualiza automáticamente -->
                    <li><a href="#" class="btn-login"><i class="fas fa-user"></i> Acceso</a></li>
                </ul>
            </div>
        </nav>
    </header>

    <!-- Tu contenido aquí -->
    <section class="section">
        <div class="container">
            <h2>Contenido de la página</h2>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
        <!-- Footer content -->
    </footer>

    <!-- Scripts - ORDEN IMPORTANTE -->
    <script src="../js/backend-config.js"></script>
    <script src="../js/auth-api.js"></script>
    <script src="../js/user-dashboard-inject.js"></script> <!-- Dashboard inyectado automáticamente -->
    <script src="../js/main.js"></script>
</body>
</html>
```

## 🎯 Funcionalidades automáticas

Al incluir el script, automáticamente obtienes:

1. **Botón de login inteligente**:
   - Muestra "Acceso Afiliados" si no estás logueado
   - Muestra tu nombre si estás logueado
   - Click abre el login modal o el dashboard según corresponda

2. **Verificación de sesión**:
   - Al cargar la página, verifica si hay sesión activa
   - Actualiza el botón automáticamente
   - Carga datos del usuario desde el backend

3. **Todos los modales funcionales**:
   - Editar perfil con foto
   - Cambiar contraseña
   - Ver cursos, documentos y eventos
   - Sin configuración adicional

## ⚠️ Importante

- El script DEBE ir ANTES de `main.js`
- El elemento `.btn-login` debe existir en el HTML
- El modal `#loginModal` debe existir (o incluir también login modals)
- Se requieren `backend-config.js` y `auth-api.js` para funcionar

## 🐛 Troubleshooting

**Problema**: El dashboard no aparece
- Solución: Verifica que `user-dashboard-inject.js` está ANTES de `main.js`
- Verifica la ruta del script (usa `../` si estás en subcarpeta)

**Problema**: El botón no muestra el nombre del usuario
- Solución: Verifica que `auth-api.js` está incluido
- Abre la consola y busca errores de autenticación

**Problema**: Elementos duplicados
- Solución: Elimina cualquier HTML del dashboard que esté en la página
- El script detecta duplicados automáticamente
