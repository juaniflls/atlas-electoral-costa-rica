'Construye las tablas territoriales a partir de las fuentes electorales.'
from pathlib import Path
import json, hashlib, unicodedata, collections
import pandas as pd
import numpy as np

YEARS=[1953,1958]+list(range(1962,2027,4))
PROVINCES=['San José','Alajuela','Cartago','Heredia','Guanacaste','Puntarenas','Limón']
CAT={'ABSTENCIONISMO':'abst','VOTOS EN BLANCO':'blancos','VOTOS NULOS':'nulos'}

def norm(s):
    return ''.join(c for c in unicodedata.normalize('NFD',str(s).upper().strip()) if unicodedata.category(c)!='Mn')
def cleanname(s):
    return str(s).strip()
def province(s):
    return next((p for p in PROVINCES if norm(p)==norm(s)),str(s))

def assemble(root, output):
    root=Path(root); output=Path(output); output.mkdir(parents=True,exist_ok=True)
    inputs={
        'L':(root/'Base_Electoral_Diputaciones_1953-2026.xlsx','Detalle_diputaciones'),
        'P':(root/'Base_Electoral_Presidencial_1953-2026.xlsx','Detalle_primera_vuelta'),
        'R':(root/'Base_Electoral_Presidencial_1953-2026.xlsx','Detalle_segunda_vuelta')}
    sources=[]; dfs=[]
    for a,(p,sheet) in inputs.items():
        if not p.exists():raise FileNotFoundError(p)
        d=pd.read_excel(p,sheet_name=sheet,usecols=['Año','Provincia','Canton','Distrito','Código','Partido','Votos'])
        d=d.rename(columns={'Año':'year','Provincia':'prov','Canton':'canton','Distrito':'district','Código':'code','Partido':'party','Votos':'votes'})
        d['year']=pd.to_numeric(d.year,errors='raise').astype('int16')
        d['code']=d.code.astype('int64').astype(str).str.zfill(5)
        if not d.code.str.fullmatch(r'[1-7][0-9]{4}').all():raise ValueError('Código distrital inválido: '+a)
        d['cantcode']=d.code.str[:3]
        d['prov']=d.prov.map(province)
        d['party']=d.party.map(cleanname)
        d['votes']=pd.to_numeric(d.votes,errors='raise').astype('int64')
        if (d.votes<0).any():raise ValueError('Votos negativos en '+a)
        d['arena']=a
        d['kind']=d.party.map(lambda x:CAT.get(norm(x),'party'))
        d=d.drop_duplicates(subset=['year','arena','code','party','votes','prov','canton','district'],keep='first') if False else d
        dfs.append(d)
        sources.append({'archivo':p.name,'hoja':sheet,'filas':len(d),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
    src=pd.concat(dfs,ignore_index=True)
    # 2026 es referencia de orden, pero se conservan códigos históricos ausentes actualmente.
    id_rows=(src[src.arena=='P'][['year','prov','canton','district','code','cantcode']]
             .drop_duplicates().sort_values('year'))
    latest_cant=(id_rows.drop_duplicates('cantcode',keep='last')[['cantcode','prov','canton']]
                 .sort_values(['prov','cantcode']))
    latest_dist=(id_rows.drop_duplicates('code',keep='last')[['code','cantcode','prov','canton','district']]
                 .sort_values(['prov','cantcode','code']))
    prov_order={p:i for i,p in enumerate(PROVINCES)}
    latest_cant['pidx']=latest_cant.prov.map(prov_order)
    latest_cant=latest_cant.sort_values(['pidx','cantcode'])
    latest_dist['pidx']=latest_dist.prov.map(prov_order)
    latest_dist=latest_dist.sort_values(['pidx','cantcode','code'])
    # Archivo oficial disponible para abstencionismo compartido. Sin imputación ad hoc.
    presfile=inputs['P'][0]
    audit=pd.read_excel(presfile,sheet_name='Participacion_distrital')
    audit=audit[['Año','Código','Abst. común (presidencial)','Papeletas pres. (válidos+blancos+nulos)','Papeletas leg. (válidos+blancos+nulos)','Estado']].copy()
    audit.columns=['year','code','shared_abst','pres_papers','leg_papers','status']
    audit['code']=audit.code.astype('int64').astype(str).str.zfill(5)
    audit=audit.groupby(['year','code'],as_index=False).agg(shared_abst=('shared_abst','sum'),pres_papers=('pres_papers','sum'),leg_papers=('leg_papers','sum'),status=('status','first'))
    if audit.duplicated(['year','code']).any():raise ValueError('Clave de abstención duplicada')
    # Distritos por elección; se conserva el universo de cada año.
    units=id_rows.drop_duplicates(['year','code'])[['year','code','cantcode','prov','canton','district']]
    rows=[]; parties=[]
    for area in ('P','L','R'):
        di=src[src.arena==area]
        if di.empty:continue
        grouped=di.groupby(['year','code','kind'],as_index=False).votes.sum()
        wide=grouped.pivot_table(index=['year','code'],columns='kind',values='votes',aggfunc='sum',fill_value=0).reset_index()
        for k in ['party','blancos','nulos','abst']:
            if k not in wide:wide[k]=0
        wide=wide.merge(units,on=['year','code'],how='left',validate='one_to_one')
        wide=wide.merge(audit,on=['year','code'],how='left',validate='one_to_one')
        wide['arena']=area
        wide['validos']=wide['party'].astype(int)
        wide['emitidos']=wide.validos+wide.blancos+wide.nulos
        wide['abstenciones']=wide.shared_abst.where(wide.shared_abst.notna(),wide.abst)
        if area=='R':
            # Segunda ronda tiene asistencia distinta; NO tomar abstención de primera ronda.
            wide['abstenciones']=wide.abst
            wide['padron_analitico']=wide.emitidos+wide.abstenciones
            wide['asistencia_estimada']=wide.emitidos
        else:
            wide['padron_analitico']=wide.shared_abst+wide.pres_papers
            wide['asistencia_estimada']=wide.pres_papers
        wide['abst_pct']=100*wide.abstenciones/wide.padron_analitico.replace(0,np.nan)
        wide['part_pct']=100*wide.asistencia_estimada/wide.padron_analitico.replace(0,np.nan)
        wide['blancos_pct']=100*wide.blancos/wide.emitidos.replace(0,np.nan)
        wide['nulos_pct']=100*wide.nulos/wide.emitidos.replace(0,np.nan)
        wide['noval_pct']=100*(wide.blancos+wide.nulos)/wide.emitidos.replace(0,np.nan)
        wide['valid_pct']=100*wide.validos/wide.emitidos.replace(0,np.nan)
        wide['emip_pct']=100*wide.emitidos/wide.padron_analitico.replace(0,np.nan)
        wide['level']='d';wide['key']=wide.code
        rows.append(wide)
        pv=di[di.kind=='party'].groupby(['year','code','party'],as_index=False).votes.sum()
        pv=pv.merge(units,on=['year','code'],how='left',validate='many_to_one')
        pv['arena']=area;pv['level']='d';pv['key']=pv.code
        parties.append(pv)
    district=pd.concat(rows,ignore_index=True)
    party=pd.concat(parties,ignore_index=True)
    measures=['validos','blancos','nulos','abstenciones','emitidos','padron_analitico','asistencia_estimada']
    metric_levels=[district]
    party_levels=[party]
    # Agrupación por claves administrativas estables dentro de cada elección.
    for lev,key in [('c','cantcode'),('p','prov')]:
        gr=district.groupby(['year','arena',key],as_index=False)[measures].sum(min_count=1)
        labels=(district.sort_values('year').drop_duplicates(['year','arena',key],keep='last')
                [['year','arena',key,'prov','canton'] if lev=='c' else ['year','arena','prov']])
        gr=gr.merge(labels,on=['year','arena',key],how='left',validate='one_to_one',suffixes=('','_r'))
        gr['key']=gr[key];gr['level']=lev
        for col in ['abst','part','blancos','nulos','noval','valid','emip']:
            num={'abst':'abstenciones','part':'asistencia_estimada','blancos':'blancos','nulos':'nulos','noval':None,'valid':'validos','emip':'emitidos'}[col]
            numerator=gr.blancos+gr.nulos if col=='noval' else gr[num]
            divisor=gr.padron_analitico if col in ['abst','part','emip'] else gr.emitidos
            gr[col+'_pct']=100*numerator/divisor.replace(0,np.nan)
        metric_levels.append(gr)
        par=party.groupby(['year','arena',key,'party'],as_index=False).votes.sum()
        par['key']=par[key];par['level']=lev
        party_levels.append(par)
    national=district.groupby(['year','arena'],as_index=False)[measures].sum(min_count=1)
    national['key']='CR';national['level']='n';national['prov']='Costa Rica'
    for col in ['abst','part','blancos','nulos','noval','valid','emip']:
        num={'abst':'abstenciones','part':'asistencia_estimada','blancos':'blancos','nulos':'nulos','noval':None,'valid':'validos','emip':'emitidos'}[col]
        numerator=national.blancos+national.nulos if col=='noval' else national[num]
        divisor=national.padron_analitico if col in ['abst','part','emip'] else national.emitidos
        national[col+'_pct']=100*numerator/divisor.replace(0,np.nan)
    metric_levels.append(national)
    natparty=party.groupby(['year','arena','party'],as_index=False).votes.sum()
    natparty['key']='CR';natparty['level']='n';party_levels.append(natparty)
    metrics=pd.concat(metric_levels,ignore_index=True)
    ptable=pd.concat(party_levels,ignore_index=True)
    denom=metrics[['year','arena','level','key','validos']]
    ptable=ptable.merge(denom,on=['year','arena','level','key'],how='left',validate='many_to_one')
    ptable['share']=100*ptable.votes/ptable.validos.replace(0,np.nan)
    winners=(ptable.sort_values(['year','arena','level','key','votes','party'],ascending=[True,True,True,True,False,True])
             .drop_duplicates(['year','arena','level','key'],keep='first'))
    top2=ptable.sort_values('votes',ascending=False).groupby(['year','arena','level','key']).head(2)
    # Diferencia de voto presidente/diputaciones, por distribución completa y mismas claves.
    both=ptable[(ptable.arena.isin(['L','P'])) & ptable.level.isin(['c','p','n'])]
    pivot=both.pivot_table(index=['year','level','key','party'],columns='arena',values='share',aggfunc='sum',fill_value=0).reset_index()
    for c in ['L','P']:
        if c not in pivot:pivot[c]=0
    divergence=pivot.assign(delta=lambda d:(d.P-d.L).abs()).groupby(['year','level','key'],as_index=False).delta.sum()
    divergence['quiebre_pp']=divergence.delta/2
    # Solo variables reproducibles y ámbito correcto. No se infieren escaños cantonales.
    mcols=['year','arena','level','key','validos','blancos','nulos','abstenciones','emitidos','padron_analitico','asistencia_estimada','abst_pct','part_pct','blancos_pct','nulos_pct','noval_pct','valid_pct','emip_pct']
    for c in mcols:
        if c not in metrics:metrics[c]=np.nan
    metrics[mcols].to_csv(output/'territorio_metricas.csv',index=False,encoding='utf-8-sig')
    ptable[['year','arena','level','key','party','votes','share']].to_csv(output/'territorio_votos_partidarios.csv',index=False,encoding='utf-8-sig')
    winners[['year','arena','level','key','party','votes','share']].to_csv(output/'territorio_liderazgos.csv',index=False,encoding='utf-8-sig')
    divergence.to_csv(output/'territorio_quiebre.csv',index=False,encoding='utf-8-sig')
    # Proteger diferencias territoriales: códigos que existieron, pero no en 2026.
    years_c=units.groupby('cantcode').year.apply(lambda x: sorted(x.unique().tolist())).to_dict()
    years_d=units.groupby('code').year.apply(lambda x: sorted(x.unique().tolist())).to_dict()
    def records(df,fields):
        d=df[fields].copy().replace({np.nan:None})
        return json.loads(d.to_json(orient='values',force_ascii=False,double_precision=5))
    summary={
        'version':'24.0',
        'years':YEARS,
        'provinces':PROVINCES,
        'cantons':records(latest_cant,['cantcode','prov','canton']),
        'districts':records(latest_dist,['code','cantcode','prov','canton','district']),
        'canton_years':years_c,'district_years':years_d,
        'metrics_fields':mcols,
        'metrics':records(metrics,mcols),
        'votes_fields':['year','arena','level','key','party','votes','share'],
        'votes':records(ptable,['year','arena','level','key','party','votes','share']),
        'leaders':records(winners,['year','arena','level','key','party','votes','share']),
        'quiebre':records(divergence,['year','level','key','quiebre_pp']),
        'sources':sources,
        'notes':{'abstencion':'Participación y abstención de jornada electoral conciliadas a partir de la base presidencial para los resultados de primera ronda y diputaciones.',
                 'ronda':'Ronda 2 usa su propia abstención y sus propias papeletas. Los votos por candidatura legislativa no existen; solo votos por partido.',
                 'provenance':'Los partidos se agrupan por rótulo electoral de la fuente, sin presumir continuidad jurídica de organizaciones homónimas.',
                 'territorio':'Cantones y distritos se mantienen con sus códigos históricos; los territorios sin observación se distinguen de cero votos.'}}
    js=json.dumps(summary,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
    (output/'territorio_base.json').write_text(js,encoding='utf-8')
    audit_report={
        'n_cantones_1953':int(units[units.year==1953].cantcode.nunique()),
        'n_cantones_2026':int(units[units.year==2026].cantcode.nunique()),
        'n_distritos_1953':int(units[units.year==1953].code.nunique()),
        'n_distritos_2026':int(units[units.year==2026].code.nunique()),
        'n_distritos_historicos':int(units.code.nunique()),
        'n_cantones_historicos':int(units.cantcode.nunique()),
        'segundas_rondas':sorted(int(y) for y in src[src.arena=='R'].year.unique()),
        'n_metricas':len(metrics),'n_votos_agrupados':len(ptable),
        'nonexisting_or_notobserved':'Los años sin registro de un territorio se diferencian de cero votos; se utiliza el catálogo observado por elección.',
        'nota_criterios':'La matriz distingue ausencia territorial observada de cero votos. La abstención es común para Presidencia y Diputaciones.',
        'entradas':sources}
    (output/'territorio_auditoria.json').write_text(json.dumps(audit_report,indent=2,ensure_ascii=False),encoding='utf-8')
    print('TERRITORIO',json.dumps({k:v for k,v in audit_report.items() if isinstance(v,(int,list))},ensure_ascii=False))
    return summary,audit_report

if __name__=='__main__':
    import sys
    assemble(sys.argv[1],Path(sys.argv[1])/'salidas'/'datos')
