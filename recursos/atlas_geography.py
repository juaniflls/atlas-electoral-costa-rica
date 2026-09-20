import json
from pathlib import Path

def enrich_geography(data):
    data['geografia']=json.loads((Path(__file__).parent/'costaricaprovincias.geojson').read_text())
    rows=[]
    for y in data['meta']['años']:
        provinces=[r for r in data['metricas'] if r['anio']==y and r['arena']=='Legislativa' and r['ronda']==1 and r['provincia']!='Nacional']
        total_seats=sum(r['magnitud'] for r in provinces)
        total_padron=sum(r['padron'] for r in provinces)
        for r in provinces:
            a=dict(r)
            a['peso_escanos_pct']=100*r['magnitud']/total_seats
            a['peso_padron_pct']=100*r['padron']/total_padron
            a['brecha_representacion_pp']=a['peso_escanos_pct']-a['peso_padron_pct']
            a['indice_representacion']=a['peso_escanos_pct']/a['peso_padron_pct']
            a['brecha_abs_pp']=abs(a['brecha_representacion_pp'])
            if a['brecha_representacion_pp'] > 1e-9:
                a['balance_padron']='Sobrerrepresentación relativa al padrón'
            elif a['brecha_representacion_pp'] < -1e-9:
                a['balance_padron']='Subrepresentación relativa al padrón'
            else:
                a['balance_padron']='Igualdad exacta escaños–padrón'
            a['electores_por_escano']=r['padron']/r['magnitud']
            previous=[x for x in rows if x['provincia']==r['provincia']]
            a['cambio_escanos']=r['magnitud']-previous[-1]['magnitud'] if previous else None
            a['cambio_asignacion']=bool(previous and a['cambio_escanos'] != 0)
            a['fuente']='Bases electorales y diputaciones electas aportadas; cálculo provincial'
            rows.append(a)
    data['representacion_territorial']=rows
    data['meta']['version']='2.0'
    data['meta']['perfil']='Politólogo · Científico de datos · Ciencia de Datos Política'
    data['meta']['autoria']='Juan Ignacio Garbanzo Fallas — construcción e integración de bases, análisis y visualización; fuentes electorales del TSE'
    return data
