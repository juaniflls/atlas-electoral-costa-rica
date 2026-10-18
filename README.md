# Atlas Electoral de Costa Rica · 1953–2026

<div align="center">
<img alt="Identidad visual del Atlas Electoral" src="assets/branding/logo-atlas-electoral-costa-rica.png" width="220">

**Ciencia de datos aplicada a elecciones, partidos, representación y trayectorias políticas**  
**Versión pública V22.0 · 19 elecciones nacionales · siete provincias · siete fuentes de base**

[**Abrir aplicación HTML autónoma**](salidas/Atlas_Electoral_Costa_Rica_1953_2026.html) · [**Notebook reproducible**](Atlas_Electoral_V22_PUBLICO.ipynb) · [**Glosario y fuentes**](#metodología-y-cautelas)
</div>

> **Autoría:** Juan Ignacio Garbanzo Fallas, politólogo (Universidad de Costa Rica), con estudios en Economía y formación complementaria en ciencia de datos. Proyecto elaborado en el marco de su Práctica Profesional en IFED–TSE. **La publicación del repositorio no implica aval editorial ni incorporación automática al Atlas Electoral institucional.**

## Qué permite investigar

La aplicación integra resultados **presidenciales y legislativos**, votos, padrones, participación/abstencionismo, fragmentación de la competencia, cuotas de representación, diputaciones electas, candidaturas legislativas y fórmulas presidenciales, nombres de partidos, cancelaciones y características de papeletas. Permite comparar las siete provincias y la serie nacional entre 1953 y 2026, con descargas de figuras PNG/SVG, tablas CSV y selección de años y partidos.

Los datos originales se conservan separados y las tablas derivadas quedan reproducibles en `salidas/datos/`. La aplicación utiliza nombres normalizados y mantiene limitaciones de procedencia, cobertura y equivalencia jurídica de las organizaciones.

## Novedades principales de V22.0

| Módulo | Función pública |
|---|---|
| **Fórmulas presidenciales** | Recorrido elección por elección de candidaturas a Presidencia, Primera y Segunda Vicepresidencia; resultado documentado, consulta nominal y cronología de presidencias electas. |
| **Presidencia y Asamblea** | Hemiciclo histórico complementario de 45/57 escaños, por partidos, selección de bancada, etiquetas nominales y reproducción temporal. Permanecen las barras y el desglose por provincia. |
| **Explorador de datos** | Diccionario de columnas de la tabla elegida, tipos, cautelas y verificación de faltantes; se conservan descargas de tablas y filtros. |
| **Laboratorio** | Ficha descriptiva de cobertura, observaciones completas y Pearson sobre la selección; advertencia contra interpretaciones causales. |
| **Metodología y fuentes** | Glosario operativo de NEP, votos válidos, fragmentación, distancia agregada del voto, representación, doble postulación y continuidad nominal. |

La actualización es de **interfaz, navegación y explicación**: no se sustituyen las figuras históricas aprobadas ni sus fórmulas mediante gráficos nuevos. Véase [`docs/CHANGELOG_V22.md`](docs/CHANGELOG_V22.md).

## Uso local

1. Descargue o clone la carpeta completa **sin separar notebook, siete bases Excel y `recursos/`**.
2. Cree un entorno Python 3.10+ y ejecute `pip install -r requirements.txt`.
3. Abra `Atlas_Electoral_V22_PUBLICO.ipynb` dentro de la carpeta del repositorio.
4. En Jupyter: **Reiniciar kernel y ejecutar todas las celdas**. La salida oficial queda en `salidas/Atlas_Electoral_Costa_Rica_1953_2026.html` y `salidas/datos/`.
5. Abra el HTML generado en un navegador moderno. Incluye la biblioteca gráfica y la base integrada, por lo que funciona sin conexión.

**Advertencia:** el notebook usa archivos de `recursos/` al ejecutar cada compilación; mover únicamente el `.ipynb` causa errores de dependencia. No reemplace por un notebook de otra versión sin conciliar sus recursos.

## Estructura mantenible

```text
atlas-electoral-costa-rica/
├── Atlas_Electoral_V22_PUBLICO.ipynb       # notebook principal
├── Base_*.xlsx                             # siete fuentes originales
├── recursos/
│   ├── atlas_pipeline.py                  # integración reproducible
│   ├── atlas_template.html                # plantilla autónoma
│   ├── atlas_final.js / atlas_v14.js       # módulos existentes
│   ├── atlas_v22_public.js                 # exploradores y hemiciclo nuevos
│   ├── atlas_v22_public.css                # interfaz y accesibilidad
│   └── ...                                # geografía, colores y controles
├── salidas/
│   ├── Atlas_Electoral_Costa_Rica_1953_2026.html
│   └── datos/                              # CSV y JSON analíticos
├── assets/branding/ y assets/screenshots/
├── docs/                                   # bitácora y procedencia
├── LICENSE / NOTICE.md / CITATION.cff
└── README.md
```

## Metodología y cautelas

- **Fragmentación:** el número efectivo de partidos se calcula a partir de proporciones de votos o escaños, según el indicador. No equivale al número de partidos registrados.
- **Quiebre del voto:** la distancia agregada de distribuciones presidenciales y legislativas por partido **no identifica el comportamiento individual de cada elector**.
- **Doble postulación:** presencia documentada de la misma identidad nominal en candidatura presidencial y legislativa para una elección. Las coincidencias nominales deben auditarse.
- **Sexo y resultados:** las proporciones son del universo explícito de candidaturas o electas de cada gráfico; los valores faltantes no se convierten en cero.
- **Territorialidad:** las provincias son el nivel de resultados de estas tablas; no se infieren bastiones cantonales o distritales sin los microdatos correspondientes.
- **Continuidad:** igual denominación partidaria o apellido no prueba continuidad jurídica, parentesco ni trayectoria biográfica por sí mismo.
- **Escaños:** magnitud de 45 en las elecciones de 1953 y 1958; 57 desde 1962. Se presenta la **Asamblea inicial electa**, no los cambios de bancada posteriores.
- **Periodizaciones:** predominio territorial del PLN, competencia bipartidista, pluralización multipartidista y el comportamiento de 2026 son **categorías analíticas exploratorias**; no se afirma un ciclo determinista.

**Fuentes jerarquizadas:** resultados, declaratorias, papeletas y normativa del TSE; materiales del IFED/Atlas Electoral; literatura académica. Consulte `recursos/manifest_fuentes.json` (generado por el pipeline) y el inventario de los siete archivos en [`docs/MANIFIESTO_BASES_V22.json`](docs/MANIFIESTO_BASES_V22.json).

## Capturas de la versión pública V22

Las **25 capturas** proporcionadas por el autor el **17 y 18 de octubre de 2026** sustituyen las 20 imágenes de referencia de V21. Son capturas originales de pantalla, preservadas en PNG sin alteraciones, y muestran secciones, gráficos, exploradores y mapas de la aplicación. Se presentan según el orden cronológico en que fueron tomadas; las dos capturas finales corresponden a vistas posteriores del hemiciclo y los mapas provinciales. No constituyen por sí mismas una certificación de los resultados electorales.

<table>
<tr><td align="center"><img alt="Captura V22 01" src="assets/screenshots/01-atlas-v22.png" width="460"><br><sub>Vista V22 01 · 2026-10-17 23:33</sub></td><td align="center"><img alt="Captura V22 02" src="assets/screenshots/02-atlas-v22.png" width="460"><br><sub>Vista V22 02 · 2026-10-17 23:34</sub></td></tr>
<tr><td align="center"><img alt="Captura V22 03" src="assets/screenshots/03-atlas-v22.png" width="460"><br><sub>Vista V22 03 · 2026-10-17 23:34</sub></td><td align="center"><img alt="Captura V22 04" src="assets/screenshots/04-atlas-v22.png" width="460"><br><sub>Vista V22 04 · 2026-10-17 23:35</sub></td></tr>
<tr><td align="center"><img alt="Captura V22 05" src="assets/screenshots/05-atlas-v22.png" width="460"><br><sub>Vista V22 05 · 2026-10-17 23:35</sub></td><td align="center"><img alt="Captura V22 06" src="assets/screenshots/06-atlas-v22.png" width="460"><br><sub>Vista V22 06 · 2026-10-17 23:36</sub></td></tr>
<tr><td align="center"><img alt="Captura V22 07" src="assets/screenshots/07-atlas-v22.png" width="460"><br><sub>Vista V22 07 · 2026-10-17 23:36</sub></td><td align="center"><img alt="Captura V22 08" src="assets/screenshots/08-atlas-v22.png" width="460"><br><sub>Vista V22 08 · 2026-10-17 23:37</sub></td></tr>
<tr><td align="center"><img alt="Captura V22 09" src="assets/screenshots/09-atlas-v22.png" width="460"><br><sub>Vista V22 09 · 2026-10-17 23:38</sub></td><td align="center"><img alt="Captura V22 10" src="assets/screenshots/10-atlas-v22.png" width="460"><br><sub>Vista V22 10 · 2026-10-17 23:39</sub></td></tr>
<tr><td align="center"><img alt="Captura V22 11" src="assets/screenshots/11-atlas-v22.png" width="460"><br><sub>Vista V22 11 · 2026-10-17 23:40</sub></td><td align="center"><img alt="Captura V22 12" src="assets/screenshots/12-atlas-v22.png" width="460"><br><sub>Vista V22 12 · 2026-10-17 23:40</sub></td></tr>
<tr><td align="center"><img alt="Captura V22 13" src="assets/screenshots/13-atlas-v22.png" width="460"><br><sub>Vista V22 13 · 2026-10-17 23:42</sub></td><td align="center"><img alt="Captura V22 14" src="assets/screenshots/14-atlas-v22.png" width="460"><br><sub>Vista V22 14 · 2026-10-17 23:43</sub></td></tr>
<tr><td align="center"><img alt="Captura V22 15" src="assets/screenshots/15-atlas-v22.png" width="460"><br><sub>Vista V22 15 · 2026-10-17 23:43</sub></td><td align="center"><img alt="Captura V22 16" src="assets/screenshots/16-atlas-v22.png" width="460"><br><sub>Vista V22 16 · 2026-10-17 23:43</sub></td></tr>
<tr><td align="center"><img alt="Captura V22 17" src="assets/screenshots/17-atlas-v22.png" width="460"><br><sub>Vista V22 17 · 2026-10-17 23:47</sub></td><td align="center"><img alt="Captura V22 18" src="assets/screenshots/18-atlas-v22.png" width="460"><br><sub>Vista V22 18 · 2026-10-17 23:48</sub></td></tr>
<tr><td align="center"><img alt="Captura V22 19" src="assets/screenshots/19-atlas-v22.png" width="460"><br><sub>Vista V22 19 · 2026-10-17 23:48</sub></td><td align="center"><img alt="Captura V22 20" src="assets/screenshots/20-atlas-v22.png" width="460"><br><sub>Vista V22 20 · 2026-10-17 23:57</sub></td></tr>
<tr><td align="center"><img alt="Captura V22 21" src="assets/screenshots/21-atlas-v22.png" width="460"><br><sub>Vista V22 21 · 2026-10-17 23:58</sub></td><td align="center"><img alt="Captura V22 22" src="assets/screenshots/22-atlas-v22.png" width="460"><br><sub>Vista V22 22 · 2026-10-17 23:58</sub></td></tr>
<tr><td align="center"><img alt="Captura V22 23" src="assets/screenshots/23-atlas-v22.png" width="460"><br><sub>Vista V22 23 · 2026-10-17 23:58</sub></td><td align="center"><img alt="Captura V22 24" src="assets/screenshots/24-atlas-v22.png" width="460"><br><sub>Vista V22 24 · 2026-10-18 01:23</sub></td></tr>
<tr><td align="center"><img alt="Captura V22 25" src="assets/screenshots/25-atlas-v22.png" width="460"><br><sub>Vista V22 25 · 2026-10-18 01:28</sub></td></tr>
</table>

[Inventario de las 25 capturas y trazabilidad de archivos](docs/INVENTARIO_CAPTURAS.md)

## Crédito y uso

Autor del proyecto de investigación, integración reproducible y aplicación: **Juan Ignacio Garbanzo Fallas**. Trabajo realizado dentro de la Práctica Profesional de Ciencias Políticas en IFED–TSE, sin atribuir al TSE compromisos de publicación ni autoría institucional que no se hayan confirmado. Los documentos oficiales y divisas siguen perteneciendo a sus titulares.

Consulte [`CITATION.cff`](CITATION.cff) para citar esta versión y [`LICENSE`](LICENSE) / [`NOTICE.md`](NOTICE.md) para las condiciones de uso. Para trabajos académicos, cite adicionalmente las fuentes electorales oficiales y la metodología empleada.
