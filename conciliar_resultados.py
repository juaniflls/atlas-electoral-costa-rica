'Concilia los indicadores provinciales y nacionales entre fuentes compatibles.'
from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET
import json, collections, re
ROOT=Path(__file__).resolve().parent
NS={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
def norm(text):
 import unicodedata
 return ''.join(c for c in unicodedata.normalize('NFD',str(text or '').upper()) if unicodedata.category(c)!='Mn')
def presidential_consolidated(path):
 out={}
 with ZipFile(path) as z:
  wb=ET.fromstring(z.read('xl/workbook.xml'));rel=ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
  target={e.get('Id'):e.get('Target').lstrip('/') for e in rel}
  shared=[]
  if 'xl/sharedStrings.xml' in z.namelist():
   root=ET.fromstring(z.read('xl/sharedStrings.xml'))
   for si in root.findall('s:si',NS):shared.append(''.join(si.itertext()))
  for sheet in wb.findall('s:sheets/s:sheet',NS):
   title=sheet.get('name')
   if not title.isdigit() or not 1953<=int(title)<=2026:continue
   fn=target[sheet.get('{'+NS['r']+'}id')]
   if not fn.startswith('xl/'):fn='xl/'+fn
   ws=ET.fromstring(z.read(fn));rows=[]
   for rr in ws.findall('s:sheetData/s:row',NS):
    vals={}
    for c in rr.findall('s:c',NS):
     ref=re.match(r'[A-Z]+',c.get('r',''))
     if ref is None:continue
     v=c.find('s:v',NS); inline=c.find('s:is',NS)
     if v is not None:
      value=shared[int(v.text)] if c.get('t')=='s' else v.text
     else:value=''.join(inline.itertext()) if inline is not None else ''
     vals[ref.group()]=value
    if vals:rows.append(vals)
   header=next((r for r in rows if norm(r.get('A','')).startswith('VOTOS') and 'ABSTENCIONISMO' in [norm(v) for v in r.values()]),None)
   if header is None:raise ValueError('No se encontró encabezado presidencial: '+title)
   idx={norm(x):k for k,x in header.items()}
   abst_col=idx['ABSTENCIONISMO'];pad_col=idx['TOTAL PADRON']
   found=0
   for row in rows[rows.index(header)+1:]:
    if found==7:break
    name=norm(row.get('A',''))
    if name in ('ALAJUELA','CARTAGO','GUANACASTE','HEREDIA','LIMON','PUNTARENAS','SAN JOSE'):
     province={'SAN JOSE':'San José','LIMON':'Limón','ALAJUELA':'Alajuela','CARTAGO':'Cartago','GUANACASTE':'Guanacaste','HEREDIA':'Heredia','PUNTARENAS':'Puntarenas'}[name]
     out[(int(title),province)]=(int(float(row[abst_col])),int(float(row[pad_col])))
     found+=1
 # Country = sum provinces only, no foreign vote; second rounds not involved
 for y in sorted({k[0] for k in out}):
  sub=[(ab,pa) for (yr,p),(ab,pa) in out.items() if yr==y]
  if len(sub)!=7:raise ValueError(f'{y}: se esperaban siete provincias, hay {len(sub)}')
  out[(y,'CR')]=(sum(x[0] for x in sub),sum(x[1] for x in sub))
 return out

def run():
 p=ROOT/'salidas/datos/territorio_integrado.json';v=json.loads(p.read_text(encoding='utf-8'))
 reference=presidential_consolidated(ROOT/'Base_Electoral_Presidencial_1953-2026.xlsx')
 f={x:i for i,x in enumerate(v['metrics_fields'])};changed=0
 for row in v['metrics']:
  y=row[f['year']];a=row[f['arena']];level=row[f['level']];k=row[f['key']]
  if a not in ('P','L') or level not in ('p','n'):continue
  if (y,k) not in reference:raise ValueError(f'Sin referencia presidencial {y} {k}')
  abst,pad=reference[(y,k)];row[f['abstenciones']]=abst;row[f['padron_analitico']]=pad;row[f['asistencia_estimada']]=pad-abst
  row[f['abst_pct']]=round(100*abst/pad,8);row[f['part_pct']]=round(100*(pad-abst)/pad,8)
  row[f['emip_pct']]=round(100*row[f['emitidos']]/pad,8)
  changed+=1
 assert changed==19*8*2,changed
 v['version']='27.0';v.setdefault('sources',[]).append({'metodo':'conciliacion_participacion_2026_11_12','referencia':'hojas presidenciales consolidadas','niveles':['provincia','nacional'],'filas_actualizadas':changed})
 p.write_text(json.dumps(v,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
 m={(r[f['year']],r[f['arena']],r[f['level']],r[f['key']]):r for r in v['metrics']}
 for (y,pro),_ in reference.items():
  lev='n' if pro=='CR' else 'p';p=m[(y,'P',lev,pro)];l=m[(y,'L',lev,pro)]
  for field in ('abst_pct','part_pct','abstenciones','padron_analitico'):
   assert p[f[field]]==l[f[field]],(y,pro,field)
 print(f'Conciliación : {changed} registros provinciales/nacionales, 19 elecciones, dos arenas; 0 diferencias en indicadores comunes.')
 print('San José 1953:',reference[(1953,'San José')],'San José 2026:',reference[(2026,'San José')])
if __name__=='__main__':run()
