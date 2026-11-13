'Integra los datos territoriales sin modificar las fuentes Excel.'
from __future__ import annotations
from pathlib import Path
from collections import defaultdict
import sys, re, json, csv, unicodedata, hashlib
import pandas as pd
try:
 from .atlas_fastxlsx import excel_records
except ImportError:
 from atlas_fastxlsx import excel_records
YEARS=[1953,1958,1962,1966,1970,1974,1978,1982,1986,1990,1994,1998,2002,2006,2010,2014,2018,2022,2026]
EPOCHS=[('1953–1974',1953,1974,'#2a9680'),('1978–1998',1978,1998,'#4387bc'),('2002–2022',2002,2022,'#ce8b4e'),('2026',2026,2026,'#945db5')]
PROVS={'1':'San José','2':'Alajuela','3':'Cartago','4':'Heredia','5':'Guanacaste','6':'Puntarenas','7':'Limón'}
EXTRAS={'VOTOS EN BLANCO':'blancos','VOTOS NULOS':'nulos','ABSTENCIONISMO':'abstenciones'}

def normal(s):
 s=unicodedata.normalize('NFKD',str(s or ''))
 return ''.join(c for c in s if not unicodedata.combining(c)).upper().strip()

def sheets(path):
 from zipfile import ZipFile
 from lxml import etree
 with ZipFile(path) as z:
  root=etree.fromstring(z.read('xl/workbook.xml'))
  return {x.get('name') for x in root.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheet')}

def select_source(root,arena):
 root=Path(root)
 pats= ['Base_Electoral_Diputaciones_1953-2026*.xlsx'] if arena=='Diputaciones' else ['Base_Electoral_Presidencial_1953-2026*.xlsx']
 required='Detalle_diputaciones' if arena=='Diputaciones' else 'Detalle_primera_vuelta'
 candidates=[]
 for pat in pats:
  for p in root.glob(pat):
   if p.name.startswith('~$'):continue
   if required in sheets(p):candidates.append(p)
 if not candidates:raise FileNotFoundError(f'Falta el Excel detallado {arena}: hoja {required} en {root}')
 # Evitar lectura accidental de una base provincial antigua; elegir la más completa por tamaño.
 return max(candidates,key=lambda x:x.stat().st_size)

def read_records(root):
 root=Path(root)
 books={a:select_source(root,a) for a in ['Diputaciones','Presidencia']}
 batch=[]
 for arena,book,round_,sheet in [('Diputaciones',books['Diputaciones'],1,'Detalle_diputaciones'),('Presidencia',books['Presidencia'],1,'Detalle_primera_vuelta'),('Presidencia',books['Presidencia'],2,'Detalle_segunda_vuelta')]:
  for r in excel_records(book,sheet):
   try:
    anio=int(r['Año']);cod=str(int(r['Código'])).zfill(5);value=int(r['Votos'])
   except (TypeError,ValueError):continue
   if anio not in YEARS or len(cod)!=5 or value<0:continue
   raw=str(r.get('Partido') or '').strip()
   if not raw:continue
   cat=EXTRAS.get(normal(raw),'partido')
   prv=PROVS.get(cod[0])
   if not prv:continue
   canton=str(r.get('Canton') or '').strip()
   distrito=str(r.get('Distrito') or '').strip()
   batch.append((anio,arena,round_,cod,prv,canton,distrito,raw,cat,value))
 d=pd.DataFrame(batch,columns=['anio','arena','ronda','codigo','provincia','canton','distrito','partido','tipo','votos'])
 if d.empty:raise ValueError('Sin observaciones territoriales validables')
 return d,books

def derive(d):
 d=d.copy()
 d['canton_codigo']=d.codigo.str[:3]
 d['partido_clave']=d.partido.map(normal)
 # Distintas denominaciones observadas se conservan; colisiones solo son colisiones en una misma combinación.
 dup=d.duplicated(['anio','arena','ronda','codigo','partido_clave'])
 if dup.any():
  # Las filas duplicadas son un evento de auditoría, no se ocultan mediante eliminación.
  du=d[dup].copy()
 else:du=d.head(0).copy()
 # Suma de votos válidos observados: no combina blancos, nulos o abstención.
 party=d[d.tipo.eq('partido')].copy()
 identity=party.groupby(['anio','arena','ronda','codigo','provincia','canton_codigo','canton','distrito','partido_clave'],as_index=False,sort=False).votos.sum()
 names=(party.groupby('partido_clave').partido.agg(lambda x:x.value_counts().index[0]).to_dict())
 specs=['provincia','canton_codigo','codigo']
 results={}
 for lvl,cols in [('Provincia',['provincia']),('Cantón',['provincia','canton_codigo','canton']),('Distrito',['provincia','canton_codigo','canton','codigo','distrito'])]:
  part=identity.groupby(['anio','arena','ronda',*cols,'partido_clave'],as_index=False,sort=False).votos.sum()
  part['total_validos']=part.groupby(['anio','arena','ronda',*cols]).votos.transform('sum')
  part['porcentaje']=100*part.votos/part.total_validos.replace(0,float('nan'))
  results[lvl]=part
 # Magnitudes para auditoría y paneles comparables.
 basic=d.pivot_table(index=['anio','arena','ronda','codigo','provincia','canton_codigo','canton','distrito'],columns='tipo',values='votos',aggfunc='sum',fill_value=0).reset_index()
 for c in ['partido','blancos','nulos','abstenciones']:
  if c not in basic:basic[c]=0
 basic['emitidos_en_registro']=basic.partido+basic.blancos+basic.nulos
 basic['padron_analitico']=basic.emitidos_en_registro+basic.abstenciones
 basic['abstencion_pct_analitica']=100*basic.abstenciones/basic.padron_analitico.replace(0,float('nan'))
 # Abstención común homologada. Si la fuente presidencial existe en ese distrito/año,
 # se adopta para la jornada ordinaria en ambos registros, preservando emitidos originales.
 pres=basic[(basic.arena=='Presidencia')&(basic.ronda==1)][['anio','codigo','abstenciones','emitidos_en_registro','padron_analitico']].rename(columns={'abstenciones':'abst_comun','emitidos_en_registro':'emitidos_comunes','padron_analitico':'padron_comun'})
 basic=basic.merge(pres,on=['anio','codigo'],how='left',validate='many_to_one')
 basic['participacion_pct_comun']=100*basic.emitidos_comunes/basic.padron_comun.replace(0,float('nan'))
 basic['abstencion_pct_comun']=100*basic.abst_comun/basic.padron_comun.replace(0,float('nan'))
 # Segunda ronda no comparte padrón con la primera; sus tasas no se homologan a 1ra.
 second=basic.ronda.eq(2)
 basic.loc[second,'participacion_pct_comun']=100*basic.loc[second,'emitidos_en_registro']/basic.loc[second,'padron_analitico'].replace(0,float('nan'))
 basic.loc[second,'abstencion_pct_comun']=basic.loc[second,'abstencion_pct_analitica']
 basic['no_validos']=basic.blancos+basic.nulos
 basic['blancos_pct']=100*basic.blancos/basic.emitidos_en_registro.replace(0,float('nan'))
 basic['nulos_pct']=100*basic.nulos/basic.emitidos_en_registro.replace(0,float('nan'))
 basic['no_validos_pct']=100*basic.no_validos/basic.emitidos_en_registro.replace(0,float('nan'))
 basic['validos_pct']=100*basic.partido/basic.emitidos_en_registro.replace(0,float('nan'))
 return {'observaciones':d,'partidos':identity,'por_nivel':results,'participacion':basic,'duplicados':du,'nombres_partidos':names}

def get_territory_rows(r,level,anio,arena,ronda=1,indicator='abstencion_pct_comun'):
 d=r['participacion']
 d=d[(d.anio==anio)&(d.arena==arena)&(d.ronda==ronda)]
 groups={'Provincia':['provincia'], 'Cantón':['provincia','canton_codigo','canton'], 'Distrito':['provincia','canton_codigo','canton','codigo','distrito']}[level]
 additive=['partido','blancos','nulos','no_validos','emitidos_en_registro','abst_comun','emitidos_comunes','padron_comun']
 agg=d.groupby(groups,as_index=False,sort=False)[additive].sum(min_count=1)
 den=agg.emitidos_en_registro.replace(0,float('nan'))
 pad=agg.padron_comun.replace(0,float('nan'))
 vals={'abstencion_pct_comun':100*agg.abst_comun/pad,'participacion_pct_comun':100*agg.emitidos_comunes/pad,
 'blancos_pct':100*agg.blancos/den,'nulos_pct':100*agg.nulos/den,'no_validos_pct':100*agg.no_validos/den,
 'validos_pct':100*agg.partido/den}
 agg[indicator]=vals[indicator] if indicator in vals else agg[indicator]
 return agg

def top10_matrix(r,level,arena,indicator='abstencion_pct_comun',ronda=1,reverse=True):
 if level=='Provincia':raise ValueError('Top 10 no procede para 7 provincias')
 rows=[]
 for year in YEARS:
  if ronda==2 and year not in [2002,2014,2018,2022]:continue
  df=get_territory_rows(r,level,year,arena,ronda,indicator)
  df=df.dropna(subset=[indicator]).sort_values([indicator,'provincia'],ascending=[not reverse,True],kind='stable').head(10)
  for rank,row in enumerate(df.to_dict('records'),1):rows.append(dict(anio=year,puesto=rank,nombre=(row['canton'] if level=='Cantón' else row['distrito']),provincia=row['provincia'],canton=row.get('canton'),codigo=row.get('codigo',row.get('canton_codigo')),indicador=indicator,valor=row[indicator]))
 return pd.DataFrame(rows)

def territory_winners(r,level,arena,ronda=1):
 d=r['por_nivel'][level];d=d[(d.arena==arena)&(d.ronda==ronda)]
 groupcols={'Provincia':['anio','provincia'],'Cantón':['anio','provincia','canton_codigo','canton'],'Distrito':['anio','provincia','canton_codigo','canton','codigo','distrito']}[level]
 d=d.sort_values(['anio','votos','partido_clave'],ascending=[True,False,True],kind='stable').drop_duplicates(groupcols)
 return d.copy()

def stable_bastions(r,arena='Diputaciones',level='Cantón',min_elections=2,min_pct=3.0,min_escanos=0):
 # Diferencial respecto al voto nacional del mismo partido y elección.
 sub=r['por_nivel'][level];sub=sub[(sub.arena==arena)&(sub.ronda==1)].copy()
 nat=r['partidos'];nat=nat[(nat.arena==arena)&(nat.ronda==1)]
 nat=nat.groupby(['anio','partido_clave'],as_index=False).votos.sum();nat['total']=nat.groupby('anio').votos.transform('sum')
 nat['nacional_pct']=100*nat.votos/nat.total.replace(0,float('nan'))
 sub=sub.merge(nat[['anio','partido_clave','nacional_pct']],on=['anio','partido_clave'],how='left',validate='many_to_one')
 sub['ventaja_pp']=sub.porcentaje-sub.nacional_pct
 records=sub[(sub.nacional_pct>=min_pct)&(sub.ventaja_pp>0)].copy()
 groups=['provincia','canton_codigo','canton','partido_clave'] if level=='Cantón' else ['provincia','codigo','distrito','partido_clave'] if level=='Distrito' else ['provincia','partido_clave']
 all_participations=sub.groupby(groups,dropna=False).anio.nunique().rename('elecciones_observadas')
 scores=records.groupby(groups,dropna=False).agg(elecciones_fortaleza=('anio','nunique'),ventaja_media_pp=('ventaja_pp','mean'),ventaja_max_pp=('ventaja_pp','max'),mayor_porcentaje=('porcentaje','max')).join(all_participations,how='left').reset_index()
 scores=scores[scores.elecciones_fortaleza>=min_elections].sort_values(['elecciones_fortaleza','ventaja_media_pp'],ascending=False)
 return scores

def audit(r):
 d=r['participacion'];out={}
 out['elecciones']=sorted(int(x) for x in d.anio.unique())
 out['distritos_2026']=int(d[(d.anio==2026)&(d.arena=='Presidencia')&(d.ronda==1)].codigo.nunique())
 out['registros_fuente']=len(r['observaciones'])
 out['duplicados_clave']=len(r['duplicados'])
 out['votos_negativos']=int((d.partido<0).sum())
 out['segundas_rondas']=sorted(int(x) for x in d[d.ronda==2].anio.unique())
 out['niveles']={level:len(table) for level,table in r['por_nivel'].items()}
 # Las diferencias entre arenas no se ocultan (especialmente 1953 y 1974).
 pm=d[d.ronda==1].pivot_table(index=['anio','codigo'],columns='arena',values='emitidos_en_registro',aggfunc='sum')
 diff=pm['Diputaciones']-pm['Presidencia']
 out['distritos_con_diferencias_emitidos_entre_papeletas']=int(diff.fillna(0).ne(0).sum())
 return out

def build_payload(r, colors=None):
 # Tuplas compactas para lectura local sin red. Códigos guardan ceros iniciales.
 d=r['observaciones'];parties=sorted(d[d.tipo.eq('partido')].partido.unique())
 pidx={x:i for i,x in enumerate(parties)}
 provs=PROVS
 places={}
 for row in d[['anio','codigo','provincia','canton','distrito']].drop_duplicates().itertuples(index=False,name=None):
  y,c,p,ct,ds=row;places[f'{y}|{c}']=[p,ct,ds]
 records=[]
 for y,a,rd,code,party,typ,votes in d[['anio','arena','ronda','codigo','partido','tipo','votos']].itertuples(index=False,name=None):
  records.append([int(y),0 if a=='Presidencia' else 1,int(rd),code,int(pidx[party]) if typ=='partido' else {'blancos':-1,'nulos':-2,'abstenciones':-3}[typ],int(votes)])
 return {'schema':'atlas-v28-1','years':YEARS,'parties':parties,'rows':records,'places':places,'colors':colors or {},'source':'Excel electorales territoriales conciliados'}

def load_party_colors(folder):
 path=Path(folder)/'recursos'/'colores_partidos.json'
 if not path.is_file():return {}
 catalog=json.loads(path.read_text(encoding='utf-8'))
 return {normal(x.get('partido')):x.get('color') for x in catalog if isinstance(x,dict) and x.get('color') and str(x.get('color')).startswith('#')}

def snapshot(root,outdir=None):
 root=Path(root)
 outdir=Path(outdir or root/'salidas'/'datos');outdir.mkdir(parents=True,exist_ok=True)
 sources={a:select_source(root,a) for a in ['Diputaciones','Presidencia']}
 hashes={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in sources.values()}
 manifest=outdir/'territorios_manifiesto.json'
 json_path=outdir/'territorios.json'
 if manifest.is_file() and json_path.is_file():
  old=json.loads(manifest.read_text(encoding='utf-8'))
  if old.get('hashes')==hashes:return json_path,old
 r=derive(read_records(root)[0]);a=audit(r)
 palette=load_party_colors(root)
 # colors only verified matches; unknown parties rendered neutral.
 colors={p:palette.get(normal(p),'#8999a5') for p in r['observaciones'].partido.unique() if normal(p) not in EXTRAS}
 json_path.write_text(json.dumps(build_payload(r,colors),ensure_ascii=False,separators=(',',':')),encoding='utf-8')
 m={'hashes':hashes,'auditoria':a,'archivos':[str(x.name) for x in sources.values()]}
 manifest.write_text(json.dumps(m,ensure_ascii=False,indent=2),encoding='utf-8')
 return json_path,m
