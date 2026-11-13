"""Validate the public distribution without changing files or Git metadata."""
from pathlib import Path
import ast
import hashlib
import json
import re
import struct
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def check():
    sources = json.loads((ROOT / 'docs/fuentes-v38.json').read_text())
    assert len(sources) == 8, 'Se requieren ocho fuentes.'
    for item in sources:
        path = ROOT / item['archivo']
        assert path.is_file(), f'Falta la fuente {path.name}'
        assert hashlib.sha256(path.read_bytes()).hexdigest() == item['sha256'], f'Fuente modificada: {path.name}'
    notebook = json.loads((ROOT / 'Atlas_Electoral_V38_Publico.ipynb').read_text())
    assert notebook['nbformat'] == 4
    code = 0
    for index, cell in enumerate(notebook['cells']):
        if cell['cell_type'] == 'code':
            ast.parse(''.join(cell['source']), filename=f'celda-{index}')
            code += 1
    assert 'Investigación por cuatro épocas' not in ''.join(notebook['cells'][0]['source'])
    sections = json.loads((ROOT / 'docs/catalogo-secciones-v38.json').read_text())
    assert [s['n'] for s in sections] == [f'{i:02}' for i in range(1, 23)]
    readme = (ROOT / 'README.md').read_text()
    for link in re.findall(r'\]\(([^)]+)\)', readme):
        if link.startswith(('http:', 'https:', '#')):
            continue
        assert (ROOT / link.split('#')[0]).exists(), f'Enlace local inexistente: {link}'
    banner = ROOT / 'assets/branding/atlas-electoral-v38.png'
    payload = banner.read_bytes()
    assert payload[:8] == b'\x89PNG\r\n\x1a\n'
    assert struct.unpack('>II', payload[16:24]) == (1280, 640)
    assert len(payload) < 1_000_000
    app = json.loads((ROOT / 'dist/aplicacion-v38.json').read_text())
    with zipfile.ZipFile(ROOT / 'dist/atlas-electoral-v38-aplicacion.zip') as archive:
        data = archive.read(app['archivo'])
    assert hashlib.sha256(data).hexdigest() == app['sha256']
    assert len(data) == app['bytes']
    if (ROOT / app['archivo']).exists():
        local = (ROOT / app['archivo']).read_bytes()
        if hashlib.sha256(local).hexdigest() != app['sha256']:
            print('Nota: el HTML local difiere del distribuido; puede haber sido regenerado.')
    for path in ['recursos/atlas_pipeline.py', 'recursos/atlas_template.html',
                 'recursos/atlas_integracion.py', 'recursos/atlas_datos_territoriales.py',
                 'integrar_territorios.py', 'construir_interfaz.py', 'conciliar_resultados.py',
                 'completar_interfaz.py', 'publicar_interfaz.py', 'publicar_aplicacion.py']:
        assert (ROOT / path).is_file(), f'Falta recurso de construcción: {path}'
    legacy = re.compile(r'(?i)(?:^|_)v(?:[1-9]|[12]\d|3[0-7])(?:_|\.)')
    for path in ROOT.rglob('*'):
        relative = path.relative_to(ROOT)
        if path.is_file() and not any(part.startswith('.') for part in relative.parts):
            assert not legacy.search(path.name), f'Nombre de edición anterior: {relative}'
    print(f'V38: ocho fuentes intactas, {code} celdas Python válidas, 22 secciones, enlaces y distribución correctos.')


if __name__ == '__main__':
    check()
