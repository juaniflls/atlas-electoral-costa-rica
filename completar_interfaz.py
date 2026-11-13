'Compila la presentación y las consultas territoriales de la aplicación.'
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parent
RES=ROOT/'recursos'
s=(RES/'atlas_interfaz_base.js').read_text(encoding='utf-8')
assert 'function participationExplorer(){' in s
begin=s.index('function participationExplorer(){')
end=s.index('function matrixSVG(',begin)
new=(RES/'participacion.txt').read_text(encoding='utf-8')
s=s[:begin]+new+'\n'+s[end:]
# Establecer vocabulario de interfaz de usuario, eliminando comentarios de desarrollo.
s=s.replace('/* Atlas V25 · Integración territorial en visores existentes. No crea un tercer explorador. */','/* Atlas Electoral · motor de consulta territorial */')
s=s.replace('if(window.AtlasV25Integrado)return;','if(window.AtlasV27Integrado)return;')
s=s.replace('window.AtlasV26Integrado={version:\'26.0\'','window.AtlasV27Integrado={version:\'27.0\'')
s=s.replace('La matriz provincial original se mantiene. La versión cantonal reproduce el diseño de cuadrados con colores partidarios y los años en el eje inferior.','Consulte los primeros lugares por partido en las 19 elecciones. Alterne entre provincias y cantones.')
s=s.replace('Provincias · gráfica original','Provincias')
s=s.replace('Cantones · matriz histórica','Cantones')
s=s.replace('Se conserva la visualización aprobada de provincias en su ubicación original.','La vista de provincias conserva su posición en la sección.')
s=s.replace('Vista preliminar: 120 registros. Las descargas contienen todas las filas que cumplen los filtros, no solamente las visibles.','Se muestran 120 registros por página de consulta; la exportación incluye todas las filas filtradas.')
s=s.replace('Registros originales de la consulta','Consulta de registros')
s=s.replace('Conservar la navegación','Navegación')
s=s.replace('La matriz provincial original se mantiene','La matriz provincial está disponible')
# 07: resultados dentro del grid del explorador existente, después de mapa y distribución.
s=s.replace('const grid=shell.querySelector(\'.ar-grid\');if(grid)grid.after(area);else shell.append(area);',"const grid=shell.querySelector('.ar-grid');if(grid){const pair=[...grid.children];(pair[1]||pair[0]||grid).after(area)}else shell.append(area);")
s=s.replace('if(!root?.__atlasResultControl||root.querySelector(\'#atlas-v26-detail\'))return;',"if(!root?.__atlasResultControl||root.querySelector('#atlas-v26-detail'))return;")
s=s.replace("<h3>Resultados detallados por territorio</h3><p>La consulta utiliza la selección superior y conserva el mapa y los resultados anteriores. Desglose los votos sin cambiar de explorador.</p>","<h3>Desglose de resultados electorales</h3><p>Elija el territorio desde el mapa o desde la selección superior. Consulte provincias, cantones y distritos sin salir de esta elección.</p>")
s=s.replace('''<div class="a26-tools">${select('a26-detail-level','División territorial',[['p','Provincia'],['c','Cantón'],['d','Distrito']])}${select('a26-detail-round','Ronda presidencial',[['P','Primera ronda'],['R','Segunda ronda']])}${select('a26-detail-zone','Territorio',[['all','Todos los territorios']])}${select('a26-detail-party','Partido',[['','Todos los partidos']])}</div>''','''<nav id="a27-geo-nav" class="a27-geo-nav" aria-label="Niveles territoriales"><button type="button" data-level="n">Costa Rica</button><button type="button" data-level="p">Provincias</button><button type="button" data-level="c">Cantones</button><button type="button" data-level="d">Distritos</button></nav><div id="a27-geo-path" class="a27-geo-path"></div>
 <div class="a26-tools">${select('a26-detail-level','Desglose',[['n','Costa Rica'],['p','Provincias'],['c','Cantones'],['d','Distritos']])}${select('a26-detail-round','Ronda',[['P','Primera ronda'],['R','Segunda ronda']])}${select('a26-detail-zone','Selección territorial',[['all','Todos los territorios']])}${select('a26-detail-party','Partido',[['','Todos los partidos']])}</div>''')
s=s.replace('''<div class="a26-metric-cards" id="a26-detail-summary"></div>''','''<div id="a27-province-jump" class="a27-province-jump"></div><div class="a26-metric-cards" id="a26-detail-summary"></div>''')
s=s.replace('<th>% de válidos</th></tr></thead><tbody>','<th>% de válidos</th><th>Detalle</th></tr></thead><tbody>',1)
# Nuevos identificadores de territorio para navegación directa.
s=s.replace("const $=id=>area.querySelector('#'+id);let filtered=[],full=[],nominal=[],nominalFiltered=[],page=0,nomPage=0,current={};", "const $=id=>area.querySelector('#'+id);let filtered=[],full=[],nominal=[],nominalFiltered=[],page=0,nomPage=0,current={},selectedCanton='';")
s=s.replace("const geo=l==='p'?(p==='Costa Rica'?provinces.map(x=>({key:x,name:x})): [{key:p,name:p}]):", "const geo=l==='n'?[{key:'CR',name:'Costa Rica'}]:l==='p'?(p==='Costa Rica'?provinces.map(x=>({key:x,name:x})): [{key:p,name:p}]):")
s=s.replace("districts.filter(x=>p==='Costa Rica'||x.province===p).filter(x=>V.district_years[x.code]?.includes(y))", "districts.filter(x=>(p==='Costa Rica'||x.province===p)&&(!selectedCanton||x.cantonCode===selectedCanton)).filter(x=>V.district_years[x.code]?.includes(y))")
s=s.replace("old=$('a26-detail-zone').value;$('a26-detail-zone').innerHTML", "old=$('a26-detail-zone').value;$('a26-detail-zone').innerHTML")
s=s.replace("const zone=$('a26-detail-zone').value;const selected=geo.filter(x=>zone==='all'||x.key===zone);",'''const zone=$('a26-detail-zone').value;const selected=geo.filter(x=>zone==='all'||x.key===zone);
  const path=[y,p,l==='n'?'País':l==='p'?'Provincias':l==='c'?'Cantones':'Distritos'];if(selectedCanton&&l==='d')path.push(cantonIndex.get(selectedCanton)?.name||selectedCanton);
  $('a27-geo-path').textContent=path.join('  /  ');
  area.querySelectorAll('#a27-geo-nav [data-level]').forEach(button=>{button.classList.toggle('active',button.dataset.level===l);button.setAttribute('aria-pressed',button.dataset.level===l?'true':'false')});
  $('a27-province-jump').innerHTML=p==='Costa Rica'&&l==='p'?provinces.map(q=>`<button data-province="${esc(q)}" type="button">${esc(q)}</button>`).join(''):'';''')
s=s.replace("let result=selected.flatMap(x=>dataVotes(y,s.arena,l,x.key).map(r=>", "let result=selected.flatMap(x=>dataVotes(y,s.arena,l,x.key).map(r=>")
s=s.replace("Provincia:p==='Costa Rica'?(l==='p'?x.key:l==='c'?cantonIndex.get(x.key)?.province:districtIndex.get(x.key)?.province):p,Division:l==='p'?'Provincia':l==='c'?'Cantón':'Distrito'", "Provincia:p==='Costa Rica'?(l==='n'?'Costa Rica':l==='p'?x.key:l==='c'?cantonIndex.get(x.key)?.province:districtIndex.get(x.key)?.province):p,Division:l==='n'?'Nacional':l==='p'?'Provincia':l==='c'?'Cantón':'Distrito'")
s=s.replace("current={year:y,arena:s.arena,province:p,level:l,zone,geo};", "current={year:y,arena:s.arena,province:p,level:l,zone,geo};")
s=s.replace("$('a26-detail-title').textContent=`${names[s.arena]} · ${p} · ${y} · ${l==='p'?'Provincias':l==='c'?'Cantones':'Distritos'}`;", "$('a26-detail-title').textContent=`${names[s.arena]} · ${p} · ${y} · ${l==='n'?'Costa Rica':l==='p'?'Provincias':l==='c'?'Cantones':'Distritos'}`;")
s=s.replace("const oldMap=root.querySelector('[data-role=\"map\"]')?.closest('.ar-panel');if(oldMap){oldMap.hidden=s.arena==='R';}", "const oldMap=root.querySelector('[data-role=\"map\"]')?.closest('.ar-panel');if(oldMap){oldMap.hidden=s.arena==='R';}")
# Original map in R hidden, second round map appended within map region by CSS grid, not extra 'atlas' block.
s=s.replace("$('a26-detail-plot').hidden=current.level==='p';if(current.level==='p')return;", "$('a26-detail-plot').hidden=false;")
s=s.replace("x.Territorio+' · '+r.Territorio", "x.Territorio+' · '+r.Territorio")
# Table drill actions: province -> cantons; canton -> districts.
s=s.replace('''</strong></td></tr>`).join('')+'</tbody>';''', '''</strong></td><td>${current.level==='p'?`<button data-open-province="${esc(r.Codigo)}">Ver cantones</button>`:current.level==='c'?`<button data-open-canton="${esc(r.Codigo)}">Ver distritos</button>`:'—'}</td></tr>`).join('')+'</tbody>';''',1)
s=s.replace("function drawNominal(){",'''$('a26-detail-table').addEventListener('click',event=>{
  const prov=event.target.closest('[data-open-province]'),cant=event.target.closest('[data-open-canton]');
  if(prov){const dropdown=root.querySelector('[data-role="province"]');if(dropdown){dropdown.value=prov.dataset.openProvince;dropdown.dispatchEvent(new Event('change',{bubbles:true}));}selectedCanton='';$('a26-detail-level').value='c';sync();}
  if(cant){selectedCanton=cant.dataset.openCanton;$('a26-detail-level').value='d';sync();}
 });
 $('a27-geo-nav').addEventListener('click',event=>{const b=event.target.closest('[data-level]');if(!b)return;selectedCanton='';$('a26-detail-level').value=b.dataset.level;sync()});
 $('a27-province-jump').addEventListener('click',event=>{const b=event.target.closest('[data-province]');if(!b)return;const d=root.querySelector('[data-role="province"]');if(d){d.value=b.dataset.province;d.dispatchEvent(new Event('change',{bubbles:true}));}$('a26-detail-level').value='c';sync()});
 function drawNominal(){''',1)
s=s.replace("if(e.target.id==='a26-detail-party')drawTable();else if(e.target.id==='a26-nom-status')drawNominal();else sync()", "if(e.target.id==='a26-detail-party')drawTable();else if(e.target.id==='a26-nom-status')drawNominal();else {if(e.target.id==='a26-detail-level')selectedCanton='';sync()}")
s=s.replace("root.addEventListener('change',e=>{if(!area.contains(e.target))sync()},true);", "root.addEventListener('change',e=>{if(!area.contains(e.target)){if(e.target.matches('[data-role=\\\"province\\\"]')){selectedCanton='';$('a26-detail-level').value=e.target.value==='Costa Rica'?'p':'c';}sync()}},true);")
s=s.replace("if(ext==='csv')return csv(filtered,file+'.csv');await Plotly.downloadImage($('a26-detail-plot'),{format:ext,filename:file,width:1600,height:Math.max(750,$('a26-detail-plot').offsetHeight),scale:ext==='png'?2:1});", "if(ext==='csv')return csv(filtered,file+'.csv');const plot=$('a26-detail-plot');if(!plot.hidden&&plot.data?.length)await Plotly.downloadImage(plot,{format:ext,filename:file,width:1600,height:Math.max(750,plot.offsetHeight),scale:ext==='png'?2:1});else return downloadMatrix(matrixSVG(area.querySelector('.a26-big-table'),$('a26-detail-title').textContent),ext,file);")
# Home should show country first; province changes drill into cantons (no odd select chaining).
s=s.replace("const mapDiv=$('a26-detail-map');", "const mapDiv=$('a26-detail-map');$('a26-detail-level').value='p';")
# Meaningful bastions: only recurring and electorally significant organizations in the data.
s=s.replace("const all=[...new Set(voteRows.filter(r=>r.level==='n'&&(r.arena==='P'||r.arena==='L')).map(r=>r.party))].sort((a,b)=>a.localeCompare(b,'es'));",'''const statistics=new Map();for(const r of voteRows.filter(r=>r.level==='n'&&r.arena==='L')){const k=norm(r.party);if(!statistics.has(k))statistics.set(k,{party:r.party,years:new Set(),max:0,total:0,elected:false});const q=statistics.get(k);q.years.add(r.year);q.max=Math.max(q.max,r.share||0);q.total+=r.votes||0;}
 const electa=new Set((V.nomination_rows||[]).filter(r=>r.arena==='L'&&r.elected).map(r=>norm(r.party)));for(const [k,v] of statistics)v.elected=electa.has(k);
 const all=[...statistics.values()].filter(q=>q.years.size>=2&&(q.elected||q.max>=3)).sort((a,b)=>b.years.size-a.years.size||b.total-a.total).map(q=>q.party);
 if(!all.length)return;''')
s=s.replace("'Identifique dónde cada partido mantiene una ventaja relativa frente a su resultado nacional y durante cuántas elecciones observa ese apoyo.'", "'Compare las organizaciones con participación reiterada y apoyo significativo. Consulte ventajas sobre el porcentaje nacional y su recurrencia histórica.'")
s=s.replace("'Bastiones electorales · concentración y persistencia'","'Bastiones electorales · fortaleza y persistencia'")
s=s.replace("Seleccioná una barra para examinar la serie electoral del territorio.","Seleccione un territorio para examinar sus resultados a lo largo del tiempo.")
# No repetir columnas territoriales sin necesidad en la matriz de líderes cantonales.
s=s.replace("html+=`<tr><td class=\"a26-province-col\"></td><th class=\"a26-canton-col\">${esc(c.name)}</th>`;", "html+=`<tr><td class=\"a26-province-col\"></td><th class=\"a26-canton-col\">${esc(c.name)}</th>`;")
# El mensaje público nunca describe la historia del código.
s=s.replace("No existía en la fuente de esa elección","No existía en esa elección")
s=s.replace("'Sin registro de este territorio para la elección'","'Territorio no disponible para esa elección'")
s=s.replace("'La vista de provincias conserva su posición en la sección.'","''")
# Navegación y consistencia de los resultados entre primera y segunda ronda.
s=s.replace("if(oldMap){oldMap.hidden=s.arena==='R';}", "if(oldMap){oldMap.hidden=s.arena==='R';} const oldBars=root.querySelector('[data-role=\"bars\"]')?.closest('.ar-panel');if(oldBars)oldBars.hidden=s.arena==='R';const oldTable=root.querySelector('[data-role=\"body\"]')?.closest('.ar-panel');if(oldTable)oldTable.hidden=s.arena==='R';const comp=root.querySelector('[data-role=\"comp-table\"]')?.closest('.ar-integration');if(comp)comp.hidden=s.arena==='R';")
s=s.replace("if(!b)return;selectedCanton='';$('a26-detail-level').value=b.dataset.level;sync()", "if(!b)return;selectedCanton='';const original=root.querySelector('[data-role=\"province\"]');if(b.dataset.level==='n'&&original){original.value='Costa Rica';original.dispatchEvent(new Event('change',{bubbles:true}))}$('a26-detail-level').value=b.dataset.level;sync()")
s=s.replace("'No existía en esa elección'", "'No existía en esa elección'")

# El mapa original debe recuperar el título «Mapa provincial de resultados» cuando no se selecciona un partido.
s=s.replace("<p>La consulta utiliza la selección superior", "<p>La consulta utiliza la selección superior")
# Exploración libre con tablas cruzadas y acceso al paquete de fuentes.
s=s.replace('<option value="aggregate">Resumen por dimensión</option>', '<option value="aggregate">Resumen por dimensión</option><option value="pivot">Cruce de filas y columnas</option>')
s=s.replace("${select('a26-data-measure','Indicador numérico'", "${select('a27-data-row','Filas (X)',[['key','Territorio / código'],['party','Partido'],['year','Año'],['arena','Arena'],['level','División territorial'],['province','Provincia'],['office','Cargo']])}${select('a27-data-column','Columnas (Y)',[['year','Elección'],['arena','Arena'],['level','División territorial'],['party','Partido'],['province','Provincia'],['office','Cargo']])}${select('a26-data-measure','Indicador numérico'")
a='<div class="a26-exportbar"><span id="a26-data-count"></span>'
b='<div class="a27-source-download"><div><strong>Bases de datos del Atlas</strong><span>Ocho archivos Excel incluidos en el paquete del proyecto.</span></div><a href="Atlas_Bases_Electorales_Originales.zip" download="Atlas_Bases_Electorales_Originales.zip">Descargar ocho bases Excel (ZIP)</a><details><summary>Archivos incluidos</summary><p>Resultados presidenciales, resultados legislativos, candidaturas presidenciales, candidaturas legislativas, diputaciones electas, diseño de papeletas legislativas, partidos políticos y partidos cancelados.</p></details></div>'+a
assert a in s;s=s.replace(a,b,1)
a="  selection=filtered;"
b="""  if($('a26-data-operation').value==='pivot'){
   const rowField=$('a27-data-row').value,colField=$('a27-data-column').value,metric=$('a26-data-measure').value,method=$('a26-data-agg').value;
   const pivot=new Map(),colSet=new Set();
   for(const r of filtered){if(r[rowField]==null||r[colField]==null)continue;const val=Number(r[metric]);if(!Number.isFinite(val))continue;const rw=String(r[rowField]),cl=String(r[colField]);colSet.add(cl);if(!pivot.has(rw))pivot.set(rw,new Map());const mm=pivot.get(rw);if(!mm.has(cl))mm.set(cl,[]);mm.get(cl).push(val)}
   const columns=[...colSet].sort((a,b)=>a.localeCompare(b,'es',{numeric:true})).slice(0,80);
   const reduce=arr=>method==='sum'?arr.reduce((a,b)=>a+b,0):method==='mean'?arr.reduce((a,b)=>a+b,0)/arr.length:method==='min'?Math.min(...arr):Math.max(...arr);
   filtered=[...pivot].map(([r,m])=>Object.assign({[rowField]:r},...columns.map(c=>({[c]:m.get(c)?.length?reduce(m.get(c)):null})))).sort((a,b)=>String(a[rowField]).localeCompare(String(b[rowField]),'es',{numeric:true}));
  }
  selection=filtered;"""
assert a in s;s=s.replace(a,b,1)

# UI look up from scroll: retrieve present pane, no duplicate root blocks.
s=s.replace("window.AtlasV26Integrado={version:'26.0'", "window.AtlasV27Integrado={version:'27.0'")
s=s.replace("window.AtlasV25Integrado=", "window.AtlasV27Integrado=")
# Preserve code validity; temporary file may not be delivered until node --check passes.
(RES/'atlas_interfaz.js').write_text(s,encoding='utf-8')
style=(RES/'atlas_interfaz_base.css').read_text(encoding='utf-8')+'\n'+(RES/'diseno.txt').read_text(encoding='utf-8')
(RES/'atlas_interfaz.css').write_text(style,encoding='utf-8')
print('JS bytes',len(s),'CSS bytes',len(style))
