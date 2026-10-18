# Publicar la actualización V22 en el repositorio existente

**Repositorio verificado:** `https://github.com/juaniflls/atlas-electoral-costa-rica` (rama `main`). No cree otro repositorio.

1. Descargue y descomprima `Atlas_Electoral_Repositorio_Publico_V22.zip`.
2. Abra la carpeta **local ya vinculada a GitHub** en GitHub Desktop.
3. Copie **el contenido** de `atlas-electoral-costa-rica/` del ZIP dentro de esa carpeta, reemplazando archivos homónimos. **No sustituya la carpeta oculta `.git`.**
4. En el repositorio local elimine los respaldos antiguos que ya no están en la V22 (`Atlas_Electoral_1953_2026_V7_FINAL_VISUAL_CORREGIDO.ipynb`, `checkpoints/`, `.ipynb_checkpoints/` y `salidas/graficas_articulo/`). Puede dejar los demás archivos no incluidos si tienen una utilidad documental verificada.
5. Compruebe en GitHub Desktop que las siete bases, `Atlas_Electoral_V22_PUBLICO.ipynb`, `recursos/atlas_v22_public.js`, `recursos/atlas_v22_public.css`, `README.md`, capturas y el HTML actualizado figuren en el cambio.
6. Commit sugerido: `feat: publica Atlas Electoral V22 con archivo presidencial y hemiciclo`.
7. Pulse **Push origin**. Verifique la fecha y el SHA del commit en la rama remota `main`.

**Línea de comandos**, desde la carpeta local del repositorio (después de copiar los archivos):

```bash
git status --short
git add -A
git commit -m "feat: publica Atlas Electoral V22 con archivo presidencial y hemiciclo"
git push origin main
```

Si GitHub advierte sobre límites de tamaño, no quite arbitrariamente las fuentes o el HTML: identifique el archivo y revise Git LFS, Releases o una distribución externa documentada. Los enlaces de GitHub Pages a un archivo HTML muy grande también pueden requerir un despliegue específico.
