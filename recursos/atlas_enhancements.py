"""Ampliaciones descriptivas del Atlas. No modifica las fuentes Excel."""
from pathlib import Path
from collections import defaultdict
import json,re,unicodedata
import pandas as pd

def display_name(value):
    if value is None:return value
    words=str(value).strip().lower().split()
    minor={'de','del','la','las','los','y','da','dos','van','von'}
    return ' '.join(w if i and w in minor else w[:1].upper()+w[1:] for i,w in enumerate(words))

def enrich(data):
    # Cambia la presentación, no las claves de identidad ni las grafías de fuente.
    for key in ['candidaturas','electas','formulas','eventos','personas','movimientos','presidencia_asamblea',
                'resultados_candidaturas','resultados_personas','transiciones_resultados','camara_electa','ejecutivo_electo']:
        for r in data[key]:
            if r.get('nombre'):
                r['nombre_original']=r['nombre'];r['nombre']=display_name(r['nombre'])
            for col in ['apellido1','apellido2']:
                if r.get(col):r[col]=display_name(r[col])
    ranks=[];gap=[]
    t=pd.DataFrame(data['totales'])
    for (year,arena),g in t[(t.provincia!='Nacional')&(t.ronda==1)].groupby(['anio','arena']):
        g=g.copy();g['rango_participacion']=g.participacion_pct.rank(ascending=False,method='min').astype(int)
        g['rango_abstencion']=g.abstencion_pct.rank(ascending=False,method='min').astype(int)
        ranks+=g[['anio','provincia','arena','participacion_pct','abstencion_pct','rango_participacion','rango_abstencion']].to_dict('records')
    for (y,p),g in t[t.ronda==1].groupby(['anio','provincia']):
        if set(g.arena)=={'Legislativa','Presidencial'}:
            a=g.set_index('arena');gap.append({'anio':y,'provincia':p,'participacion_legislativa':a.at['Legislativa','participacion_pct'],'participacion_presidencial':a.at['Presidencial','participacion_pct'],'diferencia_participacion_pp':a.at['Legislativa','participacion_pct']-a.at['Presidencial','participacion_pct'],'diferencia_abstencion_pp':a.at['Legislativa','abstencion_pct']-a.at['Presidencial','abstencion_pct']})
    data['rankings_provinciales']=ranks;data['brechas_participacion']=gap
    panel=pd.DataFrame(data['panel']);p=panel[panel.provincia=='Nacional']
    government=[]
    for r in data['presidencia_asamblea']:
        g=p[p.anio==r['anio']];vl=g[g.votos_Legislativa==g.votos_Legislativa.max()];sl=g[g.escanos==g.escanos.max()]
        row=dict(r);row.update({'ganador_presidencial':r['partido'],'ganador_voto_legislativo':' / '.join(vl.partido),'primera_bancada':' / '.join(sl.partido),'coincide_voto_legislativo':r['partido'] in set(vl.partido),'coincide_primera_bancada':r['partido'] in set(sl.partido),'escanos_primera_bancada':float(sl.escanos.max()),'brecha_escanos_primera_bancada':float(sl.escanos.max()-r['escanos'])})
        government.append(row)
    data['concordancia_gobierno']=government
    # Oferta observada por nombre: no equivale a escala registral.
    c=pd.DataFrame(data['candidaturas']);f=pd.DataFrame(data['formulas']);v=pd.DataFrame(data['votos'])
    offer=[]
    for (year,pt),g in p.groupby(['anio','partido']):
        ca=c[(c.anio==year)&(c.partido==pt)];pr=f[(f.anio==year)&(f.partido==pt)]
        vg=v[(v.anio==year)&(v.partido==pt)&(v.arena=='Legislativa')&(v.provincia!='Nacional')]
        provinces=set(ca.provincia)|set(vg[vg.votos>0].provincia)
        haspres=len(pr)>0 or bool(g.porcentaje_Presidencial.notna().any());hasleg=bool(provinces)
        if not haspres and not hasleg:continue
        category='Presidencial y legislativa' if haspres and hasleg else 'Solo presidencial' if haspres else 'Solo legislativa'
        offer.append({'anio':int(year),'partido':pt,'oferta':category,'provincias_legislativas':len(provinces),'alcance_observado':'Siete provincias' if len(provinces)==7 else 'Varias provincias' if len(provinces)>1 else 'Una provincia' if len(provinces)==1 else 'Sin oferta legislativa identificada','votos_legislativos':float(g.votos_Legislativa.fillna(0).sum()),'candidaturas_legislativas':len(ca)})
    data['oferta_partidos']=offer
    changes=[]
    for pt,g in pd.DataFrame(offer).groupby('partido'):
        rows=g.sort_values('anio').to_dict('records')
        for a,b in zip(rows,rows[1:]):
            if a['oferta']!=b['oferta'] or a['alcance_observado']!=b['alcance_observado']:
                changes.append({'partido':pt,'anio_origen':a['anio'],'anio':b['anio'],'oferta_anterior':a['oferta'],'oferta_actual':b['oferta'],'alcance_anterior':a['alcance_observado'],'alcance_actual':b['alcance_observado'],'provincias_antes':a['provincias_legislativas'],'provincias_despues':b['provincias_legislativas']})
    data['cambios_oferta']=changes
    reuse=[]
    for name,g in pd.DataFrame(data['cancelados']).groupby('Nombre del partido'):
        rows=g.sort_values('Fecha de inscripción').to_dict('records')
        for a,b in zip(rows,rows[1:]):
            days=(pd.to_datetime(b['Fecha de inscripción'])-pd.to_datetime(a['Fecha de cancelación'])).days
            reuse.append({'nombre_partido':name,'registro_anterior':a['ID registro'],'registro_posterior':b['ID registro'],'inscripcion_anterior':a['Fecha de inscripción'],'cancelacion_anterior':a['Fecha de cancelación'],'inscripcion_posterior':b['Fecha de inscripción'],'cancelacion_posterior':b['Fecha de cancelación'],'dias_entre_registros':int(days),'relacion':'Inscripción posterior a cancelación' if days>0 else 'Misma fecha' if days==0 else 'Intervalos superpuestos','escala_anterior':a['Escala'],'escala_posterior':b['Escala'],'provincia_anterior':a['Provincia'],'provincia_posterior':b['Provincia'],'continuidad':'La secuencia registral no determina identidad organizativa ni ideológica'})
    data['reutilizacion_nombres']=reuse
    # Tabla completa para sexo × año × cargo/tipo. No se infiere edad.
    sexes=[]
    for dataset,label in [('candidaturas','Candidaturas legislativas'),('electas','Diputaciones electas'),('formulas','Fórmulas presidenciales')]:
        rows=data[dataset]
        grouped=defaultdict(list)
        for r in rows:
            cat=r.get('cargo') if dataset=='formulas' else r.get('tipo','Electas')
            for prov in set(['Nacional',r.get('provincia','Nacional')]):grouped[(r['anio'],prov,cat)].append(r)
        for (y,prov,cat),g in grouped.items():
            for sex in ['Mujer','Hombre','Sin dato']:
                n=sum(r['sexo']==sex for r in g)
                sexes.append({'anio':y,'provincia':prov,'poblacion':label,'categoria':cat,'sexo':sex,'registros':n,'total_categoria':len(g),'porcentaje':100*n/len(g)})
    data['composicion_sexo']=sexes
    cp=Path(__file__).parent/'colores_partidos.json'
    data['colores_partidos']=json.loads(cp.read_text()) if cp.exists() else []
    data['meta']['version']='1.7'
    data['meta']['alias_partidarios']=[{'variante':'UNIDAD SOCIALCRISTIANA','canonico':'UNIDAD SOCIAL CRISTIANA','motivo':'Variante de espacio en fuente electoral de 1986'},{'variante':'ORG SOCIALISTA DE LOS TRABAJADORES','canonico':'ORGANIZACION SOCIALISTA DE LOS TRABAJADORES','motivo':'Abreviatura frente a nombre desarrollado en 1978'}]
    data['meta']['edad']='No disponible: las siete bases no incluyen fecha de nacimiento o edad verificable.'
    for key,rows in list(data.items()):
        if isinstance(rows,list):data[key]=json.loads(pd.DataFrame(rows).to_json(orient="records",force_ascii=False,date_format="iso"))
    return data
