from pathlib import Path
from zipfile import ZipFile
from lxml import etree
import re, posixpath
MAIN='http://schemas.openxmlformats.org/spreadsheetml/2006/main'
REL='http://schemas.openxmlformats.org/officeDocument/2006/relationships'
V='{'+MAIN+'}v'; C='{'+MAIN+'}c'; ROW='{'+MAIN+'}row'; IS='{'+MAIN+'}is'; T='{'+MAIN+'}t'
COL=re.compile(r'([A-Z]+)')
def col_idx(cell):
 a=COL.match(cell).group(1);n=0
 for c in a:n=n*26+ord(c)-64
 return n-1

def iter_excel(path, name):
 with ZipFile(path) as z:
  w=etree.fromstring(z.read('xl/workbook.xml'));rels=etree.fromstring(z.read('xl/_rels/workbook.xml.rels'))
  relmap={x.get('Id'):x.get('Target') for x in rels}
  sheet=next((x for x in w.findall('.//{'+MAIN+'}sheet') if x.get('name')==name),None)
  if sheet is None: raise KeyError(name)
  tgt=relmap[sheet.get('{'+REL+'}id')].lstrip('/')
  if not tgt.startswith('xl/'):tgt='xl/'+tgt
  ss=[]
  if 'xl/sharedStrings.xml' in z.namelist():
   root=etree.fromstring(z.read('xl/sharedStrings.xml'))
   ss=[''.join(x.itertext()) for x in root.findall('{'+MAIN+'}si')]
  with z.open(tgt) as f:
   for event, row in etree.iterparse(f,events=('end',),tag=ROW):
    vals={}
    for c in row.iterchildren(tag=C):
     v=c.find(V)
     typ=c.get('t')
     if v is not None:
      value=v.text
      if typ=='s' and value is not None:value=ss[int(value)]
      elif typ not in ('str','e') and value is not None:
       try:
        number=float(value);value=int(number) if number.is_integer() else number
       except:pass
     elif typ=='inlineStr':value=''.join(c.find(IS).itertext()) if c.find(IS) is not None else ''
     else:value=None
     vals[col_idx(c.get('r'))]=value
    if vals:yield vals
    row.clear()
    while row.getprevious() is not None:del row.getparent()[0]

def excel_records(path,sheet):
 iterator=iter_excel(path,sheet)
 headers=next(iterator)
 fields=[headers.get(i,'') for i in range(max(headers)+1)]
 for row in iterator:
  yield dict(zip(fields,[row.get(i) for i in range(len(fields))]))
