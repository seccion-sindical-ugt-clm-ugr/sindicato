# Instrucciones para Subir a GitHub

## 1. Crear el repositorio
- Ve a GitHub.com
- Crea un nuevo repositorio llamado **`sindicato`**
- No marques "Add README file"

## 2. Conectar y subir
Una vez creado el repositorio, ejecuta estos comandos en la terminal:

```bash
# Navegar al directorio del proyecto
cd "/Users/blablaele/Desktop/AI/Webs/ugt-clm-ugr"

# Añadir el remoto de GitHub (reemplaza TU_USUARIO con tu username de GitHub)
git remote add origin https://github.com/TU_USUARIO/sindicato.git

# Renombrar la rama a main (si es necesario)
git branch -M main

# Subir el código a GitHub
git push -u origin main
```

## 3. Acceder al repositorio
Tu sitio estará disponible en:
```
https://github.com/TU_USUARIO/sindicato
```

## 4. Activar GitHub Pages (opcional)
Para publicar el sitio:
1. Ve a Settings > Pages
2. Selecciona "Deploy from a branch"
3. Elige "main" y "/root"
4. Tu sitio estará en: `https://TU_USUARIO.github.io/sindicato/`

## ✅ ¡Listo!
Tu repositorio ya estará en GitHub con todo el código del sitio web.