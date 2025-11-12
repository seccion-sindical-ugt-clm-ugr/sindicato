# 🎯 CORRECCIÓN: Mejora del scroll en botón 'Afíliate'

## Descripción
Se ajusta el comportamiento del scroll cuando el usuario hace clic en el botón 'Afíliate' para que se muestre correctamente el título completo de la sección '¿Por qué afiliarse a UGT-CLM Granada?' en lugar de ir directamente al formulario.

## Cambios realizados
- **Archivo modificado**: `js/main.js`
- **Líneas**: 79-86
- **Cambio**: Reemplazar `scrollIntoView` con cálculo manual de posición usando offset de 120px

## Beneficios
- El usuario puede leer el título completo de la sección
- Se muestran los beneficios de afiliación antes del formulario
- Mejora de experiencia de usuario

## Archivo a editar
**URL**: https://github.com/seccion-sindical-ugt-clm-ugr/sindicato/blob/main/js/main.js

**Buscar (línea ~79):**
```javascript
targetSection.scrollIntoView({ behavior: 'instant', block: 'start' });
```

**Reemplazar con:**
```javascript
        // Calcular posición con offset para mejor visualización
        // Colocar el scroll más arriba para que se vea el título completo
        const offset = 120; // Offset mayor para mostrar el título completo de la sección
        const targetPosition = targetSection.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({
            top: targetPosition,
            behavior: 'instant'
        });
```
