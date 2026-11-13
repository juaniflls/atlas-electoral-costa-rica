/* Atlas Electoral V12 · consolidación de vistas y visor histórico reproducible.
   Conserva datos, nomenclaturas y gráficos originales; no altera los Excel. */
(function(){
'use strict';
const A12=['General','Legislativa','Presidencial'];
const AS12=['Legislativa','Presidencial'];
const ROLE12=['Diputación','Presidencia','Primera Vicepresidencia','Segunda Vicepresidencia'];
const C12=['#187a83','#bf8550','#6176a2','#b66779','#6c9a72','#8c719e','#d7a44d'];
const HIST12=!!window.ATLAS_HISTORICO;
const years12=()=>Y.filter(y=>y>=state.from&&y<=state.to);
const normal12=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
const comp12=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v));
const fmt12=(v,d=1)=>comp12(v)?num(+v,d):'—';
const v12=(id,arr,def)=>arr.includes(local[id])?local[id]:def;
const scopes12=v=>v==='General'?AS12:[v];
function yearsMetric12(arena,key,p='Nacional'){
 return (D.metricas||[]).filter(r=>r.arena===arena&&r.provincia===p&&+r.ronda===1&&years12().includes(+r.anio)).sort((a,b)=>a.anio-b.anio);
}
function trend12(key,scope,titleText){
 const traces=scopes12(scope).map((arena,i)=>{const rows=yearsMetric12(arena,key);return {type:'scatter',mode:'lines+markers',name:arena,x:rows.map(r=>+r.anio),y:rows.map(r=>r[key]),line:{color:i===0?C12[0]:C12[1],width:3},marker:{size:8,symbol:i===0?'circle':'diamond'},hovertemplate:`${arena}<br>%{x}<br>%{y:.2f}<extra></extra>`};});
 const rows=scopes12(scope).flatMap(arena=>yearsMetric12(arena,key).map(r=>({...r,vista:arena})));
 plot(titleText,traces,rows,{arenaVista:scope,height:465,xTitle:'Elección',yTitle:metricLabels[key]||key,subtitle:`${scope==='General'?'Comparación presidencial y legislativa':scope} · nacional · ${state.from}–${state.to}`,layout:{xaxis:{type:'linear',tickmode:'array',tickvals:years12(),tickangle:-50}},note:'Las arenas utilizan sus respectivos denominadores oficiales. Cuando falta un valor se conserva como ausencia, no se imputa cero.'});
}
// Un solo comparador de competencia. No duplicar matriz de ganadores en Competencia.
views.competencia=function(){
 title('Competencia y sistema de partidos','Un indicador y tres lecturas: General, Legislativa y Presidencial. Los liderazgos por provincia están exclusivamente en Partidos y territorio.');
 const key=v12('cm',['nep','concentracion_1','concentracion_2','margen','volatilidad_nominal'],'nep');
 const scope=v12('c12scope',A12,'General');
 controls([['cm','Indicador',[['nep','Número efectivo de partidos (NEP)'],['concentracion_1','Concentración del primero (%)'],['concentracion_2','Concentración de los dos primeros (%)'],['margen','Margen entre primero y segundo (pp)'],['volatilidad_nominal','Volatilidad nominal (pp)']],key],['c12scope','Ámbito de comparación',A12,scope]]);
 trend12(key,scope,metricLabels[key]);
 if(key==='volatilidad_nominal')note('La volatilidad utiliza denominaciones normalizadas. No sigue electores individuales ni demuestra continuidad jurídica entre nombres partidarios.');
 const rec=scopes12(scope).flatMap(arena=>yearsMetric12(arena,key).map(r=>({anio:r.anio,arena,partidos_con_votos:r.partidos_con_votos,nep:r.nep,concentracion_1:r.concentracion_1,concentracion_2:r.concentracion_2,margen:r.margen,volatilidad_nominal:r.volatilidad_nominal})));
 table(rec,['anio','arena','partidos_con_votos','nep','concentracion_1','concentracion_2','margen','volatilidad_nominal'],'Valores nacionales por elección y arena');
};
// La representación de partidos con/sin curules debe tener dos tasas distintas.
const rep12=views.representacion_voto;
views.representacion_voto=function(){
 rep12();
 const scope=v12('c12nosc',A12,'General');
 add('<div class="extension-heading">VOTOS A PARTIDOS SIN DIPUTACIONES · DOS ARENAS</div>');
 controls([['c12nosc','Votos de la arena',A12,scope]]);
 const seats=new Set((D.escanos||[]).filter(r=>r.provincia==='Nacional'&&+r.escanos>0).map(r=>r.anio+'|'+normal12(r.partido)));
 const series=scopes12(scope).map(arena=>years12().map(y=>{
  if(arena==='Legislativa'){
   const met=yearsMetric12(arena,'voto_sin_escanos_pct').find(r=>+r.anio===y);
   return {anio:y,arena,pct:met?.voto_sin_escanos_pct??null};
  }
  const all=(D.votos||[]).filter(r=>r.arena===arena&&+r.ronda===1&&r.provincia==='Nacional'&&+r.anio===y);
  const den=all.reduce((acc,r)=>acc+(+r.votos||0),0);const sin=all.filter(r=>!seats.has(y+'|'+normal12(r.partido)));const votes=sin.reduce((acc,r)=>acc+(+r.votos||0),0);
  return {anio:y,arena,pct:den?100*votes/den:null,partidos_sin_curules:sin.length,votos_sin_curules:votes,denominador:den};
 }));
 const traces=series.map((rows,i)=>({type:'scatter',mode:'lines+markers',name:scopes12(scope)[i],x:rows.map(r=>r.anio),y:rows.map(r=>r.pct),line:{color:i===0?C12[0]:C12[1],width:3},marker:{size:9},hovertemplate:'%{x}<br>%{y:.2f}% de votos válidos<extra>%{fullData.name}</extra>'}));
 const all=series.flat();plot(scope==='Presidencial'?'Voto válido presidencial a partidos sin diputaciones':scope==='Legislativa'?'Voto válido legislativo a partidos sin diputaciones':'Voto válido a partidos sin diputaciones · ambas arenas',traces,all,{arenaVista:scope,height:470,xTitle:'Elección',yTitle:'Porcentaje del voto válido (%)',layout:{xaxis:{type:'linear',tickvals:years12(),tickangle:-50}},note:'Legislativa: proporción de votos legislativos de partidos sin curules. Presidencial: proporción de votos presidenciales de primera ronda por partidos que no obtuvieron curules legislativas en esa elección. Son denominadores diferentes.'});
};
// V13: preservamos íntegramente Éxito electoral y Cancelaciones V7, incluidos nombres, perfiles, tablas y flujos.
// Los nuevos filtros de movilidad se incorporan al explorador de puentes de atlas_final.js.
// Participación: un selector, sin curvas nacionales duplicadas, y ranking ordinal (7 colores discretos).
views.participacion=function(){
 title('Participación y abstencionismo','Comparación nacional y provincial para ambas arenas; ranking ordinal con un tono identificable por puesto.');
 const key=v12('p12key',['abstencion_pct','participacion_pct','blancos_pct','nulos_pct','invalidos_pct'],'abstencion_pct');
 const scope=v12('p12scope',A12,'General');
 controls([['p12key','Indicador',[['abstencion_pct','Abstencionismo (%)'],['participacion_pct','Participación (%)'],['blancos_pct','Blancos entre emitidos (%)'],['nulos_pct','Nulos entre emitidos (%)'],['invalidos_pct','Votos no válidos entre emitidos (%)']],key],['p12scope','Arena electoral',A12,scope]]);
 trend12(key,scope,metricLabels[key]);
 const rankPalette=['#245277','#527ba6','#699cac','#8faba6','#bfad8c','#bd8e73','#a45e65'];
 for(const arena of scopes12(scope)){
  // V16: conservar el diseño V15, incluir el dato Nacional oficial como fila final;
  // el ranking ordinal sigue calculándose EXCLUSIVAMENTE sobre las siete provincias.
  const years=years12(), provs=[...P,'Nacional'];
  const raw=(D.metricas||[]).filter(r=>r.arena===arena&&+r.ronda===1&&provs.includes(r.provincia)&&years.includes(+r.anio));
  const lookup=new Map(raw.map(r=>[r.provincia+'|'+r.anio,r]));
  const z=provs.map(p=>years.map(y=>lookup.get(p+'|'+y)?.[key]??null));
  // Plotly heatmap no admite negrita por celda: dibujar Nacional como texto
  // independiente sobre la misma celda, dejando intacta la serie y el hover.
  const values=z.flat().filter(comp12).map(Number);
  const lo=values.length?Math.min(...values):0,hi=values.length?Math.max(...values):1;
  const nationalValues=z[z.length-1];
  const nationalText=nationalValues.map(v=>comp12(v)?`<b>${Number(v).toFixed(1)}</b>`:'');
  const nationalColor=nationalValues.map(v=>comp12(v)&&(Number(v)-lo)/Math.max(.001,hi-lo)>.74?'#ffffff':'#173c4d');
  plot(`Valores provinciales y nacional · ${metricLabels[key]} · ${arena}`,
    [{type:'heatmap',x:years.map(String),y:provs,z,colorscale:[[0,'#f1f3f7'],[.5,'#98b1c3'],[1,'#335879']],xgap:2,ygap:2,hoverongaps:false,
      text:z.map((row,i)=>row.map(v=>i===z.length-1?'':comp12(v)?fmt12(v,1):'')),
      texttemplate:'%{text}',textfont:{size:10},hovertemplate:'%{y} · %{x}<br>Valor oficial: %{z:.2f}%<extra></extra>'},
     {type:'scatter',mode:'text',x:years.map(String),y:years.map(()=> 'Nacional'),text:nationalText,
      textfont:{size:10,color:nationalColor},hoverinfo:'skip',showlegend:false,cliponaxis:true}],raw,
    {arenaVista:arena,height:525,subtitle:`${arena} · siete provincias y total nacional`,xTitle:'Elección',
      layout:{xaxis:{type:'category',categoryorder:'array',categoryarray:years.map(String)},
        yaxis:{type:'category',categoryorder:'array',categoryarray:provs,autorange:'reversed',
          tickmode:'array',tickvals:provs,ticktext:provs.map(p=>p==='Nacional'?'<b>Nacional</b>':p)},
        margin:{l:116,r:65,t:38,b:88}},
      note:'Nacional es una tasa calculada con los totales nacionales oficiales, no un promedio simple de provincias; no participa en los puestos provinciales.'});
  const rankRows=(D.rankings_provinciales||[]).filter(r=>r.arena===arena&&P.includes(r.provincia)&&years.includes(+r.anio));
  const rmap=new Map(rankRows.map(r=>[r.provincia+'|'+r.anio,r]));
  const rkey=key==='abstencion_pct'?'rango_abstencion':'rango_participacion';
  if(['abstencion_pct','participacion_pct'].includes(key)){
    // Rankear por la media de las tasas (en pp), no por la media de puestos.
    const historical=P.map((p,i)=>{const vals=years.map(y=>lookup.get(p+'|'+y)?.[key]).filter(comp12).map(Number);
      return {provincia:p,media_pct:vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null,elecciones:vals.length,indice:i};});
    const ordered=historical.filter(r=>r.media_pct!==null).sort((a,b)=>b.media_pct-a.media_pct||a.indice-b.indice);
    ordered.forEach((r,i)=>r.puesto_global=i+1);
    const global=new Map(ordered.map(r=>[r.provincia,r]));
    const fullYears=[...years.map(String),'GLOBAL'];
    const ranks=P.map(p=>[...years.map(y=>rmap.get(p+'|'+y)?.[rkey]??null),global.get(p)?.puesto_global??null]);
    const averages=P.map(p=>[...years.map(y=>lookup.get(p+'|'+y)?.[key]??null),global.get(p)?.media_pct??null]);
    const scale=rankPalette.flatMap((color,i)=>[[i/7,color],[(i+1)/7-.0001,color]]);scale.push([1,rankPalette[6]]);
    plot(`Ranking provincial · ${arena} · ${key==='abstencion_pct'?'abstencionismo':'participación'} · GLOBAL`,
      [{type:'heatmap',x:fullYears,y:P,z:ranks,zmin:.5,zmax:7.5,colorscale:scale,xgap:2,ygap:2,
        texttemplate:'%{z:.0f}',textfont:{size:12},showscale:false,customdata:averages,
        hovertemplate:'%{y} · %{x}<br>Puesto %{z:.0f} de 7<br>Tasa %{customdata:.2f}%<extra></extra>'}],
      [...rankRows,...ordered],{arenaVista:arena,height:490,xTitle:'Elección / promedio global',
      layout:{xaxis:{type:'category',categoryorder:'array',categoryarray:fullYears,tickangle:-50},margin:{l:115,r:35,t:36,b:115},
        shapes:[{type:'line',xref:'x',yref:'paper',x0:years.length-.5,x1:years.length-.5,y0:0,y1:1,line:{color:'#244958',width:2}}]},
      note:'Puesto 1 = tasa provincial más alta de '+(key==='abstencion_pct'?'abstencionismo':'participación')+'. GLOBAL ordena el PROMEDIO de tasas provinciales de los años seleccionados, con igual peso por elección. Nacional queda fuera de la clasificación.'});
  }
  const comp=yearsMetric12(arena,'padron').map(r=>({anio:r.anio,arena,validos:r.padron?100*r.validos/r.padron:null,blancos:r.padron?100*r.blancos/r.padron:null,nulos:r.padron?100*r.nulos/r.padron:null,abstenciones:r.padron?100*r.abstenciones/r.padron:null}));
  const categories=[['Votos válidos','validos','#187a83'],['Blancos','blancos','#9db5c0'],['Nulos','nulos','#be8553'],['Abstenciones','abstenciones','#788dad']];
  plot(`Composición del padrón · ${arena}`,categories.map(([name,col,color])=>({type:'bar',name,x:comp.map(r=>String(r.anio)),y:comp.map(r=>r[col]),marker:{color},text:comp.map(r=>r[col]>=12?fmt12(r[col])+'%':''),textposition:'inside',textfont:{color:'#fff',size:10}})),comp,{arenaVista:arena,xTitle:'Elección',yTitle:'Porcentaje del padrón (%)',layout:{barmode:'stack',xaxis:{type:'category',categoryorder:'array',categoryarray:years.map(String)},yaxis:{range:[0,100]}},height:450});
 }
};
// Quiebre de voto: explicación verificable; compara las distribuciones de dos papeletas, NO electores individuales.
// V14: Se preserva la sección de comparación de partidos y elección de detalle del HTML original.
// Registros partidarios: filtrar directamente las visualizaciones, no añadir tablas de cruces textuales.
views.cancelaciones=function(){
 title('Nombres y cancelaciones partidarias','Los registros se separan por escala de inscripción y por participación electoral observada. Una coincidencia nominal no demuestra continuidad jurídica.');
 const escala=v12('c12regScale',['Todos','Nacional','No nacional'],'Todos'),tipo=v12('c12offer',['Todos','Presidencial y legislativa','Solo legislativa','Solo presidencial','Sin correspondencia observada'],'Todos');
 controls([['c12regScale','Escala de inscripción',['Todos','Nacional','No nacional'],escala],['c12offer','Oferta electoral del nombre',['Todos','Presidencial y legislativa','Solo legislativa','Solo presidencial','Sin correspondencia observada'],tipo]]);
 const offer=new Map();for(const r of (D.oferta_partidos||[])){const k=normal12(r.partido);if(!offer.has(k))offer.set(k,new Set());offer.get(k).add(r.oferta)}
 const base=(D.cancelados||[]).map(r=>({...r,categoria_oferta:offer.has(normal12(r['Nombre del partido']))?[...offer.get(normal12(r['Nombre del partido']))].sort().join(' / '):'Sin correspondencia observada'}));
 const rows=base.filter(r=>(escala==='Todos'||(escala==='Nacional'?r.Escala==='Nacional':r.Escala!=='Nacional'))&&(tipo==='Todos'||(tipo==='Sin correspondencia observada'?r.categoria_oferta===tipo:r.categoria_oferta.split(' / ').includes(tipo))));
 const gs=group(rows,'Nombre del partido').map(([partido,rs])=>({partido,registros:rs.length,escalas:uniq(rs.map(r=>r.Escala)).join(' / '),oferta:rs[0].categoria_oferta})).sort((a,b)=>b.registros-a.registros).slice(0,35).reverse();
 plot(`Registros por denominación · ${escala} · ${tipo}`,[{type:'bar',orientation:'h',x:gs.map(r=>r.registros),y:gs.map(r=>r.partido),marker:{color:gs.map((r,i)=>C12[i%C12.length])},hovertemplate:'%{y}<br>%{x} registros<extra></extra>'}],gs,{height:Math.max(440,gs.length*21),xTitle:'Registros de inscripción o cancelación',note:'Los nombres coincidentes no acreditan continuidad del partido. La oferta se identifica a partir de resultados disponibles, no únicamente de la escala registral.'});
 const years=Y.filter(y=>y>=state.from&&y<=state.to),yr=years.map(y=>({anio:y,registros:rows.filter(r=>{const a=Number((r['Fecha de inscripción']||'').slice(0,4)),b=Number((r['Fecha de cancelación']||'').slice(0,4));return a<=y&&b>=y}).length}));
 plot('Registros cuyo intervalo comprende cada elección',[{type:'scatter',mode:'lines+markers',x:yr.map(r=>r.anio),y:yr.map(r=>r.registros),line:{color:C12[2],width:3},marker:{size:8}}],yr,{height:415,yTitle:'Registros con intervalo coincidente',xTitle:'Elección',note:'Una coincidencia temporal de registro no equivale a actividad electoral efectiva ni vincula jurídicamente los votos a un registro particular.'});
};

// Fechas y títulos dependientes de ámbito para descargas; opción HISTÓRICA muestra períodos sobre
// las mismas trazas Plotly (no imágenes separadas ni gráficos recalculados de modo distinto).
const originalPlot12=plot;
function stages12(traces,opts){
 const xs=traces.flatMap(t=>Array.isArray(t.x)?t.x:[]).map(x=>Number(x)).filter(x=>Y.includes(x));
 const unique=[...new Set(xs)];if(unique.length<2)return null;
 if(opts.layout?.xaxis?.type==='date'||traces.some(t=>t.orientation==='h'))return null;
 const bands=[[0,6,'Predominio territorial del PLN','#e7f2ef'],[6,12,'Competencia bipartidista','#edf0f8'],[12,18,'Pluralización multipartidista','#f8f0e7'],[18,19,'2026 · por evaluar','#f1e9f4']];
 const category=opts.layout?.xaxis?.type==='category'||traces.some(t=>t.type==='heatmap')||traces.every(t=>t.x?.every(x=>typeof x==='string'));
 const present=years12();
 const shapes=[],annotations=[];
 for(const [first,end,label,color] of bands){const yy=Y.slice(first,end).filter(y=>present.includes(y));if(!yy.length)continue;
  if(category){const idxs=yy.map(y=>present.indexOf(y));const start=(Math.min(...idxs))/present.length,stop=(Math.max(...idxs)+1)/present.length;shapes.push({type:'rect',xref:'paper',yref:'paper',x0:start,x1:stop,y0:0,y1:1,fillcolor:color,opacity:.27,line:{width:0},layer:'below'});annotations.push({xref:'paper',yref:'paper',x:(start+stop)/2,y:1.07,text:label,showarrow:false,font:{size:10,color:'#394f5b'},align:'center'});}
  else{const edges=[[1951,1976],[1976,2000],[2000,2024],[2024,2028]][bands.findIndex(x=>x[0]===first)];shapes.push({type:'rect',xref:'x',yref:'paper',x0:edges[0],x1:edges[1],y0:0,y1:1,fillcolor:color,opacity:.50,line:{width:0},layer:'below'});annotations.push({xref:'x',yref:'paper',x:(edges[0]+edges[1])/2,y:1.07,text:label,showarrow:false,font:{size:10,color:'#394f5b'},align:'center'});}
 }
 return{shapes,annotations};
}
plot=function(titleText,traces,rows,opts={}){
 let modified=opts;
 if(HIST12){const stages=stages12(traces,opts);if(stages){modified={...opts,layout:{...opts.layout,shapes:[...(opts.layout?.shapes||[]),...stages.shapes],annotations:[...(opts.layout?.annotations||[]),...stages.annotations],margin:{l:85,r:65,t:95,b:108,...(opts.layout?.margin||{})}}};}}
 const before=cid,ans=originalPlot12(titleText,traces,rows,modified);
 if(cid>before){const el=$('chart'+cid),card=el?.closest('article.card');if(HIST12&&card){const svg=card.querySelector('.exports button:nth-child(2)');if(svg)svg.remove();const help=document.createElement('div');help.className='atlas12-period-note';help.textContent='Las franjas son hipótesis analíticas para los capítulos, no una periodización oficial. Se conserva el mismo gráfico y datos del Atlas principal.';card.append(help);}}
 return ans;
};
// Exportar PNG de modo robusto a partir del gráfico Plotly realmente mostrado. SVG conserva
// la función principal en la aplicación pública. Evita dependencia de rutas relativas.
// V18: La última capa era quien sobreescribía exportFigure y descartaba el título.
// Capturar el título y subtítulo de la tarjeta visible sin cambiar el gráfico en pantalla.
exportFigure=async function(id,format){
 const node=$(id);if(!node?.data)return;
 const card=node.closest('article.card');
 const name=node.atlasFilename||`Atlas_${state.tab}_${state.from}_${state.to}`;
 const heading=node.atlasTitle||card?.querySelector('.card-head h3')?.textContent||'Atlas Electoral de Costa Rica';
 const scope=node.atlasScope||card?.querySelector('.card-head .mini')?.textContent||`${state.from}–${state.to}`;
 const previousTitle=node.layout?.title?JSON.parse(JSON.stringify(node.layout.title)):null;
 const previousMargin=node.layout?.margin?{...node.layout.margin}:{};
 let patched=false;
 try{
   if(card)card.classList.add('atlas12-exporting');
   const safe=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
   await Plotly.relayout(node,{
     title:{text:`<b>${safe(heading)}</b><br><sup>${safe(scope)}</sup>`,font:{size:23,color:'#1c3b49'},x:.045,xanchor:'left',y:.975,yanchor:'top'},
     margin:{...previousMargin,t:Math.max(125,Number(previousMargin.t)||0)}
   });patched=true;
   const uri=await Plotly.toImage(node,{format:format==='svg'?'svg':'png',width:1900,height:Math.max(980,Math.round((node.clientHeight||490)*1.9)),scale:format==='svg'?1:2});
   const anchor=document.createElement('a');anchor.href=uri;anchor.download=name+'.'+(format==='svg'?'svg':'png');document.body.appendChild(anchor);anchor.click();anchor.remove();
 }catch(err){console.error('Exportación con título fallida',err);alert('No se pudo exportar esta figura; pruebe de nuevo con PNG.');}
 finally{
   if(patched)try{await Plotly.relayout(node,{title:previousTitle||null,margin:previousMargin});}catch(err){console.error('Restaurar vista tras exportación',err);}
   if(card)card.classList.remove('atlas12-exporting');
 }
};

if(HIST12){document.title='Atlas Electoral · Gráficos con períodos históricos';const b=document.createElement('style');b.textContent='.atlas12-period-note{font-size:12px;color:#6a5361;padding:0 18px 15px}.atlas12-exporting{outline:2px solid #b8cdd5}';document.head.appendChild(b)}

// V14: bastiones se estudian en un solo panel por provincia, sin clasificación arbitraria.
window.ATLAS_V12_OK=true;
})();
