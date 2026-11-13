/* Atlas V23.19 · Atlas público, arena electoral y cobertura legislativa independientes. */
(function(){
 'use strict';
 if(window.ATLAS237_OK||typeof views==='undefined'||typeof D==='undefined')return;
 const PROVINCIAS=['San José','Alajuela','Cartago','Heredia','Guanacaste','Puntarenas','Limón'];
 const GRUPOS=['Toda la participación legislativa','Uniprovincial','Multiprovincial','Nacional'];
 const METRICAS=[['partidos','Partidos'],['candidaturas','Candidaturas a diputaciones'],['diputaciones','Diputaciones electas']];
 const NIVELES=['1 · Participación presidencial y legislativa','2 · Cobertura legislativa: uni, multi y nacional','3 · Siete provincias por elección'];
 const STATES=['Sin participación legislativa','Uniprovincial','Multiprovincial','Nacional'];
 const ARENAS=['Solo legislativa','Presidencial y legislativa','Solo presidencial'];
 const AMBITOS=[['Toda la participación legislativa','Todos'],['Solo legislativa','Solo legislativa'],['Presidencial y legislativa','Presidencial y legislativa']];
 const palette={
  'Nacional':['#f2f0fc','#7850aa'],'Solo legislativa':['#ecfaf5','#23836d'],
  'Presidencial y legislativa':['#ecf2ff','#385faa'],'Solo presidencial':['#fff1ec','#bc6d45'],
  'Toda la participación legislativa':['#e9f7f8','#1b8292'],
  'Sin participación legislativa':['#f6f4f1','#a19b92'],
  'Uniprovincial':['#fff9ef','#b66e21'],'Multiprovincial':['#f4f9ff','#3674b5'],
  'San José':['#f5faff','#528bcd'],'Alajuela':['#f4fff7','#4c9f6d'],
  'Cartago':['#fff9ef','#ca9048'],'Heredia':['#fbf7ff','#9b71c6'],
  'Guanacaste':['#fff7f2','#cc8150'],'Puntarenas':['#f2fcfd','#4e96a4'],
  'Limón':['#fff6fb','#bd718e'],'Costa Rica · total':['#f2f7fc','#5b86a3']
 };
 const REG=D.participaciones_partidarias||[],
   C=[...(D.candidaturas||[]),...(window.ATLAS237_EXTRA_CANDIDATURAS||[])],
   E=D.electas||[];
 const LEGIS=REG.filter(x=>String(x['Participación legislativa']).trim()==='Sí');
 const byParty=new Map(REG.map(r=>[Number(r['Año'])+'|'+r['Denominación electoral'],r]));
 const byIdentity=new Map();
 REG.forEach(r=>{const id=String(r['ID partido']);if(!byIdentity.has(id))byIdentity.set(id,[]);byIdentity.get(id).push(r);});
 for(const rows of byIdentity.values())rows.sort((a,b)=>Number(a['Año'])-Number(b['Año']));
 const coverage=new Set([
  ...C.map(r=>Number(r.anio)+'|'+r.partido+'|'+r.provincia),
  ...(D.votos||[]).filter(r=>r.arena==='Legislativa'&&Number(r.ronda)===1&&
    r.provincia!=='Nacional'&&Number(r.votos)>0)
   .map(r=>Number(r.anio)+'|'+r.partido+'|'+r.provincia)
 ]);
 const pid=r=>String(r?.['ID partido']??'');
 const findParty=r=>byParty.get(Number(r.anio)+'|'+r.partido);
 const arena=r=>{
  const p=String(r['Participación presidencial']).trim()==='Sí';
  const l=String(r['Participación legislativa']).trim()==='Sí';
  return p&&l?'Presidencial y legislativa':p?'Solo presidencial':'Solo legislativa';
 };
 const stateOf=r=>{
  const n=Number(r['Provincias legislativas']||0);
  return n===7?'Nacional':n>=2&&n<=6?'Multiprovincial':n===1?'Uniprovincial':'Sin participación legislativa';
 };
 const lifetime=rows=>{
  const p=rows.some(x=>String(x['Participación presidencial']).trim()==='Sí');
  const l=rows.some(x=>String(x['Participación legislativa']).trim()==='Sí');
  return p&&l?'Presidencial y legislativa (historial)':p?'Solo presidencial (historial)':'Solo legislativa (historial)';
 };
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=n=>Number(n||0).toLocaleString('es-CR',{maximumFractionDigits:0});
 const per=(n,d)=>d>0?100*n/d:null;
 const pct=v=>v===null?'s/b':v.toFixed(1)+'%';
 const years=()=>yearsVisible().map(Number);
 const metricLabel=metric=>METRICAS.find(x=>x[0]===metric)?.[1]||metric;
 const match=(r,group)=>group==='Todos'?true:
  group==='Toda la participación legislativa'?stateOf(r)!=='Sin participación legislativa':
  group==='Solo legislativa'||group==='Presidencial y legislativa'||group==='Solo presidencial'?
    arena(r)===group:
  group==='Nacional'||group==='Uniprovincial'||group==='Multiprovincial'?
    stateOf(r)===group:false;
 const inAmbito=(r,scope)=>scope==='Todos'||!scope||arena(r)===scope;
 const inYears=(year,y)=>year===0?years().includes(Number(y)):Number(y)===year;
 function rowsFor(year,province,metric,group,scope='Todos'){
  if(metric==='partidos'){
   const all=REG.filter(r=>inYears(year,r['Año'])&&inAmbito(r,scope)&&
    (province==='Nacional'||coverage.has(Number(r['Año'])+'|'+r['Denominación electoral']+'|'+province)));
   return {all,selected:all.filter(r=>match(r,group))};
  }
  const all=(metric==='diputaciones'?E:C).filter(r=>inYears(year,r.anio)&&
   (province==='Nacional'||r.provincia===province)&&inAmbito(findParty(r)||{},scope));
  return {all,selected:all.filter(r=>{const party=findParty(r);return party&&match(party,group);})};
 }
 const values=(year,province,metric,group,scope='Todos')=>{
  const o=rowsFor(year,province,metric,group,scope);return {n:o.selected.length,total:o.all.length,rows:o.selected};
 };
 // Porcentaje de una categoría sobre el universo COMPLETO de la variable,
 // y nunca sobre el propio subconjunto (lo que producía falsos 100%).
 // Las identidades de partido se cuentan una vez en el agregado nacional;
 // sus presencias provinciales no son aditivas.
 function denominatorV19(year,province,metric,includePresidentialOnly=false){
  // El primer nivel incluye al partido exclusivamente presidencial de 2006.
  // Las vistas de cobertura y territorio tratan SOLO listas legislativas.
  const full=metric==='partidos'&&includePresidentialOnly?'Todos':'Toda la participación legislativa';
  return values(year,province,metric,full,'Todos').n;
 }
 function ranks(vals){
  const nums=vals.map(x=>x.n).filter(x=>x>0).sort((a,b)=>b-a);
  return vals.map(x=>x.n>0?nums.indexOf(x.n)+1:null);
 }
 function askDetails(year,province,metric,group,scope='Todos'){
  local.atlas237PartyPage=0;
  local.atlas237Selection={kind:'cell',year,province,metric,group,scope};refreshSelectionV19();
 }
 function chooseFlow(route){
  local.atlas237PartyPage=0;
  local.atlas237Selection={kind:'flow',route};refreshSelectionV19();
 }
 function refreshSelectionV19(){
  const marker=document.getElementById('atlas237DetailsMarker');
  if(!marker||state.tab!=='partidos'){state.tab='partidos';render();return;}
  let next=marker.nextElementSibling;
  while(next){const after=next.nextElementSibling;
   for(const gd of next.querySelectorAll?.('.js-plotly-plot')||[])Plotly.purge(gd);
   next.remove();next=after;
  }
  selectionDetailsV14();
  document.getElementById('atlas237Details')?.scrollIntoView?.({block:'start',behavior:'smooth'});
 }
 function matriz(title,metric,labels,provinceFor,groupFor,ranking=false,scope='Todos'){
  const ys=years(),lastHeader=ranking?'Ranking global':'Promedio por elección';
  const xs=[...ys.map(String),...(ranking?[lastHeader]:['Total histórico',lastHeader])];
  const hasNationalTotal=labels.length===8&&labels[7]==='Costa Rica · total';
  const series=labels.map(label=>ys.map(y=>{
   const v=values(y,provinceFor(label),metric,groupFor(label),scope);
   return {...v,total:denominatorV19(y,hasNationalTotal?'Nacional':provinceFor(label),metric,
    labels.includes('Solo presidencial'))};
  }));
  const grand=series.map(row=>({n:row.reduce((s,r)=>s+r.n,0),total:row.reduce((s,r)=>s+r.total,0)}));
  const provinceRanks=ys.map((_,j)=>ranks(series.slice(0,7).map(row=>row[j])));
  const globalRank=ranks(grand.slice(0,7));
  const nationalRank=ranks(ys.map((_,j)=>series[7]?.[j]||{n:0}));
  const pigment=[],textRows=[],hoverRows=[],exports=[],overlays=[];
  // El contraste tipográfico se decide POR CELDA. Esto evita cifras oscuras
  // sobre una tonalidad intensa o cifras blancas sobre una tonalidad pálida.
  const hexRgb=h=>[1,3,5].map(k=>parseInt(h.slice(k,k+2),16));
  const isDark=(base,t)=>{
   const [light,deep]=base.map(hexRgb);
   const rgb=light.map((c,k)=>(c+(deep[k]-c)*t)/255);
   const lin=rgb.map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
   // Umbral de contraste aproximado entre azul marino y blanco, no el punto
   // medio RGB: favorece el texto más legible sobre fondos intermedios.
   return .2126*lin[0]+.7152*lin[1]+.0722*lin[2]<.24;
  };
  const putText=(i,x,label,shown,hover,strength,global=false)=>{
   if(!shown)return;
   const base=global?['#eef2f5','#c4d1da']:(palette[label]||palette[groupFor(label)]||['#f0f3f7','#afbecb']);
   overlays.push({x,y:label,text:shown,hover,white:isDark(base,strength)});
  };
  // Una sola traza de heatmap para TODAS las filas: así las bandas de color,
  // las cifras, los eventos de clic y los rótulos comparten las mismas celdas.
  // La escala segmentada permite un gradiente distinto para cada categoría.
  const stops=[];
  const slots=labels.length+1;
  for(let i=0;i<slots;i++){
   const [light,dark]=i===labels.length?['#eef2f5','#c4d1da']:(palette[labels[i]]||palette[groupFor(labels[i])]||['#f0f3f7','#afbecb']);
   stops.push([i/slots,light],[(i+.99999)/slots,dark]);
  }
  stops.push([1,'#c4d1da']);
  labels.forEach((label,i)=>{
   const counts=series[i].map(x=>x.n),shares=series[i].map(x=>per(x.n,x.total));
   // Intensidad = porcentaje ABSOLUTO 0–100 en todas las categorías y años.
   // El techo 0.94 impide cruzar de banda en el extremo 100%, problema
   // que generaba texto blanco sobre una celda pálida de la categoría siguiente.
   const localStrength=v=>v===null?.015:.03+.91*Math.pow(Math.max(0,Math.min(100,v))/100,.72);
   const avg=grand[i].n/Math.max(ys.length,1);
   const texts=[],hovers=[],z=[];
   ys.forEach((y,j)=>{
    const rank=ranking?(i<7?provinceRanks[j][i]:nationalRank[j]):null;
    const isRank=ranking&&i<=7;
    const shown=isRank?(rank===null?'—':'#'+rank):fmt(counts[j])+'<br>'+pct(shares[j]);
    const hover=isRank?
      (rank===null?'Sin casos para clasificar':i<7?'Puesto '+rank+' entre las siete provincias':'Puesto '+rank+' entre '+ys.length+' elecciones'):
      ('Cantidad: '+fmt(counts[j])+'<br>Porcentaje sobre el total: '+pct(shares[j])+'<br>Base completa: '+fmt(series[i][j].total));
    texts.push(shown);hovers.push(hover);
    const intensity=isRank?(rank===null?.08:.12+.79*(1-(rank-1)/(i<7?6:Math.max(ys.length-1,1)))):
      localStrength(shares[j]);
    z.push(i+intensity);
    putText(i,String(y),label,shown,hover,intensity);
   });
   let globalTxt,globalHover;
   if(ranking){
    globalTxt=i<7?(globalRank[i]===null?'—':'#'+globalRank[i]):'—';
    globalHover=i<7?(globalRank[i]===null?'Sin casos para clasificar':'Puesto histórico '+globalRank[i]+' entre las siete provincias'):
      'El promedio nacional no es una elección y no recibe puesto';
   }else{
    globalTxt=avg.toLocaleString('es-CR',{minimumFractionDigits:1,maximumFractionDigits:1})+'<br>'+pct(per(grand[i].n,grand[i].total));
    globalHover='Promedio de cantidades por elección: '+avg.toFixed(2)+'<br>Porcentaje histórico ponderado: '+pct(per(grand[i].n,grand[i].total));
    const totalTxt=fmt(grand[i].n)+'<br>'+pct(per(grand[i].n,grand[i].total));
    const totalHover='Total de observaciones acumuladas: '+fmt(grand[i].n)+'<br>Denominador histórico: '+fmt(grand[i].total);
    texts.push(totalTxt);hovers.push(totalHover);
    const totalStrength=localStrength(per(grand[i].n,grand[i].total));
    z.push(labels.length+totalStrength);
    putText(i,'Total histórico',label,totalTxt,totalHover,totalStrength,true);
    exports.push({anio:'Total histórico',provincia:provinceFor(label),categoria:groupFor(label),
     poblacion:scope,indicador:metric,cantidad:grand[i].n,denominador:grand[i].total,
     porcentaje:per(grand[i].n,grand[i].total)});
   }
   texts.push(globalTxt);hovers.push(globalHover);
   const globalStrength=ranking&&i<7&&globalRank[i]!==null?
     .08+.82*(7-globalRank[i])/6:localStrength(per(grand[i].n,grand[i].total));
   z.push(labels.length+globalStrength);
   putText(i,lastHeader,label,globalTxt,globalHover,globalStrength,true);
   pigment.push(z);textRows.push(texts);hoverRows.push(hovers);
   ys.forEach((y,j)=>exports.push({anio:y,provincia:provinceFor(label),categoria:groupFor(label),poblacion:scope,indicador:metric,
      cantidad:counts[j],denominador:series[i][j].total,porcentaje:shares[j],ranking:ranking?(i<7?provinceRanks[j]?.[i]:nationalRank[j]):''}));
   exports.push({anio:lastHeader,provincia:provinceFor(label),categoria:groupFor(label),poblacion:scope,indicador:metric,
      cantidad_media:avg,total_historico:grand[i].n,denominador_historico:grand[i].total,
      porcentaje_ponderado:per(grand[i].n,grand[i].total),ranking_global:i<7?globalRank[i]??'':''});
  });
  const traces=[{type:'heatmap',x:xs,y:labels,z:pigment,text:textRows,customdata:hoverRows,
    texttemplate:'',
    xgap:2,ygap:3,zmin:0,zmax:slots,colorscale:stops,showscale:false,hoverongaps:false,
    hovertemplate:'%{y} · %{x}<br>%{customdata}<br>Clic para consultar casos<extra></extra>'},
   ...[false,true].map(white=>{const cells=overlays.filter(o=>o.white===white);
     return {type:'scatter',mode:'text',x:cells.map(o=>o.x),y:cells.map(o=>o.y),
       text:cells.map(o=>o.text),customdata:cells.map(o=>o.hover),
       textposition:'middle center',textfont:{size:13,color:white?'#ffffff':'#183545'},
       showlegend:false,hovertemplate:'%{y} · %{x}<br>%{customdata}<br>Clic para consultar casos<extra></extra>'};})];
  const baseDescription=labels.includes('Solo presidencial')?
   'Base porcentual: todos los partidos participantes en cualquiera de las dos arenas, incluido el caso exclusivamente presidencial de 2006':hasNationalTotal?
   'Base porcentual: total de '+metricLabel(metric).toLowerCase()+' de TODA la oferta legislativa del país en cada elección':
   'Base porcentual: total de '+metricLabel(metric).toLowerCase()+' de TODA la oferta del territorio en cada elección';
  const preciseBase=metric==='partidos'?' Partidos: identidades únicas; la presencia en siete provincias no se suma como siete partidos.':'';
  plot(title,traces,exports,{wide:true,height:Math.max(390,labels.length*68+185),subtitle:'Población: '+scope+' · '+state.province+' · '+state.from+'–'+state.to+' · % sobre universo completo',
   xTitle:'Elección (año)',yTitle:'Provincia o categoría',layout:{
    xaxis:{type:'category',categoryorder:'array',categoryarray:xs,tickangle:-45},
    yaxis:{type:'category',categoryorder:'array',categoryarray:labels.slice().reverse(),automargin:true},
    margin:{l:165,r:60,t:45,b:115}},
   note:ranking?'Puesto 1 = mayor número de observaciones. Las provincias se comparan dentro de cada elección; Costa Rica ordena las elecciones. Aquí el color representa el puesto, no el porcentaje.':
    'Cada celda: cantidad y % = cantidad / base completa de la elección. '+baseDescription+'.'+preciseBase+' Tonos más oscuros = mayor porcentaje en escala fija 0–100% (sin ajustar al máximo de la fila). 0 = sin casos de esa categoría; s/b = sin base positiva para calcular el porcentaje. Total histórico suma y Promedio divide por las elecciones visibles. El CSV conserva ambos denominadores.',
   onClick:evt=>{const p=evt.points?.[0];if(!p)return;
      const year=['Total histórico',lastHeader].includes(String(p.x))?0:Number(p.x);
      askDetails(year,provinceFor(String(p.y)),metric,groupFor(String(p.y)),scope);}});
 }
 function currentMetric(){return METRICAS.some(x=>x[0]===local.atlas237Metric)?local.atlas237Metric:'candidaturas';}
 function matricial(){
  const nivel=NIVELES.includes(local.atlas237Level)?local.atlas237Level:NIVELES[0],metric=currentMetric();
  add('<div class="extension-heading">DIPUTACIONES Y TERRITORIO · MATRICES ELECTORALES</div>');
  note('Dos dimensiones independientes: (1) la arena distingue solo legislativa, presidencial y legislativa, y solo presidencial; (2) la cobertura de las listas legislativas distingue uniprovincial (1), multiprovincial (2–6) y nacional (7 provincias). La inscripción jurídica no se infiere. Las cuatro casillas sin nombre consignado en Limón 1953 conservan su conteo sin inventar identidades.');
  controls([['atlas237Level','Nivel de comparación',NIVELES,nivel],['atlas237Metric','Variable legislativa',METRICAS,metric]]);
  if(nivel===NIVELES[0]){
   const labels=metric==='partidos'?ARENAS:ARENAS.slice(0,2);
   if(metric!=='partidos')note('Los partidos solo presidenciales no presentan listas legislativas: no se representan como cero candidaturas ni cero diputaciones. La matriz legislativa compara las dos poblaciones que sí compiten por escaños.');
   matriz('Arena electoral · '+metricLabel(metric),metric,labels,()=>state.province,x=>x);
  }else if(nivel===NIVELES[1]){
   const scope=AMBITOS.some(x=>x[1]===local.atlas237Scope)?local.atlas237Scope:'Todos';
   controls([['atlas237Scope','Población partidaria',AMBITOS,scope]]);
   matriz('Cobertura legislativa · '+metricLabel(metric),metric,
     ['Uniprovincial','Multiprovincial','Nacional'],()=>state.province,x=>x,false,scope);
  }else{
   const scope=AMBITOS.some(x=>x[1]===local.atlas237Scope)?local.atlas237Scope:'Todos';
   const group=GRUPOS.includes(local.atlas237Group)?local.atlas237Group:GRUPOS[0];
   const view=['Cantidades y porcentajes','Ranking provincial'].includes(local.atlas237View)?local.atlas237View:'Cantidades y porcentajes';
   controls([['atlas237Scope','Población partidaria',AMBITOS,scope],['atlas237Group','Grupo territorial',GRUPOS,group],['atlas237View','Visor provincial',['Cantidades y porcentajes','Ranking provincial'],view]]);
   const labels=[...PROVINCIAS,'Costa Rica · total'];
   if(metric==='partidos')note('Costa Rica cuenta cada identidad partidaria una vez por elección. Las provincias muestran presencias territoriales, por lo que no deben sumarse para reproducir el total nacional.');
   matriz('Siete provincias y Costa Rica · '+group+' · '+metricLabel(metric),metric,labels,
      p=>p==='Costa Rica · total'?'Nacional':p,()=>group,view==='Ranking provincial',scope);
  }
  // El panel nominal pertenece a una CELDA, no a los filtros nuevos. Evitar
  // presentar registros de personas/partidos de una selección anterior.
  for(const id of ['atlas237Level','atlas237Metric','atlas237Scope','atlas237Group','atlas237View']){
   const element=document.getElementById(id);
   if(element&&!element.dataset.atlas19SelectionReset){
    const original=element.onchange;
    element.onchange=function(ev){local.atlas237Selection=null;local.atlas237PartyPage=0;original?.call(this,ev)};
    element.dataset.atlas19SelectionReset='1';
   }
  }
 }
 const SERIES_V16=[
  {key:'prov',group:'Toda la participación legislativa',label:'Toda la participación legislativa',color:'#207f84'},
  {key:'solo',group:'Solo legislativa',label:'Solo legislativa',color:'#248a68'},
  {key:'dual',group:'Presidencial y legislativa',label:'Presidencial y legislativa',color:'#3b65ad'},
  {key:'pres',group:'Solo presidencial',label:'Solo presidencial',color:'#c56c48'},
  {key:'uni',group:'Uniprovincial',label:'Uniprovinciales',color:'#c48137'},
  {key:'multi',group:'Multiprovincial',label:'Multiprovinciales',color:'#4587c5'},
  {key:'nac',group:'Nacional',label:'Nacionales (7 provincias legislativas)',color:'#955bc1'}
 ];
 function annualProvincialPartiesV14(){
  const ys=years(),allowed=new Set(SERIES_V16.map(s=>s.key));
  const active=(local.atlas237LinesV16===undefined?['prov']:
   String(local.atlas237LinesV16).split(',').filter(x=>allowed.has(x)));
  add('<div class="extension-heading">EVOLUCIÓN HISTÓRICA · VISOR DE PARTIDOS POR GRUPO ELECTORAL</div>');
  add('<div class="controls" style="align-items:center;flex-wrap:wrap"><span style="font-weight:700">Líneas visibles</span>'+
   SERIES_V16.map(s=>'<label style="display:inline-flex;align-items:center;gap:6px;white-space:nowrap;'+
    'padding:8px 11px;border:1px solid #cfdfe5;border-left:5px solid '+s.color+';border-radius:9px;'+
    'background:#fff;font-weight:600"><input type="checkbox" class="atlas237LineChoice" data-key="'+s.key+'" '+
    (active.includes(s.key)?'checked':'')+'>'+esc(s.label)+'</label>').join('')+'</div>');
  [...document.querySelectorAll('.atlas237LineChoice')].forEach(box=>box.onchange=()=>{
   const chosen=[...document.querySelectorAll('.atlas237LineChoice')].filter(x=>x.checked).map(x=>x.dataset.key);
   local.atlas237LinesV16=chosen.join(',');render();
  });
  const selected=SERIES_V16.filter(s=>active.includes(s.key));
  if(!selected.length){note('Activá una o varias categorías para comparar sus series.');return;}
  const traces=[],rows=[];let maximum=0;
  for(const s of selected){
   const series=ys.map(y=>({anio:y,grupo:s.label,partidos:new Set(REG.filter(r=>
    Number(r['Año'])===y&&match(r,s.group)).map(r=>pid(r))).size}));
   const peak=Math.max(...series.map(r=>r.partidos),0);maximum=Math.max(maximum,peak);
   rows.push(...series.map(r=>({...r,maximo_historico:r.partidos===peak})));
   const peakPoints=series.filter(r=>r.partidos===peak);
   traces.push({type:'scatter',mode:'lines+markers',name:s.label,
    x:series.map(r=>String(r.anio)),y:series.map(r=>r.partidos),
    customdata:series.map(()=>s.group),line:{color:s.color,width:3.2},
    marker:{color:s.color,size:8},hovertemplate:s.label+' · %{x}<br>%{y} partidos distintos<extra></extra>'});
   traces.push({type:'scatter',mode:'markers+text',showlegend:false,name:'Máximo · '+s.label,
    x:peakPoints.map(r=>String(r.anio)),y:peakPoints.map(r=>r.partidos),
    customdata:peakPoints.map(()=>s.group),text:peakPoints.map(()=>String(peak)),
    textposition:'top center',textfont:{color:s.color,size:13},
    marker:{color:s.color,size:15,symbol:'diamond',line:{color:'#fff',width:2}},
    hovertemplate:'MÁXIMO HISTÓRICO · '+s.label+'<br>%{y} partidos en %{x}<extra></extra>'});
  }
  plot('Evolución histórica de partidos · comparación configurable por elección',traces,rows,
   {wide:true,height:475,xTitle:'Elección',yTitle:'Identidades partidarias distintas',
    layout:{margin:{l:92,r:50,t:55,b:110},yaxis:{rangemode:'tozero',range:[0,maximum+Math.max(2,maximum*.24)]},
      legend:{orientation:'h',y:-.30,x:0}},
    note:'Activá o desactivá las siete líneas libremente. Cada diamante representa el máximo observado de esa categoría. Una identidad se cuenta una vez por elección. Las líneas no deben sumarse porque algunas son subconjuntos de otras. PNG, SVG y CSV reflejan las líneas visibles.',
    onClick:evt=>{const p=evt.points?.[0],year=Number(p?.x),group=p?.customdata;
      if(ys.includes(year)&&group)askDetails(year,'Nacional','partidos',group);}});
 }
 const EVENTOS=[];
 for(const [id,rows] of byIdentity){
  for(let i=1;i<rows.length;i++){
   const a=rows[i-1],b=rows[i];
   EVENTOS.push({id,partido:b['Denominación electoral'],desde:stateOf(a),hacia:stateOf(b),
    anio_origen:Number(a['Año']),anio_destino:Number(b['Año']),origen:a,destino:b});
  }
 }
 const flowParties=[['Todos','Todos los partidos'],...[...byIdentity].map(([id,r])=>[id,r[0]['Denominación electoral']+' · '+r[0]['Año']]).sort((a,b)=>a[1].localeCompare(b[1],'es'))];
 const eventPeriod=e=>years().includes(e.anio_destino);
 function activeEvents(){const id=String(local.atlas237FlowParty||'Todos');return EVENTOS.filter(e=>eventPeriod(e)&&(id==='Todos'||e.id===id));}
 function flowStats(events){
  const counts=new Map();for(const e of events){const k=e.desde+' → '+e.hacia;
    if(!counts.has(k))counts.set(k,[]);counts.get(k).push(e);}
  const from=new Map(STATES.map(s=>[s,events.filter(e=>e.desde===s).length]));
  const to=new Map(STATES.map(s=>[s,events.filter(e=>e.hacia===s).length]));
  return [...counts].map(([ruta,rows])=>{
   const source=rows[0].desde,target=rows[0].hacia;
   return {ruta,origen:source,destino:target,eventos:rows.length,
    partidos:new Set(rows.map(e=>e.id)).size,
    porcentaje_origen:per(rows.length,from.get(source)),porcentaje_destino:per(rows.length,to.get(target)),
    casos:rows};
  }).sort((a,b)=>STATES.indexOf(a.origen)-STATES.indexOf(b.origen)||STATES.indexOf(a.destino)-STATES.indexOf(b.destino));
 }
 function flowFigure(stats,events){
  if(!stats.length){note('No hay transiciones observadas con los filtros seleccionados.');return;}
  const colors=['#8b6eaf','#3c9b82','#b98b47'];
  const links=stats.map(s=>({source:STATES.indexOf(s.origen),target:3+STATES.indexOf(s.destino),
    value:s.eventos,color:colors[STATES.indexOf(s.origen)]+'90',customdata:s.ruta,
    label:`${s.eventos} transiciones · ${pct(s.porcentaje_origen)} del origen · ${pct(s.porcentaje_destino)} del destino`}));
  plot('De la participación anterior a la siguiente · origen y destino',[{type:'sankey',orientation:'h',arrangement:'snap',
    node:{label:[...STATES.map(s=>'Origen · '+s),...STATES.map(s=>'Destino · '+s)],
      color:[...colors,...colors],pad:26,thickness:19},
    link:{source:links.map(x=>x.source),target:links.map(x=>x.target),value:links.map(x=>x.value),
      color:links.map(x=>x.color),customdata:links.map(x=>x.customdata),label:links.map(x=>x.label),
      hovertemplate:'%{customdata}<br>%{label}<extra></extra>'}}],
     stats.map(({ruta,origen,destino,eventos,partidos,porcentaje_origen,porcentaje_destino})=>({ruta,origen,destino,eventos,partidos,porcentaje_origen,porcentaje_destino})),
   {wide:true,height:480,subtitle:'Transiciones consecutivas de cada identidad partidaria · '+state.from+'–'+state.to,
    note:'El ancho representa transiciones observadas, incluidas las permanencias en el mismo estado. Los porcentajes se calculan sobre los movimientos salientes del origen y entrantes del destino, respectivamente. Clic en una conexión para consultar identidades y años.',
    onClick:evt=>{const route=evt.points?.[0]?.customdata;if(route)chooseFlow(route);}});
 }
 function flowTable(stats){
  table(stats.map(({ruta,origen,destino,eventos,partidos,porcentaje_origen,porcentaje_destino})=>
    ({origen,destino,transiciones:eventos,partidos_unicos:partidos,porcentaje_del_origen:porcentaje_origen,porcentaje_del_destino:porcentaje_destino})),
    ['origen','destino','transiciones','partidos_unicos','porcentaje_del_origen','porcentaje_del_destino'],
    'Movimientos observados · valores exactos exportables');
  add('<div class="extension-heading">CONSULTAR RUTA DE TRANSICIÓN</div>');
  const buttons=stats.map(s=>'<button type="button" class="atlas237FlowBtn" data-route="'+esc(s.ruta)+'" style="margin:3px 6px 6px 0;padding:8px 12px;border:1px solid #cbd7df;background:#f4f8fa;border-radius:7px;cursor:pointer">'+esc(s.ruta)+' · '+fmt(s.eventos)+'</button>').join('');
  add('<div>'+buttons+'</div>');
  [...document.querySelectorAll('.atlas237FlowBtn')].forEach(b=>b.onclick=()=>chooseFlow(b.dataset.route));
 }
 function flowMatrix(stats){
  const items=[],data=[];
  STATES.forEach(from=>STATES.forEach(to=>{
   const item=stats.find(s=>s.origen===from&&s.destino===to);
   items.push({desde:from,hacia:to,n:item?.eventos||0,share:item?.porcentaje_origen??null});
   data.push({origen:from,destino:to,transiciones:item?.eventos||0,porcentaje_origen:item?.porcentaje_origen??null,porcentaje_destino:item?.porcentaje_destino??null});
  }));
  plot('Matriz de transición entre participaciones consecutivas',[{type:'heatmap',x:STATES,y:STATES,
    z:STATES.map(from=>STATES.map(to=>items.find(x=>x.desde===from&&x.hacia===to).n)),
    text:STATES.map(from=>STATES.map(to=>{const x=items.find(z=>z.desde===from&&z.hacia===to);return fmt(x.n)+'<br>'+pct(x.share);})),
    texttemplate:'%{text}',textfont:{size:14,color:'#203e4d'},colorscale:[[0,'#f1f6f8'],[1,'#89bad0']],
    xgap:5,ygap:5,showscale:false,hovertemplate:'Origen: %{y}<br>Destino: %{x}<br>%{text}<extra></extra>'}],data,
   {wide:true,height:440,xTitle:'Participación de destino',yTitle:'Participación de origen',
    note:'Cada celda muestra transiciones y porcentaje entre todos los movimientos que parten de su estado de origen. Cero significa transición no observada.',
    onClick:evt=>{const p=evt.points?.[0];if(p)chooseFlow(p.y+' → '+p.x);}});
 }
 function summaryFlow(){
  const histories=[...byIdentity].map(([id,rows])=>({id,partido:rows[0]['Denominación electoral'],tipo:lifetime(rows),
    provincial:rows.filter(r=>arena(r)==='Provincial'),nacional:rows.filter(r=>arena(r)==='Nacional'),
    n_uni:rows.filter(r=>stateOf(r)==='Uniprovincial').length,n_multi:rows.filter(r=>stateOf(r)==='Multiprovincial').length}));
  const categories=['Solo nacional','Solo provincial','Híbrido'];
  const rows=categories.map(cat=>({trayectoria:cat,partidos:histories.filter(x=>x.tipo===cat).length,
    porcentaje_total:per(histories.filter(x=>x.tipo===cat).length,histories.length)}));
  table(rows,['trayectoria','partidos','porcentaje_total'],'Identidades partidarias del corpus por trayectoria');
  const prov=histories.filter(x=>x.provincial.length);
  const group=[['Siempre uniprovincial',x=>x.n_uni>0&&!x.n_multi],['Siempre multiprovincial',x=>x.n_multi>0&&!x.n_uni],
    ['Participó en ambas coberturas',x=>x.n_uni>0&&x.n_multi]];
  table(group.map(([categoria,test])=>({categoria,partidos:prov.filter(test).length,porcentaje_provinciales:per(prov.filter(test).length,prov.length)})),
    ['categoria','partidos','porcentaje_provinciales'],'Cobertura territorial observada entre los partidos que alguna vez fueron provinciales');
  note('Las trayectorias usan las identidades conciliadas de los partidos a lo largo del corpus completo; los flujos se computan sobre sus participaciones consecutivas. Un partido puede mantener la misma categoría varias elecciones.');
 }
 function flowExplorer(){
  add('<div class="extension-heading">TRAYECTORIAS Y FLUJOS DE PARTIDOS · EXPLORADOR INDEPENDIENTE</div>');
  note('Las rutas se calculan comparando elecciones sucesivas en las que aparece una misma identidad partidaria, sin presumir continuidad a partir del nombre. Nacional y provincial se refieren a la arena observada; uniprovincial y multiprovincial precisan la cobertura provincial.');
  const view=['Diagrama de flujos','Matriz origen–destino','Resumen histórico'].includes(local.atlas237FlowView)?local.atlas237FlowView:'Diagrama de flujos';
  controls([['atlas237FlowView','Exploración de trayectorias',['Diagrama de flujos','Matriz origen–destino','Resumen histórico'],view],
    ['atlas237FlowParty','Elegir un partido y seguir sus cambios',flowParties,local.atlas237FlowParty||'Todos']]);
  const events=activeEvents(),stats=flowStats(events);
  if(view==='Diagrama de flujos')flowFigure(stats,events);
  else if(view==='Matriz origen–destino')flowMatrix(stats);
  else summaryFlow();
  if(view!=='Resumen histórico')flowTable(stats);
  const id=String(local.atlas237FlowParty||'Todos');
  if(id!=='Todos'){
   const rows=byIdentity.get(id)||[];
   add('<div class="extension-heading">HISTORIA DEL PARTIDO SELECCIONADO</div>');
   table(rows.map(r=>({anio:r['Año'],partido:r['Denominación electoral'],identidad:pid(r),arena:arena(r),
      cobertura:stateOf(r),provincias:r['Provincias legislativas'],propietarias:r['Candidaturas propietarias'],
      suplentes:r['Candidaturas suplentes'],electas:r['Diputaciones declaradas']})),
     ['anio','partido','identidad','arena','cobertura','provincias','propietarias','suplentes','electas'],
     'Participaciones por elección de una misma identidad');
  }
 }
 function selectionDetails(){
  const s=local.atlas237Selection;
  if(!s)return;
  let parties=[],people=[],headline='';
  if(s.kind==='flow'){
   const events=activeEvents().filter(x=>x.desde+' → '+x.hacia===s.route);
   const ids=new Set(events.map(x=>x.id));
   parties=[...REG].filter(r=>ids.has(pid(r)));
   people=C.filter(r=>ids.has(pid(findParty(r))));
   headline='RUTA '+s.route+' · '+fmt(events.length)+' TRANSICIONES · '+fmt(ids.size)+' PARTIDOS';
   add('<div id="atlas237Details" class="extension-heading">'+esc(headline)+'</div>');
   table(events.map(x=>({partido:x.partido,id:x.id,anio_origen:x.anio_origen,arena_origen:x.desde,
      anio_destino:x.anio_destino,arena_destino:x.hacia})),
      ['partido','id','anio_origen','arena_origen','anio_destino','arena_destino'],'Eventos de transición exactos');
  }else{
   const r=rowsFor(s.year,s.province,s.metric,s.group);
   const ids=new Set(r.selected.map(x=>s.metric==='partidos'?pid(x):pid(findParty(x))));
   parties=REG.filter(p=>ids.has(pid(p)));
   people=C.filter(x=>ids.has(pid(findParty(x)))&&inYears(s.year,x.anio)&&(s.province==='Nacional'||s.province===x.provincia));
   headline=s.group+' · '+s.province+' · '+(s.year===0?'todas las elecciones visibles':s.year);
   add('<div id="atlas237Details" class="extension-heading">CASOS DE LA MATRIZ · '+esc(headline)+'</div>');
   note(fmt(r.selected.length)+' observaciones de '+fmt(r.all.length)+' ('+pct(per(r.selected.length,r.all.length))+').');
  }
  const uniqueParties=[...new Map(parties.map(r=>[pid(r)+'|'+r['Año'],r])).values()].sort((a,b)=>Number(a['Año'])-Number(b['Año']));
  add('<div class="extension-heading">PARTIDOS QUE INTEGRAN LA SELECCIÓN</div>');
  table(uniqueParties.map(r=>({anio:r['Año'],nombre:r['Denominación electoral'],id:pid(r),
    categoria:r['Clasificación electoral'],trayectoria:lifetime(byIdentity.get(pid(r))||[r]),provincias:r['Provincias legislativas']})),
    ['anio','nombre','id','categoria','trayectoria','provincias'],'Historial electoral de los partidos identificados');
  add('<div class="extension-heading">CANDIDATURAS LEGISLATIVAS VINCULADAS</div>');
  if(typeof atlas225NominalPanel==='function')atlas225NominalPanel('Personas y candidaturas de la selección',people,
    'antecedent','atlas237Nominal',headline);
  table(people,['anio','nombre','sexo','partido','provincia','tipo','electa'],'Personas de las candidaturas legislativas');
  note('Los controles y gráficos anteriores permanecen visibles: basta seleccionar otra celda, ruta o partido.');
 }
 // Los flujos de arena y los de cobertura son preguntas diferentes.
 const FLOW_DEFS=[
  {name:'Arena electoral · presidencial ↔ legislativa',left:ARENAS,right:ARENAS,
   map:(s,e,side)=>arena(side==='origen'?e.origen:e.destino),test:()=>true,
   description:'Cambios entre solo legislativa, presidencial y legislativa y solo presidencial, incluidos los casos que permanecen en la misma categoría.'},
  {name:'Cobertura legislativa · uni ↔ multi ↔ nacional',left:STATES.slice(1),right:STATES.slice(1),
   map:s=>s,test:e=>e.desde!=='Sin participación legislativa'&&e.hacia!=='Sin participación legislativa',
   description:'Cambios y permanencias entre una, dos a seis y siete provincias, solo cuando existen listas legislativas en ambas observaciones.'},
  {name:'De nacional a cobertura provincial',left:['Nacional'],right:['Uniprovincial','Multiprovincial'],
   map:s=>s,test:e=>e.desde==='Nacional'&&['Uniprovincial','Multiprovincial'].includes(e.hacia),
   description:'Pérdida de cobertura legislativa de siete provincias a entre una y seis provincias, sin inferir el estatus jurídico.'},
  {name:'De cobertura provincial a nacional',left:['Uniprovincial','Multiprovincial'],right:['Nacional'],
   map:s=>s,test:e=>['Uniprovincial','Multiprovincial'].includes(e.desde)&&e.hacia==='Nacional',
   description:'Expansión de cobertura legislativa de una a seis provincias hacia siete provincias.'}
 ];
 const FLOW_LABELS=[...FLOW_DEFS.map(d=>d.name),'Resumen histórico de partidos'];
 const FLOW_COLORS={'Nacional':'#8960b2','Sin participación legislativa':'#949a9c',
  'Uniprovincial':'#d49a58','Multiprovincial':'#6c9ac2',
  'Solo legislativa':'#28836d','Presidencial y legislativa':'#4678b2','Solo presidencial':'#c17243'};
 function flowSetting(){return FLOW_DEFS.find(x=>x.name===local.atlas237FlowLevel)||FLOW_DEFS[0];}
 function flowEventsV14(def){
  // Orígenes y destinos deben describir la MISMA cohorte de transiciones.
  // El contraste requiere observar cambios Y permanencias simultáneamente.
  const selectedId=String(local.atlas237FlowParty||'Todos');
  return EVENTOS.filter(e=>eventPeriod(e)&&def.test(e)&&
   (selectedId==='Todos'||e.id===selectedId));
 }
 function flowStatsV14(def,events){
  const groups=new Map();
  for(const e of events){const a=def.map(e.desde,e,'origen'),b=def.map(e.hacia,e,'destino'),key=a+' → '+b;
   if(!groups.has(key))groups.set(key,{key,a,b,events:[]});groups.get(key).events.push(e);}
  const origin=new Map(def.left.map(s=>[s,events.filter(e=>def.map(e.desde,e,'origen')===s).length]));
  const destination=new Map(def.right.map(s=>[s,events.filter(e=>def.map(e.hacia,e,'destino')===s).length]));
  return [...groups.values()].map(x=>({...x,transiciones:x.events.length,
   partidos:new Set(x.events.map(e=>e.id)).size,
   porcentaje_origen:per(x.events.length,origin.get(x.a)),
   porcentaje_destino:per(x.events.length,destination.get(x.b))})).sort((a,b)=>
   def.left.indexOf(a.a)-def.left.indexOf(b.a)||def.right.indexOf(a.b)-def.right.indexOf(b.b));
 }
 function flowBalanceV15(def,events){
  if(!events.length)return;
  const labels=[...new Set([...def.left,...def.right])];
  const total=events.length;
  const tableRows=[];
  const traces=labels.map(cat=>{
   const n0=events.filter(e=>def.map(e.desde,e,'origen')===cat).length;
   const n1=events.filter(e=>def.map(e.hacia,e,'destino')===cat).length;
   tableRows.push({categoria:cat,origen:n0,origen_porcentaje:per(n0,total),
    destino:n1,destino_porcentaje:per(n1,total),variacion_neta:n1-n0});
   return {type:'bar',orientation:'h',name:cat,x:[n0,n1],y:['Origen','Destino'],
    marker:{color:FLOW_COLORS[cat]},
    text:[fmt(n0)+' · '+pct(per(n0,total)),fmt(n1)+' · '+pct(per(n1,total))],
    textposition:'inside',insidetextanchor:'middle',textfont:{color:'#fff',size:12},
    customdata:[cat,cat],hovertemplate:'%{y} · '+cat+'<br>%{x} transiciones · %{text}<extra></extra>'};
  });
  plot(def.name+' · composición de origen y destino',traces,tableRows,
   {wide:true,height:325,xTitle:'Transiciones observadas (una transición por participación consecutiva)',
    layout:{barmode:'stack',showlegend:true,legend:{orientation:'h',y:1.22,x:0},margin:{l:85,r:40,t:62,b:55}},
    note:'Distribución de la MISMA cohorte antes y después. La suma de cada barra es '+fmt(total)+
      ' transiciones (100%). Los porcentajes utilizan el mismo denominador, no porcentajes de enlaces. Clic para identificar los partidos de una categoría.',
    onClick:evt=>{const p=evt.points?.[0];if(!p)return;
      local.atlas237Selection={kind:'flow_state_v15',flow:def.name,side:String(p.y),category:String(p.customdata)};
      local.atlas237PartyPage=0;refreshSelectionV19();}});
 }
 function showFlowCasesV14(def,from,to){
  local.atlas237PartyPage=0;
  local.atlas237Selection={kind:'flow_v14',flow:def.name,from,to};refreshSelectionV19();
 }
 function flowFigureV14(def,stats){
  if(!stats.length){note('No hay transiciones observadas para esta combinación de filtros.');return;}
  const events=flowEventsV14(def),total=events.length;
  const nodes=[...def.left.map(s=>{
   const n=events.filter(e=>def.map(e.desde,e,'origen')===s).length;
   return 'Origen · '+s+' · '+fmt(n)+' ('+pct(per(n,total))+')';
  }),...def.right.map(s=>{
   const n=events.filter(e=>def.map(e.hacia,e,'destino')===s).length;
   return 'Destino · '+s+' · '+fmt(n)+' ('+pct(per(n,total))+')';
  })];
  const source=stats.map(s=>def.left.indexOf(s.a));
  const target=stats.map(s=>def.left.length+def.right.indexOf(s.b));
  plot(def.name+' · rutas partidarias',[{type:'sankey',orientation:'h',arrangement:'fixed',
   node:{label:nodes,pad:28,thickness:22,
    color:[...def.left,...def.right].map(s=>FLOW_COLORS[s]),
    line:{color:'#fff',width:1.5}},
   link:{source,target,value:stats.map(s=>s.transiciones),
    color:stats.map(s=>(FLOW_COLORS[s.a]||'#94a4b2')+'80'),
    customdata:stats.map(s=>s.key),
    hovertemplate:'%{customdata}<br>%{value} transiciones de una misma cohorte<extra></extra>'}}],
   stats.map(s=>({origen:s.a,destino:s.b,partidos:s.partidos,transiciones:s.transiciones,
    porcentaje_del_origen:s.porcentaje_origen,porcentaje_del_destino:s.porcentaje_destino})),
   {wide:true,height:465,subtitle:'Identidades partidarias · '+state.from+'–'+state.to,
    note:'El ancho representa transiciones entre dos participaciones consecutivas, incluidas las permanencias. Los nodos presentan el número y porcentaje de la cohorte completa en cada extremo. Un partido puede participar en varias transiciones; clic en una conexión para identificar partidos y elecciones.',
    onClick:evt=>{const key=evt.points?.[0]?.customdata;
     if(key){const [a,b]=String(key).split(' → ');showFlowCasesV14(def,a,b);}}});
 }
 function flowMatrixV14(def,stats){
  const get=(a,b)=>stats.find(s=>s.a===a&&s.b===b);
  const total=stats.reduce((n,s)=>n+s.transiciones,0);
  // Una matriz de 1×2 o 2×1 no muestra realmente una transición: su única
  // dimensión relevante es el reparto entre las dos coberturas provinciales.
  if(def.left.length===1||def.right.length===1){
   const byOrigin=def.left.length>1;
   const categories=byOrigin?def.left:def.right;
   const records=categories.map(cat=>{
    const chosen=stats.filter(s=>(byOrigin?s.a:s.b)===cat),n=chosen.reduce((v,s)=>v+s.transiciones,0);
    return {categoria:cat,transiciones:n,porcentaje_del_total:per(n,total)||0,
     partidos_distintos:new Set(chosen.flatMap(s=>s.events.map(e=>e.id))).size};
   });
   const traces=records.map(row=>({type:'bar',orientation:'h',name:row.categoria,
     x:[row.transiciones],y:['Distribución de las transiciones'],customdata:[row.categoria],
     marker:{color:FLOW_COLORS[row.categoria]},
     text:[fmt(row.transiciones)+' transiciones · '+pct(row.porcentaje_del_total)],
     textposition:'auto',hovertemplate:row.categoria+'<br>%{x} transiciones · '+pct(row.porcentaje_del_total)+' de todas<extra></extra>'}));
   plot('Distribución de '+def.name,traces,records,{wide:true,height:285,
    xTitle:'Número de transiciones',layout:{barmode:'stack',margin:{l:95,r:48,t:42,b:70},
      legend:{orientation:'h',y:-.35,x:0}},
    note:'Esta ruta tiene un solo estado '+(byOrigin?'de destino':'de origen')+'. Una barra de composición representa mejor el reparto que una matriz de una fila o una columna. Cada porcentaje divide entre las '+fmt(total)+' transiciones de la ruta, incluidos los ceros.',
    onClick:evt=>{const cat=evt.points?.[0]?.customdata;if(cat){
      const origin=byOrigin?cat:def.left[0],dest=byOrigin?def.right[0]:cat;
      showFlowCasesV14(def,origin,dest);}}});
   add('<div style="display:flex;gap:10px;flex-wrap:wrap;margin:8px 0 18px">'+records.map(r=>
    '<span style="border-left:5px solid '+FLOW_COLORS[r.categoria]+';padding:9px 13px;'+
     'background:#f4f8fa;border-radius:8px;font-weight:600">'+esc(r.categoria)+' · '+
     fmt(r.transiciones)+' transiciones · '+pct(r.porcentaje_del_total)+'</span>').join('')+'</div>');
   return;
  }
  const originTotals=new Map(def.left.map(a=>[a,stats.filter(s=>s.a===a).reduce((v,s)=>v+s.transiciones,0)]));
  const raw=[],z=def.left.map(a=>def.right.map(b=>get(a,b)?.transiciones??0));
  const txt=def.left.map(a=>def.right.map(b=>{
   const n=get(a,b)?.transiciones??0;
   return fmt(n)+' transiciones<br>'+pct(originTotals.get(a)?per(n,originTotals.get(a)):0)+' del origen';
  }));
  for(const a of def.left)for(const b of def.right){const s=get(a,b);
   raw.push({origen:a,destino:b,partidos:s?.partidos??0,transiciones:s?.transiciones??0,
    porcentaje_origen:originTotals.get(a)?per(s?.transiciones??0,originTotals.get(a)):0,
    porcentaje_destino:stats.some(x=>x.b===b)?per(s?.transiciones??0,stats.filter(x=>x.b===b).reduce((v,x)=>v+x.transiciones,0)):0});
  }
  plot('Matriz de '+def.name,[{type:'heatmap',x:def.right,y:def.left,z,text:txt,
   texttemplate:'%{text}',textfont:{size:13,color:'#203f4d'},
   xgap:6,ygap:6,colorscale:[[0,'#f2fafb'],[.2,'#c6e2e8'],[1,'#3d8aa8']],showscale:false,hoverongaps:false,
   hovertemplate:'Origen · %{y}<br>Destino · %{x}<br>%{text}<extra></extra>'}],raw,
   {wide:true,height:390,xTitle:'Participación posterior',yTitle:'Participación anterior',
    note:'Cada casilla muestra todas las transiciones, incluidos los ceros, y qué porcentaje de las salidas de ese origen representa. Los enlaces no observados muestran explícitamente 0 transiciones y 0,0 %. El CSV indica además el número de partidos únicos.',
    onClick:evt=>{const p=evt.points?.[0];if(p)showFlowCasesV14(def,p.y,p.x);}});
 }
 function flowSummaryV14(){
  const selectedId=String(local.atlas237FlowParty||'Todos');
  const histories=[...byIdentity].filter(([id])=>selectedId==='Todos'||selectedId===id)
   .map(([id,rows])=>({id,rows,tipo:lifetime(rows),
   uni:rows.some(r=>stateOf(r)==='Uniprovincial'),multi:rows.some(r=>stateOf(r)==='Multiprovincial'),
   nac:rows.some(r=>stateOf(r)==='Nacional')}));
  const cats=['Solo legislativa (historial)','Presidencial y legislativa (historial)','Solo presidencial (historial)'];
  const stats=cats.map((cat,i)=>({grupo:cat,partidos:histories.filter(h=>h.tipo===cat).length,
   porcentaje:per(histories.filter(h=>h.tipo===cat).length,histories.length),color:['#8562b1','#5da789','#bf9163'][i]}));
  plot('Trayectorias históricas de partidos · clasificación completa',[{type:'bar',orientation:'h',
    x:stats.map(r=>r.partidos),y:stats.map(r=>r.grupo),marker:{color:stats.map(r=>r.color)},
    text:stats.map(r=>fmt(r.partidos)+' · '+pct(r.porcentaje)),textposition:'auto',
    hovertemplate:'%{y}<br>%{x} partidos<extra></extra>'}],stats,
   {wide:true,height:330,xTitle:'Partidos con identidad histórica conciliada',
    note:'Cada partido se cuenta una vez en el grupo de su trayectoria completa. Clic en una barra para ver las identidades.',
    onClick:evt=>{const group=evt.points?.[0]?.y;if(group){local.atlas237Selection={kind:'lifetime',group};
       local.atlas237PartyPage=0;refreshSelectionV19();}}});
  const provincial=histories.filter(h=>h.uni||h.multi||h.nac);
  const group=[['Solo uniprovincial',h=>h.uni&&!h.multi&&!h.nac],
   ['Solo multiprovincial',h=>!h.uni&&h.multi&&!h.nac],
   ['Solo nacional',h=>!h.uni&&!h.multi&&h.nac],
   ['Varias coberturas',h=>[h.uni,h.multi,h.nac].filter(Boolean).length>1]];
  const rural=group.map(([label,condition],i)=>({grupo:label,
    partidos:provincial.filter(condition).length,porcentaje:per(provincial.filter(condition).length,provincial.length),
    color:['#d49a58','#6c9ac2','#8960b2','#a98bc2'][i]}));
  plot('Cobertura legislativa histórica de las identidades partidarias',
   [{type:'bar',orientation:'h',x:rural.map(r=>r.partidos),y:rural.map(r=>r.grupo),
     marker:{color:rural.map(r=>r.color)},text:rural.map(r=>fmt(r.partidos)+' · '+pct(r.porcentaje)),
     textposition:'auto',hovertemplate:'%{y}<br>%{x} partidos<extra></extra>'}],rural,
   {wide:true,height:340,xTitle:'Identidades con participación legislativa',
    note:'Clasificación por todas las coberturas legislativas de la identidad. Nacional significa exactamente siete provincias. Una identidad con varias coberturas integra el cuarto grupo. Esta gráfica no representa una transición.',
    onClick:evt=>{const group=evt.points?.[0]?.y;if(group){local.atlas237Selection={kind:'coverage',group};
      local.atlas237PartyPage=0;refreshSelectionV19();}}});
 }
 function flowExplorerV14(){
  add('<div class="extension-heading">TRAYECTORIAS Y FLUJOS DE PARTIDOS · ANÁLISIS SEPARADOS</div>');
  note('Cada transición enlaza observaciones consecutivas de la misma identidad partidaria. La arena (presidencia/legislatura) y la cobertura legislativa (1, 2–6 o 7 provincias) se analizan por separado. No se atribuyen cambios jurídicos. Las rutas muestran identidades auditables al pulsarlas.');
  const current=FLOW_LABELS.includes(local.atlas237FlowLevel)?local.atlas237FlowLevel:FLOW_LABELS[0];
  const selectedId=flowParties.some(x=>x[0]===String(local.atlas237FlowParty||'Todos'))?
   String(local.atlas237FlowParty||'Todos'):'Todos';
  controls([['atlas237FlowLevel','Pregunta de transición',FLOW_LABELS,current],
   ['atlas237FlowParty','Partido · identidad histórica (restablecer con «Todos»)',flowParties,selectedId]]);
  for(const id of ['atlas237FlowLevel','atlas237FlowParty']){
   const el=document.getElementById(id);
   if(el&&!el.dataset.atlas19SelectionReset){const previous=el.onchange;
    el.onchange=function(event){local.atlas237Selection=null;local.atlas237PartyPage=0;previous?.call(this,event)};
    el.dataset.atlas19SelectionReset='1';
   }
  }
  if(selectedId!=='Todos'){
   const history=byIdentity.get(selectedId)||[];
   add('<div class="extension-heading">PARTIDO SELECCIONADO · '+esc(history[0]?.['Denominación electoral']||selectedId)+'</div>');
   table(history.map(r=>({anio:r['Año'],partido:r['Denominación electoral'],arena:arena(r),
    cobertura_legislativa:stateOf(r),provincias_legislativas:r['Provincias legislativas'],
    candidaturas_propietarias:r['Candidaturas propietarias'],diputaciones_electas:r['Diputaciones declaradas']})),
    ['anio','partido','arena','cobertura_legislativa','provincias_legislativas',
     'candidaturas_propietarias','diputaciones_electas'],'Historial de la identidad partidaria elegida · CSV');
   add('<button type="button" class="button" id="atlas237OpenSelectedParty" style="margin:8px 0 15px">Ver ficha completa del partido · sección 17 ↗</button>');
   const link=document.getElementById('atlas237OpenSelectedParty');
   if(link)link.onclick=()=>setPartyProfileV14(selectedId);
  }
  if(current==='Resumen histórico de partidos'){flowSummaryV14();return;}
  const def=FLOW_DEFS.find(d=>d.name===current)||FLOW_DEFS[0];
  const mode=['Diagrama','Matriz'].includes(local.atlas237FlowDisplay)?local.atlas237FlowDisplay:'Diagrama';
  controls([['atlas237FlowDisplay','Presentación',['Diagrama','Matriz'],mode]]);
  note(def.description);
  const events=flowEventsV14(def),stats=flowStatsV14(def,events);
  flowBalanceV15(def,events);
  if(mode==='Diagrama')flowFigureV14(def,stats);else flowMatrixV14(def,stats);
  table(stats.map(s=>({origen:s.a,destino:s.b,partidos:s.partidos,transiciones:s.transiciones,
     porcentaje_origen:s.porcentaje_origen,porcentaje_destino:s.porcentaje_destino})),
    ['origen','destino','partidos','transiciones','porcentaje_origen','porcentaje_destino'],
    'Rutas observadas y porcentajes por origen y destino · CSV');
 }
 // El CSV de candidaturas por sí solo no trae id_persona; se debe recuperar
 // por id_evento desde la base consolidada. Sin ese enlace se unían personas
 // distintas en una tarjeta de cientos de casos y se repetían las trayectorias.
 const fullEvents=D.resultados_candidaturas||[];
 const byEventId=new Map(fullEvents.map(r=>[String(r.id_evento),r]));
 const normName=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,'');
 const exactKey=r=>Number(r.anio)+'|'+r.partido+'|'+r.provincia+'|'+normName(r.nombre);
 const byExactCandidate=new Map();
 for(const row of fullEvents){const key=exactKey(row);
  if(!byExactCandidate.has(key))byExactCandidate.set(key,[]);byExactCandidate.get(key).push(row);}
 const electedByElection=new Map();
 for(const row of fullEvents){if(row.electa!==true)continue;
  const key=Number(row.anio)+'|'+row.partido+'|'+row.provincia;
  if(!electedByElection.has(key))electedByElection.set(key,[]);
  electedByElection.get(key).push(row);
 }
 const surnames=s=>normName(String(s||'').trim().split(/\s+/).slice(-2).join(' '));
 const partyColors=new Map((D.colores_partidos||[]).map(r=>[String(r.partido),String(r.color||'#7395a9')]));
 const partyColor=r=>partyColors.get(r['Denominación electoral'])||'#6389a0';
 const PARTY_PAGE_SIZE=12;
 let partyExportV16={title:'',visible:[],flat:[],page:0};
 function selectionTitleV16(metric,group,province,year,scope='Todos'){
  const territory=province==='Nacional'?'Costa Rica (siete provincias)':province;
  const types={'Toda la participación legislativa':'participación legislativa general',
   'Nacional':'cobertura legislativa nacional (7 provincias)',
   'Uniprovincial':'cobertura legislativa uniprovincial',
   'Multiprovincial':'cobertura legislativa multiprovincial (2–6 provincias)',
   'Solo presidencial':'solo presidencial',
   'Solo legislativa':'solo legislativa',
   'Presidencial y legislativa':'presidencial y legislativa'};
  const label=metric==='diputaciones'?'Diputaciones electas':
   metric==='candidaturas'?'Candidaturas a diputaciones':'Partidos participantes';
  return label+' · '+(types[group]||group)+' · '+
   (scope!=='Todos'?'Población: '+scope+' · ':'')+territory+' · '+
   (year===0?state.from+'–'+state.to+' (todas las elecciones)':String(year));
 }
 function partyTimelineV16(id){
  const history=byIdentity.get(String(id))||[];
  return history.map((r,i)=>{
   const prev=history[i-1],changes=[];
   if(prev){
    if(arena(prev)!==arena(r))changes.push('Participación: '+arena(prev)+' → '+arena(r));
    if(stateOf(prev)!==stateOf(r))changes.push('Cobertura: '+stateOf(prev)+' → '+stateOf(r));
    if(prev['Denominación electoral']!==r['Denominación electoral'])
     changes.push('Denominación: '+prev['Denominación electoral']+' → '+r['Denominación electoral']);
    if(String(prev['Provincias legislativas']||'')!==String(r['Provincias legislativas']||''))
     changes.push('Provincias: '+String(prev['Provincias legislativas']||'—')+' → '+String(r['Provincias legislativas']||'—'));
   }
   const y=Number(r['Año']);
   return {id:String(id),anio:y,nombre:r['Denominación electoral'],arena:arena(r),
    cobertura:stateOf(r),provincias:Number(r['Provincias legislativas']||0),
    presidencial:r['Participación presidencial']||'No',
    candidaturas:C.filter(c=>c.anio===y&&pid(findParty(c))===String(id)).length,
    diputaciones_electas:E.filter(e=>e.anio===y&&pid(findParty(e))===String(id)).length,
    votos_legislativos:r['Votos legislativos']??'',
    cambios:changes,numero_cambios:changes.length};
  });
 }
 const shortenV16=(s,n=54)=>String(s??'').length>n?String(s).slice(0,n-1)+'…':String(s??'');
 const partyExportFileV16=(blob,name)=>{
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),5000);
 };
 function partySvgV16(){
  const {title,visible,page}=partyExportV16,cols=3,w=1420,g=22,cw=(w-64-g*(cols-1))/cols;
  let y=100,body='';
  for(let start=0;start<visible.length;start+=cols){
   const row=visible.slice(start,start+cols),h=Math.max(...row.map(c=>150+c.timeline.length*22),170);
   row.forEach((card,i)=>{
    const x=32+i*(cw+g),t=card.timeline;
    body+='<rect x="'+x+'" y="'+y+'" width="'+cw+'" height="'+h+'" rx="12" fill="#f8fbfd" stroke="#ccdae4"/>'+
     '<rect x="'+x+'" y="'+y+'" width="6" height="'+h+'" rx="2" fill="'+esc(card.color)+'"/>';
    body+='<text x="'+(x+20)+'" y="'+(y+27)+'" font-size="16" font-weight="bold" fill="#1b3b4c">'+esc(shortenV16(card.name,45))+'</text>';
    body+='<text x="'+(x+20)+'" y="'+(y+51)+'" font-size="12" fill="#516976">'+
     esc(shortenV16(card.type+' · '+card.first+'–'+card.last,61))+'</text>';
    body+='<text x="'+(x+20)+'" y="'+(y+76)+'" font-size="12" fill="#284954">'+
     esc(card.timeline.length+' elecciones · '+card.candidates+' candidaturas · '+card.elected+' electas')+'</text>';
    body+='<text x="'+(x+20)+'" y="'+(y+101)+'" font-size="12" font-weight="bold" fill="#217b83">'+
     esc(card.changes+' elecciones con cambios observados')+'</text>';
    for(let j=0;j<t.length;j++){
     const event=t[j],flag=event.numero_cambios?' · CAMBIO':'',line=event.anio+' · '+event.cobertura+flag;
     body+='<text x="'+(x+20)+'" y="'+(y+133+j*22)+'" font-size="11.5" fill="'+
      (event.numero_cambios?'#9c5834':'#4b6370')+'">'+esc(shortenV16(line,57))+'</text>';
    }
   });y+=h+g;
  }
  const height=y+18;
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+height+'" viewBox="0 0 '+w+' '+height+'">'+
   '<rect width="100%" height="100%" fill="#ffffff"/>'+
   '<text x="32" y="38" font-family="Arial" font-size="21" font-weight="bold" fill="#193949">'+
   esc(shortenV16(title,105))+'</text>'+
   '<text x="32" y="66" font-family="Arial" font-size="12" fill="#516b78">'+
   'Una tarjeta por identidad · Historia completa de categorías por elección · Página '+(page+1)+'</text>'+
   '<g font-family="Arial, sans-serif">'+body+'</g></svg>';
  return {svg,width:w,height};
 }
 function exportPartyCardsV16(format){
  if(format==='csv'){
   if(typeof csv==='function')csv(partyExportV16.flat,'Atlas_Partidos_Trayectorias_1953_2026.csv');
   return;
  }
  const {svg,width,height}=partySvgV16();
  if(format==='svg'){
   partyExportFileV16(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}),
    'Atlas_Tarjetas_Partidos_pagina_'+(partyExportV16.page+1)+'.svg');return;
  }
  const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'})),image=new Image();
  image.onload=()=>{
   const canvas=document.createElement('canvas');canvas.width=width*2;canvas.height=height*2;
   const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
   ctx.scale(2,2);ctx.drawImage(image,0,0,width,height);URL.revokeObjectURL(url);
   canvas.toBlob(blob=>{if(blob)partyExportFileV16(blob,'Atlas_Tarjetas_Partidos_pagina_'+(partyExportV16.page+1)+'.png');},'image/png');
  };
  image.onerror=()=>URL.revokeObjectURL(url);
  image.src=url;
 }
 function candidateRecordV14(row,isElected=false){
  const id=String(row.id_evento||row.id||row.id_registro||[
   row.anio,row.provincia,row.partido,normName(row.nombre)].join('|'));
  let exact=byEventId.get(id)||((byExactCandidate.get(exactKey(row))||[])
    .find(x=>!isElected||x.electa===true))||null;
  if(!exact&&isElected){
   // Tres declaratorias históricas usan nombres abreviados o una grafía
   // distinta respecto a la candidatura. Conciliación solo si la coincidencia
   // de ambos apellidos y la inicial identifica UNA persona electa.
   const possibilities=(electedByElection.get(Number(row.anio)+'|'+row.partido+'|'+row.provincia)||[])
    .filter(x=>surnames(x.nombre)===surnames(row.nombre)&&
       normName(x.nombre).slice(0,1)===normName(row.nombre).slice(0,1));
   const persons=new Set(possibilities.map(x=>x.id_persona));
   if(persons.size===1)exact=possibilities[0];
  }
  if(!String(row.nombre||'').trim()||String(row.nombre).startsWith('[Nombre no consignado]'))return null;
  return {...row,id_persona:exact?.id_persona||('IDENTIDAD:'+normName(row.nombre)),
   id_evento:exact?.id_evento||id,cargo:exact?.cargo||'Diputación',
   antecedente:isElected?'Diputación electa':row.electa?'Candidatura electa':'Candidatura no electa',
   nombre:exact?.nombre||row.nombre,partido:row.partido,provincia:row.provincia,
   anio:Number(row.anio)};
 }
 function namesForSelectionV14(records,elected){
  const list=records.map(row=>candidateRecordV14(row,elected)).filter(Boolean);
  // Una candidatura o declaratoria precisa no puede aparecer varias veces.
  return [...new Map(list.map(r=>[String(r.id_evento||r.id_registro||r.id),r])).values()];
 }
 function setPartyProfileV14(id){
  local.atlas237ProfileParty=String(id);
  // Un filtro previo de la sección 17 no puede ocultar un partido escogido
  // desde un flujo, matriz o resultado.
  local.atlas237ProfileYear='Todos';local.atlas237ProfileArena='Todas';
  local.atlas237ProfileElecta='Todos';local.atlas237ProfilePres='Todos';
  const historical=byIdentity.get(String(id))||[];
  if(historical.length)local.profileparty=historical[0]['Denominación electoral'];
  state.tab='perfiles';render();
  document.getElementById('atlas237PartyProfile')?.scrollIntoView?.({block:'start',behavior:'smooth'});
 }
 function showPartyCardsV14(records,titleText='Partidos de la selección'){
  const uniq=[...new Map(records.map(r=>[pid(r),r])).values()].sort((a,b)=>
   a['Denominación electoral'].localeCompare(b['Denominación electoral'],'es'));
  add('<div class="extension-heading">PARTIDOS DE LA SELECCIÓN · '+esc(titleText)+' · '+fmt(uniq.length)+' identidades</div>');
  if(!uniq.length){note('Ningún partido observado en esta selección.');return;}
  const allCards=uniq.map(r=>{
   const timeline=partyTimelineV16(pid(r));
   return {id:pid(r),name:r['Denominación electoral'],color:partyColor(r),
    type:lifetime(byIdentity.get(pid(r))||[r]),first:timeline[0]?.anio,last:timeline.at(-1)?.anio,
    candidates:timeline.reduce((n,x)=>n+x.candidaturas,0),
    elected:timeline.reduce((n,x)=>n+x.diputaciones_electas,0),
    changes:timeline.filter(x=>x.numero_cambios>0).length,timeline};
  });
  const countPages=Math.ceil(allCards.length/PARTY_PAGE_SIZE);
  const requested=Math.floor(Number(local.atlas237PartyPage||0));
  const page=Number.isFinite(requested)?Math.max(0,Math.min(requested,countPages-1)):0;
  const visible=allCards.slice(page*PARTY_PAGE_SIZE,(page+1)*PARTY_PAGE_SIZE);
  const flat=allCards.flatMap(card=>card.timeline.map(t=>({seleccion:titleText,partido:card.name,
   id_partido:card.id,trayectoria_historica:card.type,anio:t.anio,denominacion:t.nombre,
   arena:t.arena,cobertura:t.cobertura,provincias:t.provincias,presidencia:t.presidencial,
   candidaturas_legislativas:t.candidaturas,diputaciones_electas:t.diputaciones_electas,
   votos_legislativos:t.votos_legislativos,cambios_observados:t.cambios.join(' | ')})));
  partyExportV16={title:titleText,visible,flat,page};
  add('<section class="card" style="padding:18px;margin-top:12px;border:1px solid #bed7df">'+
   '<div class="card-head"><div><h3>'+esc(titleText)+'</h3><span class="mini">'+
   fmt(allCards.length)+' partidos distintos · '+fmt(flat.length)+' participaciones históricas · '+
   'página '+(page+1)+' de '+countPages+'</span></div>'+
   '<div class="exports"><button type="button" id="atlas237PartyPNG">PNG</button>'+
   '<button type="button" id="atlas237PartySVG">SVG</button>'+
   '<button type="button" id="atlas237PartyCSV">CSV</button></div></div>'+
   '<p class="chart-note">Una tarjeta por identidad partidaria, con todas sus participaciones, cambios de arena, '+
   'cobertura, denominación y provincias, candidaturas y elecciones ganadas. '+
   'PNG y SVG exportan las tarjetas de la página visible; CSV incluye toda la selección y su historia completa.</p>'+
   '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px">'+
   visible.map(card=>'<article style="border:1px solid #d4e0e7;border-top:5px solid '+esc(card.color)+';'+
    'background:#fbfcfe;border-radius:11px;padding:14px;min-height:230px;display:flex;flex-direction:column;gap:8px">'+
    '<h4 style="margin:0;font-size:15px;line-height:1.3;color:#173748">'+esc(card.name)+'</h4>'+
    '<div style="color:#536b77;font-size:12px">'+esc(card.type)+' · '+esc(card.first)+'–'+esc(card.last)+'</div>'+
    '<div style="display:flex;gap:5px;flex-wrap:wrap;font-size:12px">'+
    ['Elecciones: '+card.timeline.length,'Candidaturas: '+fmt(card.candidates),
      'Diputaciones electas: '+fmt(card.elected),'Elecciones con cambios: '+card.changes].map(x=>
     '<span style="padding:5px 7px;background:#eaf2f5;border-radius:6px">'+esc(x)+'</span>').join('')+'</div>'+
    '<details><summary style="color:#087b83;font-weight:700;cursor:pointer">'+
    'Ver todas las '+card.timeline.length+' participaciones y cambios</summary>'+
    '<ol style="padding-left:20px;margin:7px 0;font-size:12px">'+card.timeline.map(t=>
     '<li style="padding:5px 0;border-bottom:1px solid #e7eef2">'+
      '<strong>'+t.anio+' · '+esc(t.nombre)+'</strong>'+
      '<div>'+esc(t.arena)+' · '+esc(t.cobertura)+'</div>'+
      '<div>Provincias: '+esc(t.provincias)+'</div>'+
      '<div>Presidencia: '+esc(t.presidencial)+' · '+fmt(t.candidaturas)+' candidaturas · '+
       fmt(t.diputaciones_electas)+' diputaciones electas</div>'+
      (t.cambios.length?'<div style="color:#a85f2f"><b>Cambios:</b> '+esc(t.cambios.join(' · '))+'</div>':'')+
      '</li>').join('')+'</ol></details>'+
    '<button class="atlas237PartyCard button" type="button" data-id="'+esc(card.id)+'" '+
    'style="margin-top:auto;cursor:pointer;color:#096e7b">Ver perfil completo · sección 17 ↗</button></article>').join('')+
   '</div><div style="display:flex;align-items:center;gap:10px;justify-content:flex-end;margin-top:16px">'+
   '<button class="button" id="atlas237PartyPrev" '+(page===0?'disabled':'')+'>Anterior</button>'+ 
   '<span>Página '+(page+1)+' / '+countPages+'</span><button class="button" id="atlas237PartyNext" '+
   (page===countPages-1?'disabled':'')+'>Siguiente</button></div></section>');
  [...document.querySelectorAll('.atlas237PartyCard')].forEach(button=>
   button.onclick=()=>setPartyProfileV14(button.dataset.id));
  for(const [id,format] of [['atlas237PartyPNG','png'],['atlas237PartySVG','svg'],['atlas237PartyCSV','csv']]){
   const button=document.getElementById(id);if(button)button.onclick=()=>exportPartyCardsV16(format);
  }
  for(const [id,next] of [['atlas237PartyPrev',page-1],['atlas237PartyNext',page+1]]){
   const button=document.getElementById(id);if(button)button.onclick=()=>{
    local.atlas237PartyPage=next;refreshSelectionV19();
   };
  }
  table(flat,['partido','anio','denominacion','arena','cobertura','provincias',
    'presidencia','candidaturas_legislativas','diputaciones_electas','cambios_observados'],
    'Registro longitudinal de todos los partidos de la selección · CSV');
 }
 function selectionDetailsV14(){
  const s=local.atlas237Selection;if(!s)return;
  let related=[],selectedPeople=[],titleText='',selectedMetric='partidos';
  if(s.kind==='flow'){
   const matched=activeEvents().filter(e=>e.desde+' → '+e.hacia===s.route);
   const ids=new Set(matched.map(e=>e.id));
   related=[...byIdentity].filter(([id])=>ids.has(id)).map(([,rows])=>rows[rows.length-1]);
   titleText='Transición de cobertura · '+s.route;
   add('<div id="atlas237Details" class="extension-heading">PARTIDOS DE LA RUTA · '+esc(titleText)+'</div>');
   table(matched.map(e=>({partido:e.partido,id_partido:e.id,anio_origen:e.anio_origen,origen:e.desde,
     anio_destino:e.anio_destino,destino:e.hacia})),
     ['partido','id_partido','anio_origen','origen','anio_destino','destino'],'Transiciones exactas · CSV');
  }else if(s.kind==='flow_v14'){
   const def=FLOW_DEFS.find(x=>x.name===s.flow);if(!def)return;
   const matched=flowEventsV14(def).filter(e=>def.map(e.desde,e,'origen')===s.from&&def.map(e.hacia,e,'destino')===s.to);
   const ids=new Set(matched.map(e=>e.id));
   related=[...byIdentity].filter(([id])=>ids.has(id)).map(([,rows])=>rows[rows.length-1]);
   titleText=s.flow+' · '+s.from+' → '+s.to+' · '+fmt(ids.size)+' partidos';
   add('<div id="atlas237Details" class="extension-heading">RUTA DE PARTIDOS · '+esc(titleText)+'</div>');
   table(matched.map(e=>({partido:e.partido,id:e.id,anio_origen:e.anio_origen,
     origen:def.map(e.desde,e,'origen'),anio_destino:e.anio_destino,destino:def.map(e.hacia,e,'destino')})),
     ['partido','id','anio_origen','origen','anio_destino','destino'],'Transiciones exactas de esta ruta');
  }else if(s.kind==='flow_state_v15'){
   const def=FLOW_DEFS.find(x=>x.name===s.flow);if(!def)return;
   const matched=flowEventsV14(def).filter(e=>s.side==='Origen'?def.map(e.desde,e,'origen')===s.category:def.map(e.hacia,e,'destino')===s.category);
   const ids=new Set(matched.map(e=>e.id));
   related=[...byIdentity].filter(([id])=>ids.has(id)).map(([,rows])=>rows[rows.length-1]);
   titleText=s.side+' · '+s.category+' · '+fmt(matched.length)+' transiciones';
   add('<div id="atlas237Details" class="extension-heading">PARTIDOS DEL BALANCE · '+esc(titleText)+'</div>');
   table(matched.map(e=>({id:e.id,partido:e.partido,anio_origen:e.anio_origen,origen:def.map(e.desde,e,'origen'),
       anio_destino:e.anio_destino,destino:def.map(e.hacia,e,'destino')})),
      ['id','partido','anio_origen','origen','anio_destino','destino'],'Transiciones de la categoría seleccionada');
  }else if(s.kind==='lifetime'||s.kind==='coverage'){
   const flowId=String(local.atlas237FlowParty||'Todos');
   const selected=[...byIdentity].filter(([id,rows])=>{
    if(flowId!=='Todos'&&flowId!==id)return false;
    if(s.kind==='lifetime')return lifetime(rows)===s.group;
    const uni=rows.some(r=>stateOf(r)==='Uniprovincial'),
     multi=rows.some(r=>stateOf(r)==='Multiprovincial'),
     nac=rows.some(r=>stateOf(r)==='Nacional');
    return s.group==='Solo uniprovincial'?uni&&!multi&&!nac:
     s.group==='Solo multiprovincial'?!uni&&multi&&!nac:
     s.group==='Solo nacional'?!uni&&!multi&&nac:
     [uni,multi,nac].filter(Boolean).length>1;
   });
   related=selected.map(([,rows])=>rows[rows.length-1]);titleText=s.group;
   add('<div id="atlas237Details" class="extension-heading">PARTIDOS DEL GRUPO · '+esc(titleText)+'</div>');
  }else if(s.kind==='cell'){
   selectedMetric=s.metric;
   const picked=rowsFor(s.year,s.province,s.metric,s.group,s.scope||'Todos');
   related=picked.selected.map(r=>s.metric==='partidos'?r:findParty(r)).filter(Boolean);
   titleText=selectionTitleV16(s.metric,s.group,s.province,s.year,s.scope);
   add('<div id="atlas237Details" class="extension-heading">OBSERVACIONES DE LA CELDA · '+esc(titleText)+'</div>');
   const whole=denominatorV19(s.year,local.atlas237Level===NIVELES[2]?'Nacional':s.province,s.metric,
    ['Solo legislativa','Presidencial y legislativa','Solo presidencial'].includes(s.group));
   note(fmt(picked.selected.length)+' observaciones; '+pct(per(picked.selected.length,whole))+
    ' del universo completo de '+fmt(whole)+' observaciones '+
    (local.atlas237Level===NIVELES[2]?'en Costa Rica':'en '+s.province)+'. '+
    'Los subgrupos filtrados no se utilizan como su propio denominador.');
   if(s.year===0)note('La celda histórica reúne las observaciones reales de todas las elecciones incluidas en el intervalo. No se interpretan los promedios como observaciones ficticias.');
   if(s.metric!=='partidos'){
    selectedPeople=namesForSelectionV14(picked.selected,s.metric==='diputaciones');
   }
  }else{return;}
  if(selectedMetric==='partidos'){
   showPartyCardsV14(related,titleText);
   return; // partido ≠ candidatura: no panel de personas.
  }
  add('<div class="extension-heading">PERSONAS Y CANDIDATURAS EXACTAS DE LA CELDA</div>');
  if(typeof atlas225NominalPanel==='function')
   atlas225NominalPanel('Personas · '+titleText,selectedPeople,'antecedent','atlas237Personas',titleText);
  table(selectedPeople.map(r=>({anio:r.anio,nombre:r.nombre,partido:r.partido,provincia:r.provincia,
    cargo:r.cargo,tipo:r.tipo,resultado:r.antecedente,id_evento:r.id_evento,id_persona:r.id_persona})),
    ['anio','nombre','partido','provincia','cargo','tipo','resultado','id_evento','id_persona'],
    'Candidaturas o declaratorias sin duplicación de eventos · CSV');
  const omitted=(s.kind==='cell'?rowsFor(s.year,s.province,s.metric,s.group,s.scope||'Todos').selected.length:0)-selectedPeople.length;
  if(omitted>0)note(fmt(omitted)+' registros no tienen una identidad nominal o un evento único verificable; permanecen en los totales, pero no se atribuyen a una persona.');
  showPartyCardsV14(related,'Partidos vinculados · '+titleText);
 }
 function partyProfilesV14(){
  add('<div class="extension-heading" id="atlas237PartyProfile">PERFILES DE PARTIDOS · CONSULTA HISTÓRICA</div>');
  note('Cada perfil reúne las participaciones de una misma identidad partidaria conciliada. La denominación electoral puede variar por elección; los registros de personas se muestran en su propio explorador.');
  const yearOptions=['Todos',...years().map(String)];
  const year=yearOptions.includes(String(local.atlas237ProfileYear||'Todos'))?String(local.atlas237ProfileYear||'Todos'):'Todos';
  const arenaFilter=['Todas',...ARENAS].includes(local.atlas237ProfileArena)?local.atlas237ProfileArena:'Todas';
  const electionFilter=['Todos','Con diputaciones electas','Sin diputaciones electas'].includes(local.atlas237ProfileElecta)?local.atlas237ProfileElecta:'Todos';
  const presFilter=['Todos','Con participación presidencial','Sin participación presidencial'].includes(local.atlas237ProfilePres)?local.atlas237ProfilePres:'Todos';
  controls([['atlas237ProfileYear','Año de observación',yearOptions,year],
    ['atlas237ProfileArena','Participación por arena',['Todas',...ARENAS],arenaFilter],
    ['atlas237ProfileElecta','Diputaciones electas',['Todos','Con diputaciones electas','Sin diputaciones electas'],electionFilter],
    ['atlas237ProfilePres','Presidencia',['Todos','Con participación presidencial','Sin participación presidencial'],presFilter]]);
  const available=[...byIdentity].filter(([,rows])=>rows.some(r=>
   (year==='Todos'||String(r['Año'])===year)&&
   (arenaFilter==='Todas'||arena(r)===arenaFilter)&&
   (electionFilter==='Todos'||(Number(r['Diputaciones declaradas']||0)>0)===(electionFilter==='Con diputaciones electas'))&&
   (presFilter==='Todos'||(r['Participación presidencial']==='Sí')===(presFilter==='Con participación presidencial'))));
  const options=[['','Seleccionar partido'],...available.map(([id,rows])=>[id,rows[0]['Denominación electoral']+' · '+rows[0]['Año']])
    .sort((a,b)=>a[1].localeCompare(b[1],'es'))];
  controls([['atlas237ProfileParty','Partido',options,local.atlas237ProfileParty||'']]);
  const suggestions=available.map(([id,rows])=>'<option value="'+esc(rows[0]['Denominación electoral'])+'" data-id="'+esc(id)+'"></option>').join('');
  add('<div style="margin:8px 0 14px"><label for="atlas237PartyFind">Buscar por nombre</label> '+
    '<input id="atlas237PartyFind" list="atlas237PartyNames" type="search" placeholder="Escriba el nombre del partido" '+
    'style="width:min(95%,450px);padding:10px;border:1px solid #bed0da;border-radius:8px">'+
    '<datalist id="atlas237PartyNames">'+suggestions+'</datalist></div>');
  const search=document.getElementById('atlas237PartyFind');
  if(search)search.onchange=()=>{const raw=normName(search.value);
    const match=available.find(([,rows])=>rows.some(r=>normName(r['Denominación electoral'])===raw))||
     available.find(([,rows])=>rows.some(r=>normName(r['Denominación electoral']).includes(raw)));
    if(match&&raw)setPartyProfileV14(match[0]);};
  const id=String(local.atlas237ProfileParty||'');if(!id)return;
  const history=byIdentity.get(id);if(!history){note('El partido seleccionado no figura en este corpus.');return;}
  const base=history[0],totalC=C.filter(r=>pid(findParty(r))===id),
    totalE=E.filter(r=>pid(findParty(r))===id),
    pres=history.filter(r=>r['Participación presidencial']==='Sí');
  const fullTimeline=partyTimelineV16(id);
  const changeElections=fullTimeline.filter(r=>r.numero_cambios>0);
  const names=[...new Set(fullTimeline.map(r=>r.nombre))];
  const nationalElections=fullTimeline.filter(r=>r.cobertura==='Nacional').length;
  const provincialElections=fullTimeline.filter(r=>['Uniprovincial','Multiprovincial'].includes(r.cobertura)).length;
  const noLegElections=fullTimeline.filter(r=>r.cobertura==='Sin participación legislativa').length;
  const covers=[...new Set(fullTimeline.map(r=>r.cobertura))];
  const rawEvents=(D.eventos||[]).filter(r=>r.id_persona&&history.some(h=>Number(h['Año'])===Number(r.anio)&&h['Denominación electoral']===r.partido));
  const byPersonYear=new Map();
  for(const r of rawEvents){const k=r.id_persona+'|'+r.anio;
   if(!byPersonYear.has(k))byPersonYear.set(k,new Set());byPersonYear.get(k).add(r.cargo);}
  const dobles=[...byPersonYear.values()].filter(cargos=>cargos.has('Diputación')&&[...cargos].some(c=>c!=='Diputación')).length;
  add('<div class="card" style="padding:18px;border-top:6px solid '+esc(partyColor(base))+';margin:12px 0">'+
    '<h3>'+esc(base['Denominación electoral'])+'</h3><p><b>Identidad:</b> '+esc(id)+
    ' · <b>Trayectoria:</b> '+esc(lifetime(history))+' · <b>Periodo observado:</b> '+
    esc(fullTimeline[0]?.anio)+'–'+esc(fullTimeline.at(-1)?.anio)+'</p><div style="display:flex;flex-wrap:wrap;gap:10px">'+
    [['Elecciones',history.length],['Presidenciales',pres.length],['Candidaturas legislativas',totalC.length],
     ['Diputaciones electas',totalE.length],['Dobles postulaciones observadas',dobles],
     ['Cobertura nacional (7)',nationalElections],['Cobertura 1–6 provincias',provincialElections],
     ['Solo presidenciales (sin listas)',noLegElections],
     ['Elecciones con cambios',changeElections.length],['Denominaciones observadas',names.length]].map(([key,v])=>
      '<span style="padding:8px 11px;background:#eaf2f6;border-radius:8px"><b>'+fmt(v)+'</b> '+esc(key)+'</span>').join('')+
    '</div><p style="margin-top:15px"><b>Denominaciones documentadas:</b> '+
     esc(names.join(' · '))+'</p><p><b>Coberturas históricas observadas:</b> '+
     esc(covers.join(' → '))+'</p></div>');
  add('<div class="extension-heading">CAMBIOS ENTRE PARTICIPACIONES CONSECUTIVAS</div>');
  if(changeElections.length){
   const beforeByYear=new Map(fullTimeline.map((r,i)=>[r.anio,fullTimeline[i-1]]));
   table(changeElections.map(r=>({anio_anterior:beforeByYear.get(r.anio)?.anio,
     anio_nuevo:r.anio,partido:r.nombre,arena_anterior:beforeByYear.get(r.anio)?.arena,
     arena_nueva:r.arena,cobertura_anterior:beforeByYear.get(r.anio)?.cobertura,
     cobertura_nueva:r.cobertura,detalle_de_cambios:r.cambios.join(' | ')})),
     ['anio_anterior','anio_nuevo','partido','arena_anterior','arena_nueva',
      'cobertura_anterior','cobertura_nueva','detalle_de_cambios'],
     'Cambios documentados: arena, cobertura, denominación y provincias · CSV');
  }else note('En las participaciones observadas no se registran cambios de arena, cobertura, denominación o provincias entre elecciones consecutivas.');
  const categoryCounts=STATES.map(cat=>({
   categoria:cat,elecciones:fullTimeline.filter(r=>r.cobertura===cat).length,
   porcentaje_del_historial:per(fullTimeline.filter(r=>r.cobertura===cat).length,fullTimeline.length)||0}));
  plot('Distribución histórica de la cobertura · '+base['Denominación electoral'],[
   {type:'bar',orientation:'h',x:categoryCounts.map(x=>x.elecciones),y:categoryCounts.map(x=>x.categoria),
    marker:{color:categoryCounts.map(x=>FLOW_COLORS[x.categoria])},
    text:categoryCounts.map(x=>fmt(x.elecciones)+' · '+pct(x.porcentaje_del_historial)),textposition:'outside',
    hovertemplate:'%{y}<br>%{x} elecciones observadas<extra></extra>'}],
   categoryCounts,{wide:true,height:320,xTitle:'Participaciones históricas observadas',
    note:'Cada participación se cuenta una vez en una sola categoría de cobertura. Esta distribución describe la historia de la identidad; no implica continuidad organizativa más allá de la conciliación documental.'});
  plot('Cronología de cambios de clasificación · '+base['Denominación electoral'],[
   {type:'scatter',mode:'lines+markers',x:fullTimeline.map(t=>String(t.anio)),
    y:fullTimeline.map(t=>t.cobertura),
    name:'Cobertura observada',line:{color:'#8199a9',width:2,dash:'dot'},
    marker:{size:14,color:fullTimeline.map(t=>FLOW_COLORS[t.cobertura]),
      line:{color:'#fff',width:1.6}},
    customdata:fullTimeline.map(t=>[t.nombre,t.provincias,t.cambios.join(' | ')]),
    hovertemplate:'%{x} · %{y}<br>%{customdata[0]}<br>Provincias: %{customdata[1]}<br>Cambios: %{customdata[2]}<extra></extra>'}],
   fullTimeline,{wide:true,height:350,xTitle:'Elección',yTitle:'Clasificación electoral',
    layout:{yaxis:{type:'category',categoryorder:'array',
      categoryarray:STATES}},
    note:'Se conecta únicamente el orden de las participaciones documentadas de esta identidad. Cada punto identifica su clasificación en esa elección; los intervalos sin participación no se imputan.'});
  const voteHistory=history.filter(r=>r['Votos legislativos']!==null&&
   r['Votos legislativos']!==undefined&&r['Votos legislativos']!==''&&
   Number.isFinite(Number(r['Votos legislativos'])));
  if(voteHistory.length)plot('Votación legislativa documentada · '+base['Denominación electoral'],[
   {type:'bar',x:voteHistory.map(r=>String(r['Año'])),
    y:voteHistory.map(r=>Number(r['Votos legislativos'])),
    marker:{color:voteHistory.map(r=>FLOW_COLORS[stateOf(r)])},
    customdata:voteHistory.map(r=>r['Denominación electoral']),
    hovertemplate:'%{x}<br>%{y:,} votos legislativos<br>%{customdata}<extra></extra>'}],
   voteHistory.map(r=>({anio:r['Año'],partido:r['Denominación electoral'],
     votos_legislativos:Number(r['Votos legislativos']),cobertura:stateOf(r)})),
   {wide:true,height:350,xTitle:'Elección',yTitle:'Votos legislativos',
    note:'Se usan solamente votaciones legislativas documentadas para la identidad y su denominación correspondiente. Los años sin dato no reciben una barra cero.'});
  const rows=history.map(r=>({anio:Number(r['Año']),nombre:r['Denominación electoral'],
    arena:arena(r),cobertura:stateOf(r),provincias:r['Provincias legislativas'],
    candidaturas:totalC.filter(c=>Number(c.anio)===Number(r['Año'])).length,
    diputaciones_electas:totalE.filter(e=>Number(e.anio)===Number(r['Año'])).length,
    presidencial:r['Participación presidencial'],votos_legislativos:r['Votos legislativos'],
    cambio_de_arena:r['Cambio de arena respecto observación previa']}));
  const plotted=rows.filter(r=>year==='Todos'||String(r.anio)===year);
  table(plotted,['anio','nombre','arena','cobertura','provincias','candidaturas','diputaciones_electas','presidencial','votos_legislativos','cambio_de_arena'],
    'Historia electoral de la identidad seleccionada · CSV');
  plot('Historia legislativa de '+base['Denominación electoral'],[
    {type:'scatter',mode:'lines+markers',name:'Candidaturas',x:plotted.map(r=>String(r.anio)),
     y:plotted.map(r=>r.candidaturas),line:{color:partyColor(base),width:3},marker:{size:10}},
    {type:'scatter',mode:'lines+markers',name:'Diputaciones electas',x:plotted.map(r=>String(r.anio)),
     y:plotted.map(r=>r.diputaciones_electas),line:{color:'#387d89',width:3},marker:{size:10}}],
    plotted,{wide:true,height:380,xTitle:'Elección',yTitle:'Observaciones',
      note:'Solo diputaciones. Las candidaturas presidenciales se resumen en el perfil, no se suman a las candidaturas legislativas.'});
 }
 const originalPartidos=views.partidos;
 views.partidos=function(...args){
  const result=originalPartidos.apply(this,args);
  matricial();annualProvincialPartiesV14();flowExplorerV14();
  add('<div id="atlas237DetailsMarker" aria-hidden="true"></div>');
  selectionDetailsV14();
  return result;
 };
 // La sección 17 ya existe en el Atlas. Enriquecer ESA sección, nunca
 // duplicar el explorador de partidos al pie de la sección territorial.
 const originalPerfiles=views.perfiles;
 views.perfiles=function(...args){
  const result=originalPerfiles.apply(this,args);
  partyProfilesV14();
  return result;
 };
 const originalGobierno=views.gobierno;
 views.gobierno=function(...args){
  const result=originalGobierno.apply(this,args);
  add('<div class="extension-heading">ORIGEN ELECTORAL DE LAS DIPUTACIONES ELECTAS</div>');
  matriz('Diputaciones electas · arena presidencial y legislativa','diputaciones',ARENAS.slice(0,2),()=>state.province,x=>x);
  return result;
 };
 window.ATLAS237_OK=true;window.ATLAS_V2317_COBERTURA_OK=true;
})();
