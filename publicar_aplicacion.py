'Publica la aplicación y prepara el paquete de fuentes originales.'
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from tempfile import NamedTemporaryFile
import json,re,os,hashlib
ROOT=Path(__file__).resolve().parent
HTML=ROOT/'salidas/Atlas_Electoral_Costa_Rica_1953_2026.html'
JS=ROOT/'recursos/atlas_interfaz.js'
CSS=ROOT/'recursos/atlas_interfaz.css'
DATA=ROOT/'salidas/datos/territorio_integrado.json'
GEO=ROOT/'recursos/costaricaprovincias.geojson'
for path in (HTML,JS,CSS,DATA,GEO):
 if not path.exists():raise FileNotFoundError('Recurso V27 necesario: '+str(path))
s=HTML.read_text(encoding='utf-8')
# Retira únicamente versiones anteriores de la extensión; los módulos históricos permanecen intactos.
s=re.sub(r'<script id="atlas-v(?:25|26|27)-js">[\s\S]*?</script>','',s)
s=re.sub(r'<style id="atlas-v(?:26|27)-css">[\s\S]*?</style>','',s)
if '</body>' not in s or '</head>' not in s:raise ValueError('HTML sin documento completo')
s=s.replace('</body>','<script id="atlas-v27-js">\n'+JS.read_text(encoding='utf-8')+'\n</script></body>',1)
s=s.replace('</head>','<style id="atlas-v27-css">\n'+CSS.read_text(encoding='utf-8')+'\n</style></head>',1)
match=re.search(r'(<script type="application/json" id="atlas-v24-data">)([\s\S]*?)(</script>)',s)
if not match:raise ValueError('No se encontró la capa de datos territoriales del Atlas')
v=json.loads(DATA.read_text(encoding='utf-8'));v['version']='27.0';v['province_geojson']=json.loads(GEO.read_text(encoding='utf-8'));v['geo_name_key']='properties.NAME_1'
blob=json.dumps(v,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
s=s[:match.start()]+match.group(1)+blob+match.group(3)+s[match.end():]
s=s.replace('Versión pública 26.0','Atlas Electoral 2026').replace('7</strong><span>bases históricas conectadas','8</strong><span>bases históricas conectadas')
if s.count('id="atlas-v27-js"')!=1 or s.count('id="atlas-v27-css"')!=1 or s.count('id="atlas-v24-data"')!=1:raise AssertionError('Publicación duplicada')
with NamedTemporaryFile(mode='w',encoding='utf-8',delete=False,dir=HTML.parent,suffix='.tmp') as f:
 f.write(s);temp=Path(f.name)
os.replace(temp,HTML)
# Fuentes descargables junto al HTML: se mantienen también individualmente en la raíz del proyecto.
SOURCE_ARCHIVE=HTML.parent/'Atlas_Bases_Electorales_Originales.zip'
with ZipFile(SOURCE_ARCHIVE,'w',ZIP_DEFLATED,compresslevel=6) as z:
 for name in sorted(ROOT.glob('*.xlsx')):
  z.write(name,arcname=name.name)
metadata={'version':'27.0','fuentes':8,'elecciones':len(v['years']),'observaciones_metricas':len(v['metrics']),'filas_votos':len(v['votes']),'archivo_html':HTML.name,'bases_descargables':SOURCE_ARCHIVE.name,'sha256_js':hashlib.sha256(JS.read_bytes()).hexdigest()}
(ROOT/'salidas/datos/control_publicacion.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2),encoding='utf-8')
print('Atlas publicado:',HTML.name,'· fuentes:',SOURCE_ARCHIVE.name)
