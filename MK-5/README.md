# MK-5 — Simulador de Mapas de Karnaugh

Proyecto académico para representar y simplificar funciones booleanas de 2 a 5 variables.

## Tecnologías
- HTML5, CSS3, JavaScript (sin servidor)
- SVG para visualizar circuitos lógicos

## Cómo usar
1. Abre `index.html` para ver la portada.
2. Haz clic en **Ingresar al simulador**.
3. Selecciona de 2 a 5 variables e ingresa los minterminos separados por comas.
4. Haz clic en **Generar mapa**.

## Publicación con GitHub Pages
1. Crea un repositorio público en GitHub (por ejemplo, `mk-5`).
2. Desde Git Bash, entra a la carpeta del proyecto y ejecuta:

```bash
git init
git add .
git commit -m "Publicar MK-5 con portada universitaria"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/mk-5.git
git push -u origin main
```

3. En GitHub abre **Settings → Pages**.
4. En **Build and deployment**, elige **Deploy from a branch**, rama **main**, carpeta **/(root)** y guarda.
5. Abre la dirección que GitHub Pages indique. Usualmente es `https://TU_USUARIO.github.io/mk-5/`.

**Nota:** reemplaza `TU_USUARIO` por tu nombre de usuario real de GitHub. GitHub puede solicitar autenticación mediante el navegador o un administrador de credenciales. No publiques contraseñas ni claves.

## Archivos
- `index.html`: portada institucional.
- `simulador.html`: simulador original.
- `css/portada.css`: estilos de portada.
- `css/styles.css`: estilos del simulador.
- `js/app.js`: lógica original del simulador.
- `imagenes/LOGO UNIVERSIDAD.webp`: escudo aportado para uso académico.

Proyecto académico no oficial; no representa un sitio web institucional de la universidad.
