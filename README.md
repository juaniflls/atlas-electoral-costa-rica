# Atlas electoral interactivo de Costa Rica

<div align="center">
  <img src="assets/branding/logo-atlas-electoral-costa-rica.png" alt="Logo Atlas electoral de Costa Rica" width="260">
  <br><br>
  <img src="assets/branding/social-preview-atlas-electoral-costa-rica.png" alt="Portada del Atlas electoral interactivo de Costa Rica" width="920">
</div>

<div align="center">

**Producto interactivo de consulta y análisis electoral · 1953–2026**  
**Autor:** Juan Ignacio Garbanzo Fallas · **Perfil:** Politólogo  
**Marco institucional:** Práctica Profesional · Instituto de Formación y Estudios en Democracia (IFED) · Tribunal Supremo de Elecciones de Costa Rica (TSE)

[Ver HTML final](salidas/Atlas_Electoral_Costa_Rica_1953_2026.html) · [Abrir notebook](Atlas_Electoral_Costa_Rica_1953_2026.ipynb) · [Documento madre](DOCUMENTO_MADRE_ATLAS_ELECTORAL_V2_0.md)

</div>

---

## ¿Qué es este proyecto?

Este repositorio reúne un **producto interactivo final**, un **notebook reproducible** y un conjunto de **bases históricas integradas** para explorar la transformación político-electoral de Costa Rica entre **1953 y 2026**.

La aplicación permite consultar, comparar y descargar información sobre:

- resultados presidenciales y legislativos;
- votos, participación y escaños;
- partidos, candidaturas y papeletas;
- diputaciones electas y fórmulas presidenciales;
- trayectorias individuales, recurrencia y éxito electoral;
- territorio, representación y mapas provinciales;
- datos derivados en CSV, PNG y SVG.

---

## Vista rápida

| Indicador | Alcance |
|---|---:|
| Serie histórica | **73 años** |
| Elecciones integradas | **19** |
| Provincias comparables | **7** |
| Bases históricas conectadas | **7** |
| Modalidad del producto | **HTML autocontenido + notebook reproducible** |

---

## Principales módulos de la aplicación

- **00 · Presentación**: qué es la aplicación, cómo se construyó y cómo usarla.
- **01–09 · Panorama temático**: participación, competencia, presidencia/diputaciones, votos y escaños, partidos, candidaturas, sexo y representación.
- **10–19 · Personas y trayectorias**: personas, exploradores, fórmulas presidenciales, apellidos, diseño de papeletas, perfiles de partidos, mapas, éxito electoral y laboratorio.
- **20–21 · Descargas y metodología**: centro de datos, definiciones, fuentes, límites y criterios analíticos.

---

## Galería de capturas

La galería incluye **todas las capturas suministradas de la aplicación** para documentar visualmente sus distintos módulos, vistas, exploradores y componentes.

<table>
  <tr>
    <td><img src="assets/screenshots/01-captura-aplicacion.png" alt="Captura 1 de la aplicación" width="100%"></td>
    <td><img src="assets/screenshots/02-captura-aplicacion.png" alt="Captura 2 de la aplicación" width="100%"></td>
  </tr>
  <tr>
    <td><img src="assets/screenshots/03-captura-aplicacion.png" alt="Captura 3 de la aplicación" width="100%"></td>
    <td><img src="assets/screenshots/04-captura-aplicacion.png" alt="Captura 4 de la aplicación" width="100%"></td>
  </tr>
  <tr>
    <td><img src="assets/screenshots/05-captura-aplicacion.png" alt="Captura 5 de la aplicación" width="100%"></td>
    <td><img src="assets/screenshots/06-captura-aplicacion.png" alt="Captura 6 de la aplicación" width="100%"></td>
  </tr>
  <tr>
    <td><img src="assets/screenshots/07-captura-aplicacion.png" alt="Captura 7 de la aplicación" width="100%"></td>
    <td><img src="assets/screenshots/08-captura-aplicacion.png" alt="Captura 8 de la aplicación" width="100%"></td>
  </tr>
  <tr>
    <td><img src="assets/screenshots/09-captura-aplicacion.png" alt="Captura 9 de la aplicación" width="100%"></td>
    <td><img src="assets/screenshots/10-captura-aplicacion.png" alt="Captura 10 de la aplicación" width="100%"></td>
  </tr>
  <tr>
    <td><img src="assets/screenshots/11-captura-aplicacion.png" alt="Captura 11 de la aplicación" width="100%"></td>
    <td><img src="assets/screenshots/12-captura-aplicacion.png" alt="Captura 12 de la aplicación" width="100%"></td>
  </tr>
  <tr>
    <td><img src="assets/screenshots/13-captura-aplicacion.png" alt="Captura 13 de la aplicación" width="100%"></td>
    <td><img src="assets/screenshots/14-captura-aplicacion.png" alt="Captura 14 de la aplicación" width="100%"></td>
  </tr>
  <tr>
    <td><img src="assets/screenshots/15-captura-aplicacion.png" alt="Captura 15 de la aplicación" width="100%"></td>
    <td><img src="assets/screenshots/16-captura-aplicacion.png" alt="Captura 16 de la aplicación" width="100%"></td>
  </tr>
  <tr>
    <td><img src="assets/screenshots/17-captura-aplicacion.png" alt="Captura 17 de la aplicación" width="100%"></td>
    <td><img src="assets/screenshots/18-captura-aplicacion.png" alt="Captura 18 de la aplicación" width="100%"></td>
  </tr>
  <tr>
    <td><img src="assets/screenshots/19-captura-aplicacion.png" alt="Captura 19 de la aplicación" width="100%"></td>
    <td><img src="assets/screenshots/20-captura-aplicacion.png" alt="Captura 20 de la aplicación" width="100%"></td>
  </tr>
  <tr>
    <td><img src="assets/screenshots/21-captura-aplicacion.png" alt="Captura 21 de la aplicación" width="100%"></td>
    <td><img src="assets/screenshots/22-captura-aplicacion.png" alt="Captura 22 de la aplicación" width="100%"></td>
  </tr>
  <tr>
    <td colspan="2"><img src="assets/screenshots/23-captura-aplicacion.png" alt="Captura 23 de la aplicación" width="100%"></td>
  </tr>
</table>

---

## Estructura del repositorio

```text
atlas-electoral-costa-rica/
├── Atlas_Electoral_Costa_Rica_1953_2026.ipynb
├── requirements.txt
├── Base_*.xlsx
├── recursos/
│   ├── atlas_pipeline.py
│   ├── atlas_enhancements.py
│   ├── atlas_geography.py
│   ├── atlas_outcomes.py
│   ├── atlas_template.html
│   ├── atlas_final.js
│   ├── atlas_visual_extensions.js
│   ├── costaricaprovincias.geojson
│   └── otros recursos auxiliares
├── salidas/
│   ├── Atlas_Electoral_Costa_Rica_1953_2026.html
│   └── datos/
│       ├── *.csv
│       ├── *.json
│       └── tablas derivadas para descarga
├── assets/
│   ├── branding/
│   └── screenshots/
├── docs/
│   ├── COMO_PUBLICAR_EN_GITHUB.md
│   ├── CONFIGURACION_SUGERIDA_GITHUB.md
│   └── RESUMEN_DEL_REPOSITORIO.md
├── DOCUMENTO_MADRE_ATLAS_ELECTORAL_V2_0.md
├── CAMBIOS_V2_0.md
├── LICENSE
├── NOTICE.md
└── README.md
```

---

## Cómo usarlo

### Opción 1 · Usar el producto final

1. Descargue o clone el repositorio.
2. Abra `salidas/Atlas_Electoral_Costa_Rica_1953_2026.html` en su navegador.
3. Navegue por las pestañas temáticas.
4. Use los filtros superiores para acotar período, territorio y elección.
5. Descargue gráficos en **PNG**, **SVG** o tablas en **CSV**.

### Opción 2 · Reproducir el producto desde el notebook

1. Instale dependencias:

```bash
python -m pip install -r requirements.txt
```

2. Abra `Atlas_Electoral_Costa_Rica_1953_2026.ipynb`.
3. Ejecute las celdas en orden (**Restart Kernel and Run All**).
4. El proceso vuelve a generar el HTML final y los archivos derivados de `salidas/datos/`.

---

## Bases integradas

El repositorio incorpora siete bases principales:

1. `Base_Electoral_Diputaciones_1953-2026.xlsx`
2. `Base_Electoral_Presidencial_1953-2026.xlsx`
3. `Base_Final_Candidaturas_Diputaciones_1953-2026.xlsx`
4. `Base_Final_Candidaturas_Presidenciales_1953-2026.xlsx`
5. `Base_Final_Diputaciones_Electas_1953-2026.xlsx`
6. `Base_Final_Diseno_Papeletas_Diputaciones_1953-2026.xlsx`
7. `Base_partidos_cancelados.xlsx`

---

## Metodología de trabajo

La construcción sigue un pipeline reproducible de ciencia de datos aplicada a historia electoral:

1. inventario y preservación de fuentes;
2. extracción y normalización;
3. validación con fuentes oficiales;
4. integración de bases;
5. análisis exploratorio y construcción de indicadores;
6. visualización y diseño del HTML;
7. exportación de datos descargables.

Para el detalle ampliado, consulte:

- [DOCUMENTO_MADRE_ATLAS_ELECTORAL_V2_0.md](DOCUMENTO_MADRE_ATLAS_ELECTORAL_V2_0.md)
- [LEEME.md](LEEME.md)
- [recursos/manifest_fuentes.json](recursos/manifest_fuentes.json)

---

## Tecnologías utilizadas

- **Python**
- **Jupyter Notebook**
- **pandas**
- **Plotly**
- **HTML / CSS / JavaScript**
- **GeoJSON**

---

## Criterios de interpretación

- Una **coincidencia nominal o de apellidos no prueba parentesco**.
- Los resultados se presentan con **fines descriptivos y analíticos**, no como pruebas causales.
- Los datos faltantes se conservan como faltantes; **no se imputan automáticamente**.
- El producto **no sustituye** las publicaciones oficiales del Tribunal Supremo de Elecciones.

---

## Identidad visual del repositorio

Se incorporan dos piezas originales para uso del repositorio:

- **Logo:** `assets/branding/logo-atlas-electoral-costa-rica.png`
- **Social preview / portada:** `assets/branding/social-preview-atlas-electoral-costa-rica.png`

Ambas están listas para README, About y social preview del repositorio.

---

## Publicación en GitHub

Este paquete ya viene preparado para GitHub:

- `README.md` listo;
- `LICENSE` incluida;
- `.gitignore` incluido;
- `.gitattributes` ajustado para que GitHub no privilegie el HTML exportado en la detección del lenguaje;
- recursos visuales y capturas listos para presentación.

Guía rápida: [docs/COMO_PUBLICAR_EN_GITHUB.md](docs/COMO_PUBLICAR_EN_GITHUB.md)

---

## Autor

**Juan Ignacio Garbanzo Fallas**  
Politólogo  
[Perfil de LinkedIn](https://www.linkedin.com/in/juan-ignacio-garbanzo-fallas-34ba65219)

---

## Licencia

Este repositorio se distribuye bajo licencia [MIT](LICENSE), **salvo** los materiales de terceros y las fuentes institucionales que puedan tener condiciones propias. Véase [NOTICE.md](NOTICE.md).
