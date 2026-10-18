"""Verifica el notebook completo sin inflar el archivo con salidas HTML/Plotly.

Ejecuta todos los cálculos y la generación del HTML. Durante esta verificación
las llamadas de presentación `display()` y `show()` se silencian después de la
celda de entorno; el código del notebook no se modifica y al usar Run All en
Jupyter vuelve a mostrar todas las figuras normalmente.
"""
from pathlib import Path
import os, nbformat
from IPython.core.interactiveshell import InteractiveShell
from IPython.utils.capture import capture_output

root=Path(__file__).resolve().parent.parent
p=root/'Atlas_Electoral_V12_VERIFICADO.ipynb'
os.chdir(root)
n=nbformat.read(p,as_version=4)
shell=InteractiveShell.instance();count=0
for idx,cell in enumerate(n.cells):
    if cell.cell_type!='code':continue
    count+=1;cell.execution_count=count;cell.outputs=[]
    with capture_output(stdout=True,stderr=True,display=False) as captured:
        result=shell.run_cell(cell.source,store_history=False)
    if captured.stdout:cell.outputs.append(nbformat.v4.new_output('stream',name='stdout',text=captured.stdout))
    if captured.stderr:cell.outputs.append(nbformat.v4.new_output('stream',name='stderr',text=captured.stderr))
    error=result.error_before_exec or result.error_in_exec
    nbformat.write(n,p)
    print(f'Celda {idx+1}/{len(n.cells)}: '+('ERROR' if error else 'ok'),flush=True)
    if error:raise error
    # Evita serializar decenas de MB de representaciones gráficas durante la auditoría.
    if idx==2:
        shell.user_ns['display']=lambda *args,**kwargs: None
        shell.user_ns['show']=lambda *args,**kwargs: None
n.metadata['atlas_verificacion']={
    'ejecucion':'Secuencial en IPython; cálculos y HTML reconstruidos desde los siete Excel',
    'celdas_codigo':count,'errores':0,
    'salidas_graficas':'Suprimidas solo durante la verificación automática; Run All en Jupyter las muestra normalmente',
    'version':'2.0'
}
nbformat.validate(n);nbformat.write(n,p)
print('Completado',count,'celdas de código sin errores',flush=True)
