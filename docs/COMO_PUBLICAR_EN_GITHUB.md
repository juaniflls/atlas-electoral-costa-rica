# Cómo publicar este paquete en GitHub

## Opción recomendada (web + GitHub Desktop)

1. Cree un repositorio nuevo en GitHub con el nombre sugerido `atlas-electoral-costa-rica`.
2. **No** agregue README, `.gitignore` ni licencia desde la web, porque este paquete ya los incluye.
3. Abra **GitHub Desktop**.
4. Seleccione **File → Clone repository** y clone el repositorio vacío en su computadora.
5. Descomprima este paquete ZIP.
6. Copie **todo el contenido** de la carpeta `atlas-electoral-costa-rica/` dentro de la carpeta local clonada por GitHub Desktop.
7. Vuelva a GitHub Desktop: verá todos los archivos detectados.
8. Escriba un commit inicial, por ejemplo: `Versión inicial del Atlas electoral interactivo de Costa Rica`.
9. Presione **Commit to main**.
10. Presione **Push origin** para subirlo a GitHub.
11. En GitHub Web, vaya a **Settings → General → Social preview** y cargue la imagen `assets/branding/social-preview-atlas-electoral-costa-rica.png`.
12. En la caja **About**, agregue la descripción y topics sugeridos en `CONFIGURACION_SUGERIDA_GITHUB.md`.

## Verificación rápida después de publicarlo
- Confirme que el README se vea correctamente.
- Revise que GitHub muestre el lenguaje principal como **Python** o **Jupyter Notebook**, no como HTML.
- Verifique que el notebook, el HTML y la carpeta `salidas/datos/` se hayan subido correctamente.
