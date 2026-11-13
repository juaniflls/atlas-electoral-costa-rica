'Incorpora los datos y el explorador territorial al HTML generado.'
from __future__ import annotations
from pathlib import Path
from tempfile import NamedTemporaryFile
import os, re, json
from .atlas_datos_territoriales import snapshot

START='<!-- ATLAS-V28-INTEGRADO -->'
END='<!-- /ATLAS-V28-INTEGRADO -->'

def install(project_root: Path, *, html:Path|None=None, data_override:Path|None=None):
    root=Path(project_root).resolve()
    html=Path(html) if html is not None else root/'salidas'/'Atlas_Electoral_Costa_Rica_1953_2026.html'
    if not html.is_file():
        raise FileNotFoundError(f'Primero ejecute el notebook que genera el HTML: {html}')
    js=root/'recursos'/'atlas_explorador_territorial.js'
    if not js.is_file():raise FileNotFoundError(f'Recurso adicional necesario: {js}')
    data=data_override if data_override is not None else snapshot(root)[0]
    if not Path(data).is_file():raise FileNotFoundError(data)
    content=html.read_text(encoding='utf-8')
    if START in content:
        start=content.find(START)
        end=content.find(END,start)
        if end<0:raise ValueError('El bloque V28 existente está incompleto: no se modificó el HTML.')
        content=content[:start]+content[end+len(END):]
    if '</body>' not in content.lower():raise ValueError('HTML sin cierre </body>; no se modifica.')
    js_text=js.read_text(encoding='utf-8')
    # Protección de cierre de etiquetas script incrustadas.
    if '</script>' in js_text.lower():raise ValueError('JavaScript contiene un cierre de script inesperado.')
    payload=Path(data).read_text(encoding='utf-8').replace('</','<\\/')
    block=START+'\n<script id="atlas-v28-dataset" type="application/json">'+payload+'</script>\n<script id="atlas-v28-runtime">'+js_text+'</script>\n'+END+'\n'
    pos=content.lower().rfind('</body>')
    content=content[:pos]+block+content[pos:]
    # Solo escribe cuando ha podido verificar toda la estructura.
    with NamedTemporaryFile('w',encoding='utf-8',delete=False,dir=html.parent,prefix='.atlas_v28_',suffix='.tmp') as f:
        f.write(content);tmp=Path(f.name)
    try:os.replace(tmp,html)
    finally:tmp.unlink(missing_ok=True)
    assert content.count('id="atlas-v28-dataset"')==1
    return {'html':str(html),'dataset_bytes':Path(data).stat().st_size,'javascript_bytes':js.stat().st_size,'integracion_unica':True}
