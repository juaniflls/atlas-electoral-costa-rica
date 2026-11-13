"""Restore the exact public application from the distribution archive."""
from pathlib import Path
import argparse
import hashlib
import json
import tempfile
import os
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def restore(replace=False):
    manifest = json.loads((ROOT / 'dist/aplicacion-v38.json').read_text())
    destination = ROOT / manifest['archivo']
    with zipfile.ZipFile(ROOT / 'dist/atlas-electoral-v38-aplicacion.zip') as archive:
        payload = archive.read(manifest['archivo'])
    if hashlib.sha256(payload).hexdigest() != manifest['sha256']:
        raise ValueError('La aplicación comprimida no supera la verificación SHA-256.')
    if destination.exists():
        if hashlib.sha256(destination.read_bytes()).hexdigest() == manifest['sha256']:
            print('La aplicación ya está disponible:', destination)
            return
        if not replace:
            raise FileExistsError('Existe un HTML diferente. Use --replace para sustituirlo deliberadamente.')
    with tempfile.NamedTemporaryFile(dir=ROOT, suffix='.html', delete=False) as temporary:
        temporary.write(payload)
        staged = temporary.name
    os.replace(staged, destination)
    print('Aplicación restaurada y verificada:', destination)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--replace', action='store_true', help='Sustituir un HTML local diferente.')
    restore(parser.parse_args().replace)
