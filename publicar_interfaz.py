'Publica de forma determinista los recursos base de la interfaz.'
from pathlib import Path
import json,re,os,tempfile,hashlib
root=Path(__file__).resolve().parent
html_path=root/'salidas/Atlas_Electoral_Costa_Rica_1953_2026.html'
js_path=root/'recursos/atlas_interfaz_base.js'
css_path=root/'recursos/atlas_interfaz_base.css'
geo_path=root/'recursos/costaricaprovincias.geojson'
assert all(x.exists() for x in (html_path,js_path,css_path,geo_path))
s=html_path.read_text(encoding='utf-8')

oldjs=re.search(r'<script id="atlas-v(?:25|26)-js">[\s\S]*?</script>',s)
assert oldjs, 'No hay script de integración localizado'
s=s[:oldjs.start()]+'<script id="atlas-v26-js">\n'+js_path.read_text(encoding='utf-8')+'\n</script>'+s[oldjs.end():]
oldstyle=re.search(r'<style id="atlas-v26-css">[\s\S]*?</style>',s)
if oldstyle:s=s[:oldstyle.start()]+s[oldstyle.end():]

assert '</head>' in s
s=s.replace('</head>','<style id="atlas-v26-css">\n'+css_path.read_text(encoding='utf-8')+'\n</style></head>',1)
# Añadir geometría provincial a la misma carga territorial: para mapa de segunda vuelta.
match=re.search(r'(<script type="application/json" id="atlas-v24-data">)([\s\S]*?)(</script>)',s)
assert match
v=json.loads(match.group(2));v['version']='26.0'
v['province_geojson']=json.loads(geo_path.read_text(encoding='utf-8'))
v['geo_name_key']='properties.NAME_1'
blob=json.dumps(v,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
s=s[:match.start()]+match.group(1)+blob+match.group(3)+s[match.end():]
# Corrige textos de metadatos históricos; valores dinámicos se presentan en la nueva portada.
s=s.replace('7</strong><span>bases históricas conectadas','8</strong><span>bases históricas conectadas')
s=s.replace('Versión pública 25.0 · Recurso de consulta','Versión pública 26.0 · Recurso de consulta')
assert s.count('id="atlas-v26-js"')==1 and s.count('id="atlas-v26-css"')==1 and s.count('id="atlas-v24-data"')==1
fd,tmp=tempfile.mkstemp(dir=str(html_path.parent),prefix='atlas_v26_',suffix='.html')
try:
 with os.fdopen(fd,'w',encoding='utf-8') as f:f.write(s)
 os.replace(tmp,html_path)
except BaseException:
 Path(tmp).unlink(missing_ok=True);raise
status={'version':'26.0','years':len(v['years']),'cantons':len(v['cantons']),'districts':len(v['districts']), 'metrics':len(v['metrics']),'votes':len(v['votes']),'nominations':len(v['nomination_rows']),'html_bytes':html_path.stat().st_size,'js_sha256':hashlib.sha256(js_path.read_bytes()).hexdigest(),'html_sha256':hashlib.sha256(html_path.read_bytes()).hexdigest()}
(root/'salidas/datos/control_interfaz_base.json').write_text(json.dumps(status,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(status,ensure_ascii=False,indent=2))
