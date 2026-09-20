# Atlas Electoral de Costa Rica · versión 2.0

Esta es la **versión final del producto interactivo de consulta y exploración electoral 1953–2026** desarrollado por Juan Ignacio Garbanzo Fallas en el marco de su Práctica Profesional en el IFED–TSE.

## Inicio recomendado

Abra `salidas/Atlas_Electoral_Costa_Rica_1953_2026.html`. La aplicación funciona sin conexión y abre en la pestaña **00 · Presentación**, donde se explica qué es el producto, cómo se construyó, qué información contiene, cómo navegarlo y qué cautelas metodológicas deben considerarse.

## Reproducibilidad

Para reconstruir el producto desde las fuentes:

1. Descomprima el paquete completo.
2. Abra `Atlas_Electoral_Costa_Rica_1953_2026.ipynb` dentro de esta carpeta.
3. Instale las dependencias con `python -m pip install -r requirements.txt`.
4. Ejecute **Restart Kernel and Run All Cells**.

También puede ejecutar `python recursos/verificar_notebook.py` para una verificación secuencial. El proceso vuelve a generar `salidas/datos/`, el HTML autocontenido y los checkpoints.

## Contenido

El paquete conserva las siete bases Excel fuente, el notebook, módulos reproducibles en Python, GeoJSON provincial, recursos visuales, CSV/JSON derivados, checkpoints, documentación metodológica y el HTML final.

Las bases fuente se preservan sin modificaciones. Las identidades personales se tratan como coincidencias nominales salvo verificación adicional; compartir nombre o apellido no prueba parentesco. Las asociaciones descriptivas no se presentan como efectos causales.
