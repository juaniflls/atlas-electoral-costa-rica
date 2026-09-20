# Atlas electoral de Costa Rica (1953–2026): guía madre

**Autor e investigador:** Juan Ignacio Garbanzo Fallas. Proyecto académico de Práctica Profesional IFED–TSE. Esta guía permite continuar el proyecto en otro chat o convertirlo después en un repositorio público. **Versión de trabajo: 2.0.**

## 1. Objetivo y productos

El proyecto integra siete libros Excel sobre elecciones, candidaturas, electos, diseño de papeletas y cancelación de partidos. El notebook reconstruye todos los cálculos, genera CSV/JSON auditables y crea `salidas/Atlas_Electoral_Costa_Rica_1953_2026.html`, una aplicación de una sola página que incorpora Plotly y el GeoJSON provincial para abrirse sin conexión.

La vista distingue **candidatura**, **resultado electo** y **ejercicio efectivo de un cargo**. Las bases documentan los dos primeros; la lista de electos no acredita por sí sola la totalidad de los años de ejercicio, cambios de bancada o relaciones familiares. Una cadena que coincide en nombre es una **coincidencia nominal**, no necesariamente una persona civil idéntica. Las denominaciones partidarias tampoco prueban continuidad jurídica entre inscripciones.

## 2. Carpeta y archivos de entrada

Descomprima el ZIP completo; abra `Atlas_Electoral_Costa_Rica_1953_2026.ipynb` **dentro de la carpeta descomprimida**. Allí se encuentran exactamente siete bases activas. `version_anterior/` conserva material antiguo como referencia, sin alimentar el notebook.

| Rol (`FILES`) | Excel activo en la raíz | Contenido |
|---|---|---|
| `leg` | `Base_Electoral_Diputaciones_1953-2026(20260918-171611).xlsx` | Votos y escaños legislativos, pestañas por año. |
| `pres` | `Base_Electoral_Presidencial_1953-2026(4).xlsx` | Votos presidenciales, pestañas por año. |
| `cand` | `Base_Final_Candidaturas_Diputaciones_1953-2026_ENTREGA.xlsx` | **Base final de 14.874 filas**, candidaturas a diputaciones. |
| `formula` | `Base_Final_Candidaturas_Presidenciales_1953-2026(4).xlsx` | Presidencia y vicepresidencias, postulaciones y resultado. |
| `electas` | `Base_Final_Diputaciones_Electas_1953-2026(4).xlsx` | 1.059 diputaciones electas documentadas. |
| `diseno` | `Base_Final_Diseno_Papeletas_Diputaciones_1953-2026(4).xlsx` | Diseño y características de las papeletas. |
| `cancelados` | `Base_partidos_cancelados.xlsx` | Registros de cancelación y coincidencias. |

Los nombres de archivo se declaran en `recursos/atlas_pipeline.py` (`FILES`). Para actualizar **solo nombres o candidaturas**: reemplace el archivo de `cand` con un Excel nuevo **del mismo nombre**, pestaña y columnas, sin cambiar los otros seis. Si necesita un nombre distinto, actualice únicamente `FILES['cand']`. Si se cambia una de las otras bases, respete también su esquema y ajuste el código que lee esa fuente cuando cambie su contrato.

### Contrato exacto de candidaturas

Pestaña `Datos`, una candidatura real por fila, cabeceras exactas en este orden:

1. `ID candidatura` — identificador estable y único; no reciclable después de quitar una línea OCR falsa.
2. `Año` — entero de elección, dentro del conjunto de 19 procesos 1953–2026.
3. `Provincia` — una de las siete provincias con acento y grafía consistente.
4. `Partido` — nombre documental de la fuente; se normaliza *en memoria* para cruces.
5. `Tipo de candidatura` — `Propietaria` o `Suplencia` según época y papeleta.
6. `Orden en lista` — entero positivo y consecutivo dentro de año × provincia × partido × tipo cuando la fuente lo determina.
7. `Nombre completo` — lectura documental; cuatro filas históricas aún carecen de nombre; **no inventar**.
8. `Sexo` — `Mujer`, `Hombre` o vacío / `Sin dato` si no está verificado.
9. `Electa` — `Sí` / `No`, conservando las 1.059 marcas electas.
10. `Cédula` — identificador cuando exista; preservar texto para no perder ceros o separadores.
11. `Alias` — aquí va `c.c.` / conocido como; **no agregar otra candidatura** por un alias.

El pipeline verifica las 11 cabeceras, la unicidad del ID y que el total de `Electa = Sí` coincida con el número de registros de electas. También informa las diferencias de grafía entre ambas fuentes sin borrar automáticamente una marca `Sí`. Si aumenta o disminuye el número de filas, emite aviso; el notebook verifica dinámicamente los recuentos contra el archivo de entrada. No use el índice físico de Excel como identidad: los ID son la referencia estable.

**Dato sin resolver que ya consta en el informe de papeletas:** «Limonense» en `Limonense Jackson Bell` (Limón, 1974) es un identificador provisional indicado para suplir una lectura imposible, no un nombre de pila confirmado. Una observación de puesto de Rafael Antonio León Solís (San José, 1978) contradice otro puesto plausible: se conservó su orden 21 hasta resolverlo con una fuente visible. No convierta estas notas en certezas nuevas.

## 3. Ejecución y actualización

1. Instale Python 3.10 o posterior; abra terminal dentro de la carpeta del proyecto.
2. Instale los paquetes: `python -m pip install -r requirements.txt` (idealmente en un entorno virtual).
3. Ejecute `jupyter lab`, abra el notebook y seleccione **Restart Kernel and Run All Cells**. Si abre Jupyter desde otra carpeta, configure `PROJECT_PATH` en la primera celda con la ruta absoluta del proyecto.
4. La primera celda vuelve a cargar los módulos de **esta carpeta** incluso si había versiones anteriores en la memoria de Jupyter. Construye `salidas/datos/`, `salidas/Atlas_Electoral_Costa_Rica_1953_2026.html` y `checkpoints/`.
5. Abra el HTML local con un navegador. Se pueden descargar CSV de tablas y figuras; el HTML no requiere servicio web.
6. Tras corregir candidaturas, **reemplace solo** `Base_Final_Candidaturas_Diputaciones_1953-2026_ENTREGA.xlsx`, reinicie el kernel y ejecute todo. No edite manualmente el HTML ni el JSON generado: se sobrescriben al reconstruir el proyecto.

Para una verificación secuencial sin JupyterLab, después de instalar dependencias: `python recursos/verificar_notebook.py`. Ese programa vuelve a guardar el notebook con salidas de todas las celdas; por tanto, ejecútelo en una copia si quiere conservar la presentación anterior. Los archivos `checkpoints/estado.json` y `salidas/datos/manifest_fuentes.json` guardan nombres, tamaños y SHA-256 de las entradas para rastrear exactamente qué versión produjo cada salida.

## 4. Arquitectura mínima

| Archivo | Responsabilidad |
|---|---|
| `Atlas_Electoral_Costa_Rica_1953_2026.ipynb` | Narración académica, cálculos reproducibles, controles y exportación. |
| `recursos/atlas_pipeline.py` | Contrato de siete bases, extracción de votos y escaños, integración de candidaturas, identidad nominal, métricas, manifest y HTML. |
| `recursos/atlas_outcomes.py` | Eventos de candidatura, personas nominales, resultados y transiciones; reconstruye cámara y fórmula electa. |
| `recursos/atlas_enhancements.py` | Tablas complementarias, sexo y denominaciones de partidos. |
| `recursos/atlas_geography.py` + `recursos/costaricaprovincias.geojson` | Geometría local y representación territorial. |
| `recursos/atlas_template.html` | Diseño, filtros globales, gráficos, tablas descargables y navegación. |
| `recursos/atlas_v3.js` | Extensiones anteriores: mapas, partidos, flujos, perfiles, representación y estabilidad de selectores. |
| `recursos/atlas_final.js` | Nuevas vistas y enlaces: gobiernos y cámara, credenciales, apellidos, outcomes y mapas integrados. |
| `recursos/verificar_notebook.py` | Ejecución secuencial y salvado del notebook. |

La interfaz conserva las pestañas originales y mantiene **Laboratorio, Explorador de datos y Metodología y fuentes** al final; añade **Éxito electoral** antes de ellas. El mapa provincial también se usa dentro de Participación, Presidencia/diputaciones, Votos y escaños y Gobiernos, además de la pestaña Mapas provinciales. Las vistas históricas comparten el filtro de periodo, año de detalle y provincia cuando sus denominadores son compatibles.

## 5. Datos, fórmulas y límites de interpretación

- Resultados: `votos.csv` (partido × año × provincia × arena), `totales.csv`, `escanos.csv`, `metricas.csv`, `panel.csv`; se agregan 7 provincias para la fila Nacional, no se promedian porcentajes provinciales.
- Candidaturas y electos: `candidaturas.csv`, `electas.csv`, `formulas.csv`, `eventos.csv`, `personas.csv`, `camara_electa.csv`, `ejecutivo_electo.csv`.
- Outcomes: `resultados_candidaturas.csv` (una fila por postulación); `resultados_personas.csv` (una fila por ID nominal); `transiciones_resultados.csv` (origen y destino con ambos ID, años, cargo, partido, provincia y resultado). Un apellido nunca sirve como clave de identidad.
- Tasa general = candidaturas electas / candidaturas con nombre y resultado de la selección; tasa de personas = ID nominales alguna vez electos / ID nominales seleccionados. Las tasas de regreso, cambio de partido o provincia y primera postulación se calculan con **denominadores propios** visibles. `Sin dato` de sexo se muestra como faltante y no se asigna a otra categoría.
- Una transición corresponde a dos participaciones sucesivas de un mismo ID nominal en **elecciones distintas**. El Sankey usa número de transiciones; la tabla distingue personas distintas. El clic o selector de flujo abre las filas de origen y destino, no una interpretación causal.
- Participación = votos emitidos / padrón; blancos y nulos = votos blancos o nulos / emitidos; peso provincial de escaños = escaños provinciales / total nacional de escaños. El índice de escaños/padrón es comparativo y **no** reproduce la regla legal de asignación. El [art. 106 constitucional](https://pgrweb.go.cr/scij/Busqueda/Normativa/Normas/nrm_articulo.aspx?nValor1=1&nValor2=871&nValor3=935&nValor5=4954&param1=NRA) y el [TSE](https://www.tse.go.cr/pdf/publicaciones/C%C3%B3mo%20se%20Elige.pdf) vinculan la distribución provincial a la **población**, no al padrón. Sin población censal anual compatible no se debe afirmar que el índice representa desigualdad respecto de habitantes.
- Etiquetas de partidos normalizadas para cálculo no demuestran que organizaciones homónimas sean la misma entidad. La divisa que se muestra es una referencia visual disponible, no prueba de su uso histórico por cada organización.
- El paquete **no** posee relaciones familiares verificadas. El explorador de apellidos usa únicamente campos explícitos y ofrece coincidencias para investigar; omite nombres sin desglose de apellidos. Cargos adicionales, años completos de ejercicio y cambios intralegislatura requieren fuentes nuevas verificadas.

## 6. Comprobaciones al actualizar la base

Confirme que el notebook terminó sin error, que hay 19 elecciones, siete provincias y exactamente 45 diputaciones electas en 1953/1958 y 57 en cada elección posterior. Verifique las 1.059 marcas electas frente al registro separado, las tasas (numerador y denominador) y las filas de nombres que cambió. Revise `salidas/datos/integridad.csv`: una falta de coincidencia textual debe analizarse, no convertirse automáticamente en una no elección. Controle en el HTML que no haya tokens `__ATLAS_DATA__`, `__PLOTLY_JS__` ni `__V3_EXTENSIONS__`, y que carguen navegación, selectores, perfiles, mapas, cámara, outcomes, tablas y descargas. Una ejecución de Python no reemplaza revisar visualmente el HTML en un navegador.

Al publicar un repositorio, preserve la atribución a Juan Ignacio, documente licencia y procedencia de cada fuente, y decida qué imágenes y bases institucionales pueden redistribuirse. No convierta por defecto este ZIP académico en un repositorio público; prepare primero una revisión de privacidad, permisos y reproducibilidad de fuentes.

## 7. Instrucción breve para otro chat

> Trabaja sobre este ZIP completo del Atlas Electoral 1.9 y lee `DOCUMENTO_MADRE.md`, `LEEME.md`, `CAMBIOS_V1_9.md` y `REVISION_GUIADA_V1_9.md` antes de editar. Preserva las siete bases autorizadas, la autoría de Juan Ignacio y las pestañas existentes. La base activa de diputaciones se llama `Base_Final_Candidaturas_Diputaciones_1953-2026_ENTREGA.xlsx`: pestaña `Datos`, 11 columnas exactas documentadas aquí, ID estables y marcas electas verificadas. Para cambiar nombres, reemplaza solo ese Excel y ejecuta el notebook de inicio a fin. Conserva los alias en `Alias`, no crees candidaturas por líneas `c.c.`. Comprueba 19 elecciones, siete provincias, 1.059 diputaciones electas y la integridad del HTML sin tokens JS; valida interfaz y descargas en navegador. Presenta tasas con N y denominador; distingue candidatura, persona y carrera completa; y no conviertas coincidencias nominales, apellidos o asociaciones descriptivas en identidades, parentescos o causalidad. Devuélveme un ZIP completo reproducible, Documento Madre actualizado, registro de cambios, guía de revisión y cualquier límite no resuelto documentado.

## 8. Cambios y contrato de continuidad de la versión 1.6

La versión 1.6 **no sustituye ni elimina** la arquitectura de 1.5: la amplía para que las personas, los outcomes y las trayectorias puedan inspeccionarse con mayor claridad. Las siete bases de entrada permanecen iguales y ningún Excel original se modifica.

### 8.1 Explorador de personas

La pestaña antes denominada **Credenciales** se presenta ahora como **Explorador de personas**. Debe permitir consultar el catálogo nominal completo, no solamente un subconjunto inicial. La interfaz usa búsqueda por nombre, filtros de población y paginación de 100 nombres. Los filtros disponibles incluyen todas las personas, candidaturas repetidas, alguna vez electas, sin elección observada, diputación electa, candidatura presidencial, Presidencia electa y vicepresidencia electa.

La ficha individual separa: (a) candidatura; (b) outcome electa/no electa; (c) registros específicos de diputaciones o fórmula presidencial electas. La línea entre eventos sigue siendo una trayectoria nominal, no una verificación civil independiente.

**Personas y trayectorias** conserva otra función: es la vista agregada de recurrencia, movilidad, experiencia previa e intentos hasta la primera elección observada. No debe confundirse con el explorador individual.

### 8.2 Outcomes y éxito electoral

La unidad de análisis debe mantenerse explícita:

- **candidatura-evento:** cada postulación documentada;
- **persona nominal:** cada `id_persona`, que puede acumular varias candidaturas.

Toda tasa debe mostrar numerador, denominador y registros subyacentes. “Sin elección” significa que ninguna candidatura dentro de la selección tiene outcome electo; no significa ausencia de otros cargos públicos fuera de estas fuentes.

La pestaña **Éxito electoral** incorpora cinco lecturas complementarias:

1. outcomes por candidatura y por persona;
2. tasas por primera candidatura, regreso, elección previa y cambios de partido/provincia;
3. flujos entre participaciones consecutivas;
4. puentes entre cargos que no tienen que ser consecutivos;
5. antecedentes observados antes de cada outcome electo.

Las diferencias son descriptivas. No interpretar una mayor tasa después de cambiar de partido o provincia como efecto causal.

### 8.3 Nueva tabla `puentes_cargos`

`puentes_cargos.csv` contiene pares ordenados de participaciones de una misma identidad nominal cuando el cargo de origen y el de destino son distintos y el destino ocurre en una elección posterior. Registra nombre, años, cargo, outcome, partido, provincia, cambio de partido/provincia y años entre ambos eventos.

Esta tabla permite preguntar, por ejemplo:

- cuántas personas fueron candidatas a diputación antes de competir por la Presidencia;
- cuántas ya habían sido diputadas electas antes de una candidatura o elección presidencial;
- cuántas candidaturas presidenciales fueron seguidas posteriormente por candidaturas o elecciones legislativas;
- trayectorias equivalentes entre diputación y vicepresidencias.

Una persona puede aportar más de un par si tuvo varias candidaturas en alguno de los cargos; por eso la interfaz siempre distingue **personas** de **pares documentados**.

### 8.4 Tabla `antecedentes_cargos_electos` y claridad de antecedentes

Cada outcome electo se clasifica según su historia previa dentro del corpus:

- `Ya había resultado electa antes`;
- `Había competido antes, pero aún no había sido electa`;
- `No tenía candidaturas anteriores en estas bases`.

También se registran indicadores específicos de diputación, Presidencia y vicepresidencias previas. Esta tabla sustenta porcentajes como “presidencias electas con diputación electa previa” y, simultáneamente, permite abrir los nombres que forman el numerador.

**Límite temporal:** la base empieza en 1953. “No tenía candidaturas anteriores en estas bases” describe únicamente el corpus disponible y nunca debe redactarse como “nunca había tenido actividad política” sin una fuente externa que lo demuestre.

### 8.5 Flujos auditables

El selector de flujos debe validar que la opción elegida siga existiendo después de cambiar filtros. En 1.6 se puede alternar entre:

- resultado → resultado;
- cargo + resultado → cargo + resultado;
- cargo → cargo;
- condición de cambio de partido → outcome posterior;
- condición de cambio de provincia → outcome posterior.

Cada flujo tiene tabla de personas, años, cargos, partidos, provincias y outcomes. El clic del Sankey utiliza el nombre del flujo como identificador; no depende del número visual del enlace.

### 8.6 Apellidos

El explorador admite primer apellido, segundo apellido, ambos por separado y **par de apellidos** cuando los dos campos existen de forma explícita. Para el apellido seleccionado muestra personas nominales, personas con alguna elección, personas sin elección y candidaturas. La red de partidos continúa siendo exploratoria.

No reconstruir un segundo apellido faltante desde el texto libre ni inferir parentesco por coincidencia nominal.

### 8.7 Partidos, territorio y brecha entre arenas

La vista **Partidos y territorio** añade frecuencias históricas, dentro del periodo seleccionado, de Presidencia electa, mayor voto legislativo y primera bancada por denominación. Son conteos descriptivos y no acreditan continuidad jurídica de nombres reutilizados.

**Perfiles de partidos** añade un resumen provincial del porcentaje legislativo observado: promedio simple por provincia, máximo y año del máximo. El promedio no es ponderado y no representa por sí solo fortaleza organizativa.

La **brecha presidencial–legislativa** se define de forma única como:

`porcentaje presidencial − porcentaje legislativo`.

Positivo = mayor porcentaje presidencial; negativo = mayor porcentaje legislativo; cero = igualdad. No equivale a porcentaje de personas que cruzaron el voto.

### 8.8 Comprobaciones adicionales de 1.6

Además de los controles de 1.5, verificar:

- que `resultados_personas` contenga el catálogo nominal completo;
- que `puentes_cargos` solo tenga años de origen menores al destino y cargos distintos;
- que `antecedentes_cargos_electos` contenga exclusivamente outcomes electos;
- que el selector de flujo cambie realmente la tabla inspeccionada;
- que Explorador de personas permita llegar a nombres fuera de las primeras 100 entradas;
- que los porcentajes de antecedentes puedan auditarse con nombres;
- que las nuevas tablas estén disponibles en Explorador de datos;
- que la etiqueta de la brecha explique correctamente el signo.

### 8.9 Entrega de cada iteración

El contrato de trabajo para las siguientes versiones es:

1. trabajar sobre el ZIP completo más reciente;
2. preservar las siete bases originales y las prestaciones válidas existentes;
3. ejecutar el notebook desde cero;
4. generar el HTML autocontenido y las tablas de `salidas/datos/`;
5. actualizar `CAMBIOS_VX_Y.md`, `ESTADO.md`, `LEEME.md` y este `DOCUMENTO_MADRE.md`;
6. devolver un ZIP completo reproducible y una copia externa del documento madre actualizado.



## Hotfix 1.6.1 — robustez de outcomes en Jupyter

La versión 1.6.1 corrige un fallo de ejecución observado al llegar al bloque de Éxito electoral cuando un kernel de Jupyter conservaba un diccionario `frames` generado antes de que existieran `puentes_cargos` y `antecedentes_cargos_electos`. El bloque ahora comprueba explícitamente las siete tablas de outcomes y, si alguna falta, las reconstruye desde `eventos`, `electas` y `formulas` del propio dataset activo mediante `build_outcomes`, actualiza `frames`, `data` y los CSV derivados, y solo después continúa con las validaciones. Esto evita el `KeyError: 'puentes_cargos'` sin modificar ninguna de las siete bases Excel. Aun así, la práctica recomendada sigue siendo **Restart Kernel and Run All Cells** al abrir una versión nueva del paquete.


## 9. Revisión 1.7 — claridad de outcomes y lectura profesional

La versión 1.7 responde a una revisión visual y sustantiva del módulo de éxito electoral. El principio rector es que **una candidatura no electa no define el resultado final de una persona**. A partir de esta versión se distinguen explícitamente tres niveles:

1. **candidatura-evento:** una postulación concreta en un año, cargo, partido y provincia;
2. **persona nominal:** el conjunto de candidaturas asociadas al mismo identificador nominal;
3. **carrera observada:** la secuencia completa 1953–2026, incluyendo derrotas anteriores o posteriores a una elección exitosa.

### 9.1 Corrección temporal importante

La lógica de antecedentes ya no depende del orden de filas dentro de un mismo año. Si una persona tiene dos postulaciones simultáneas en una elección —por ejemplo, diputación y vicepresidencia— ambas pertenecen al mismo **primer año documentado** y ninguna se trata como antecedente temporal de la otra. Los campos `electa_antes` y `electa_despues` se calculan solo con años electorales estrictamente anteriores o posteriores.

`resultados_candidaturas.csv` añade o consolida:

- `numero_eleccion_documentada`;
- `primer_anio_documentado`;
- `electa_antes`;
- `electa_despues`;
- `resultado_contextual`.

`resultado_contextual` permite distinguir una candidatura no electa de una persona que después sí resultó electa, una candidatura no electa de alguien que ya había sido electo antes, y una persona que nunca registra un outcome electo dentro del corpus.

### 9.2 Éxito electoral

La pestaña **Éxito electoral** presenta primero indicadores directos y auditables: candidaturas analizadas, candidaturas electas, candidaturas no electas, personas candidatas, personas que resultaron electas al menos una vez y personas que no resultaron electas dentro de la selección. Se eliminó `Sexo sin dato` como KPI principal; los faltantes continúan disponibles en tablas y no se redistribuyen.

Se añadieron visualizaciones de:

- electa/no electa dentro de cada cargo, con columnas que suman 100%;
- tasa de elección por sexo con numerador y denominador;
- contexto de las candidaturas no electas: elección posterior, elección previa o nunca electa en el corpus;
- ruta de personas hasta su primera elección exitosa;
- flujos consecutivos con grosor por **personas únicas**, no por número visual de pares;
- matriz de personas que pasan de un cargo disputado a otro;
- puentes de carrera con años y outcome explícitos en origen y destino;
- resultado final observado en el cargo posterior, de modo que una derrota intermedia no oculte una victoria posterior.

### 9.3 Antecedentes de Presidencia, vicepresidencias y diputaciones electas

Para cada cargo electo se muestran porcentajes directos como:

- ya tenía una elección previa;
- tenía una diputación electa previa;
- había sido candidata a Presidencia previamente;
- no tenía candidaturas anteriores en estas bases.

Las tres categorías generales de antecedente son mutuamente excluyentes y su gráfico suma 100%. El selector se llama **Ver nombres de esta categoría** y actualiza el detalle visible, incluyendo el porcentaje de la categoría y las personas que forman el numerador.

### 9.4 Explorador de personas

Se corrigió la navegación desde otras pestañas: al abrir un nombre, la página calcula automáticamente qué bloque de 100 contiene esa persona en lugar de conservar una página anterior y mostrar otro perfil. La ficha individual muestra:

- resultado final de la carrera observada;
- ruta hasta la primera elección exitosa;
- candidaturas y elecciones distintas;
- cronología completa;
- outcome de cada candidatura;
- contexto de cada derrota (`electa_antes` / `electa_despues`).

### 9.5 Sexo y representación

La pestaña se reestructuró para separar **composición** de **tasa de elección**. El usuario puede explorar diputaciones propietarias, suplencias, diputaciones electas, Presidencia y ambas vicepresidencias.

- La composición por sexo suma 100% entre Mujer y Hombre cuando existe dato.
- Los registros `Sin dato` se mantienen en las tablas pero no se convierten en un KPI central.
- Para poblaciones con outcome comparable, se muestra `Electa / No electa` dentro de cada sexo, de modo que cada columna suma 100%.
- Si una categoría no existe en una elección de detalle —por ejemplo, una elección sin registros de suplencias— la interfaz indica **no hay registros** en lugar de dibujar un cero que pueda confundirse con un dato observado.
- Las suplencias se tratan como composición documental; no se calcula una tasa de éxito individual cuando la base no codifica ese outcome de manera comparable.

### 9.6 Fórmulas presidenciales

La pestaña ahora separa con claridad candidatura y resultado electo para Presidencia, Primera Vicepresidencia y Segunda Vicepresidencia. Incluye candidaturas totales, resultados electos, composición por sexo, tasa de elección por sexo, listado de personas electas y tabla completa descargable.

### 9.7 Reglas de revisión visual para futuras versiones

Al entregar una nueva versión, el asistente debe enumerar en el mismo chat **cada cambio realizado y exactamente dónde revisarlo**. Juan Ignacio utilizará esa lista como checklist de aceptación. No debe declararse una versión “final” solo porque el notebook termine: deben revisarse denominadores, etiquetas, selectores, nombres, outcomes, descargas y comportamiento visual.

### 9.8 Contrato de entrega actualizado

Cada iteración debe devolver:

1. ZIP completo reproducible;
2. `DOCUMENTO_MADRE.md` actualizado y una copia externa con número de versión;
3. `CAMBIOS_VX_Y.md`;
4. notebook ejecutado desde cero cuando el entorno lo permita;
5. HTML autocontenido;
6. CSV derivados y registro de integridad;
7. una lista en el chat de todo lo modificado y la pestaña donde debe revisarse.


## 10. Hotfix 1.7.1 — coherencia de rotulación de versión

La entrega 1.7 contenía una inconsistencia exclusivamente documental: la primera celda Markdown del notebook todavía mostraba **Versión 1.6.1**, el apartado final decía **Alcance de la versión 1.6** y el pie lateral de la plantilla HTML mostraba **Versión 1.6**. El código analítico nuevo de V1.7 sí estaba incorporado, pero la rotulación podía hacer pensar que se había abierto un paquete anterior.

V1.7.1 corrige esas referencias visibles y los metadatos activos a **1.7.1**, actualiza el verificador, `LEEME.md`, `ESTADO.md` y la instrucción breve de continuidad. No modifica ninguna de las siete bases Excel ni cambia los cálculos, outcomes o visualizaciones introducidos en V1.7. El HTML se vuelve a generar desde la plantilla corregida para que la rotulación no dependa de una edición manual del archivo de salida.

## 11. Revisión 1.8 — recurrencia, éxito condicionado y exploración avanzada

La versión 1.8 conserva toda la arquitectura y mejoras anteriores y responde a la revisión visual de V1.7.1. El cambio central es **separar universos analíticos** para que los fenómenos minoritarios no queden visualmente comprimidos por la gran mayoría de personas que nunca resultaron electas.

### 11.1 Dos lecturas de la ruta a la primera elección

Se mantiene la gráfica completa de carreras, incluida la categoría `Nunca resultó electa en el corpus`, porque ese 92% aproximado es sustantivamente importante. Inmediatamente después se agrega una segunda gráfica cuyo denominador son **solo las personas que alguna vez resultaron electas**. Esta segunda lectura muestra qué porcentaje ganó en su primer año electoral documentado y qué porcentaje necesitó uno, dos, tres o más años electorales previos sin éxito.

### 11.2 Trayectoria después de la primera victoria

Para cada persona alguna vez electa se cuentan los **años electorales distintos con al menos un outcome electo**. La nueva gráfica muestra cuántas no volvieron a resultar electas y cuántas registran uno, dos, tres o más éxitos electorales adicionales. Esto puede involucrar cargos diferentes y por ello no debe denominarse automáticamente “reelección al mismo cargo”.

### 11.3 Recurrencia de candidaturas

Éxito electoral incorpora indicadores de personas con una sola elección documentada frente a personas que vuelven a competir en otro año electoral. Entre las recurrentes se separan quienes alguna vez resultaron electas y quienes nunca lo hicieron. Una gráfica adicional muestra, **solo entre recurrentes**, cuántos años electorales distintos disputaron, evitando que la enorme categoría de una sola participación comprima visualmente el fenómeno.

### 11.4 Flujos auditables completos

La selección de un Sankey informa ahora cuántas personas distintas y cuántos pares de candidaturas sustentan el flujo. Las tarjetas se paginan cuando es necesario, de modo que no exista un corte silencioso de 60 u 80 nombres. Cada tarjeta usa verde para outcomes electos y ámbar para no electos, y la tabla inferior conserva todos los registros.

### 11.5 Antecedentes: persona vs. resultado electo

La vista permite elegir entre dos unidades: **Personas distintas · primera elección en el cargo** y **Resultados electos**. Esto evita llamar “personas” a un conteo de resultados donde una misma identidad puede aparecer varias veces. Las tarjetas de antecedentes adoptan el estilo visual de los puentes de carrera y muestran la trayectoria documentada hasta el resultado que se está explicando.

### 11.6 Explorador de personas

Se elimina la paginación rígida de 100 nombres. La búsqueda puede combinar texto libre con año, partido, cargo, resultado y provincia, además de la población (`Más de una candidatura`, `Alguna vez electa`, etc.). El texto libre también busca sobre partido, cargo, provincia, año y resultado, no únicamente sobre el nombre. Cuando existen demasiadas coincidencias, el selector muestra una muestra amplia y solicita refinar filtros, sin alterar el universo real.

### 11.7 Panorama histórico

Panorama incorpora una lectura nacional de **renovación vs. recurrencia** por elección: personas en su primera aparición documentada frente a personas que ya habían competido en un año anterior. También presenta la proporción de recurrentes por elección y KPIs agregados de personas distintas, recurrencia, elección observada y candidaturas.

### 11.8 Regla de continuidad de la entrega

Toda versión posterior debe seguir entregándose como: ZIP completo reproducible + Documento Madre + registro de cambios + guía de revisión. La respuesta de entrega debe enumerar, punto por punto, qué cambió y en qué pestaña debe revisarse.



## 12. Revisión 1.9 — afinamiento final, representación territorial y centro de datos

La versión 2.0 se plantea como la revisión de afinamiento final previa a una eventual publicación/repositorio, sin alterar las siete bases Excel fuente. Mantiene la arquitectura de V1.8 y concentra los cambios en claridad cuantitativa, representación territorial, descargas y presentación del producto.

### 12.1 Regla visible de `N`

Cuando una gráfica porcentual dispone de un conteo subyacente, V2.0 preserva o genera la etiqueta de `N` en lugar de mostrar únicamente el porcentaje. El cambio central fue corregir el componente común `plot()`, que en versiones previas podía sobreescribir textos personalizados como `75,5% · N=...`. Las tablas y CSV continúan siendo la fuente auditable del numerador y denominador.

### 12.2 Representación territorial respecto al padrón

La tabla `representacion_territorial` incorpora y conserva:

- `peso_escanos_pct`: escaños de la provincia / total nacional de escaños;
- `peso_padron_pct`: padrón provincial / padrón nacional;
- `brecha_representacion_pp`: peso en escaños menos peso en padrón;
- `indice_representacion`: peso en escaños / peso en padrón;
- `electores_por_escano`;
- `brecha_abs_pp`;
- `balance_padron`;
- `cambio_escanos`;
- `cambio_asignacion`.

La lectura es descriptiva. Una brecha positiva significa **mayor peso en escaños que en el padrón** y una negativa **menor peso**. No debe presentarse como una conclusión jurídica sobre sobre/subrepresentación respecto de habitantes, porque el paquete no contiene una serie provincial de población compatible para 1953–2026.

### 12.3 Cambios de asignación provincial

Se recuperan las franjas verticales que habían desaparecido de la vista final de `Votos y escaños`. Las franjas marcan únicamente elecciones en las que por lo menos una provincia cambió su número de escaños respecto del proceso anterior disponible. La aplicación añade una tabla con año, provincia, magnitud y cambio, además de periodos de estabilidad por provincia.

### 12.4 Visualizaciones nuevas de representación

La pestaña `Votos y escaños` añade:

1. barra divergente de brecha escaños–padrón para la elección de detalle;
2. dispersión peso del padrón vs. peso de escaños con diagonal `x = y`;
3. matriz histórica provincia × elección de la brecha;
4. colores semánticos: verde = mayor peso en escaños; rojo = menor peso; gris = igualdad exacta;
5. tabla auditable con todas las variables del indicador.

### 12.5 Explorador de datos como centro de descarga

El Explorador de datos deja de mostrar únicamente nombres técnicos. Cada tabla tiene título comprensible, tema y descripción. Se ofrecen paquetes temáticos (resultados y representación, personas y outcomes, carreras, partidos, gobiernos, papeletas) y una selección personalizada de varias tablas. La selección puede descargarse como varios CSV o como un JSON único.

Las descargas derivadas no sustituyen los siete Excel fuente; son productos analíticos generados por el notebook.

### 12.6 Rotulación de producto final

Se elimina la expresión `Anexo de investigación` de la portada, sidebar y metodología. La versión se identifica como **Producto interactivo final de consulta y exploración electoral** desarrollado durante la Práctica Profesional IFED–TSE. Esto describe su condición de entregable; no implica que haya sido incorporado oficialmente a la infraestructura técnica del Atlas ni que sustituya publicaciones oficiales del TSE.

### 12.7 Antecedente de entrega V1.9

V1.9 consolidó el notebook ejecutado, HTML autocontenido, siete Excel fuente intactos, CSV derivados, documentación, requisitos y checkpoints. V2.0 conserva esa arquitectura y añade únicamente la capa de presentación pública descrita en la sección 13.

## 13. Versión 2.0 — presentación pública y cierre del producto

La versión 2.0 se define como la versión final del producto interactivo. Conserva los análisis, visualizaciones, descargas y controles de V1.9 y añade una nueva pestaña inicial **00 · Presentación**, que funciona como portada explicativa para personas que abren la aplicación sin conocer previamente el proyecto.

La pestaña 00 presenta: el propósito del Atlas interactivo; su cobertura 1953–2026; las 19 elecciones, siete provincias y siete bases integradas; las áreas que pueden explorarse; la metodología de Political Data Science; el flujo de preservación, extracción, limpieza, validación, integración, análisis y visualización; las reglas de interpretación; la autoría de Juan Ignacio Garbanzo Fallas y el contexto institucional IFED–TSE; una guía práctica de navegación; descargas disponibles; y una advertencia de que el producto complementa pero no sustituye las publicaciones oficiales del Tribunal Supremo de Elecciones.

La aplicación abre por defecto en esta pestaña 00. El encabezado general **“Setenta y tres años de historia electoral”** permanece visible como identidad del producto. La navegación numera Presentación como `00` y conserva la secuencia de las demás pestañas.

No se modifican las siete bases Excel fuente ni los cálculos analíticos de V1.9. V2.0 es una revisión de presentación, accesibilidad y orientación del usuario final.

