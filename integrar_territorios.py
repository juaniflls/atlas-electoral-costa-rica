'Integra los datos territoriales y sus recursos visuales en la aplicación.'
from pathlib import Path
import json,re,csv,hashlib,os,tempfile,unicodedata

ROOT=Path(__file__).resolve().parent
HTML=ROOT/'salidas/Atlas_Electoral_Costa_Rica_1953_2026.html'
JS=ROOT/'recursos/atlas_integracion_territorial.js'
CSS=ROOT/'recursos/atlas_integracion_territorial.css'
assert HTML.is_file() and JS.is_file() and CSS.is_file(), 'Falta el HTML V24 o los recursos V25'

def norm(s):
 s=''.join(c for c in unicodedata.normalize('NFD',str(s)) if unicodedata.category(c)!='Mn')
 s=''.join(c for c in s.upper() if c.isalnum())
 return s[7:] if s.startswith('PARTIDO') else s

palette={}
for item in json.loads((ROOT/'recursos/colores_partidos.json').read_text()):
 for label in (item.get('nombre'),item.get('partido')):
  if label and item.get('color'):palette[norm(label)]=item['color']
# Conservar nombres documentados; equivalencias habituales del corpus.
extra={'LIBERACIONNACIONAL':'#079648','UNIDADSOCIALCRISTIANA':'#0074B8','ACCIONCIUDADANA':'#F3BB25','FRENTEAMPLIO':'#E4B626','AGENDACIUDADANA':'#DB4C35'}
for label,col in extra.items():palette.setdefault(label,col)
# Paleta auxiliar estable para partidos sin referencia cromática documental.
# Un color por denominación normalizada, independiente de vista y elección.
import colorsys
territorial_file=ROOT/'salidas/datos/territorio_base.json'
territorial=json.loads(territorial_file.read_text(encoding='utf-8'))
all_party_names=sorted({str(r[4]) for r in territorial['votes']},key=norm)
unknown_keys=sorted({norm(x) for x in all_party_names if norm(x) not in palette})
for i,k in enumerate(unknown_keys):
 hue=((i*0.618033988749895)+0.113)%1
 light=.39+(i%4)*.038
 sat=.55+(i%3)*.035
 rgb=colorsys.hls_to_rgb(hue,light,sat)
 palette[k]='#'+''.join(f'{round(255*x):02X}' for x in rgb)

nom=[]
for ar,filename in [('P','formulas.csv'),('L','candidaturas.csv')]:
 with (ROOT/'salidas/datos'/filename).open(encoding='utf-8-sig',newline='') as f:
  for r in csv.DictReader(f):
   if not r.get('nombre'):continue
   nom.append({'year':int(r['anio']),'arena':ar,'province':r.get('provincia') or 'Nacional',
      'party':r.get('partido',''),'name':r['nombre'],'office':r.get('cargo') if ar=='P' else 'Diputación '+r.get('tipo',''),
      'elected':str(r.get('electa','')).strip().lower() in ('true','1','si','sí')})

html=HTML.read_text(encoding='utf-8')

if 'id="atlas-v25-js"' in html:
 html=re.sub(r'<script id="atlas-v25-js">.*?</script>', '<script id="atlas-v24-js">/* módulo reemplazado para reconstrucción */</script>',html,flags=re.S)
if 'id="atlas-v25-css"' in html:
 html=html.replace('id="atlas-v25-css"','id="atlas-v24-css"')

start_tag='<script type="application/json" id="atlas-v24-data">'
pos=html.find(start_tag)
assert pos>=0, 'No hay datos territoriales V24 embebidos'
start=pos+len(start_tag)
end=html.find('</script>',start)
assert end>start
v24=json.loads(html[start:end]);v24['version']='25.0';v24['party_colors']=palette;v24['nomination_rows']=nom
blob=json.dumps(v24,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
(ROOT/'salidas/datos/territorio_integrado.json').write_text(json.dumps(v24,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
html=html[:start]+blob+html[end:]
old_js=re.search(r'<script id="atlas-v24-js">.*?</script>',html,flags=re.S)
assert old_js, 'No se encontró el módulo anterior para sustituir sin duplicar'
new_js='<script id="atlas-v25-js">\n'+JS.read_text(encoding='utf-8')+'\n</script>'
html=html[:old_js.start()]+new_js+html[old_js.end():]
old_css=re.search(r'<style id="atlas-v24-css">.*?</style>',html,flags=re.S)
assert old_css
new_css='<style id="atlas-v25-css">\n'+CSS.read_text(encoding='utf-8')+'\n</style>'
html=html[:old_css.start()]+new_css+html[old_css.end():]
# Un mecanismo de actualización explícito, sin ejecutar scripts ni listeners adicionales.
anchor='else comparisonDraw();}'
if html.count(anchor)==1:
 html=html.replace(anchor,"else comparisonDraw();root.dispatchEvent(new CustomEvent('atlas-results-updated',{detail:{year:state.year,province:state.province,arena:state.arena}}));}",1)
else:
 assert html.count("root.dispatchEvent(new CustomEvent('atlas-results-updated'")==1, 'No se localizó de forma inequívoca la actualización del visor original'
# En los colores de respaldo del explorador existente se prioriza el mismo catálogo conciliado.
fall='return `hsl(${Math.abs(n)%360} 45% 46%)`;'
if fall in html:
 html=html.replace(fall,"return (window.atlasPartyColor?.(name)||'#7c90a2');",1)
else:
 assert "window.atlasPartyColor?.(name)" in html
# Presentación pública: ocho fuentes actuales, novena base prevista.
html=html.replace('Siete bases históricas','Ocho bases históricas').replace('siete bases históricas','ocho bases históricas')
html=html.replace('siete bases aportadas','ocho bases integradas').replace('Siete bases conectadas','Ocho bases integradas').replace('Siete bases relacionables','Ocho bases relacionables')
html=html.replace('Versión pública 23.31 · Recurso de consulta','Versión pública 25.0 · Recurso de consulta')
html=html.replace(' · Politólogo <span class="tag">Producto interactivo',' · Ciencia Política · Economía · Ciencia de Datos <span class="tag">Producto interactivo')
assert html.count('id="atlas-v25-js"')==1 and html.count('id="atlas-v24-js"')==0
assert html.count('id="atlas-v25-css"')==1
assert html.count('id="atlas-v24-data"')==1
# Publicar solamente cuando los artefactos están completos, mediante sustitución atómica.
fd,tmp=tempfile.mkstemp(prefix='atlas_v25_',suffix='.html',dir=HTML.parent)
try:
 with os.fdopen(fd,'w',encoding='utf-8') as f:f.write(html)
 os.replace(tmp,HTML)
except Exception:
 Path(tmp).unlink(missing_ok=True);raise

stats={'version':'25.0','proyecto':'Atlas Electoral de Costa Rica 1953-2026','n_years':len(v24['years']),
       'n_cantons':len(v24['cantons']),'n_districts':len(v24['districts']),
       'n_votes':len(v24['votes']),'n_metrics':len(v24['metrics']),
       'n_nomination_rows':len(nom),'n_catalog_colors':len(palette),
       'html_size':HTML.stat().st_size,
       'html_sha256':hashlib.sha256(HTML.read_bytes()).hexdigest(),
       'source_sha256':{str(p.name):hashlib.sha256(p.read_bytes()).hexdigest() for p in [JS,CSS]}}
(ROOT/'salidas/datos/control_integracion_territorial.json').write_text(json.dumps(stats,ensure_ascii=False,indent=2),encoding='utf-8')
print('ATLAS CONCILIADO',json.dumps({k:v for k,v in stats.items() if not k.endswith('sha256')},ensure_ascii=False))
print('HTML',HTML)
