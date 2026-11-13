# Actualización de la copia local

La entrega conserva la carpeta `.git` recibida y los demás archivos ocultos. El historial no se reescribió, no se cambiaron remotos y no se creó ningún commit. Si la copia en Documentos tiene commits posteriores, conservar su propia `.git`: no sustituirla por la del paquete.

Copiar los archivos visibles de esta entrega al directorio de trabajo y actualizar también `.gitattributes` y `.gitignore`. Eliminar archivos visibles antiguos que ya no figuran en la entrega, después de comprobar que no sean trabajo local pendiente. No borrar archivos ocultos para realizar esa limpieza.

## Archivos grandes y salidas

El HTML principal está disponible localmente, pero se ignora en commits nuevos por su tamaño. La aplicación exacta también se encuentra comprimida en `dist/`; se restaura con:

```bash
python scripts/restaurar_aplicacion.py
```

`salidas/` contiene derivados y descargas, conservados en el paquete completo. El notebook puede reconstruirlos. Un clon nuevo debe ejecutar el notebook para producir todas las descargas auxiliares; restaurar únicamente el HTML permite la consulta principal.

## Archivos previamente rastreados

`.gitignore` no elimina del índice los archivos ya rastreados. Revisar primero:

```bash
git ls-files salidas .ipynb_checkpoints
```

Si se desea dejar de versionar derivados y checkpoints, conservándolos en el disco:

```bash
git rm -r --cached --ignore-unmatch salidas .ipynb_checkpoints
```

Este comando solo retira esas rutas del índice. No ejecutar `git rm` sin `--cached` para esa tarea. Revisar los cambios preparados antes del commit. La entrega no ejecuta el comando ni modifica el índice por cuenta del usuario.

Si GitHub Desktop muestra eliminaciones de notebooks o capturas antiguos que ya no forman parte de la entrega, corresponden a la limpieza de archivos públicos visibles. No recuperar esas copias por su número de versión: el punto de entrada vigente es `Atlas_Electoral_V38_Publico.ipynb`.

## Publicación

Usar GitHub Desktop o el cliente Git habitual para revisar, confirmar y subir los cambios. El ZIP completo es una entrega local del proyecto y su historial; no debe añadirse como un archivo más dentro del repositorio. GitHub no recibe la carpeta `.git` como contenido del proyecto: el cliente la usa para operar el repositorio.

La portada social se configura manualmente en los ajustes del repositorio seleccionando `assets/branding/atlas-electoral-v38.png`. El README ya referencia esa imagen. Las estadísticas de lenguajes se recalculan al procesar la rama publicada, con los atributos de esta entrega.
