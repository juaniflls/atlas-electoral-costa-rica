# Revisión de la distribución pública 38

Fecha: 13 de noviembre de 2026.

## Integridad

- Se conservaron sin modificación los ocho archivos Excel de entrada, comprobados con SHA-256.
- Se actualizaron las rutas e imports del notebook, los recursos incorporados y las etapas de construcción para emplear nombres funcionales estables. Los cálculos y los datos fuente se conservan. El Markdown inicial omite la fila ajena al producto público.
- El HTML se regeneró con las rutas actualizadas. La copia comprimida de `dist/` reproduce exactamente los bytes de la aplicación de esta entrega.
- La carpeta `.git` y los archivos ocultos aportados se conservaron. La excepción deliberada es `.gitattributes`, actualizado para clasificar las fuentes y los productos generados. Se añadió `.gitignore` sin modificar el índice ni el historial.
- Se sustituyeron documentación y capturas antiguas visibles. Se retiraron notas históricas de requisitos sin uso ejecutivo; los módulos de compatibilidad necesarios permanecen.

## Ejecución real del notebook

Se ejecutaron las 52 celdas Python, en orden, en una copia aislada del proyecto con las ocho bases y los recursos de la entrega. Todas terminaron sin error; la ejecución produjo la aplicación principal y sus derivados. El tiempo observado fue aproximadamente 150 segundos en este entorno, no una garantía para otras computadoras.

Los cambios de implementación afectan nombres de archivos, sus referencias, comentarios de mantenimiento y mensajes de construcción. Se conservan los indicadores y las funciones aprobadas. Plotly y los metadatos de ejecución reflejan el entorno que reconstruye la aplicación.

## Interacción y límites

Las pruebas de DOM de la V38 verificaron:

- Fórmulas de 2006: una única cuadrícula de 14 fórmulas, colores y enlaces nominales.
- Apellidos: persona de referencia, exclusión de la referencia entre coincidencias y enlaces al Explorador de personas.
- Perfiles: selector y bandera antes del análisis adicional; un único selector, matrices, representación y navegación contextual.
- Mapas: cinco modos de lectura, dos arenas, siete provincias y comparación 2022–2026.
- Laboratorio: siete métodos, conteos de pares válidos, componentes principales y cargas, agrupamiento reproducible y exportaciones completas.
- Nombres de candidaturas y contexto partidario enlazados a los exploradores correspondientes.

Estas pruebas usan un DOM instrumentado y una implementación simulada de Plotly para comprobar controles, datos y navegación. No sustituyen la inspección de píxeles ni una prueba manual completa en un navegador real. Las capturas documentales son las aportadas por el autor. No se presenta la revisión automática como una certificación de todas las combinaciones posibles de filtros ni de la exactitud histórica de cada fuente.

Además, se cargaron los scripts y conjuntos JSON del HTML exacto de la entrega en un DOM instrumentado y se abrieron las 23 vistas registradas (presentación + 22 secciones). Todas pudieron construirse sin errores de ejecución en esa selección inicial. El resultado está en `comprobacion-vistas-v38.json`; el número de figuras se refiere solo a los filtros iniciales y no al total de variantes disponibles.

## Documentación y presentación

El README cubre las 22 secciones, además de la presentación, y distingue figuras, variantes, consultas, tablas y controles. El inventario técnico conserva rótulos de capas compatibles; no los suma como si todos fueran gráficos activos independientes.

La portada PNG mide 1280 × 640 píxeles y ocupa menos de 1 MB. La geometría provincial procede del recurso del proyecto. La portada no contiene resultados electorales simulados.

`python scripts/verificar_proyecto.py` comprueba fuentes, sintaxis de celdas, secciones, enlaces locales, portada y distribución comprimida. La publicación en GitHub, la selección de social preview y la revisión final en la computadora del autor quedan fuera de esta ejecución: no se creó ningún commit ni se hizo push.

## Limpieza de nombres funcionales

Se renombraron los seis módulos de construcción y sus recursos asociados. Se actualizaron imports, rutas, referencias del notebook, paquetes incorporados y pasos comprimidos. La reconstrucción completa volvió a superar las 52 celdas. No se conservan archivos visibles con nombres de ediciones anteriores; los archivos ocultos históricos se respetan. La comparación de los cuatro conjuntos JSON del HTML no detectó cambios analíticos: solo varían la fecha de generación y el orden de filas de una composición, cuyos registros y valores son idénticos al ordenar.

El instalador incorporado se probó también en una carpeta vacía: restauró 77 recursos con nombres funcionales y no recreó archivos con nombres de ediciones anteriores. Los recursos incorporados se sincronizaron con los archivos actuales de la entrega.

Las fuentes Excel se conservan exclusivamente como archivos de entrada de la raíz, con su manifiesto SHA-256. Se retiró su duplicación dentro del instalador incorporado: el notebook requiere los ocho archivos reales del paquete y no reconstruye sustitutos de las fuentes.
