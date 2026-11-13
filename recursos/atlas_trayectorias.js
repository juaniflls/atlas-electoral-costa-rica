/* ATLAS V14 · cambios acotados: conservar secciones originales y añadir vistas que faltan. */
(function(){
'use strict';
const PROV14=['San José','Alajuela','Cartago','Heredia','Guanacaste','Puntarenas','Limón'];
const VALID14=x=>x!==null&&x!==undefined&&x!==''&&Number.isFinite(+x);
const elect14=()=>Y.filter(y=>y>=state.from&&y<=state.to);
const name14=p=>labelText(p);
const color14=p=>partyPalette[p]?.color||'#87949c';
const within14=x=>+x>=state.from&&+x<=state.to;
const clean14=(s)=>String(s||'').replace(/\s+/g,' ').trim();
const origPartidos14=views.partidos;
views.partidos=function(...args){
  const result=origPartidos14.apply(this,args);
  add('<div class="extension-heading">LIDERAZGOS PROVINCIALES Y PERSISTENCIA ELECTORAL</div>');
  const arena=local.b14arena||'Legislativa';
  const startYear=Y.includes(+local.b14from)?+local.b14from:Y[0];
  const endYear=Y.includes(+local.b14to)?+local.b14to:Y[Y.length-1];
  controls([['b14arena','Arena electoral',['Legislativa','Presidencial','Ambas'],arena],
    ['b14from','Desde (elección)',Y.map(String),String(startYear)],
    ['b14to','Hasta (elección)',Y.map(String),String(endYear)]]);
  const filt=Y.filter(y=>y>=startYear&&y<=endYear);
  if(startYear>endYear){note('El inicio debe ser anterior o igual al final del intervalo.',true);return result;}
  const arenas=arena==='Ambas'?['Legislativa','Presidencial']:[arena];
  const source=(D.metricas||[]).filter(r=>arenas.includes(r.arena)&&+r.ronda===1&&PROV14.includes(r.provincia)&&filt.includes(+r.anio)&&r.ganador);
  const groups=group(source,r=>r.arena+'|'+r.provincia+'|'+r.ganador).map(([k,g])=>{
    const t=g.slice().sort((a,b)=>a.anio-b.anio),p=t[0].provincia,a=t[0].arena,partido=t[0].ganador;
    let streak=0,longest=0;
    for(let i=0;i<t.length;i++){
      streak=(i>0&&Y.indexOf(+t[i].anio)===Y.indexOf(+t[i-1].anio)+1)?streak+1:1;
      longest=Math.max(longest,streak);
    }
    return {provincia:p,arena:a,partido,ganadas:g.length,primer_anio:+t[0].anio,ultimo_anio:+t[t.length-1].anio,racha_maxima:longest,voto_medio:g.reduce((acc,r)=>acc+(+r.concentracion_1||0),0)/g.length,margen_medio:g.reduce((acc,r)=>acc+(+r.margen||0),0)/g.length};
  });
  const partyRanks=group(groups,r=>r.partido).map(([p,rs])=>({p,total:rs.reduce((a,r)=>a+r.ganadas,0)})).sort((a,b)=>b.total-a.total);
  const rows=(arena==='Ambas'?arenas.flatMap(a=>PROV14.map(p=>({a,p,label:p+' · '+a}))):PROV14.map(p=>({a:arena,p,label:p}))).reverse();
  const traces=partyRanks.map(({p})=>{
    const parsed=rows.map(r=>groups.find(g=>g.arena===r.a&&g.provincia===r.p&&g.partido===p));
    return {type:'bar',name:name14(p),orientation:'h',y:rows.map(r=>r.label),x:parsed.map(r=>r?.ganadas||0),
      customdata:parsed.map(r=>r?[r.ganadas,r.voto_medio,r.margen_medio,r.ultimo_anio,r.racha_maxima]:[0,0,0,0,0]),
      marker:{color:color14(p),line:{width:.5,color:'#fff'}},text:parsed.map(r=>r?.ganadas?String(r.ganadas):''),textposition:'inside',textfont:{color:'#fff',size:11},
      hovertemplate:'%{y}<br>'+clean14(name14(p))+'<br>Primer lugar en %{customdata[0]} elecciones<br>Voto medio al ganar: %{customdata[1]:.1f}%<br>Ventaja media sobre segundo: %{customdata[2]:.1f} pp<br>Última victoria: %{customdata[3]}<br>Racha máxima: %{customdata[4]} elecciones<extra></extra>'};
  });
  if(groups.length){
    plot('Composición histórica de liderazgos provinciales · '+arena+' · '+startYear+'–'+endYear,traces,groups,{
      height:Math.max(505,rows.length*42+260),arenaVista:arena,xTitle:'Número de elecciones en las que el partido encabezó la provincia',
      layout:{barmode:'stack',margin:{l:arena==='Ambas'?215:122,r:38,t:40,b:Math.min(260,105+Math.ceil(partyRanks.length/4)*21)},legend:{orientation:'h',x:0,y:-.27,font:{size:10}},
        xaxis:{dtick:1,gridcolor:'#dfe8ea',rangemode:'tozero'}},
      note:'Cada barra es una provincia: los segmentos representan elecciones ganadas por la denominación partidaria. Cambie el horizonte para distinguir bastiones históricos de fortalezas recientes. En el cursor: cuota media, ventaja y última victoria. Esta es una composición de liderazgos, no una clasificación automática de bastiones ni una prueba de continuidad jurídica.'});
    table(groups,['arena','provincia','partido','ganadas','primer_anio','ultimo_anio','racha_maxima','voto_medio','margen_medio'],'Historial territorial de primer lugar · datos auditables');
  }else note('No hay elecciones provinciales observadas en este horizonte.',true);
  return result;
};
const origDual14=views.dualidad;
views.dualidad=function(...args){
  const r=origDual14.apply(this,args);
  add('<div class="extension-heading">QUIEBRE DEL VOTO · DISTRIBUCIONES AGREGADAS POR PROVINCIA</div>');
  note('<b>Qué se mide:</b> diferencia entre la distribución porcentual del voto presidencial (primera ronda) y legislativo para todos los partidos en cada provincia: ½ × suma de diferencias absolutas. En Costa Rica se discute como <b>quiebre del voto</b>; aquí no se estima cuántos electores concretos dividieron su voto. No es una encuesta individual.');
  const years=elect14(),rows=(D.metricas||[]).filter(r=>r.arena==='Legislativa'&&+r.ronda===1&&PROV14.includes(r.provincia)&&years.includes(+r.anio)&&VALID14(r.divergencia_arenas));
  const map=new Map(rows.map(r=>[r.provincia+'|'+r.anio,r]));
  const z=PROV14.map(p=>years.map(y=>map.get(p+'|'+y)?.divergencia_arenas??null));
  plot('Quiebre del voto · distancia presidencial–legislativa por provincia y elección',
    [{type:'heatmap',x:years.map(String),y:PROV14,z,colorscale:[[0,'#f2f6f8'],[.35,'#bfd4df'],[.7,'#6c99b6'],[1,'#265779']],
      texttemplate:'%{z:.1f}',textfont:{size:11,color:'#1d3d53'},xgap:2,ygap:2,
      colorbar:{title:{text:'Distancia<br>(pp)'},thickness:16},
      hovertemplate:'Provincia: %{y}<br>Elección: %{x}<br>Distancia entre distribuciones: %{z:.2f} pp<extra></extra>'}],rows,
    {height:515,arenaVista:'General',xTitle:'Elección',yTitle:'Provincia',
      layout:{xaxis:{type:'category',categoryorder:'array',categoryarray:years.map(String),tickangle:-48},margin:{l:123,r:90,t:32,b:100}},
      note:'Las siete provincias y los 19 procesos se comparan en una misma escala de puntos porcentuales. Cero indica distribuciones idénticas; no indica que nadie haya dividido su voto.'});
  const yearly=[];for(const y of years){const values=rows.filter(r=>+r.anio===y).sort((a,b)=>+b.divergencia_arenas-+a.divergencia_arenas);
    values.forEach((v,i)=>yearly.push({anio:y,provincia:v.provincia,puesto:i+1,distancia_pp:+v.divergencia_arenas}));}
  const rankmap=new Map(yearly.map(r=>[r.provincia+'|'+r.anio,r]));
  const historicalMean=PROV14.map(provincia=>{const seq=yearly.filter(r=>r.provincia===provincia);return {provincia,media_pp:seq.length?seq.reduce((total,r)=>total+r.distancia_pp,0)/seq.length:null,elecciones:seq.length};})
    .sort((a,b)=>(b.media_pp??-Infinity)-(a.media_pp??-Infinity)||PROV14.indexOf(a.provincia)-PROV14.indexOf(b.provincia));
  historicalMean.forEach((row,i)=>row.puesto_global=row.media_pp===null?null:i+1);
  const globalByProvince=new Map(historicalMean.map(r=>[r.provincia,r]));
  const fullX=[...years.map(String),'Ranking global'];
  const rankcolors=['#27547b','#4175a1','#5794b1','#78acae','#99bfa7','#c8b79c','#b28c85'];
  const step=[];for(let i=0;i<7;i++){step.push([i/7,rankcolors[i]],[(i+1)/7-.00001,rankcolors[i]]);}step.push([1,rankcolors[6]]);
  plot('Ranking provincial del quiebre del voto · último campo: promedio global',
    [{type:'heatmap',x:fullX,y:PROV14,z:PROV14.map(p=>[...years.map(y=>rankmap.get(p+'|'+y)?.puesto??null),globalByProvince.get(p)?.puesto_global??null]),
      zmin:.5,zmax:7.5,colorscale:step,xgap:2,ygap:2,showscale:false,
      texttemplate:'%{z:.0f}',textfont:{size:12,color:'#fff'},
      customdata:PROV14.map(p=>[...years.map(y=>rankmap.get(p+'|'+y)?.distancia_pp??null),globalByProvince.get(p)?.media_pp??null]),
      hovertemplate:'%{y} · %{x}<br>Puesto provincial: %{z:.0f} de 7<br>Distancia: %{customdata:.2f} pp<extra></extra>'}],yearly,
    {height:485,arenaVista:'General',xTitle:'Elección',yTitle:'Provincia',
      layout:{xaxis:{type:'category',categoryorder:'array',categoryarray:fullX,tickangle:-50},shapes:[{type:'line',xref:'x',yref:'paper',x0:years.length-.5,x1:years.length-.5,y0:0,y1:1,line:{color:'#27485f',width:2,dash:'dash'}}],margin:{l:125,r:35,t:25,b:120}},
      note:'Puesto 1 = mayor divergencia agregada. La última columna ordena las provincias por su promedio de distancia en puntos porcentuales durante las elecciones seleccionadas (igual peso por elección). No representa una tasa individual de voto dividido.'});
  const focus=+state.focus,sorted=yearly.filter(r=>r.anio===focus).sort((a,b)=>a.puesto-b.puesto);
  if(sorted.length)plot('Provincias con mayor quiebre agregado · elección '+focus,
    [{type:'bar',orientation:'h',y:sorted.slice().reverse().map(x=>x.provincia),x:sorted.slice().reverse().map(x=>x.distancia_pp),
      marker:{color:sorted.slice().reverse().map((_,i)=>rankcolors[6-i])},
      text:sorted.slice().reverse().map(x=>`${x.distancia_pp.toFixed(1)} pp`),textposition:'outside',
      hovertemplate:'%{y}: %{x:.2f} pp<extra></extra>'}],sorted,
    {height:370,arenaVista:'General',xTitle:'Distancia entre distribuciones (pp)',
      note:'Seleccione otra elección mediante el control de año de detalle del Atlas para actualizar este ranking provincial.'});
  table(yearly,['anio','provincia','puesto','distancia_pp'],'Ranking del quiebre agregado por provincia y elección');
  table(historicalMean,['puesto_global','provincia','media_pp','elecciones'],'Ranking global provincial · promedio de divergencia');
  return r;
};
// V18: Ampliación de la pestaña ya existente «Votos y escaños» (sin nueva sección).
const originalSeatsV18=views.representacion_voto;
views.representacion_voto=function(...args){
 const returned=originalSeatsV18.apply(this,args);
 const arena=local.v18SeatArena||'Legislativa';
 add('<div class="extension-heading">OFERTA PARTIDARIA Y ACCESO A LA ASAMBLEA · POR ARENA</div>');
 controls([['v18SeatArena','Partidos observados en la arena',['Legislativa','Presidencial'],arena]]);
 const chosen=Y.filter(y=>y>=state.from&&y<=state.to);
 const seats=new Set((D.escanos||[]).filter(r=>r.provincia==='Nacional'&&Number(r.escanos)>0).map(r=>r.anio+'|'+String(r.partido)));
 const rows=chosen.map(anio=>{
  const parties=new Set((D.votos||[]).filter(r=>r.provincia==='Nacional'&&r.arena===arena&&Number(r.ronda)===1&&Number(r.anio)===anio&&Number(r.votos)>0).map(r=>String(r.partido)));
  let con=0,sin=0;for(const party of parties){if(seats.has(anio+'|'+party))con++;else sin++;}
  return {anio,arena,partidos_con_diputaciones:con,partidos_sin_diputaciones:sin,total:con+sin};
 });
 if(rows.length){
   plot('Oferta partidaria y acceso a diputaciones · '+arena,
     [{type:'scatter',mode:'lines+markers',name:'Partidos con diputaciones',x:rows.map(r=>r.anio),y:rows.map(r=>r.partidos_con_diputaciones),line:{color:'#16817d',width:3},marker:{size:8}},
      {type:'scatter',mode:'lines+markers',name:'Partidos sin diputaciones',x:rows.map(r=>r.anio),y:rows.map(r=>r.partidos_sin_diputaciones),line:{color:'#b97653',width:3},marker:{size:8}}],rows,
     {arenaVista:arena,height:470,xTitle:'Elección',yTitle:'Organizaciones con votos válidos',subtitle:arena+' · Nacional · '+state.from+'–'+state.to,
      note:arena==='Presidencial'?'Se cuentan únicamente organizaciones con votos presidenciales de primera ronda; su acceso a la Asamblea se evalúa por curules legislativas obtenidas en la misma elección.':'Se cuentan organizaciones con votos legislativos; su acceso a la Asamblea se evalúa por curules nacionales obtenidas en la misma elección.'});
 }
 return returned;
};
window.ATLAS_V14_OK=true;
})();

/* V19 · Nombres y cancelaciones: filtros verificables por oferta electoral observada.
   No se infiere identidad organizativa a partir de una denominación compartida. */
(function atlasV19Nombres(){
 const limpiar=t=>String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
 function clasificador(){
  const cats=new Map();
  for(const r of (D.oferta_partidos||[])){
   const k=limpiar(r.partido);if(!cats.has(k))cats.set(k,new Set());cats.get(k).add(r.oferta);
  }
  return cats;
 }
 const catalog=clasificador();
 function tipoDeNombre(nombre){
  const opts=catalog.get(limpiar(nombre))||new Set();
  if(opts.has('Presidencial y legislativa'))return 'Presidencial y legislativa';
  if(opts.has('Solo legislativa')&&!opts.has('Solo presidencial'))return 'Solo legislativa';
  return 'Sin clasificación exclusiva';
 }
 const claseColor={'Solo legislativa':'#9a6aab','Presidencial y legislativa':'#167f79','Sin clasificación exclusiva':'#8c9ba4'};
 views.cancelaciones=function(){
  title('Nombres y cancelaciones partidarias','Cronología documental de inscripciones y cancelaciones, con tres vistas de oferta electoral. Un nombre reiterado no demuestra continuidad jurídica entre registros.');
  const filter=local.n19view||'Todos',periodStart=state.from,periodEnd=state.to;
  const options=['Todos','Solo legislativa','Presidencial y legislativa'];
  const all=(D.cancelados||[]).map(r=>({...r,categoria_electoral:tipoDeNombre(r['Nombre del partido']),fecha_desde:r['Fecha de inscripción'],fecha_hasta:r['Fecha de cancelación']}));
  const rows=all.filter(r=>{
   const desde=Number(String(r.fecha_desde||'').slice(0,4)),hasta=Number(String(r.fecha_hasta||'').slice(0,4));
   return (filter==='Todos'||r.categoria_electoral===filter)&&desde<=periodEnd&&hasta>=periodStart &&(state.province==='Nacional'||!r.Provincia||r.Provincia===state.province);
  });
  const byName=group(rows,'Nombre del partido').map(([nombre,g])=>({nombre,registros:g.length,categoria:g[0].categoria_electoral,primera_inscripcion:g.map(r=>r.fecha_desde).sort()[0],ultima_cancelacion:g.map(r=>r.fecha_hasta).sort().slice(-1)[0]})).sort((a,b)=>b.registros-a.registros||a.nombre.localeCompare(b.nombre,'es'));
  const focusChoices=['Panorama · nombres con más registros',...byName.map(r=>r.nombre).sort((a,b)=>a.localeCompare(b,'es'))];
  const focus=focusChoices.includes(local.n19focus)?local.n19focus:focusChoices[0];
  controls([['n19view','Oferta observada de la denominación',options,filter],['n19focus','Ver cronología de una denominación',focusChoices,focus]]);
  const names=focus===focusChoices[0]?byName.slice(0,Math.min(24,byName.length)).map(r=>r.nombre):[focus];
  const visible=rows.filter(r=>names.includes(r['Nombre del partido']));
  const colorFor=n=>claseColor[tipoDeNombre(n)]||'#8c9ba4';
  const traces=visible.map(r=>({type:'scatter',mode:'lines+markers',showlegend:false,
    x:[r.fecha_desde,r.fecha_hasta],y:[r['Nombre del partido'],r['Nombre del partido']],
    line:{color:colorFor(r['Nombre del partido']),width:9},marker:{color:colorFor(r['Nombre del partido']),size:9},
    text:[r['ID registro'],r['ID registro']],
    hovertemplate:'Denominación: %{y}<br>Fecha: %{x}<br>Registro: %{text}<extra></extra>'}));
  if(traces.length)plot(`Cronología de nombres y cancelaciones · ${filter}`,traces,visible,{
    arenaVista:filter,height:Math.max(390,130+names.length*28),xTitle:'Fecha de inscripción → cancelación',
    subtitle:`${periodStart}–${periodEnd} · ${state.province} · ${focus.startsWith('Panorama')?'Hasta 24 denominaciones; seleccione una para ver todos sus registros':focus}`,
    layout:{xaxis:{type:'date',automargin:true},yaxis:{categoryorder:'array',categoryarray:names.slice().reverse(),automargin:true},showlegend:false,margin:{l:215,r:40,t:35,b:100}},
    note:'Cada segmento horizontal es un registro documental separado; sus extremos son fechas de inscripción y cancelación de la fuente. Las interrupciones no se rellenan ni se interpretan como continuidad jurídica. Colores por oferta electoral observada asociada al nombre, no por ideología.'});
  else note('No hay registros coincidentes con esos filtros y fechas.');
  if(byName.length){
    const repeated=byName.filter(r=>r.registros>=2).slice(0,18).reverse();
    if(repeated.length)plot(`Denominaciones con múltiples registros · ${filter}`,[{type:'bar',orientation:'h',y:repeated.map(r=>r.nombre),x:repeated.map(r=>r.registros),marker:{color:repeated.map(r=>colorFor(r.nombre))},text:repeated.map(r=>r.registros),textposition:'outside',hovertemplate:'%{y}<br>%{x} registros separados<extra></extra>'}],repeated,{arenaVista:filter,height:Math.max(300,repeated.length*30+125),xTitle:'Registros de inscripción/cancelación',note:'Número de registros por denominación, no número de organizaciones jurídicamente continuas.'});
  }
  const years=Y.filter(y=>y>=periodStart&&y<=periodEnd);
  const lastRegistryYear=Math.max(...(D.cancelados||[]).map(r=>Number(String(r['Fecha de cancelación']||'').slice(0,4))).filter(Number.isFinite));
  const series=years.map(anio=>({anio,registros:anio>lastRegistryYear?null:rows.filter(r=>{
    const a=Number(String(r.fecha_desde).slice(0,4)),b=Number(String(r.fecha_hasta).slice(0,4));
    return a<=anio&&b>=anio;
  }).length}));
  plot(`Registros cuyo intervalo comprende cada elección · ${filter}`,[{type:'scatter',mode:'lines+markers',x:series.map(r=>r.anio),y:series.map(r=>r.registros),line:{color:filter==='Solo legislativa'?'#9a6aab':filter==='Presidencial y legislativa'?'#167f79':'#326c92',width:3},marker:{size:8},hovertemplate:'Elección %{x}<br>%{y} registros con intervalo coincidente<extra></extra>'}],series,{
    arenaVista:filter,height:400,xTitle:'Elección',yTitle:'Registros con intervalo concurrente',
    subtitle:`${periodStart}–${periodEnd} · ${filter}`,
    note:`Serie de la base de partidos CANCELADOS, no del padrón completo de partidos activos. Último año cubierto por cancelaciones en la base: ${lastRegistryYear}; después se presenta NA (no cero). Una coincidencia temporal NO prueba participación electoral ni continuidad jurídica del nombre.`});
  table(rows,['ID registro','Nombre del partido','Escala','Provincia','fecha_desde','fecha_hasta','categoria_electoral','Nombre repetido','Referencia'],'Todos los registros históricos de la selección · trazabilidad');
 };
})();
