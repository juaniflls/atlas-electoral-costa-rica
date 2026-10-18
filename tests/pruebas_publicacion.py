"""Comprobaciones estáticas y documentales de la distribución pública V22.

No sustituye la revisión interactiva completa en navegador ni la validación de las
fuentes originales con declaratorias oficiales del TSE.
"""
from pathlib import Path
from hashlib import sha256
import json
import csv
import re

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / 'salidas/Atlas_Electoral_Costa_Rica_1953_2026.html'
NOTEBOOK = ROOT / 'Atlas_Electoral_V22_PUBLICO.ipynb'
manifest = json.loads((ROOT / 'docs/MANIFIESTO_BASES_V22.json').read_text())
assert len(manifest) == 7, 'Se esperan siete fuentes documentales.'
for base in manifest:
    path = ROOT / base['archivo']
    assert path.is_file(), f'Falta base: {path}'
    assert sha256(path.read_bytes()).hexdigest() == base['sha256'], f'Fuente modificada: {path}'
for name in ['atlas_template.html', 'atlas_pipeline.py', 'atlas_final.js',
             'atlas_v14.js', 'atlas_v22_public.js', 'atlas_v22_public.css']:
    assert (ROOT/'recursos'/name).is_file(), f'Falta recurso {name}'
nb = json.loads(NOTEBOOK.read_text())
assert not any('function atlasV22Public' in ''.join(c['source']) for c in nb['cells'] if c['cell_type']=='code'), 'El código de mejora está en su recurso externo, no se duplica en notebook.'
assert any('atlas_v22_public.js' in ''.join(c['source']) for c in nb['cells']), 'Falta integración de módulo V22.'
html = HTML.read_text(encoding='utf-8')
assert html.count('ATLAS_V22_PUBLIC_PRODUCT')==1
assert html.count('ATLAS_V22_PUBLIC_PRESENTATION')==1
assert '<script id="atlas-data" type="application/json">' in html
assert '__ATLAS_DATA__' not in html and '__PLOTLY_JS__' not in html
assert len(list((ROOT/'assets/screenshots').glob('*.png')))==25
p=ROOT/'salidas/datos/camara_electa.csv'
with p.open(newline='',encoding='utf-8') as fp:
    rows=list(csv.DictReader(fp))
from collections import Counter
counts=Counter(int(r['anio']) for r in rows)
assert counts[1953] == 45 and counts[1958] == 45
assert all(count == 57 for year,count in counts.items() if year>=1962), counts
assert len(counts)==19
print('V22: integridad documental OK · 7 bases, 19 elecciones, 25 capturas, HTML y recursos coherentes.')
