/* Atlas 2.0: advanced person explorer, clearer recurrence, elected-only success paths, career bridges and auditable outcomes.
   Loaded after the existing views. All figures use the bundled data and Plotly. */
Object.assign(labels,{numero_candidatura:'Intento',resultado:'Resultado',id_evento:'ID candidatura',
 id_registro:'ID registro',posicion:'Posición provincial',candidaturas_electas:'Candidaturas electas',
 id_origen:'ID origen',id_destino:'ID destino',anio_origen:'Elección de origen',
 partido_origen:'Partido de origen',partido_destino:'Partido de destino',
 provincia_origen:'Provincia de origen',provincia_destino:'Provincia de destino',
 electa_origen:'Electa en origen',electa_destino:'Electa en destino',resultado_origen:'Resultado de origen',resultado_destino:'Resultado de destino',
 antecedente:'Antecedente observado',cargos_previos:'Cargos previos observados',cargos_electos_previos:'Cargos electos previos',
 cargos_candidatados:'Cargos disputados',cargos_electos:'Cargos electos',resultado_persona:'Resultado de la persona',trayectoria:'Trayectoria entre cargos'});

function atlasOpenPerson(pid){
 if(!pid)return;
 state.tab='credenciales';local.credentialperson=pid;
 render().then(()=>window.scrollTo({top:0,behavior:'instant'}));
}
window.atlasOpenPerson=atlasOpenPerson;
function atlasNavigate(tab,year,party,province){
 state.tab=tab;
 if(Number.isFinite(+year)){state.focus=+year;
   if(state.focus<state.from)state.from=state.focus;
   if(state.focus>state.to)state.to=state.focus;
   for(const key of ['from','to','focus'])$(key).value=state[key];}
 state.province=province&&P.includes(province)?province:'Nacional';$('province').value=state.province;
 if(party){local.profileparty=party;local.oparty=party;}
 render().then(()=>window.scrollTo({top:0,behavior:'instant'}));
}
window.atlasNavigate=atlasNavigate;
function atlasPersonButton(r){
 return r.id_persona?`<button type="button" class="person-link" onclick="atlasOpenPerson('${esc(r.id_persona)}')">${esc(labelText(r.nombre))}</button>`:
 `<span title="No hay identidad enlazada por nombre exacto">${esc(labelText(r.nombre))}</span>`;
}
function atlasCount(n,d){return d?`${num(n,0)} / ${num(d,0)} (${num(pct(n,d),1)} %)`: `0 / 0 (sin denominador)`}
function atlasFlag(r){return r.electa?'Electa':'No electa'}
function atlasFilteredOutcomes(){
 const cargo=local.ocargo||'Todos',sex=local.osex||'Todos',party=local.oparty||'Todos';
 return D.resultados_candidaturas.filter(r=>r.anio>=state.from&&r.anio<=state.to&&
    (state.province==='Nacional'||r.provincia===state.province)&&
    (cargo==='Todos'||r.cargo===cargo)&&(sex==='Todos'||r.sexo===sex)&&
    (party==='Todos'||r.partido===party));
}
function atlasOutcomeBars(rows){
 const groups=[['Primera candidatura',r=>r.primera_candidatura],
    ['Candidatura posterior',r=>r.regresa],['Ya electa anteriormente',r=>r.electa_antes],
    ['Regresa, mismo partido',r=>r.regresa&&!r.cambio_partido],
    ['Regresa, cambia partido',r=>r.regresa&&r.cambio_partido],
    ['Regresa, misma provincia',r=>r.regresa&&!r.cambio_provincia&&r.provincia!=='Nacional'],
    ['Regresa, cambia provincia',r=>r.regresa&&r.cambio_provincia]];
 return groups.map(([grupo,pred])=>{let g=rows.filter(pred),success=g.filter(r=>r.electa).length;
     return {grupo,candidaturas:g.length,electas:success,no_electas:g.length-success,
             porcentaje:pct(success,g.length),criterio:'Tasa descriptiva · candidaturas electas / candidaturas en el grupo'} });
}

function atlasPersonScopeMatch(r,scope){
 if(scope==='Más de una candidatura')return r.candidaturas>1;
 if(scope==='Alguna vez electa')return !!r.alguna_vez_electa;
 if(scope==='Sin elección observada'||scope==='Nunca resultó electa en el corpus')return !r.alguna_vez_electa;
 if(scope==='Diputación electa')return !!r.alguna_eleccion_diputacion;
 if(scope==='Presidencia candidata')return !!r.alguna_candidatura_presidencia;
 if(scope==='Presidencia electa')return !!r.alguna_eleccion_presidencia;
 if(scope==='Vicepresidencia electa')return !!r.alguna_eleccion_vicepresidencia_1||!!r.alguna_eleccion_vicepresidencia_2;
 return true;
}
function atlasResultBadge(elected,label){return `<span class="outcome-badge ${elected?'win':'loss'}">${esc(label||(elected?'Electa':'No electa'))}</span>`}
function atlasRoleResult(r,side){const cargo=r['cargo_'+side],res=r['resultado_'+side]||(r['electa_'+side]?'Electa':'No electa');return `${cargo} · ${res}`}
function atlasTransitionDescriptor(r,mode){
 if(mode==='Cargo + resultado')return {origen:`${r.cargo_origen} · ${r.resultado_origen}`,destino:`${r.cargo_destino} · ${r.resultado_destino}`};
 if(mode==='Cambio de cargo')return {origen:r.cargo_origen,destino:r.cargo_destino};
 if(mode==='Cambio de partido + resultado')return {origen:r.cambia_partido?'Cambia de partido':'Mantiene partido',destino:`${r.resultado_destino} después`};
 if(mode==='Cambio de provincia + resultado')return {origen:r.cambia_provincia?'Cambia de provincia':'Mantiene provincia',destino:`${r.resultado_destino} después`};
 return {origen:`${r.resultado_origen} antes`,destino:`${r.resultado_destino} después`};
}
function atlasUniquePersonRows(rows){return [...new Map(rows.map(r=>[r.id_persona,r])).values()]}
function atlasSelectionLabel(v){return v==='Todos'?'Todos':labelText(v)}
function atlasOutcomeFilterSummary(extra=[]){
 const base=[`Intervalo: ${state.from}–${state.to}`,`Territorio: ${labelText(state.province)}`,`Cargo: ${atlasSelectionLabel(local.ocargo||'Todos')}`,`Sexo: ${atlasSelectionLabel(local.osex||'Todos')}`,`Partido: ${atlasSelectionLabel(local.oparty||'Todos')}`];
 return [...base,...extra.filter(Boolean)].join(' · ');
}
function atlasRegisterCardRows(id,rows){window.atlasCardRows=window.atlasCardRows||{};window.atlasCardRows[id]=rows||[]}
async function atlasExportNode(id, format='png', filename='Atlas_Exportacion'){
 // ATLAS_VECTOR_EXPORT_V3: elementos SVG nativos, sin HTML/CSS incrustado.
 try {
  const root=document.getElementById(id);
  if(!root)throw new Error('No se encontró la sección de personas seleccionada.');
  const cardNodes=Array.from(root.querySelectorAll('.person-result'));
  if(!cardNodes.length)throw new Error('Esta selección no contiene personas que se puedan exportar.');
  const compact=s=>String(s??'').replace(/\s+/g,' ').trim();
  const readCard=el=>{
   const name=compact(el.querySelector('.person-link')?.textContent||el.querySelector(':scope > span')?.textContent||'Persona sin nombre');
   const badges=Array.from(el.querySelectorAll('.outcome-badge')).map(n=>compact(n.textContent)).filter(Boolean);
   const pairs=Array.from(el.querySelectorAll('.career-pair')).map(n=>compact(n.textContent)).filter(Boolean);
   const extras=Array.from(el.querySelectorAll('.mini,.route')).filter(n=>!n.closest('.career-pair')).map(n=>compact(n.textContent)).filter(Boolean);
   return {name,badges,details:[...pairs,...extras]};
  };
  const people=cardNodes.map(readCard);
  const heading=compact(root.querySelector('h3')?.textContent||'Personas de la selección');
  const scope=compact(root.querySelector('.card-head .mini')?.textContent||'');
  const methodology=compact(root.querySelector(':scope > .chart-note')?.textContent||'');
  const cols=people.length>36?3:people.length>5?2:1;
  const width=cols===3?2100:cols===2?1560:1120;
  const margin=55, gap=22, cardWidth=(width-2*margin-gap*(cols-1))/cols;
  const wrap=(value,max)=>{
   const words=compact(value).split(' ').filter(Boolean),out=[];let line='';
   for(const word of words){
    if(word.length>max){if(line){out.push(line);line='';}for(let i=0;i<word.length;i+=max)out.push(word.slice(i,i+max));continue;}
    if((line?line.length+1:0)+word.length>max){out.push(line);line=word;}else line+=(line?' ':'')+word;
   }
   if(line)out.push(line);
   return out.length?out:[''];
  };
  const maxTitle=cols===3?43:cols===2?59:100;
  const maxDetail=cols===3?48:cols===2?65:105;
  const prepared=people.map(p=>({
   name:wrap(p.name,maxTitle),
   badges:p.badges.flatMap(s=>wrap(s,maxDetail)),
   details:p.details.flatMap(s=>wrap(s,maxDetail)),
  }));
  const cardHeight=p=>24+p.name.length*29+(p.badges.length?8+p.badges.length*23:0)+(p.details.length?9+p.details.length*24:0)+22;
  const headScope=wrap(scope,Math.max(55,Math.floor((width-2*margin)/11)));
  const headHeight=184+Math.max(0,headScope.length-1)*25;
  const placement=[];let nextY=headHeight;
  for(let i=0;i<prepared.length;i+=cols){
   const slice=prepared.slice(i,i+cols);
   const rh=Math.max(...slice.map(cardHeight));
   slice.forEach((p,j)=>placement.push({person:p,x:margin+j*(cardWidth+gap),y:nextY,height:rh}));
   nextY+=rh+gap;
  }
  const noteLines=methodology?wrap(methodology,Math.floor((width-2*margin)/10)):[];
  const totalHeight=Math.ceil(nextY+46+noteLines.length*24+60);
  const ns='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(ns,'svg');
  svg.setAttribute('xmlns',ns);svg.setAttribute('width',String(width));
  svg.setAttribute('height',String(totalHeight));svg.setAttribute('viewBox',`0 0 ${width} ${totalHeight}`);
  svg.setAttribute('role','img');svg.setAttribute('aria-label',heading);
  const draw=(tag,attrs,content,parent=svg)=>{
   const e=document.createElementNS(ns,tag);
   for(const [key,value] of Object.entries(attrs||{}))e.setAttribute(key,String(value));
   if(content!==null&&content!==undefined)e.textContent=String(content);
   parent.appendChild(e);return e;
  };
  const tx=(x,y,value,size=18,color='#274251',weight=400)=>draw('text',{x,y,fill:color,'font-family':'Arial, Helvetica, sans-serif','font-size':size,'font-weight':weight},value);
  draw('rect',{x:0,y:0,width,height:totalHeight,fill:'#f5f8fa'});
  draw('rect',{x:0,y:0,width,height:10,fill:'#137f7a'});
  tx(margin,51,'ATLAS ELECTORAL DE COSTA RICA · 1953–2026',20,'#167a78',700);
  tx(margin,94,heading,29,'#173143',700);
  headScope.forEach((s,i)=>tx(margin,130+i*25,s,17,'#466474',400));
  tx(margin,headHeight-20,`PERSONAS EN ESTA PÁGINA: ${people.length} · Filtros indicados en el encabezado`,17,'#3f6170',700);
  draw('line',{x1:margin,y1:headHeight-7,x2:width-margin,y2:headHeight-7,stroke:'#bfd4d6','stroke-width':2});
  placement.forEach(({person:p,x,y,height})=>{
   draw('rect',{x,y,width:cardWidth,height,rx:11,fill:'#ffffff',stroke:'#cfdee5','stroke-width':1.5});
   draw('rect',{x,y,width:7,height,rx:3,fill:'#137f7a'});
   let baseline=y+36;
   p.name.forEach(line=>{tx(x+24,baseline,line,21,'#153a4c',700);baseline+=29;});
   if(p.badges.length){baseline+=5;p.badges.forEach(line=>{tx(x+24,baseline,line,16,'#0c746b',700);baseline+=23;});}
   if(p.details.length){baseline+=6;p.details.forEach(line=>{tx(x+24,baseline,line,16,'#415c69',400);baseline+=24;});}
  });
  const footY=nextY+17;
  draw('line',{x1:margin,y1:footY-16,x2:width-margin,y2:footY-16,stroke:'#d4e1e7','stroke-width':1.5});
  noteLines.forEach((line,i)=>tx(margin,footY+i*24,line,15,'#526874'));
  tx(margin,totalHeight-27,'Fuente: Atlas electoral de Costa Rica · Consulta filtrada · Resultados descriptivos del corpus',15,'#536a77');
  const serialized=new XMLSerializer().serializeToString(svg);
  const vectorBlob=new Blob([serialized],{type:'image/svg+xml;charset=utf-8'});
  const safeName=(filename||'Atlas_Personas').replace(/[^\p{L}\p{N}_-]+/gu,'_');
  const saveBlob=(blob,ext)=>{
   const u=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=u;a.download=`${safeName}.${ext}`;document.body.appendChild(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(u),2000);
  };
  if(format==='svg'){saveBlob(vectorBlob,'svg');return;}
  if(format!=='png')throw new Error('Formato de exportación desconocido.');
  const imageUrl=URL.createObjectURL(vectorBlob);
  try {
   const bitmap=new Image();
   await new Promise((resolve,reject)=>{
    bitmap.onload=resolve;
    bitmap.onerror=()=>reject(new Error('El navegador no pudo cargar la representación vectorial de los nombres.'));
    bitmap.src=imageUrl;
   });
   const factor=Math.max(.6,Math.min(2,15000/totalHeight,Math.sqrt(45000000/(width*totalHeight))));
   const canvas=document.createElement('canvas');
   canvas.width=Math.max(1,Math.round(width*factor));
   canvas.height=Math.max(1,Math.round(totalHeight*factor));
   const ctx=canvas.getContext('2d');
   if(!ctx)throw new Error('No se pudo inicializar el lienzo de imagen.');
   ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);
   ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
   const raster=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('El navegador no pudo convertir el gráfico en PNG.')),'image/png'));
   saveBlob(raster,'png');
  } finally {URL.revokeObjectURL(imageUrl);}
 }catch(error){console.error('Atlas · fallo de exportación:',error);alert('No se pudo exportar la imagen: '+(error?.message||error));}
}
function atlasSectionCard(id,title,innerHtml,rows,opts={}){
 atlasRegisterCardRows(id,rows);
 const subtitle=opts.subtitle?`<span class="mini">${esc(opts.subtitle)}</span>`:'';
 const note=opts.note?`<p class="chart-note">${opts.note}</p>`:'';
 const intro=opts.intro?`<p class="chart-note">${opts.intro}</p>`:'';
 const filename=(opts.filename||`Atlas_${state.tab}_${title}`).replace(/[^\p{L}\p{N}_-]+/gu,'_');
 add(`<section class="card" id="${id}"><div class="card-head"><div><h3>${esc(title)}</h3>${subtitle}</div><div class="exports"><button onclick="atlasExportNode('${id}','png','${filename}')">PNG</button><button onclick="atlasExportNode('${id}','svg','${filename}')">SVG</button><button onclick="csv((window.atlasCardRows||{})['${id}']||[],'${filename}.csv')">CSV</button></div></div>${intro}${innerHtml}${note}</section>`);
}
function atlasPersonAggregate(rows){return group(rows,'id_persona').map(([id,g])=>({
 id_persona:id,nombre:g[g.length-1].nombre,sexo:g[g.length-1].sexo,candidaturas:g.length,electas:g.filter(r=>r.electa).length,
 resultado:g.some(r=>r.electa)?'Electa al menos una vez':'Sin elección en la selección',
 cargos:uniq(g.map(r=>r.cargo)).join(' | '),partidos:uniq(g.map(r=>r.partido)).length,
 provincias:uniq(g.map(r=>r.provincia).filter(p=>p!=='Nacional')).length,inicio:Math.min(...g.map(r=>r.anio)),fin:Math.max(...g.map(r=>r.anio))}));}
function atlasSeatMap(titleText,rows,key,denominator){
 const maprows=P.map(provincia=>{const r=rows.find(x=>x.provincia===provincia);
 return {anio:state.focus,provincia,valor:r?.[key]??null,
 etiqueta:key==='magnitud'?'Escaños asignados':key==='participacion_pct'?'Participación electoral (%)':
  key==='porcentaje_Legislativa'?'Voto legislativo (%)':key==='mujeres_pct'?'Mujeres entre electas (%)':key};});
 atlas14MapFigure(maprows,titleText,{label:maprows[0]?.etiqueta,
    note:`Lectura provincial para ${state.focus}. ${denominator} Gris: dato ausente, no cero. Ver tabla y serie para los valores exactos.`});
 return maprows;
}

const atlasOldParticipation=views.participacion;
views.participacion=()=>{atlasOldParticipation();
 const rows=D.metricas.filter(r=>r.anio===state.focus&&r.provincia!=='Nacional'&&r.arena==='Legislativa'&&r.ronda===1);
 const map=atlasSeatMap('Participación provincial en la elección legislativa',rows,'participacion_pct','Votos emitidos / padrón provincial × 100.');
 table(map,['anio','provincia','valor'],'Participación mostrada en el mapa');};
const atlasOldDuality=views.dualidad;
views.dualidad=()=>{atlasOldDuality();const party=local.dualparty||'LIBERACION NACIONAL';
 const choices=uniq(D.panel.filter(r=>r.anio===state.focus&&r.provincia!=='Nacional').map(r=>r.partido)).sort();
 controls([['dualparty','Partido para mapa de voto legislativo',choices,party]]);
 const rows=D.panel.filter(r=>r.anio===state.focus&&r.provincia!=='Nacional'&&r.partido===party);
 const map=atlasSeatMap('Voto legislativo provincial · '+labelText(party),rows,'porcentaje_Legislativa','Votos al partido / votos válidos de la provincia × 100.');
 table(map,['anio','provincia','valor'],'Voto provincial del partido');};
const atlasOldRepresentation=views.representacion;
views.representacion=()=>{atlasOldRepresentation();
 const rows=D.representacion_territorial.filter(r=>r.anio===state.focus);
 const map=atlasSeatMap('Magnitud legislativa provincial',rows,'magnitud',
  'Número de diputaciones por provincia. La asignación jurídica se vincula a población según el art. 106 constitucional, no al padrón.');
 table(map,['anio','provincia','valor'],'Distribución de escaños representada');
 explanation('Fundamento de la distribución territorial',
 '<p>El artículo 106 de la Constitución Política fija 57 diputaciones y la asignación provincial en proporción a la población después de un censo general. El padrón permite una comparación descriptiva distinta: no es el denominador jurídico. <a target="_blank" rel="noopener" href="https://pgrweb.go.cr/scij/Busqueda/Normativa/Normas/nrm_articulo.aspx?nValor1=1&amp;nValor2=871&amp;nValor3=935&amp;nValor5=4954&amp;param1=NRA">Texto constitucional oficial</a>; <a target="_blank" rel="noopener" href="https://www.tse.go.cr/pdf/publicaciones/C%C3%B3mo%20se%20Elige.pdf">explicación del TSE</a>.</p>');};

views.gobierno=()=>{
 title('Gobiernos y Asambleas por elección','Composición inicial electa según los registros: Presidencia, vicepresidencias y diputaciones. La elección no acredita por sí sola todo el periodo de ejercicio.');
 const chamber=D.camara_electa.filter(r=>r.anio===state.focus),exec=D.ejecutivo_electo.filter(r=>r.anio===state.focus),
       expected=state.focus<=1958?45:57,parties=uniq(chamber.map(r=>r.partido)).sort(),chosen=local.gparty||'Todos';
 controls([['gparty','Resaltar bancada',['Todos',...parties],chosen]]);
 kpis([['Elección',state.focus,'Periodo electoral seleccionado'],['Diputaciones',atlasCount(chamber.length,expected),'45 en 1953/1958; 57 desde 1962'],
       ['Bancadas',parties.length,'Partidos de diputaciones electas'],['Fórmula electa',exec.length,'Presidencia y vicepresidencias que constan']]);
 if(chamber.length!==expected)note('La lista de diputaciones no coincide con la magnitud histórica; consulte Integridad.',true);
 add('<section class="card"><h3>Fórmula presidencial electa</h3><div class="assembly-grid">'+
  exec.sort((a,b)=>a.orden-b.orden).map(r=>`<div class="assembly-person"><b>${esc(r.cargo)}</b><br>${atlasPersonButton(r)}<br><span>${esc(labelText(r.partido))}</span></div>`).join('')+'</div></section>');
 const counts=group(chamber,'partido').map(([partido,g])=>({partido,escanos:g.length,porcentaje:pct(g.length,chamber.length)}))
    .sort((a,b)=>b.escanos-a.escanos);
 plot('Composición partidaria de la Asamblea',[{type:'bar',x:counts.map(r=>r.escanos),y:counts.map(r=>labelText(r.partido)),
  orientation:'h',marker:{color:counts.map(r=>semanticColor(r.partido))},hovertemplate:'%{y}: %{x} escaños<extra></extra>'}],counts,
  {xTitle:'Diputaciones electas',height:Math.max(360,counts.length*32+150),note:'Composición inicial según el registro de electas; cambios posteriores de bancada no están en estas fuentes.'});
 add('<section class="card"><h3>Cámara por provincia</h3><p class="chart-note">Cada tarjeta representa una diputación electa. Seleccione una persona para abrir su trayectoria nominal.</p>'+P.map(p=>{
  const group=chamber.filter(r=>r.provincia===p).sort((a,b)=>(a.posicion||0)-(b.posicion||0));
  return `<h3 class="assembly-province">${esc(p)} · ${group.length}</h3><div class="assembly-grid">`+
   group.map(r=>`<div class="assembly-person" style="border-left:4px solid ${semanticColor(r.partido)};opacity:${chosen==='Todos'||chosen===r.partido?1:.35}">
    <small>${esc(labelText(r.partido))} · ${esc(r.posicion??'—')}</small><br>${atlasPersonButton(r)}</div>`).join('')+'</div>';
 }).join('')+'</section>');
 table(chamber,['anio','provincia','posicion','nombre','sexo','partido','periodo','id_registro','id_persona'],'Registro completo de la Asamblea');
 table(exec,['anio','cargo','nombre','sexo','partido','formula','id_persona'],'Personas de la fórmula presidencial electa');
 table(D.concordancia_gobierno.filter(r=>r.anio===state.focus),
   ['anio','ganador_presidencial','ganador_voto_legislativo','primera_bancada','escanos','escanos_primera_bancada','mayoria_inicial'],
   'Presidencia, mayor voto legislativo y primera bancada');
 const seats=D.escanos.filter(r=>r.anio===state.focus&&r.provincia!=='Nacional'),top=seats.filter(r=>r.partido===((exec.find(r=>r.cargo==='Presidencia')||exec[0])?.partido));
 if(top.length){const map=atlasSeatMap('Escaños provinciales del partido presidencial',top,'escanos','Escaños ganados / escaños asignados por provincia, disponibles en las tablas.');
  table(map,['anio','provincia','valor'],'Bancada presidencial por provincia');}
};

views.credenciales=()=>{
 title('Explorador de personas','Consulte cualquier nombre del corpus y distinga con claridad candidatura, resultado electoral y trayectoria. Esta vista individual complementa Personas y trayectorias, que resume recurrencia y movilidad de forma agregada.');
 const scope=local.credentialscope||'Todas',query=local.personquery||'',all=D.resultados_personas.slice().sort((a,b)=>a.nombre.localeCompare(b.nombre,'es'));
 let filtered=all.filter(r=>atlasPersonScopeMatch(r,scope)&&(!query||normalized(r.nombre).includes(normalized(query))));
 const direct=all.find(r=>r.id_persona===local.credentialperson);
 if(direct&&!filtered.some(r=>r.id_persona===direct.id_persona))filtered.unshift(direct);
 const perPage=100,pages=Math.max(1,Math.ceil(filtered.length/perPage));let page=Math.min(Math.max(0,+(local.credentialpage||0)),pages-1);
 if(String(local.credentialpage)!==String(page))local.credentialpage=page;
 const visible=filtered.slice(page*perPage,(page+1)*perPage);
 let chosen=local.credentialperson&&visible.some(r=>r.id_persona===local.credentialperson)?local.credentialperson:visible[0]?.id_persona||'';
 if(chosen!==local.credentialperson)local.credentialperson=chosen;
 add(`<section class="card"><div class="card-head"><div><h3>Buscar por nombre completo</h3><p class="chart-note">El catálogo contiene ${num(all.length,0)} identidades nominales. Ya no se recorta a las primeras coincidencias: use búsqueda o páginas de 100 nombres.</p></div></div><div class="searchbar"><input id="personsearch" type="search" placeholder="Nombre o apellido…" value="${esc(query)}"><button class="button primary" id="personsearchbtn">Buscar</button><button class="button" id="personclear">Limpiar</button></div></section>`);
 $('personsearchbtn').onclick=()=>{local.personquery=$('personsearch').value;local.credentialpage=0;local.credentialperson='';render()};
 $('personsearch').onkeydown=e=>{if(e.key==='Enter')$('personsearchbtn').click()};
 $('personclear').onclick=()=>{local.personquery='';local.credentialpage=0;local.credentialperson='';render()};
 controls([['credentialscope','Población',['Todas','Más de una candidatura','Alguna vez electa','Nunca resultó electa en el corpus','Diputación electa','Presidencia candidata','Presidencia electa','Vicepresidencia electa'],scope],
  ['credentialpage',`Página · ${num(filtered.length,0)} nombres`,Array.from({length:pages},(_,i)=>[i,`${i*perPage+1}–${Math.min((i+1)*perPage,filtered.length)}`]),page],
  ['credentialperson','Persona (nombre completo)',visible.map(r=>[r.id_persona,r.nombre]),chosen]]);
 const person=all.find(r=>r.id_persona===chosen),events=D.resultados_candidaturas.filter(r=>r.id_persona===chosen).sort((a,b)=>a.anio-b.anio||a.numero_candidatura-b.numero_candidatura);
 if(!person){note('No hay nombres que cumplan la búsqueda o el filtro seleccionado.');return;}
 const actualElected=D.camara_electa.filter(r=>r.id_persona===chosen),executives=D.ejecutivo_electo.filter(r=>r.id_persona===chosen),wins=events.filter(r=>r.electa);
 add(`<section class="person-hero"><div class="identity"><div class="eyebrow">PERFIL ELECTORAL NOMINAL</div><h2>${esc(person.nombre)}</h2><p class="mini">${esc(person.identidad||'Coincidencia nominal')} · ${esc(person.sexo||'Sin dato')} · ${person.primera_candidatura||'—'}–${person.ultima_candidatura||'—'}</p>${atlasResultBadge(!!person.alguna_vez_electa,person.alguna_vez_electa?'Electa al menos una vez':'Sin elección observada')}</div>
 <div class="micro-kpi"><span>Candidaturas</span><strong>${num(events.length,0)}</strong><span>Eventos documentados</span></div>
 <div class="micro-kpi"><span>Resultados electos</span><strong>${num(wins.length,0)}</strong><span>No implica años completos de ejercicio</span></div>
 <div class="micro-kpi"><span>Cargos disputados</span><strong>${num(uniq(events.map(r=>r.cargo)).length,0)}</strong><span>${esc(uniq(events.map(r=>r.cargo)).join(' · ')||'—')}</span></div></section>`);
 add('<div class="clarity-box"><b>Cómo leer esta ficha:</b> cada bloque siguiente es una candidatura. “Electa” describe el outcome registrado para esa postulación. Una candidatura presidencial no equivale a haber ejercido la Presidencia; los registros electos se muestran separadamente.</div>');
 add('<section class="card"><h3>Historia electoral en orden cronológico</h3><div class="career-strip">'+events.map(r=>`<div class="career-step"><b>${r.anio} · ${esc(r.cargo)}</b>${atlasResultBadge(r.electa)}<span class="mini">${esc(labelText(r.partido))}<br>${esc(r.provincia)} · ${esc(r.tipo||'—')} · orden ${esc(r.orden??'—')}</span></div>`).join('')+'</div></section>');
 const trace=events.map(r=>({anio:r.anio,cargo:r.cargo,partido:r.partido,provincia:r.provincia,resultado:atlasFlag(r),intento:r.numero_candidatura,id_evento:r.id_evento}));
 plot('Cronología visual de candidaturas y outcomes',[{type:'scatter',mode:'lines+markers',x:trace.map(r=>r.anio),y:trace.map(r=>r.cargo),text:trace.map(r=>`${labelText(r.partido)} · ${r.provincia} · ${r.resultado} · candidatura ${r.intento}`),marker:{size:13,color:trace.map(r=>r.resultado==='Electa'?'#168278':'#b8a16d'),symbol:trace.map(r=>r.resultado==='Electa'?'circle':'circle-open')},line:{color:'#879aa5',width:2},hovertemplate:'%{x} · %{y}<br>%{text}<extra></extra>'}],trace,{height:360,note:'Las líneas unen registros con el mismo nombre completo normalizado; son una trayectoria nominal, no una verificación civil independiente.'});
 add('<section class="card"><h3>Explorar el contexto de cada participación</h3><div class="assembly-grid">'+events.map(r=>{const party=encodeURIComponent(r.partido).replaceAll("'",'%27'),prov=encodeURIComponent(r.provincia).replaceAll("'",'%27');return `<div class="assembly-person"><b>${r.anio} · ${esc(r.cargo)}</b><br>${atlasResultBadge(r.electa)}<br><span>${esc(labelText(r.partido))} · ${esc(r.provincia)}</span><br><button class="person-link" onclick="atlasNavigate('gobierno',${r.anio},null,'Nacional')">Gobierno y Asamblea</button> · <button class="person-link" onclick="atlasNavigate('perfiles',${r.anio},decodeURIComponent('${party}'),'Nacional')">Partido</button>${r.provincia!=='Nacional'?` · <button class="person-link" onclick="atlasNavigate('mapas',${r.anio},null,decodeURIComponent('${prov}'))">Provincia</button>`:''}</div>`}).join('')+'</div></section>');
 table(events,['anio','nombre','cargo','tipo','partido','provincia','orden','sexo','resultado','numero_candidatura','electa_antes','cambio_partido','cambio_provincia','id_evento'],'Todas las candidaturas y outcomes de esta persona nominal');
 if(actualElected.length)table(actualElected,['anio','cargo','nombre','partido','provincia','periodo','posicion'],'Diputaciones electas en el registro específico');
 if(executives.length)table(executives,['anio','cargo','nombre','partido','electa'],'Cargos de fórmula presidencial con resultado electo');
};

views.apellidos=()=>{
 title('Apellidos y coincidencias','Explorador nominal de primer apellido, segundo apellido o par de apellidos. Las coincidencias sirven para localizar casos; no prueban parentesco, identidad civil ni continuidad familiar.');
 const origin=local.ssource||'Todas',field=local.sfield||'Ambos por separado';
 controls([['ssource','Outcome de candidatura',['Todas','Electas','No electas'],origin],['sfield','Coincidencia',['Ambos por separado','Primer apellido','Segundo apellido','Par de apellidos'],field]]);
 const events=D.resultados_candidaturas.filter(r=>r.anio>=state.from&&r.anio<=state.to&&(state.province==='Nacional'||r.provincia===state.province)&&(origin==='Todas'||(origin==='Electas'&&r.electa)||(origin==='No electas'&&!r.electa)));
 const expanded=events.flatMap(r=>{
   if(field==='Par de apellidos')return r.apellido1&&r.apellido2?[{...r,apellido:`${r.apellido1} ${r.apellido2}`,posicion_apellido:'Par de apellidos'}]:[];
   return [...(field!=='Segundo apellido'&&r.apellido1?[{...r,apellido:r.apellido1,posicion_apellido:'Primer apellido'}]:[]),...(field!=='Primer apellido'&&r.apellido2?[{...r,apellido:r.apellido2,posicion_apellido:'Segundo apellido'}]:[])];
 });
 const counts=group(expanded,r=>normalized(r.apellido)).map(([key,rr])=>{const ps=group(rr,'id_persona'),pe=ps.filter(([_,g])=>g.some(x=>x.electa)).length;return {apellido:rr[0].apellido,candidaturas:rr.length,personas_nominales:ps.length,personas_con_eleccion:pe,personas_sin_eleccion:ps.length-pe,tasa_personas_electas:pct(pe,ps.length),eventos_electos:rr.filter(r=>r.electa).length}}).sort((a,b)=>b.personas_nominales-a.personas_nominales||a.apellido.localeCompare(b.apellido,'es'));
 const selected=counts.some(r=>r.apellido===local.surname)?local.surname:counts[0]?.apellido||'',pages=Math.max(1,Math.ceil(counts.length/25)),current=Math.min(+(local.spage||0),pages-1);local.surname=selected;
 controls([['spage','Página de apellidos',Array.from({length:pages},(_,i)=>[i,`${i*25+1}–${Math.min((i+1)*25,counts.length)}`]),current],['surname','Apellido o par',counts.map(r=>[r.apellido,`${r.apellido} · ${r.personas_nominales} personas`]),selected]]);
 const list=expanded.filter(r=>normalized(r.apellido)===normalized(selected)),personList=group(list,'id_persona').map(([id,g])=>({id_persona:id,nombre:g[g.length-1].nombre,anio_inicio:Math.min(...g.map(r=>r.anio)),anio_fin:Math.max(...g.map(r=>r.anio)),candidaturas:g.length,electa:g.some(r=>r.electa),partidos:uniq(g.map(r=>r.partido)).length,provincias:uniq(g.map(r=>r.provincia)).join(', ')}));
 kpis([['Coincidencias disponibles',counts.length,'Según el campo de apellido explícito'],['Personas nominales',personList.length,'Para el apellido seleccionado'],['Con alguna elección',atlasCount(personList.filter(r=>r.electa).length,personList.length),'Dentro de la selección actual'],['Candidaturas',list.length,'Eventos, no personas']]);
 add('<div class="clarity-box"><b>Coincidencia nominal ≠ parentesco.</b> El modo “Par de apellidos” exige que ambos apellidos estén separados explícitamente en la fuente. No se reconstruyen apellidos faltantes a partir del texto libre del nombre.</div>');
 plot('Apellidos visibles en el ranking',[bars(counts.slice(current*25,(current+1)*25).reverse(),'apellido','personas_nominales')],counts.slice(current*25,(current+1)*25),{height:650,xTitle:'Personas nominales distintas',note:'El ranking cuenta identificadores nominales distintos; la tabla muestra además candidaturas y outcomes.'});
 const selectedSummary=[{resultado:'Con alguna elección',personas:personList.filter(r=>r.electa).length},{resultado:'Sin elección observada',personas:personList.filter(r=>!r.electa).length}];
 plot(`Outcome de personas con «${selected}»`,[{type:'bar',x:selectedSummary.map(r=>r.personas),y:selectedSummary.map(r=>r.resultado),orientation:'h',marker:{color:['#168278','#b8a16d']},text:selectedSummary.map(r=>r.personas),textposition:'outside'}],selectedSummary,{xTitle:'Personas nominales',height:300,note:'Una persona se cuenta como electa si al menos una candidatura de la selección tiene outcome electo.'});
 add('<section class="card"><h3>Personas que comparten «'+esc(selected)+'»</h3><p class="chart-note">Seleccione un nombre para abrir su perfil completo.</p><div class="person-result-grid">'+personList.slice().sort((a,b)=>b.electa-a.electa||a.nombre.localeCompare(b.nombre,'es')).slice(0,80).map(r=>`<div class="person-result">${atlasPersonButton(r)}${atlasResultBadge(r.electa)}<span class="mini">${r.anio_inicio}${r.anio_fin!==r.anio_inicio?'–'+r.anio_fin:''} · ${r.candidaturas} candidatura(s)</span></div>`).join('')+'</div></section>');
 const network=personList.slice(0,14),sampleIds=new Set(network.map(r=>r.id_persona)),sample=list.filter(r=>sampleIds.has(r.id_persona)),networkParties=uniq(sample.map(r=>r.partido));
 if(network.length>=2&&networkParties.length){const left=network.map(r=>r.nombre),right=networkParties;const links=[];for(const person of network){for(const pt of uniq(sample.filter(r=>r.id_persona===person.id_persona).map(r=>r.partido)))links.push({person:person.nombre,partido:pt})}plot('Red exploratoria: coincidencia nominal → partidos',[{type:'sankey',node:{label:[...left,...right.map(p=>'Partido · '+labelText(p))],pad:17,thickness:13},link:{source:links.map(r=>left.indexOf(r.person)),target:links.map(r=>left.length+right.indexOf(r.partido)),value:links.map(()=>1),hovertemplate:'Coincidencia nominal y candidatura documentada<extra></extra>'}}],sample,{height:Math.max(380,network.length*35),note:'Los enlaces representan participación partidaria de nombres que comparten el apellido seleccionado. No hay enlaces de parentesco.'});}
 table(counts,['apellido','personas_nominales','personas_con_eleccion','personas_sin_eleccion','tasa_personas_electas','candidaturas','eventos_electos'],'Estadísticas de coincidencias nominales');
 table(list,['anio','nombre','apellido','posicion_apellido','partido','provincia','cargo','sexo','resultado','id_persona'],'Registros que sustentan el apellido seleccionado');
};

views.outcomes=()=>{
 title('Éxito electoral y outcomes','Explore resultados de candidaturas, éxito de personas, movilidad y puentes entre cargos. Todo porcentaje muestra su N o su tabla subyacente; las asociaciones son descriptivas, no causales.');
 const options=['Todos',...uniq(D.resultados_candidaturas.map(r=>r.partido)).sort()];
 controls([['ocargo','Cargo de la candidatura',['Todos','Diputación','Presidencia','Primera Vicepresidencia','Segunda Vicepresidencia'],local.ocargo||'Todos'],['osex','Sexo',['Todos','Mujer','Hombre','Sin dato'],local.osex||'Todos'],['oparty','Partido',options,local.oparty||'Todos']]);
 const rows=atlasFilteredOutcomes(),won=rows.filter(r=>r.electa),personAgg=atlasPersonAggregate(rows),personWins=personAgg.filter(r=>r.electas>0),personLoss=personAgg.filter(r=>r.electas===0),unknown=rows.filter(r=>!['Mujer','Hombre'].includes(r.sexo));
 kpis([['Candidaturas electas',atlasCount(won.length,rows.length),'Eventos electos / candidaturas filtradas'],['Personas con alguna elección',atlasCount(personWins.length,personAgg.length),'Personas nominales dentro de la selección'],['Personas sin elección',atlasCount(personLoss.length,personAgg.length),'Ninguna candidatura electa en la selección'],['Sexo sin dato',atlasCount(unknown.length,rows.length),'Cobertura del campo sexo']]);
 add('<div class="clarity-box"><b>Dos denominadores distintos:</b> una candidatura es un evento; una persona puede tener varias candidaturas. “Personas con alguna elección” cuenta cada ID nominal una sola vez. Los filtros superiores se aplican a estas dos primeras lecturas.</div>');
 const baseContext=atlasOutcomeFilterSummary();
 const personStatus=[{resultado:'Alguna candidatura electa',personas:personWins.length},{resultado:'Sin elección en la selección',personas:personLoss.length}];
 plot('Outcome a nivel de personas',[{type:'bar',orientation:'h',x:personStatus.map(r=>r.personas),y:personStatus.map(r=>r.resultado),text:personStatus.map(r=>r.personas),textposition:'outside',marker:{color:['#168278','#b8a16d']}}],personStatus,{height:300,xTitle:'Personas nominales',subtitle:baseContext,note:'Cada persona aparece una vez según exista o no al menos una candidatura electa dentro de los filtros actuales. Esta visualización resume identidades nominales; no cuenta candidaturas repetidas de la misma persona.'});
 const rateRows=atlasOutcomeBars(rows);plot('Tasa de elección por experiencia y movilidad',[{type:'bar',orientation:'h',x:rateRows.map(r=>r.porcentaje),y:rateRows.map(r=>r.grupo),customdata:rateRows.map(r=>[r.electas,r.candidaturas]),text:rateRows.map(r=>`${num(r.porcentaje,1)}% · ${r.electas}/${r.candidaturas}`),textposition:'outside',marker:{color:rateRows.map(r=>r.grupo.includes('cambia')?'#637cac':'#168278')},hovertemplate:'%{y}<br>%{x:.1f} % · %{customdata[0]} / %{customdata[1]} candidaturas<extra></extra>'}],rateRows,{height:430,xTitle:'Candidaturas electas / candidaturas del grupo (%)',subtitle:baseContext,note:'Cada barra usa su propio denominador. El texto visible muestra porcentaje y numerador/denominador; la tabla inferior conserva el detalle auditable completo. Cambio de partido o provincia describe una asociación observada con el outcome, no un efecto causal.'});
 table(rateRows,['grupo','candidaturas','electas','no_electas','porcentaje','criterio'],'Numeradores y denominadores de las tasas');
 const byYear=group(rows,'anio').map(([anio,g])=>({anio,candidaturas:g.length,electas:g.filter(r=>r.electa).length,no_electas:g.filter(r=>!r.electa).length,tasa:pct(g.filter(r=>r.electa).length,g.length)})).sort((a,b)=>a.anio-b.anio);
 plot('Outcome de candidaturas por elección',[{type:'bar',name:'Electas',x:byYear.map(r=>r.anio),y:byYear.map(r=>r.electas),marker:{color:'#168278'}},{type:'bar',name:'No electas',x:byYear.map(r=>r.anio),y:byYear.map(r=>r.no_electas),marker:{color:'#b8a16d'}}],byYear,{yTitle:'Candidaturas',subtitle:baseContext,layout:{barmode:'stack'},note:'Conteo de eventos electorales dentro de los filtros actuales. Cada barra apilada separa candidaturas electas y no electas; la tabla conserva además la tasa porcentual calculada para cada elección.'});
 table(byYear,['anio','candidaturas','electas','no_electas','tasa'],'Outcomes por elección con denominador');

 add('<div class="extension-heading">FLUJOS ENTRE PARTICIPACIONES CONSECUTIVAS</div>');
 const ids=new Set(rows.map(r=>r.id_persona));let transitions=D.transiciones_resultados.filter(r=>r.anio>=state.from&&r.anio<=state.to&&ids.has(r.id_persona));
 if(state.province!=='Nacional')transitions=transitions.filter(r=>r.provincia_origen===state.province||r.provincia_destino===state.province);
 const flowMode=local.oflowdim||'Resultado';controls([['oflowdim','Qué flujo mostrar',['Resultado','Cargo + resultado','Cambio de cargo','Cambio de partido + resultado','Cambio de provincia + resultado'],flowMode]]);
 let flowRows=transitions;if(flowMode==='Cambio de provincia + resultado')flowRows=flowRows.filter(r=>r.provincia_origen!=='Nacional'&&r.provincia_destino!=='Nacional');
 const described=flowRows.map(r=>({...r,...atlasTransitionDescriptor(r,flowMode)}));
 const edges=group(described,r=>r.origen+' → '+r.destino).map(([recorrido,g])=>({recorrido,origen:g[0].origen,destino:g[0].destino,transiciones:g.length,personas:uniq(g.map(r=>r.id_persona)).length})).sort((a,b)=>b.transiciones-a.transiciones);
 let sel=(local.outflow&&edges.some(r=>r.recorrido===local.outflow))?local.outflow:'Todos';local.outflow=sel;
 controls([['outflow','Flujo para inspeccionar',['Todos',...edges.map(r=>r.recorrido)],sel]]);
 if(edges.length){const left=uniq(edges.map(r=>r.origen)),right=uniq(edges.map(r=>r.destino));plot('Flujos auditables entre una participación y la siguiente',[{type:'sankey',orientation:'h',arrangement:'snap',node:{label:[...left.map(x=>'Origen · '+x),...right.map(x=>'Destino · '+x)],pad:28,thickness:19},link:{source:edges.map(r=>left.indexOf(r.origen)),target:edges.map(r=>left.length+right.indexOf(r.destino)),value:edges.map(r=>r.transiciones),customdata:edges.map(r=>r.recorrido),hovertemplate:'%{customdata}<br>%{value} transiciones<extra></extra>'}}],edges,{height:Math.max(360,Math.max(left.length,right.length)*42+160),subtitle:atlasOutcomeFilterSummary([`Dimensión del flujo: ${flowMode}`]),note:'Grosor = transiciones entre participaciones consecutivas en elecciones distintas. Cambie la dimensión para ver outcome, cargos o movilidad. El selector y el clic permiten inspeccionar el flujo concreto y las personas que lo integran.',onClick:evt=>{const value=evt.points?.[0]?.customdata;if(value&&edges.some(r=>r.recorrido===value)){local.outflow=value;render()}}});
  table(edges,['recorrido','transiciones','personas'],'Resumen de flujos visibles');
  const selectedRows=described.filter(r=>sel==='Todos'||`${r.origen} → ${r.destino}`===sel);
  const flowCards=atlas18FlowCards(selectedRows,0,60);
  atlasSectionCard('outcome_flow_selected','Personas del flujo seleccionado',flowCards.html,selectedRows,{subtitle:atlasOutcomeFilterSummary([`Dimensión del flujo: ${flowMode}`,`Flujo inspeccionado: ${sel}`]),note:`Una tarjeta por persona nominal. Se muestran hasta 60 personas en pantalla; la exportación CSV conserva todas las filas del flujo seleccionado (${num(selectedRows.length,0)} transiciones).`});
  table(selectedRows,['nombre','anio_origen','anio','cargo_origen','cargo_destino','resultado_origen','resultado_destino','partido_origen','partido_destino','provincia_origen','provincia_destino','cambia_partido','cambia_provincia','id_origen','id_destino','id_persona'],'Filas que sustentan el flujo seleccionado');
 }else note('No hay transiciones que cumplan los filtros actuales.');

 add('<div class="extension-heading">PUENTES ENTRE CARGOS · NO SOLO TRANSICIONES CONSECUTIVAS</div>');
 const roleOpts=['Diputación','Presidencia','Primera Vicepresidencia','Segunda Vicepresidencia'],bFrom=local.bridgeFrom||'Diputación',bTo=local.bridgeTo||'Presidencia',bFromResult=local.bridgeFromResult||'Todos',bToResult=local.bridgeToResult||'Todos';
 controls([['bridgeFrom','Cargo previo',roleOpts,bFrom],['bridgeFromResult','Outcome previo',['Todos','Electa','No electa'],bFromResult],['bridgeTo','Cargo posterior',roleOpts,bTo],['bridgeToResult','Outcome posterior',['Todos','Electa','No electa'],bToResult]]);
 let bridges=(D.puentes_cargos||[]).filter(r=>r.anio>=state.from&&r.anio<=state.to&&r.cargo_origen===bFrom&&r.cargo_destino===bTo&&(bFromResult==='Todos'||r.resultado_origen===bFromResult)&&(bToResult==='Todos'||r.resultado_destino===bToResult));
 if(state.province!=='Nacional')bridges=bridges.filter(r=>r.provincia_origen===state.province||r.provincia_destino===state.province);
 const bridgePeople=atlasUniquePersonRows(bridges),bridgeEdges=group(bridges,r=>r.resultado_origen+' → '+r.resultado_destino).map(([recorrido,g])=>({recorrido,origen:g[0].resultado_origen,destino:g[0].resultado_destino,pares:g.length,personas:uniq(g.map(r=>r.id_persona)).length}));
 kpis([['Personas con el puente',bridgePeople.length,`${bFrom} → ${bTo}`],['Pares documentados',bridges.length,'Una persona puede aportar varios pares de candidaturas'],['Electas en destino',atlasCount(bridgePeople.filter(p=>bridges.some(r=>r.id_persona===p.id_persona&&r.electa_destino)).length,bridgePeople.length),'Personas con al menos un outcome electo en el cargo posterior'],['Cambio de partido',atlasCount(atlasUniquePersonRows(bridges.filter(r=>r.cambia_partido)).length,bridgePeople.length),'Personas con al menos un par entre partidos distintos']]);
 if(bridgeEdges.length){const left=uniq(bridgeEdges.map(r=>r.origen)),right=uniq(bridgeEdges.map(r=>r.destino));plot(`${bFrom} → ${bTo}: outcome antes y después`,[{type:'sankey',node:{label:[...left.map(x=>`${bFrom} · ${x}`),...right.map(x=>`${bTo} · ${x}`)],pad:30,thickness:22},link:{source:bridgeEdges.map(r=>left.indexOf(r.origen)),target:bridgeEdges.map(r=>left.length+right.indexOf(r.destino)),value:bridgeEdges.map(r=>r.personas),customdata:bridgeEdges.map(r=>r.recorrido),hovertemplate:'%{customdata}<br>%{value} personas nominales<extra></extra>'}}],bridgeEdges,{height:330,subtitle:atlasOutcomeFilterSummary([`Puente: ${bFrom} → ${bTo}`,`Outcome previo: ${bFromResult}`,`Outcome posterior: ${bToResult}`]),note:'Este puente busca cualquier candidatura anterior del cargo de origen y cualquier candidatura posterior del cargo de destino. Por eso no se limita a participaciones consecutivas; la tabla inferior conserva todos los pares de candidaturas que sustentan el puente.'});}
 const bridgeCareerPeople=atlas17BridgePeople(bridges,bFrom,bTo);
 atlasSectionCard('outcome_bridge_people','Quiénes forman este puente de carrera',atlas17CareerCards(bridgeCareerPeople,80),bridges,{subtitle:atlasOutcomeFilterSummary([`Puente: ${bFrom} → ${bTo}`,`Outcome previo: ${bFromResult}`,`Outcome posterior: ${bToResult}`]),note:`Se muestran hasta 80 personas nominales. Cada tarjeta resume los pares de candidaturas que conectan ambos cargos; el CSV conserva todos los pares observados (${num(bridges.length,0)} registros).`});
 table(bridges,['nombre','anio_origen','anio','cargo_origen','resultado_origen','cargo_destino','resultado_destino','partido_origen','partido_destino','provincia_origen','provincia_destino','cambia_partido','cambia_provincia','anos_entre','id_persona'],'Pares de candidaturas que sustentan el puente entre cargos');

 add('<div class="extension-heading">DE DÓNDE VIENEN QUIENES RESULTARON ELECTOS</div>');
 const anteCargo=local.anteCargo||'Presidencia';controls([['anteCargo','Cargo electo a explicar',roleOpts,anteCargo]]);
 let antecedents=(D.antecedentes_cargos_electos||[]).filter(r=>r.cargo===anteCargo&&r.anio>=state.from&&r.anio<=state.to);if(state.province!=='Nacional'&&anteCargo==='Diputación')antecedents=antecedents.filter(r=>r.provincia===state.province);
 const anteGroups=group(antecedents,'antecedente').map(([antecedente,g])=>({antecedente,casos:g.length,personas:uniq(g.map(r=>r.id_persona)).length,porcentaje:pct(g.length,antecedents.length)})).sort((a,b)=>b.casos-a.casos);
 let anteSel=(local.anteCategory&&anteGroups.some(r=>r.antecedente===local.anteCategory))?local.anteCategory:'Todos';local.anteCategory=anteSel;controls([['anteCategory','Antecedente para inspeccionar',['Todos',...anteGroups.map(r=>r.antecedente)],anteSel]]);
 const priorDeputy=antecedents.filter(r=>r.diputacion_electa_previa),priorPresCand=antecedents.filter(r=>r.presidencia_candidata_previa);
 kpis([['Resultados electos',antecedents.length,`${anteCargo} dentro del periodo`],['Con elección previa',atlasCount(antecedents.filter(r=>r.antecedente==='Elección previa observada').length,antecedents.length),'En cualquier cargo previo del corpus'],['Con diputación electa previa',atlasCount(priorDeputy.length,antecedents.length),'Antes del cargo electo seleccionado'],['Con candidatura presidencial previa',atlasCount(priorPresCand.length,antecedents.length),'Antes del cargo electo seleccionado']]);
 if(anteGroups.length)plot(`Antecedentes antes de resultar electo en ${anteCargo}`,[{type:'bar',orientation:'h',x:anteGroups.map(r=>r.porcentaje),y:anteGroups.map(r=>r.antecedente),customdata:anteGroups.map(r=>r.casos),text:anteGroups.map(r=>`${num(r.porcentaje,1)}% · N=${r.casos}`),textposition:'outside',marker:{color:['#168278','#637cac','#b8a16d']}}],anteGroups,{height:330,xTitle:'Porcentaje de resultados electos (%)',subtitle:atlasOutcomeFilterSummary([`Cargo electo: ${anteCargo}`]),note:'“Sin candidatura previa observada” significa que no existe una candidatura anterior en el corpus 1953–2026; no afirma ausencia de actividad política fuera de estas bases. El texto visible incorpora N para facilitar uso en el artículo incluso al descargar la imagen.'});
 const anteRows=antecedents.filter(r=>anteSel==='Todos'||r.antecedente===anteSel);
 const anteCards=atlas18AntecedentCards(anteRows,0,60);
 atlasSectionCard('outcome_antecedent_people','Personas en el antecedente seleccionado',anteCards.html,anteRows,{subtitle:atlasOutcomeFilterSummary([`Cargo electo: ${anteCargo}`,`Antecedente inspeccionado: ${anteSel}`]),note:`Se muestran hasta 60 personas nominales. Las tarjetas resumen la secuencia observada antes del cargo electo; el CSV conserva todos los casos del antecedente seleccionado (${num(anteRows.length,0)} registros).`});
 table(anteRows,['anio','nombre','cargo','partido','provincia','antecedente','candidaturas_previas','elecciones_previas','cargos_previos','cargos_electos_previos','diputacion_electa_previa','presidencia_candidata_previa','vicepresidencia_electa_previa','id_persona'],'Casos y nombres que forman los porcentajes de antecedentes');

 add('<div class="extension-heading">PERSONAS SIN ELECCIÓN OBSERVADA EN LA SELECCIÓN</div>');
 add('<div class="clarity-box"><b>“Sin elección”</b> significa que ninguna candidatura incluida por los filtros superiores tiene outcome electo. No equivale a fracaso profesional general ni excluye cargos no contenidos en estas bases.</div>');
 const profileById=new Map((D.resultados_personas||[]).map(r=>[r.id_persona,r]));const failed=personLoss.map(r=>({...r,...(profileById.get(r.id_persona)||{})}));
 table(failed,['nombre','sexo','candidaturas','cargos_candidatados','partidos_distintos','provincias_distintas','primera_candidatura','ultima_candidatura','cambio_partido_alguna_vez','cambio_provincia_alguna_vez','id_persona'],'Personas nominales sin candidatura electa bajo los filtros actuales');
 table(rows,['id_evento','anio','nombre','cargo','partido','provincia','sexo','numero_candidatura','primera_candidatura','electa_antes','cambio_partido','cambio_provincia','resultado','id_persona'],'Todas las candidaturas del filtro y su outcome');
};

// Claridad adicional en la comparación presidencial-legislativa.
const atlas16DualidadBase=views.dualidad;
views.dualidad=()=>{atlas16DualidadBase();const p=filteredParty(panel(),'dp'),detail=p.filter(r=>r.anio===state.focus&&valid(r.brecha_pp)).map(r=>({...r,lectura_brecha:r.brecha_pp>0?'Ventaja presidencial':r.brecha_pp<0?'Ventaja legislativa':'Igual porcentaje'})).sort((a,b)=>b.brecha_pp-a.brecha_pp);add('<div class="clarity-box"><b>Definición única de la brecha:</b> porcentaje presidencial − porcentaje legislativo. Ejemplo: +5 pp = cinco puntos más en Presidencia; −5 pp = cinco puntos más en diputaciones. No es una estimación de voto cruzado individual.</div>');table(detail,['partido','porcentaje_Presidencial','porcentaje_Legislativa','brecha_pp','lectura_brecha'],'Lectura textual de la brecha en la elección de detalle');};

// Auditoría histórica descriptiva de partidos, preservando la vista existente.
const atlas16PartidosBase=views.partidos;
views.partidos=()=>{atlas16PartidosBase();add('<div class="extension-heading">RESULTADOS NACIONALES ACUMULADOS EN EL PERIODO</div>');const presidencies=(D.ejecutivo_electo||[]).filter(r=>r.cargo==='Presidencia'&&r.anio>=state.from&&r.anio<=state.to),agreements=(D.concordancia_gobierno||[]).filter(r=>r.anio>=state.from&&r.anio<=state.to),names=uniq([...presidencies.map(r=>r.partido),...agreements.flatMap(r=>[r.ganador_voto_legislativo,r.primera_bancada])].filter(Boolean));const summary=names.map(partido=>({partido,presidencias_electas:presidencies.filter(r=>r.partido===partido).length,mayor_voto_legislativo:agreements.filter(r=>r.ganador_voto_legislativo===partido).length,primera_bancada:agreements.filter(r=>r.primera_bancada===partido).length})).sort((a,b)=>b.presidencias_electas-a.presidencias_electas||b.primera_bancada-a.primera_bancada);plot('Frecuencia histórica de resultados nacionales',[{type:'bar',name:'Presidencia electa',x:summary.map(r=>labelText(r.partido)),y:summary.map(r=>r.presidencias_electas)},{type:'bar',name:'Mayor voto legislativo',x:summary.map(r=>labelText(r.partido)),y:summary.map(r=>r.mayor_voto_legislativo)},{type:'bar',name:'Primera bancada',x:summary.map(r=>labelText(r.partido)),y:summary.map(r=>r.primera_bancada)}],summary,{height:480,yTitle:'Número de elecciones',layout:{barmode:'group',xaxis:{tickangle:-35,automargin:true}},note:'Conteo descriptivo de elecciones dentro del periodo seleccionado. Una denominación partidaria no prueba continuidad jurídica entre inscripciones homónimas.'});table(summary,['partido','presidencias_electas','mayor_voto_legislativo','primera_bancada'],'Frecuencias nacionales por denominación partidaria');};

const atlas16PerfilesBase=views.perfiles;
views.perfiles=()=>{atlas16PerfilesBase();const party=local.profileparty||'LIBERACION NACIONAL',matches=r=>normalized(r.partido)===normalized(party),pres=(D.ejecutivo_electo||[]).filter(r=>r.cargo==='Presidencia'&&matches(r)&&r.anio>=state.from&&r.anio<=state.to),agreements=(D.concordancia_gobierno||[]).filter(r=>r.anio>=state.from&&r.anio<=state.to),firstBank=agreements.filter(r=>normalized(r.primera_bancada)===normalized(party)),legWins=agreements.filter(r=>normalized(r.ganador_voto_legislativo)===normalized(party));const terr=period(D.panel,false).filter(r=>r.provincia!=='Nacional'&&matches(r)&&valid(r.porcentaje_Legislativa));const prov=group(terr,'provincia').map(([provincia,g])=>{const best=g.slice().sort((a,b)=>b.porcentaje_Legislativa-a.porcentaje_Legislativa)[0];return {provincia,elecciones:g.length,promedio_legislativo:avg(g.map(r=>r.porcentaje_Legislativa)),maximo_legislativo:best?.porcentaje_Legislativa,anio_maximo:best?.anio}}).sort((a,b)=>b.promedio_legislativo-a.promedio_legislativo);add('<div class="extension-heading">AUDITORÍA DE RESULTADOS Y TERRITORIO DEL NOMBRE SELECCIONADO</div>');kpis([['Presidencias electas',pres.length,'Eventos dentro del periodo'],['Primera bancada',firstBank.length,'Elecciones con mayor número de escaños'],['Mayor voto legislativo',legWins.length,'Elecciones con mayor voto legislativo nacional'],['Provincia con mayor promedio',prov[0]?.provincia||'—',prov[0]?`${num(prov[0].promedio_legislativo,1)}% en ${prov[0].elecciones} elecciones observadas`:'Sin datos provinciales']]);if(prov.length)plot('Apoyo legislativo provincial observado',[{type:'bar',orientation:'h',x:prov.map(r=>r.promedio_legislativo),y:prov.map(r=>r.provincia),customdata:prov.map(r=>[r.elecciones,r.maximo_legislativo,r.anio_maximo]),marker:{color:prov.map(r=>provinceColors[r.provincia])},hovertemplate:'%{y}<br>Promedio simple: %{x:.2f}%<br>%{customdata[0]} elecciones<br>Máximo: %{customdata[1]:.2f}% (%{customdata[2]})<extra></extra>'}],prov,{height:390,xTitle:'Promedio simple del porcentaje legislativo (%)',note:'Promedio no ponderado entre elecciones con datos del partido en cada provincia. Sirve para describir dónde fue relativamente más alto su apoyo observado; no mide organización territorial ni causalidad.'});table(prov,['provincia','elecciones','promedio_legislativo','maximo_legislativo','anio_maximo'],'Resumen territorial del apoyo legislativo');if(pres.length)table(pres,['anio','nombre','partido'],'Personas electas a la Presidencia bajo esta denominación');};

// Orden de navegación de la versión 1.7.1.
const existingCredential=tabs.findIndex(t=>t[0]==='credenciales');if(existingCredential>=0)tabs.splice(existingCredential,1);
const trajectoryIndex=tabs.findIndex(t=>t[0]==='trayectorias');tabs.splice(trajectoryIndex>=0?trajectoryIndex+1:tabs.length,0,['credenciales','Explorador de personas']);
if(!tabs.some(t=>t[0]==='outcomes'))tabs.splice(tabs.findIndex(t=>t[0]==='laboratorio'),0,['outcomes','Éxito electoral']);


/* ========================= ATLAS 1.7 =========================
   Claridad de outcomes, carreras completas, puentes auditables y representación por sexo.
   Esta capa sustituye visualmente las vistas de Explorador de personas, Éxito electoral,
   Sexo y representación y Fórmulas presidenciales sin eliminar los datos ni descargas previas. */
Object.assign(labels,{
  numero_eleccion_documentada:'Elección documentada n.º',primer_anio_documentado:'Primer año documentado',
  electa_despues:'Resultó electa después',resultado_contextual:'Resultado en contexto de la carrera',
  ruta_primera_eleccion:'Ruta hasta la primera elección',primera_eleccion_anio:'Primera elección exitosa',
  candidaturas_no_electas:'Candidaturas no electas',elecciones_antes_primera_eleccion:'Elecciones previas antes de ganar',
  anios_electorales_previos:'Años electorales previos'
});

if(!document.getElementById('atlas17styles')){
 const s=document.createElement('style');s.id='atlas17styles';s.textContent=`
 .atlas17-subhead{margin:28px 0 10px;font-size:13px;font-weight:800;letter-spacing:.08em;color:#176f72;text-transform:uppercase}
 .career-pairs{display:grid;gap:6px;margin-top:8px}.career-pair{padding:7px 9px;border-radius:8px;background:#f5f8f9;font-size:12px;line-height:1.35}
 .career-pair .wintext{color:#08766d;font-weight:700}.career-pair .losstext{color:#8a5d26;font-weight:700}
 .direct-stat{border-left:4px solid #168278}.selected-detail{background:#f3f8f8;border:1px solid #cfe0e2;border-radius:12px;padding:16px 18px;margin:12px 0 20px}
 .selected-detail strong{font-size:22px;color:#173143}.person-result .route{display:block;margin-top:6px;font-size:11px;color:#5a6f79}
 `;document.head.appendChild(s);
}

function atlas17Ratio(n,d){return d?`${num(n,0)} / ${num(d,0)} (${num(pct(n,d),1)} %)`:'0 / 0'}
function atlas17OutcomeContext(r){
 if(r.electa)return 'Electa en esta candidatura';
 if(r.electa_despues)return 'No electa aquí; resultó electa después';
 if(r.electa_antes)return 'No electa aquí; ya había resultado electa antes';
 return 'No electa aquí; nunca resultó electa en el corpus';
}
function atlas17PersonFull(pid){return (D.resultados_personas||[]).find(r=>r.id_persona===pid)}
function atlas17RoleSuccess(rows){
 return group(rows,'cargo').map(([cargo,g])=>({cargo,candidaturas:g.length,electas:g.filter(r=>r.electa).length,no_electas:g.filter(r=>!r.electa).length,
   tasa:pct(g.filter(r=>r.electa).length,g.length)})).sort((a,b)=>b.candidaturas-a.candidaturas);
}
function atlas17SexSuccess(rows){
 return ['Mujer','Hombre'].map(sexo=>{const g=rows.filter(r=>r.sexo===sexo);return {sexo,candidaturas:g.length,electas:g.filter(r=>r.electa).length,no_electas:g.filter(r=>!r.electa).length,tasa:pct(g.filter(r=>r.electa).length,g.length)}}).filter(r=>r.candidaturas);
}
function atlas17BridgePeople(rows,fromRole,toRole){
 const result=[];
 for(const [pid,g0] of group(rows,'id_persona')){
   const g=g0.slice().sort((a,b)=>a.anio_origen-b.anio_origen||a.anio-b.anio);
   const all=(D.resultados_candidaturas||[]).filter(r=>r.id_persona===pid);
   const firstOrigin=Math.min(...g.map(r=>r.anio_origen));
   const destination=all.filter(r=>r.cargo===toRole&&r.anio>firstOrigin).sort((a,b)=>a.anio-b.anio);
   const destWins=destination.filter(r=>r.electa);
   result.push({id_persona:pid,nombre:g[g.length-1].nombre,pares:g,
     destino_candidaturas:destination.length,destino_alguna_vez_electa:destWins.length>0,
     destino_primera_eleccion:destWins.length?destWins[0].anio:null,
     origen_alguna_electa:g.some(r=>r.electa_origen),cambio_partido:g.some(r=>r.cambia_partido),
     fromRole,toRole});
 }
 return result;
}
function atlas17CareerCards(people,limit=80){
 return '<div class="person-result-grid">'+people.slice(0,limit).map(p=>{
   const pairs=(p.pares||[]).slice(0,6).map(r=>`<div class="career-pair"><span class="${r.electa_origen?'wintext':'losstext'}">${r.anio_origen} ${esc(r.cargo_origen)} · ${r.resultado_origen}</span> → <span class="${r.electa_destino?'wintext':'losstext'}">${r.anio} ${esc(r.cargo_destino)} · ${r.resultado_destino}</span></div>`).join('');
   const more=(p.pares||[]).length>6?`<span class="mini">+ ${(p.pares||[]).length-6} pares adicionales en la tabla</span>`:'';
   return `<div class="person-result">${atlasPersonButton(p)}${p.destino_alguna_vez_electa?atlasResultBadge(true,`Alguna vez electa en ${p.toRole}`):atlasResultBadge(false,`Nunca electa en ${p.toRole}`)}${pairs}${more}</div>`;
 }).join('')+'</div>';
}


// Utilidades 1.8 para mostrar carreras completas sin ocultar personas detrás de cortes arbitrarios.
function atlas18EventLine(r){
 const cls=r.electa?'wintext':'losstext';
 return `<div class="career-pair"><span class="${cls}">${r.anio} ${esc(r.cargo)} · ${r.electa?'Electa':'No electa'}</span><span class="mini">${esc(labelText(r.partido))}${r.provincia?` · ${esc(r.provincia)}`:''}</span></div>`;
}
function atlas18PersonEvents(pid){return (D.resultados_candidaturas||[]).filter(r=>r.id_persona===pid).sort((a,b)=>a.anio-b.anio||a.numero_candidatura-b.numero_candidatura)}
function atlas18PageOptions(n,per){return Array.from({length:Math.max(1,Math.ceil(n/per))},(_,i)=>[i,`${i*per+1}–${Math.min((i+1)*per,n)}`])}
function atlas18FlowCards(rows,page=0,per=48){
 const people=group(rows,'id_persona').map(([pid,g])=>({id_persona:pid,nombre:g[0].nombre,pares:g.slice().sort((a,b)=>a.anio_origen-b.anio_origen||a.anio-b.anio)})).sort((a,b)=>a.nombre.localeCompare(b.nombre,'es'));
 const slice=people.slice(page*per,(page+1)*per);
 return {people,html:'<div class="person-result-grid">'+slice.map(p=>{const pairs=p.pares.slice(0,8).map(r=>`<div class="career-pair"><span class="${r.electa_origen?'wintext':'losstext'}">${r.anio_origen} ${esc(r.cargo_origen)} · ${esc(r.resultado_origen)}</span> → <span class="${r.electa_destino?'wintext':'losstext'}">${r.anio} ${esc(r.cargo_destino)} · ${esc(r.resultado_destino)}</span></div>`).join('');const more=p.pares.length>8?`<span class="mini">+ ${p.pares.length-8} transiciones adicionales en la tabla</span>`:'';return `<div class="person-result">${atlasPersonButton(p)}${pairs}${more}</div>`}).join('')+'</div>'};
}
function atlas18AntecedentCards(rows,page=0,per=48){
 const people=group(rows,'id_persona').map(([pid,g])=>({id_persona:pid,nombre:g[0].nombre,targets:g.slice().sort((a,b)=>a.anio-b.anio)})).sort((a,b)=>a.nombre.localeCompare(b.nombre,'es'));
 const slice=people.slice(page*per,(page+1)*per);
 return {people,html:'<div class="person-result-grid">'+slice.map(p=>{const maxTarget=Math.max(...p.targets.map(r=>r.anio));const targetYears=new Set(p.targets.map(r=>r.anio));const hist=atlas18PersonEvents(p.id_persona).filter(r=>r.anio<=maxTarget);const shown=hist.slice(Math.max(0,hist.length-9));const lines=shown.map(r=>atlas18EventLine(r)).join('');const more=hist.length>shown.length?`<span class="mini">+ ${hist.length-shown.length} candidaturas anteriores en el perfil completo</span>`:'';const cat=uniq(p.targets.map(r=>r.antecedente)).join(' · ');return `<div class="person-result">${atlasPersonButton(p)}<span class="outcome-badge neutral">${esc(cat)}</span>${lines}${more}</div>`}).join('')+'</div>'};
}

// Explorador de personas 1.8: búsqueda avanzada sin paginación rígida.
views.credenciales=()=>{
 title('Explorador de personas','Busque por nombre, partido, año, cargo, provincia o resultado y recorra la historia electoral completa de cada identidad nominal.');
 const all=(D.resultados_personas||[]).slice().sort((a,b)=>a.nombre.localeCompare(b.nombre,'es'));
 const allEvents=(D.resultados_candidaturas||[]).filter(r=>r.anio>=state.from&&r.anio<=state.to&&(state.province==='Nacional'||r.provincia===state.province));
 const scope=local.credentialscope||'Todas',query=local.personquery||'',year=local.credyear||'Todos',party=local.credparty||'Todos',role=local.credrole||'Todos',result=local.credresult||'Todos',province=local.credprovince||'Todos';
 const years=['Todos',...uniq(allEvents.map(r=>r.anio)).sort((a,b)=>a-b)],parties=['Todos',...uniq(allEvents.map(r=>r.partido)).sort()],roles=['Todos',...uniq(allEvents.map(r=>r.cargo)).sort()],results=['Todos','Electa','No electa'],provinces=['Todos',...uniq(allEvents.map(r=>r.provincia)).sort()];
 const q=normalized(query);
 let matchingEvents=allEvents.filter(r=>(year==='Todos'||r.anio===+year)&&(party==='Todos'||r.partido===party)&&(role==='Todos'||r.cargo===role)&&(result==='Todos'||r.resultado===result)&&(province==='Todos'||r.provincia===province)&&(!q||[r.nombre,r.partido,r.cargo,r.provincia,String(r.anio),r.resultado].some(v=>normalized(v||'').includes(q))));
 const matchingIds=new Set(matchingEvents.map(r=>r.id_persona));
 let filtered=all.filter(r=>atlasPersonScopeMatch(r,scope)&&matchingIds.has(r.id_persona));
 const direct=all.find(r=>r.id_persona===local.credentialperson);
 if(direct&&!filtered.some(r=>r.id_persona===direct.id_persona))filtered.unshift(direct);
 add(`<section class="card"><div class="card-head"><div><h3>Búsqueda avanzada</h3><p class="chart-note">Busque por nombre o cualquier atributo electoral. El selector ya no depende de páginas rígidas; cuando hay demasiadas coincidencias, refine uno o más filtros.</p></div></div><div class="searchbar"><input id="personsearch" type="search" placeholder="Nombre, apellido, partido, año, cargo, provincia o resultado…" value="${esc(query)}"><button class="button primary" id="personsearchbtn">Buscar</button><button class="button" id="personclear">Limpiar filtros</button></div></section>`);
 $('personsearchbtn').onclick=()=>{local.personquery=$('personsearch').value;local.credentialperson='';render()};$('personsearch').onkeydown=e=>{if(e.key==='Enter')$('personsearchbtn').click()};$('personclear').onclick=()=>{for(const k of ['personquery','credyear','credparty','credrole','credresult','credprovince'])delete local[k];local.credentialscope='Todas';local.credentialperson='';render()};
 controls([['credentialscope','Población',['Todas','Más de una candidatura','Alguna vez electa','Nunca resultó electa en el corpus','Diputación electa','Presidencia candidata','Presidencia electa','Vicepresidencia electa'],scope],['credyear','Año',years,year],['credparty','Partido',parties,party],['credrole','Cargo',roles,role],['credresult','Resultado',results,result],['credprovince','Provincia',provinces,province]]);
 const maxOptions=600;let visible=filtered.slice(0,maxOptions);if(direct&&!visible.some(r=>r.id_persona===direct.id_persona))visible.unshift(direct);
 let chosen=(local.credentialperson&&visible.some(r=>r.id_persona===local.credentialperson))?local.credentialperson:visible[0]?.id_persona||'';local.credentialperson=chosen;
 controls([['credentialperson',`Persona · ${num(filtered.length,0)} coincidencias`,visible.map(r=>[r.id_persona,r.nombre]),chosen]]);
 if(filtered.length>maxOptions)note(`Hay ${num(filtered.length,0)} coincidencias. El selector muestra las primeras ${num(maxOptions,0)}; use nombre, partido, año, cargo, provincia o resultado para afinar la búsqueda.`);
 const person=all.find(r=>r.id_persona===chosen);if(!person){note('No hay personas que cumplan la búsqueda o los filtros seleccionados.');return;}
 const events=atlas18PersonEvents(chosen),wins=events.filter(r=>r.electa),careerLabel=person.alguna_vez_electa?'Resultó electa al menos una vez':'Nunca resultó electa en el corpus';
 add(`<section class="person-hero"><div class="identity"><div class="eyebrow">PERFIL ELECTORAL NOMINAL</div><h2>${esc(person.nombre)}</h2><p class="mini">${esc(person.identidad||'Coincidencia nominal')} · ${esc(person.sexo||'Sin dato')} · ${person.primera_candidatura||'—'}–${person.ultima_candidatura||'—'}</p>${atlasResultBadge(!!person.alguna_vez_electa,careerLabel)}<span class="route">${esc(person.ruta_primera_eleccion||'')}</span></div><div class="micro-kpi"><span>Candidaturas</span><strong>${num(events.length,0)}</strong><span>${num(person.elecciones_distintas,0)} elecciones distintas</span></div><div class="micro-kpi"><span>Candidaturas electas</span><strong>${num(wins.length,0)}</strong><span>${person.primera_eleccion_anio?`Primera: ${person.primera_eleccion_anio}`:'Sin elección registrada'}</span></div><div class="micro-kpi"><span>Cargos disputados</span><strong>${num(uniq(events.map(r=>r.cargo)).length,0)}</strong><span>${esc(uniq(events.map(r=>r.cargo)).join(' · ')||'—')}</span></div></section>`);
 add('<div class="clarity-box"><b>Lectura clave:</b> “No electa” describe una candidatura concreta, no toda la carrera. El historial completo muestra si la persona había ganado antes o si resultó electa después.</div>');
 add('<section class="card"><h3>Historia electoral completa</h3><div class="career-strip">'+events.map(r=>`<div class="career-step"><b>${r.anio} · ${esc(r.cargo)}</b>${atlasResultBadge(r.electa,r.electa?'Electa':'No electa')}<span class="mini">${esc(labelText(r.partido))}<br>${esc(r.provincia)} · ${esc(r.tipo||'—')}<br>${esc(atlas17OutcomeContext(r))}</span></div>`).join('')+'</div></section>');
 const trace=events.map(r=>({anio:r.anio,cargo:r.cargo,partido:r.partido,provincia:r.provincia,resultado:r.resultado,contexto:atlas17OutcomeContext(r),id_evento:r.id_evento}));plot('Cronología visual de candidaturas y outcomes',[{type:'scatter',mode:'lines+markers',x:trace.map(r=>r.anio),y:trace.map(r=>r.cargo),text:trace.map(r=>`${labelText(r.partido)} · ${r.provincia}<br>${r.contexto}`),marker:{size:14,color:trace.map(r=>r.resultado==='Electa'?'#168278':'#b8a16d'),symbol:trace.map(r=>r.resultado==='Electa'?'circle':'circle-open')},line:{color:'#879aa5',width:2},hovertemplate:'%{x} · %{y}<br>%{text}<extra></extra>'}],trace,{height:390,note:'Cada punto es una candidatura documentada. Verde = electa; ámbar = no electa.'});
 table(events,['anio','nombre','cargo','tipo','partido','provincia','orden','sexo','resultado','resultado_contextual','numero_eleccion_documentada','numero_candidatura','electa_antes','electa_despues','cambio_partido','cambio_provincia','id_evento'],'Todas las candidaturas y el contexto de la carrera');
};

// Éxito electoral 1.7.
views.outcomes=()=>{
 title('Éxito electoral y trayectorias','Distingue tres niveles: cada candidatura, cada persona y la secuencia completa de su carrera electoral. “No electa” nunca significa que la persona no haya ganado antes o después.');
 const roleOpts=['Diputación','Presidencia','Primera Vicepresidencia','Segunda Vicepresidencia'];
 const roles=['Todos',...roleOpts],sexes=['Todos','Mujer','Hombre'];
 const partyChoices=['Todos',...uniq((D.resultados_candidaturas||[]).map(r=>r.partido)).sort()];
 controls([['ocargo','Cargo',roles,local.ocargo||'Todos'],['osex','Sexo',sexes,local.osex||'Todos'],['oparty','Partido',partyChoices,local.oparty||'Todos']]);
 const rows=atlasFilteredOutcomes(),won=rows.filter(r=>r.electa),lost=rows.filter(r=>!r.electa),personAgg=atlasPersonAggregate(rows),personWins=personAgg.filter(r=>r.electas>0),personLoss=personAgg.filter(r=>r.electas===0);
 kpis([['Candidaturas analizadas',num(rows.length,0),'Cada postulación es un evento'],['Candidaturas electas',atlas17Ratio(won.length,rows.length),'Outcome electo dentro del filtro'],['Candidaturas no electas',atlas17Ratio(lost.length,rows.length),'Outcome no electo dentro del filtro'],['Personas candidatas',num(personAgg.length,0),'Cada ID nominal se cuenta una vez'],['Personas que resultaron electas',atlas17Ratio(personWins.length,personAgg.length),'Al menos una candidatura electa en la selección'],['Personas que no resultaron electas',atlas17Ratio(personLoss.length,personAgg.length),'Ninguna candidatura electa en la selección']]);
 add('<div class="clarity-box"><b>Candidatura ≠ persona.</b> Una persona puede perder una elección y ganar otra. Los porcentajes de candidaturas usan eventos; los porcentajes de personas cuentan cada identidad nominal una sola vez.</div>');

 const roleSuccess=atlas17RoleSuccess(rows);
 if(roleSuccess.length){
   plot('Electa o no electa dentro de cada cargo',[{type:'bar',name:'Electa',x:roleSuccess.map(r=>r.cargo),y:roleSuccess.map(r=>pct(r.electas,r.candidaturas)),customdata:roleSuccess.map(r=>[r.electas,r.candidaturas]),text:roleSuccess.map(r=>`${num(pct(r.electas,r.candidaturas),1)}% · N=${r.electas}`),textposition:'inside',marker:{color:'#168278'},hovertemplate:'%{x}<br>Electas: %{customdata[0]} / %{customdata[1]} (%{y:.1f}%)<extra></extra>'},{type:'bar',name:'No electa',x:roleSuccess.map(r=>r.cargo),y:roleSuccess.map(r=>pct(r.no_electas,r.candidaturas)),customdata:roleSuccess.map(r=>[r.no_electas,r.candidaturas]),text:roleSuccess.map(r=>`${num(pct(r.no_electas,r.candidaturas),1)}% · N=${r.no_electas}`),textposition:'inside',marker:{color:'#b8a16d'},hovertemplate:'%{x}<br>No electas: %{customdata[0]} / %{customdata[1]} (%{y:.1f}%)<extra></extra>'}],roleSuccess,{height:390,yTitle:'Porcentaje dentro del cargo (%)',layout:{barmode:'stack',yaxis:{range:[0,100]}},note:'Cada columna suma 100%: dentro de cada cargo, qué proporción de candidaturas resultó electa y qué proporción no.'});
   table(roleSuccess,['cargo','candidaturas','electas','no_electas','tasa'],'Resultado por cargo · numerador y denominador');
 }
 const sexSuccess=atlas17SexSuccess(rows);
 if(sexSuccess.length){plot('Tasa de elección por sexo',[{type:'bar',x:sexSuccess.map(r=>r.sexo),y:sexSuccess.map(r=>r.tasa),customdata:sexSuccess.map(r=>[r.electas,r.candidaturas]),marker:{color:sexSuccess.map(r=>sexColors[r.sexo])},text:sexSuccess.map(r=>`${num(r.tasa,1)}% · ${r.electas}/${r.candidaturas}`),textposition:'outside',hovertemplate:'%{x}<br>%{customdata[0]} electas / %{customdata[1]} candidaturas<br>%{y:.1f}%<extra></extra>'}],sexSuccess,{height:330,yTitle:'Candidaturas electas / candidaturas (%)',note:'Comparación descriptiva dentro del sexo registrado. No se muestra “Sin dato” como KPI; los faltantes permanecen disponibles en las tablas.'});}

 // Qué significa una candidatura no electa dentro de la carrera completa.
 const lossContext=[
  ['Resultó electa en una elección posterior',r=>r.electa_despues],
  ['Ya había resultado electa antes',r=>!r.electa_despues&&r.electa_antes],
  ['Nunca resultó electa en el corpus',r=>!r.electa_despues&&!r.electa_antes]
 ].map(([situacion,pred])=>{const g=lost.filter(pred);return {situacion,candidaturas:g.length,personas:uniq(g.map(r=>r.id_persona)).length,porcentaje:pct(g.length,lost.length)}});
 if(lost.length){plot('Qué ocurrió en la carrera de las candidaturas no electas',[{type:'bar',orientation:'h',x:lossContext.map(r=>r.porcentaje),y:lossContext.map(r=>r.situacion),customdata:lossContext.map(r=>[r.candidaturas,r.personas]),marker:{color:['#3276c2','#6266a4','#b8a16d']},text:lossContext.map(r=>`${num(r.porcentaje,1)}% · N=${r.candidaturas}`),textposition:'outside',hovertemplate:'%{y}<br>%{customdata[0]} candidaturas · %{customdata[1]} personas<br>%{x:.1f}% de las candidaturas no electas<extra></extra>'}],lossContext,{height:340,xTitle:'Porcentaje de candidaturas no electas (%)',note:'Ejemplo: una derrota presidencial seguida por una victoria posterior aparece en “Resultó electa en una elección posterior”, no como fracaso final de la persona.'});table(lossContext,['situacion','candidaturas','personas','porcentaje'],'Contexto posterior y previo de las candidaturas no electas');}

 // Persistencia y ruta completa de las personas que aparecen en la selección.
 const selectedIds=new Set(rows.map(r=>r.id_persona)),careerPeople=(D.resultados_personas||[]).filter(r=>selectedIds.has(r.id_persona));
 const repeaters=careerPeople.filter(r=>r.elecciones_distintas>1),single=careerPeople.filter(r=>r.elecciones_distintas===1),repeatWin=repeaters.filter(r=>r.alguna_vez_electa),repeatNever=repeaters.filter(r=>!r.alguna_vez_electa);
 add('<div class="atlas17-subhead">Persistencia de candidaturas</div>');
 kpis([['Personas con una sola elección documentada',atlas17Ratio(single.length,careerPeople.length),'No reaparecen en otro año electoral del corpus'],['Personas que volvieron a competir',atlas17Ratio(repeaters.length,careerPeople.length),'Aparecen en dos o más años electorales'],['Entre quienes volvieron: alguna vez electas',atlas17Ratio(repeatWin.length,repeaters.length),'Resultado de toda su carrera observada'],['Entre quienes volvieron: nunca electas',atlas17Ratio(repeatNever.length,repeaters.length),'No registran una candidatura electa en el corpus']]);
 const repeatDist=group(repeaters,'elecciones_distintas').map(([elecciones,g])=>({elecciones:+elecciones,personas:g.length,porcentaje:pct(g.length,repeaters.length)})).sort((a,b)=>a.elecciones-b.elecciones);
 if(repeatDist.length)plot('Entre quienes repitieron: cuántos años electorales distintos disputaron',[{type:'bar',x:repeatDist.map(r=>r.elecciones),y:repeatDist.map(r=>r.porcentaje),customdata:repeatDist.map(r=>r.personas),marker:{color:'#3276c2'},text:repeatDist.map(r=>`${num(r.porcentaje,1)}% · N=${r.personas}`),textposition:'outside',hovertemplate:'%{x} elecciones distintas<br>%{customdata} personas · %{y:.1f}%<extra></extra>'}],repeatDist,{height:350,xTitle:'Años electorales distintos con candidatura',yTitle:'Porcentaje entre quienes repitieron (%)',note:'El universo de este gráfico excluye a quienes solo aparecen en un año electoral; así se puede observar el fenómeno de recurrencia sin que la categoría mayoritaria lo comprima.'});
 const routeRows=group(careerPeople,'ruta_primera_eleccion').map(([ruta,g])=>({ruta,personas:g.length,porcentaje:pct(g.length,careerPeople.length)})).sort((a,b)=>b.personas-a.personas);
 if(routeRows.length)plot('Ruta de todas las personas hasta su primera elección exitosa',[{type:'bar',orientation:'h',x:routeRows.map(r=>r.porcentaje),y:routeRows.map(r=>r.ruta),customdata:routeRows.map(r=>r.personas),marker:{color:routeRows.map(r=>r.ruta.startsWith('Nunca')?'#b8a16d':'#168278')},text:routeRows.map(r=>`${num(r.porcentaje,1)}% · N=${r.personas}`),textposition:'outside',hovertemplate:'%{y}<br>%{customdata} personas · %{x:.1f}%<extra></extra>'}],routeRows,{height:Math.max(330,routeRows.length*48+150),xTitle:'Porcentaje de personas (%)',note:'Vista completa: incluye a quienes nunca resultaron electos. La gráfica siguiente amplía únicamente a quienes sí tuvieron al menos un éxito electoral.'});
 const electedPeople=careerPeople.filter(r=>r.alguna_vez_electa),electedRoute=group(electedPeople,'ruta_primera_eleccion').map(([ruta,g])=>({ruta,personas:g.length,porcentaje:pct(g.length,electedPeople.length)})).sort((a,b)=>b.personas-a.personas);
 if(electedRoute.length)plot('Entre quienes sí resultaron electos: camino hasta la primera elección exitosa',[{type:'bar',orientation:'h',x:electedRoute.map(r=>r.porcentaje),y:electedRoute.map(r=>r.ruta),customdata:electedRoute.map(r=>r.personas),marker:{color:'#168278'},text:electedRoute.map(r=>`${num(r.porcentaje,1)}% · N=${r.personas}`),textposition:'outside',hovertemplate:'%{y}<br>%{customdata} personas · %{x:.1f}%<extra></extra>'}],electedRoute,{height:Math.max(320,electedRoute.length*52+150),xTitle:'Porcentaje entre personas alguna vez electas (%)',note:'Aquí se elimina del denominador a quienes nunca resultaron electos. Permite comparar con claridad cuántas personas ganaron en su primera elección documentada y cuántas necesitaron uno, dos o más años electorales previos sin éxito.'});
 const successAgain=electedPeople.map(p=>{const winYears=uniq((D.resultados_candidaturas||[]).filter(r=>r.id_persona===p.id_persona&&r.electa).map(r=>r.anio)).length;const extra=Math.max(0,winYears-1);return {...p,elecciones_exitosas_distintas:winYears,exitos_adicionales:extra,grupo_extra:extra===0?'No volvió a resultar electa':extra===1?'1 elección exitosa adicional':extra===2?'2 elecciones exitosas adicionales':extra===3?'3 elecciones exitosas adicionales':'4 o más elecciones exitosas adicionales'}});
 const extraRows=group(successAgain,'grupo_extra').map(([grupo,g])=>({grupo,personas:g.length,porcentaje:pct(g.length,successAgain.length),orden:Math.min(...g.map(r=>r.exitos_adicionales))})).sort((a,b)=>a.orden-b.orden);
 if(extraRows.length)plot('Después de la primera victoria: cuántas veces volvieron a resultar electas',[{type:'bar',orientation:'h',x:extraRows.map(r=>r.porcentaje),y:extraRows.map(r=>r.grupo),customdata:extraRows.map(r=>r.personas),marker:{color:'#637cac'},text:extraRows.map(r=>`${num(r.porcentaje,1)}% · N=${r.personas}`),textposition:'outside',hovertemplate:'%{y}<br>%{customdata} personas · %{x:.1f}%<extra></extra>'}],extraRows,{height:Math.max(320,extraRows.length*50+150),xTitle:'Porcentaje entre personas alguna vez electas (%)',note:'Cuenta años electorales distintos con al menos un resultado electo. “Volvió a resultar electa” puede corresponder al mismo cargo o a otro; no implica reelección inmediata al mismo puesto.'});
 table([...repeatDist.map(r=>({indicador:'Años electorales disputados entre recurrentes',categoria:r.elecciones,personas:r.personas,porcentaje:r.porcentaje})),...electedRoute.map(r=>({indicador:'Camino hasta primera elección · solo electas',categoria:r.ruta,personas:r.personas,porcentaje:r.porcentaje})),...extraRows.map(r=>({indicador:'Éxitos posteriores a la primera elección',categoria:r.grupo,personas:r.personas,porcentaje:r.porcentaje}))],['indicador','categoria','personas','porcentaje'],'Persistencia y éxito de las carreras · datos de las gráficas');

 add('<div class="atlas17-subhead">Flujos entre elecciones consecutivas de una persona</div>');
 const ids=new Set(rows.map(r=>r.id_persona));let transitions=(D.transiciones_resultados||[]).filter(r=>r.anio>=state.from&&r.anio<=state.to&&ids.has(r.id_persona));
 if(state.province!=='Nacional')transitions=transitions.filter(r=>r.provincia_origen===state.province||r.provincia_destino===state.province);
 const flowMode=local.oflowdim||'Resultado de candidaturas';controls([['oflowdim','Qué comparar entre una elección y la siguiente',['Resultado de candidaturas','Cargo + resultado','Cambio de cargo','Cambio de partido + resultado','Cambio de provincia + resultado'],flowMode]]);
 let flowRows=transitions;if(flowMode==='Cambio de provincia + resultado')flowRows=flowRows.filter(r=>r.provincia_origen!=='Nacional'&&r.provincia_destino!=='Nacional');
 const descriptor=r=>{
   if(flowMode==='Cargo + resultado')return {origen:`${r.cargo_origen} · candidatura ${r.resultado_origen.toLowerCase()}`,destino:`${r.cargo_destino} · candidatura ${r.resultado_destino.toLowerCase()}`};
   if(flowMode==='Cambio de cargo')return {origen:r.cargo_origen,destino:r.cargo_destino};
   if(flowMode==='Cambio de partido + resultado')return {origen:r.cambia_partido?'Cambió de partido':'Mantuvo partido',destino:`Siguiente candidatura: ${r.resultado_destino.toLowerCase()}`};
   if(flowMode==='Cambio de provincia + resultado')return {origen:r.cambia_provincia?'Cambió de provincia':'Mantuvo provincia',destino:`Siguiente candidatura: ${r.resultado_destino.toLowerCase()}`};
   return {origen:`Candidatura anterior: ${r.resultado_origen.toLowerCase()}`,destino:`Candidatura siguiente: ${r.resultado_destino.toLowerCase()}`};
 };
 const described=flowRows.map(r=>({...r,...descriptor(r)}));
 const edges=group(described,r=>r.origen+' → '+r.destino).map(([recorrido,g])=>({recorrido,origen:g[0].origen,destino:g[0].destino,pares:g.length,personas:uniq(g.map(r=>r.id_persona)).length})).sort((a,b)=>b.personas-a.personas);
 let sel=(local.outflow&&edges.some(r=>r.recorrido===local.outflow))?local.outflow:'Todos';local.outflow=sel;controls([['outflow','Ver personas de este flujo',['Todos',...edges.map(r=>r.recorrido)],sel]]);
 if(edges.length){const left=uniq(edges.map(r=>r.origen)),right=uniq(edges.map(r=>r.destino));plot('Flujos auditables entre una elección y la siguiente',[{type:'sankey',orientation:'h',arrangement:'snap',node:{label:[...left,...right],pad:28,thickness:19},link:{source:edges.map(r=>left.indexOf(r.origen)),target:edges.map(r=>left.length+right.indexOf(r.destino)),value:edges.map(r=>r.personas),customdata:edges.map(r=>r.recorrido),hovertemplate:'%{customdata}<br>%{value} personas<extra></extra>'}}],edges,{height:Math.max(360,Math.max(left.length,right.length)*42+160),note:'Grosor = personas nominales únicas por flujo. La tabla conserva también el número de pares de candidaturas. El selector sí actualiza los nombres que aparecen debajo.',onClick:evt=>{const value=evt.points?.[0]?.customdata;if(value&&edges.some(r=>r.recorrido===value)){local.outflow=value;render()}}});
  const selectedRows=described.filter(r=>sel==='Todos'||`${r.origen} → ${r.destino}`===sel);
  const flowPack0=atlas18FlowCards(selectedRows,0,48),flowPages=atlas18PageOptions(flowPack0.people.length,48),flowPage=Math.min(+(local.outflowpage||0),flowPages.length-1);if(flowPages.length>1)controls([['outflowpage',`Página de personas · ${num(flowPack0.people.length,0)} personas`,flowPages,flowPage]]);const flowPack=atlas18FlowCards(selectedRows,flowPage,48);
  add(`<div class="selected-detail"><span class="mini">Flujo seleccionado</span><br><strong>${num(flowPack.people.length,0)} personas distintas</strong><br>${num(selectedRows.length,0)} pares de candidaturas sustentan este flujo.</div>`);
  atlasSectionCard('outcome_flow_selected_visible','Personas del flujo seleccionado',flowPack.html,selectedRows,{subtitle:atlasOutcomeFilterSummary([`Dimensión del flujo: ${flowMode}`,`Flujo inspeccionado: ${sel}`,`Página visible: ${flowPage+1} de ${flowPages.length}`]),note:`Las tarjetas muestran todas las combinaciones del flujo para cada persona en la página visible. Verde = electa; ámbar = no electa. Puede exportar la tarjeta compuesta como PNG o SVG; el CSV conserva todos los registros del flujo seleccionado (${num(selectedRows.length,0)} pares de candidaturas).`,filename:'Atlas_ExitoElectoral_FlujoSeleccionado'});
  table(edges,['recorrido','personas','pares'],'Resumen de flujos');table(selectedRows,['nombre','anio_origen','anio','cargo_origen','resultado_origen','cargo_destino','resultado_destino','destino_electa_despues','partido_origen','partido_destino','provincia_origen','provincia_destino','cambia_partido','cambia_provincia','id_persona'],'Registros que sustentan el flujo seleccionado');
 }else note('No hay transiciones que cumplan los filtros actuales.');

 add('<div class="atlas17-subhead">Puentes entre cargos · cualquier candidatura anterior y posterior</div>');
 // Matriz general antes del detalle.
 let allBridges=(D.puentes_cargos||[]).filter(r=>r.anio>=state.from&&r.anio<=state.to);
 const matrixRows=[];for(const from of roleOpts)for(const to of roleOpts){if(from===to)continue;const g=allBridges.filter(r=>r.cargo_origen===from&&r.cargo_destino===to),persons=uniq(g.map(r=>r.id_persona));if(persons.length)matrixRows.push({cargo_origen:from,cargo_destino:to,personas:persons.length,pares:g.length});}
 if(matrixRows.length){const z=roleOpts.map(from=>roleOpts.map(to=>matrixRows.find(r=>r.cargo_origen===from&&r.cargo_destino===to)?.personas??0));plot('Matriz de personas que pasaron de un cargo disputado a otro',[{type:'heatmap',x:roleOpts,y:roleOpts,z,texttemplate:'%{z}',colorscale:[[0,'#f0f5f5'],[1,'#167d8d']],hovertemplate:'Origen: %{y}<br>Destino: %{x}<br>%{z} personas<extra></extra>'}],matrixRows,{height:470,xTitle:'Cargo posterior',yTitle:'Cargo anterior',note:'Cuenta personas nominales únicas con al menos una candidatura anterior en el cargo de fila y una candidatura posterior en el cargo de columna. Cero es ausencia observada en el corpus.'});}
 const bFrom=local.bridgeFrom||'Diputación',bTo=local.bridgeTo||'Presidencia',bFromResult=local.bridgeFromResult||'Todos',bToResult=local.bridgeToResult||'Todos';
 controls([['bridgeFrom','Cargo anterior',roleOpts,bFrom],['bridgeFromResult','Resultado de esa candidatura',['Todos','Electa','No electa'],bFromResult],['bridgeTo','Cargo posterior',roleOpts,bTo],['bridgeToResult','Resultado de esa candidatura',['Todos','Electa','No electa'],bToResult]]);
 let bridges=allBridges.filter(r=>r.cargo_origen===bFrom&&r.cargo_destino===bTo&&(bFromResult==='Todos'||r.resultado_origen===bFromResult)&&(bToResult==='Todos'||r.resultado_destino===bToResult));
 if(state.province!=='Nacional')bridges=bridges.filter(r=>r.provincia_origen===state.province||r.provincia_destino===state.province);
 const bridgePeople=atlas17BridgePeople(bridges,bFrom,bTo),destWins=bridgePeople.filter(r=>r.destino_alguna_vez_electa),destNever=bridgePeople.filter(r=>!r.destino_alguna_vez_electa);
 kpis([['Personas con este puente',num(bridgePeople.length,0),`${bFrom} → ${bTo}`],['Alguna vez electas en el cargo posterior',atlas17Ratio(destWins.length,bridgePeople.length),`En ${bTo} después del cargo anterior`],['Nunca electas en el cargo posterior',atlas17Ratio(destNever.length,bridgePeople.length),`Aunque sí registran candidatura posterior en ${bTo}`],['Con cambio de partido',atlas17Ratio(bridgePeople.filter(r=>r.cambio_partido).length,bridgePeople.length),'En al menos uno de los pares observados']]);
 if(bridgePeople.length){const bridgeStatus=[{situacion:`Alguna vez electa en ${bTo}`,personas:destWins.length},{situacion:`Nunca electa en ${bTo}`,personas:destNever.length}];plot(`${bFrom} → ${bTo}: resultado final observado en el cargo posterior`,[{type:'bar',orientation:'h',x:bridgeStatus.map(r=>r.personas),y:bridgeStatus.map(r=>r.situacion),marker:{color:['#168278','#b8a16d']},text:bridgeStatus.map(r=>`${r.personas} · ${num(pct(r.personas,bridgePeople.length),1)}%`),textposition:'outside'}],bridgeStatus,{height:300,xTitle:'Personas nominales',note:'Una persona que perdió una o más veces y luego ganó el cargo posterior cuenta como “Alguna vez electa”. Esto evita confundir una derrota intermedia con el resultado final de su trayectoria.'});
 atlasSectionCard('outcome_bridge_people_visible','Quiénes forman este puente de carrera',atlas17CareerCards(bridgePeople),bridges,{subtitle:atlasOutcomeFilterSummary([`Puente: ${bFrom} → ${bTo}`,`Outcome previo: ${bFromResult}`,`Outcome posterior: ${bToResult}`]),note:`Cada tarjeta muestra los años y el outcome exacto de las candidaturas que forman el puente. Puede exportar la composición visible como PNG o SVG; el CSV conserva todos los pares de candidaturas que forman el puente (${num(bridges.length,0)} registros).`,filename:'Atlas_ExitoElectoral_PuenteCarrera'});
 table(bridges,['nombre','anio_origen','cargo_origen','resultado_origen','anio','cargo_destino','resultado_destino','destino_electa_despues_del_origen','destino_primera_eleccion_anio_despues_origen','partido_origen','partido_destino','provincia_origen','provincia_destino','cambia_partido','cambia_provincia','anos_entre','id_persona'],'Pares de candidaturas que forman el puente');}
 else note(`No se observan personas con el puente ${bFrom} → ${bTo} bajo estos filtros.`);

 add('<div class="atlas17-subhead">Antecedentes de quienes sí resultaron electos</div>');
 const anteCargo=local.anteCargo||'Presidencia',anteUnit=local.anteUnit||'Personas distintas · primera elección en el cargo';controls([['anteCargo','Cargo electo a explicar',roleOpts,anteCargo],['anteUnit','Unidad de análisis',['Personas distintas · primera elección en el cargo','Resultados electos'],anteUnit]]);
 let antecedents=(D.antecedentes_cargos_electos||[]).filter(r=>r.cargo===anteCargo&&r.anio>=state.from&&r.anio<=state.to);if(state.province!=='Nacional'&&anteCargo==='Diputación')antecedents=antecedents.filter(r=>r.provincia===state.province);
 const uniqueAnte=group(antecedents,'id_persona').map(([pid,g])=>g.slice().sort((a,b)=>a.anio-b.anio)[0]);const analytic=anteUnit.startsWith('Personas distintas')?uniqueAnte:antecedents;
 const categories=['Ya había resultado electa antes','Había competido antes, pero aún no había sido electa','No tenía candidaturas anteriores en estas bases'];
 const anteGroups=categories.map(antecedente=>{const g=analytic.filter(r=>r.antecedente===antecedente);return {antecedente,casos:g.length,personas:uniq(g.map(r=>r.id_persona)).length,porcentaje:pct(g.length,analytic.length)}});
 const anteSel=(local.anteCategory&&['Todos',...categories].includes(local.anteCategory))?local.anteCategory:'Todos';local.anteCategory=anteSel;controls([['anteCategory','Ver nombres de esta categoría',['Todos',...categories],anteSel]]);
 const priorAny=analytic.filter(r=>r.elecciones_previas>0),priorDeputy=analytic.filter(r=>r.diputacion_electa_previa),priorPresCand=analytic.filter(r=>r.presidencia_candidata_previa),firstCorpus=analytic.filter(r=>r.antecedente===categories[2]);
 kpis([['Resultados electos observados',num(antecedents.length,0),`${anteCargo} · eventos electos del periodo`],['Personas distintas electas',num(uniqueAnte.length,0),`${anteCargo} · cada ID nominal una sola vez`],['Ya tenían una elección previa',atlas17Ratio(priorAny.length,analytic.length),anteUnit],['Tenían diputación electa previa',atlas17Ratio(priorDeputy.length,analytic.length),'Antes del resultado analizado'],['Habían competido por la Presidencia',atlas17Ratio(priorPresCand.length,analytic.length),'En un año electoral anterior'],['Sin candidaturas anteriores en estas bases',atlas17Ratio(firstCorpus.length,analytic.length),'Primera aparición documentada en el corpus']]);
 if(analytic.length){plot(`Cómo llegaban quienes resultaron electos en ${anteCargo}`,anteGroups.map((r,i)=>({type:'bar',orientation:'h',name:r.antecedente,x:[r.porcentaje],y:[anteCargo],customdata:[[r.casos,r.personas]],text:[`${num(r.porcentaje,1)}% · N=${r.casos}`],textposition:r.porcentaje>12?'inside':'outside',marker:{color:['#168278','#637cac','#b8a16d'][i]},hovertemplate:`${esc(r.antecedente)}<br>N=%{customdata[0]} · %{x:.1f}%<extra></extra>`})),anteGroups,{height:280,xTitle:'Porcentaje dentro de la unidad seleccionada (%)',layout:{barmode:'stack',xaxis:{range:[0,100]}},note:`Las tres categorías son mutuamente excluyentes y suman 100%. Unidad actual: ${anteUnit}. En “Personas distintas” se toma la primera elección exitosa de cada persona en el cargo dentro del periodo.`});}
 const anteRows=analytic.filter(r=>anteSel==='Todos'||r.antecedente===anteSel),selectedN=anteRows.length,anteDisplay=anteSel==='Todos'?'Todas las categorías':anteSel;const antePack0=atlas18AntecedentCards(anteRows,0,48),antePages=atlas18PageOptions(antePack0.people.length,48),antePage=Math.min(+(local.antepage||0),antePages.length-1);if(antePages.length>1)controls([['antepage',`Página de personas · ${num(antePack0.people.length,0)} personas`,antePages,antePage]]);const antePack=atlas18AntecedentCards(anteRows,antePage,48);
 add(`<div class="selected-detail"><span class="mini">Categoría seleccionada</span><br><strong>${atlas17Ratio(selectedN,analytic.length)}</strong><br>${esc(anteDisplay)} · ${num(antePack.people.length,0)} personas distintas</div>`);
 atlasSectionCard('outcome_antecedent_people_visible','Personas del antecedente seleccionado',antePack.html,anteRows,{subtitle:atlasOutcomeFilterSummary([`Cargo electo: ${anteCargo}`,`Unidad: ${anteUnit}`,`Categoría: ${anteDisplay}`,`Página visible: ${antePage+1} de ${antePages.length}`]),note:`Cada tarjeta muestra la trayectoria documentada hasta el resultado electo analizado. Verde = electa; ámbar = no electa. Puede exportar la composición visible como PNG o SVG; el CSV conserva todos los registros de la categoría seleccionada (${num(anteRows.length,0)} filas).`,filename:'Atlas_ExitoElectoral_AntecedenteSeleccionado'});
 table(anteRows,['anio','nombre','cargo','partido','provincia','antecedente','candidaturas_previas','anios_electorales_previos','elecciones_previas','cargos_previos','cargos_electos_previos','diputacion_electa_previa','presidencia_candidata_previa','vicepresidencia_electa_previa','id_persona'],'Nombres y antecedentes que forman los porcentajes');

 table(rows,['id_evento','anio','nombre','cargo','partido','provincia','sexo','numero_eleccion_documentada','numero_candidatura','resultado','resultado_contextual','electa_antes','electa_despues','cambio_partido','cambio_provincia','id_persona'],'Todas las candidaturas del filtro y su outcome');
};

// Sexo y representación 1.7: composición y tasa de éxito con denominadores intuitivos.
views.genero=()=>{
 title('Sexo y representación','Compara composición y éxito electoral sin mezclar denominadores. La composición suma 100%; la tasa de elección responde cuántas candidaturas de cada sexo resultaron electas.');
 const pop=local.sexpop||'Diputación propietaria';
 const populations=['Diputación propietaria','Suplencia legislativa','Diputación electa','Presidencia','Primera Vicepresidencia','Segunda Vicepresidencia'];
 controls([['sexpop','Población',populations,pop]]);
 let base=[],outcomeApplicable=true;
 if(pop==='Diputación propietaria')base=period(D.candidaturas).filter(r=>r.tipo==='Propietaria');
 else if(pop==='Suplencia legislativa'){base=period(D.candidaturas).filter(r=>r.tipo==='Suplencia');outcomeApplicable=false;}
 else if(pop==='Diputación electa'){base=period(D.electas);outcomeApplicable=false;}
 else base=period(D.formulas,false).filter(r=>r.cargo===pop);
 const parties=['Todos',...uniq(base.map(r=>r.partido).filter(Boolean)).sort()],party=(parties.includes(local.sexparty)?local.sexparty:'Todos');controls([['sexparty','Partido',parties,party]]);base=base.filter(r=>party==='Todos'||r.partido===party);
 const women=base.filter(r=>r.sexo==='Mujer'),men=base.filter(r=>r.sexo==='Hombre'),known=women.length+men.length,unknown=base.length-known;
 const womenE=outcomeApplicable?women.filter(r=>r.electa).length:(pop==='Diputación electa'?women.length:null),menE=outcomeApplicable?men.filter(r=>r.electa).length:(pop==='Diputación electa'?men.length:null);
 kpis([['Registros',num(base.length,0),pop],['Mujeres',atlas17Ratio(women.length,known),'Entre registros con sexo Mujer/Hombre'],['Hombres',atlas17Ratio(men.length,known),'Entre registros con sexo Mujer/Hombre'],['Mujeres electas',womenE===null?'No aplica':num(womenE,0),outcomeApplicable?'Outcome de candidaturas':'La población ya es de electas'],['Hombres electos',menE===null?'No aplica':num(menE,0),outcomeApplicable?'Outcome de candidaturas':'La población ya es de electas']]);
 if(unknown)note(`${num(unknown,0)} registros tienen sexo sin dato y se mantienen en las tablas, pero no se convierten en una tarjeta principal ni se redistribuyen artificialmente.`);
 const ys=yearsVisible(),composition=ys.flatMap(anio=>{const g=base.filter(r=>r.anio===anio),den=g.filter(r=>['Mujer','Hombre'].includes(r.sexo)).length;return ['Mujer','Hombre'].map(sexo=>({anio,sexo,registros:g.filter(r=>r.sexo===sexo).length,total_con_sexo:den,porcentaje:pct(g.filter(r=>r.sexo===sexo).length,den)}))});
 const yearsWith=ys.filter(y=>composition.some(r=>r.anio===y&&r.total_con_sexo>0));
 if(yearsWith.length)plot('Composición por sexo a través del tiempo',['Mujer','Hombre'].map(sexo=>({type:'bar',name:sexo,x:yearsWith,y:yearsWith.map(y=>composition.find(r=>r.anio===y&&r.sexo===sexo)?.porcentaje??0),customdata:yearsWith.map(y=>composition.find(r=>r.anio===y&&r.sexo===sexo)?.registros??0),marker:{color:sexColors[sexo]},text:yearsWith.map(y=>{const z=composition.find(r=>r.anio===y&&r.sexo===sexo);return `${num(z?.porcentaje??0,1)}% · N=${z?.registros??0}`}),textposition:'inside',hovertemplate:'%{x}<br>'+sexo+': %{customdata} registros · %{y:.1f}%<extra></extra>'})),composition,{height:420,yTitle:'Composición (%)',layout:{barmode:'stack',yaxis:{range:[0,100]}},note:'Cada año con registros suma 100% entre Mujer y Hombre. Los faltantes no se reasignan.'});
 else note(`No hay registros de ${pop} en el intervalo seleccionado.`);
 const detail=base.filter(r=>r.anio===state.focus);if(!detail.length)note(`En la elección de detalle ${state.focus} no hay registros de ${pop}. Esto significa ausencia de esa categoría en la base para ese año; no se dibuja un cero artificial.`);
 else{const dw=detail.filter(r=>r.sexo==='Mujer').length,dm=detail.filter(r=>r.sexo==='Hombre').length,dd=dw+dm;add(`<div class="selected-detail"><span class="mini">Elección de detalle · ${state.focus}</span><br><strong>${num(detail.length,0)} registros</strong><br>Mujeres: ${atlas17Ratio(dw,dd)} · Hombres: ${atlas17Ratio(dm,dd)}</div>`);}
 if(outcomeApplicable){const sexStats=atlas17SexSuccess(base);if(sexStats.length){plot('Dentro de cada sexo: candidaturas electas y no electas',[{type:'bar',name:'Electa',x:sexStats.map(r=>r.sexo),y:sexStats.map(r=>pct(r.electas,r.candidaturas)),customdata:sexStats.map(r=>[r.electas,r.candidaturas]),text:sexStats.map(r=>`${num(pct(r.electas,r.candidaturas),1)}% · N=${r.electas}`),textposition:'inside',marker:{color:'#168278'},hovertemplate:'%{x}<br>%{customdata[0]} electas / %{customdata[1]} candidaturas · %{y:.1f}%<extra></extra>'},{type:'bar',name:'No electa',x:sexStats.map(r=>r.sexo),y:sexStats.map(r=>pct(r.no_electas,r.candidaturas)),customdata:sexStats.map(r=>[r.no_electas,r.candidaturas]),text:sexStats.map(r=>`${num(pct(r.no_electas,r.candidaturas),1)}% · N=${r.no_electas}`),textposition:'inside',marker:{color:'#b8a16d'}}],sexStats,{height:350,yTitle:'Porcentaje dentro de cada sexo (%)',layout:{barmode:'stack',yaxis:{range:[0,100]}},note:'Este gráfico responde a la pregunta “de las candidaturas de cada sexo, ¿qué porcentaje resultó electo?”. Cada columna suma 100%.'});table(sexStats,['sexo','candidaturas','electas','no_electas','tasa'],'Tasa de elección por sexo · numeradores y denominadores');}}
 else if(pop==='Suplencia legislativa')note('Las suplencias se muestran como composición documental. Esta base no las trata como un outcome comparable de elección individual, por lo que no se calcula una “tasa de éxito” de suplencias.');
 table(base,base.length?Object.keys(base[0]).filter(k=>['anio','nombre','sexo','partido','provincia','tipo','cargo','electa','orden'].includes(k)):['anio','nombre'],'Registros de la población seleccionada');
};

// Fórmulas presidenciales 1.7: distingue candidatura y resultado electo y muestra nombres.
views.formulas=()=>{
 title('Fórmulas presidenciales','Candidaturas a Presidencia y vicepresidencias, con el outcome electo/no electo explícito.');
 const cargo=local.fxcargo||'Presidencia';controls([['fxcargo','Cargo',['Presidencia','Primera Vicepresidencia','Segunda Vicepresidencia'],cargo]]);
 const formulaIds=new Map((D.resultados_candidaturas||[]).filter(r=>r.cargo!=='Diputación').map(r=>[r.id_evento,r.id_persona]));
 let rows=period(D.formulas,false).filter(r=>r.cargo===cargo).map(r=>({...r,id_persona:formulaIds.get(r.id_evento)||null})),parties=['Todos',...uniq(rows.map(r=>r.partido)).sort()],party=parties.includes(local.fxparty)?local.fxparty:'Todos';controls([['fxparty','Partido',parties,party]]);rows=rows.filter(r=>party==='Todos'||r.partido===party);
 const elect=rows.filter(r=>r.electa),women=rows.filter(r=>r.sexo==='Mujer'),men=rows.filter(r=>r.sexo==='Hombre');
 kpis([['Candidaturas',num(rows.length,0),cargo],['Resultados electos',atlas17Ratio(elect.length,rows.length),'Una fórmula ganadora por elección para el cargo'],['Mujeres candidatas',atlas17Ratio(women.length,women.length+men.length),'Entre candidaturas con sexo Mujer/Hombre'],['Mujeres electas',atlas17Ratio(elect.filter(r=>r.sexo==='Mujer').length,elect.length),'Entre resultados electos del cargo']]);
 const ys=yearsVisible(),grouped=ys.flatMap(y=>['Mujer','Hombre'].map(sexo=>{const g=rows.filter(r=>r.anio===y),den=g.filter(r=>['Mujer','Hombre'].includes(r.sexo)).length;return {anio:y,sexo,candidaturas:g.filter(r=>r.sexo===sexo).length,porcentaje:pct(g.filter(r=>r.sexo===sexo).length,den)}}));
 const vis=ys.filter(y=>rows.some(r=>r.anio===y));if(vis.length)plot('Composición por sexo · '+cargo,['Mujer','Hombre'].map(s=>({type:'bar',name:s,x:vis,y:vis.map(y=>grouped.find(r=>r.anio===y&&r.sexo===s)?.porcentaje??0),customdata:vis.map(y=>grouped.find(r=>r.anio===y&&r.sexo===s)?.candidaturas??0),marker:{color:sexColors[s]},text:vis.map(y=>{const z=grouped.find(r=>r.anio===y&&r.sexo===s);return `${num(z?.porcentaje??0,1)}% · N=${z?.candidaturas??0}`}),textposition:'inside',hovertemplate:'%{x}<br>'+s+': %{customdata} candidaturas · %{y:.1f}%<extra></extra>'})),grouped,{height:400,yTitle:'Composición (%)',layout:{barmode:'stack',yaxis:{range:[0,100]}},note:'Cada elección suma 100% entre Mujer y Hombre para el cargo seleccionado.'});
 const sexStats=atlas17SexSuccess(rows);if(sexStats.length)plot('Tasa de elección por sexo · '+cargo,[{type:'bar',x:sexStats.map(r=>r.sexo),y:sexStats.map(r=>r.tasa),customdata:sexStats.map(r=>[r.electas,r.candidaturas]),marker:{color:sexStats.map(r=>sexColors[r.sexo])},text:sexStats.map(r=>`${num(r.tasa,1)}% · ${r.electas}/${r.candidaturas}`),textposition:'outside',hovertemplate:'%{x}<br>%{customdata[0]} electas / %{customdata[1]} candidaturas<br>%{y:.1f}%<extra></extra>'}],sexStats,{height:330,yTitle:'Candidaturas electas / candidaturas (%)',note:'El denominador es el total de candidaturas del mismo sexo y cargo dentro del periodo y partido seleccionados.'});
 add('<section class="card"><h3>Personas electas en el cargo</h3><div class="person-result-grid">'+elect.map(r=>`<div class="person-result">${atlasPersonButton(r)}${atlasResultBadge(true,'Electa')}<span class="mini">${r.anio} · ${esc(labelText(r.partido))}</span></div>`).join('')+'</div></section>');
 table(rows,['anio','nombre','sexo','partido','cargo','electa','formula','orden','id_evento','id_persona'],'Todas las candidaturas y su resultado');
};

// Texto más explícito para la brecha presidencial-legislativa.
const atlas17DualidadBase=views.dualidad;
views.dualidad=()=>{atlas17DualidadBase();add('<div class="clarity-box"><b>Cómo leer el signo:</b> brecha = porcentaje presidencial − porcentaje legislativo. <b>Positiva:</b> el partido obtuvo mayor porcentaje para Presidencia. <b>Negativa:</b> obtuvo mayor porcentaje para diputaciones. No representa personas individuales que hayan dividido su voto.</div>');};

// Panorama 1.8: añade recurrencia y renovación de candidaturas sin reemplazar los módulos especializados.
const atlas18PanoramaBase=views.panorama;
views.panorama=()=>{atlas18PanoramaBase();
 add('<div class="atlas17-subhead">Renovación y recurrencia nacional de candidaturas</div>');
 const ev=(D.resultados_candidaturas||[]).filter(r=>r.anio>=state.from&&r.anio<=state.to),ys=yearsVisible();
 const renewal=ys.map(anio=>{const yr=ev.filter(r=>r.anio===anio),people=group(yr,'id_persona').map(([id,g])=>g[0]),recurrent=people.filter(r=>r.numero_eleccion_documentada>1).length;return {anio,personas:people.length,nuevas:people.length-recurrent,recurrentes:recurrent,recurrentes_pct:pct(recurrent,people.length),candidaturas:yr.length,electas:yr.filter(r=>r.electa).length}});
 plot('Personas candidatas nuevas y recurrentes por elección',[{type:'bar',name:'Primera aparición documentada',x:renewal.map(r=>r.anio),y:renewal.map(r=>r.nuevas),marker:{color:'#b8a16d'}},{type:'bar',name:'Ya habían competido antes',x:renewal.map(r=>r.anio),y:renewal.map(r=>r.recurrentes),marker:{color:'#168278'}}],renewal,{height:430,yTitle:'Personas nominales distintas',layout:{barmode:'stack'},note:'Cada persona se cuenta una vez por elección. “Ya habían competido antes” significa que registra una candidatura en un año electoral anterior dentro del corpus.'});
 plot('Peso de candidaturas recurrentes en cada elección',[{type:'scatter',mode:'lines+markers+text',x:renewal.map(r=>r.anio),y:renewal.map(r=>r.recurrentes_pct),customdata:renewal.map(r=>[r.recurrentes,r.personas]),text:renewal.map(r=>local.values==='No'?'':`N=${r.recurrentes}`),textposition:'top center',name:'Personas recurrentes',line:{color:colors[0],width:3},marker:{size:8,color:colors[0]},hovertemplate:'%{x}<br>%{y:.1f}% recurrentes<br>N=%{customdata[0]} de %{customdata[1]} personas<extra></extra>'}],renewal,{height:380,yTitle:'Personas recurrentes (%)',note:'Porcentaje de las personas candidatas de cada elección que ya habían aparecido en un año electoral anterior del corpus. La etiqueta N muestra cuántas personas recurrentes sustentan cada porcentaje.'});
 const nationalPeople=(D.resultados_personas||[]).filter(p=>{const pe=atlas18PersonEvents(p.id_persona);return pe.some(r=>r.anio>=state.from&&r.anio<=state.to)}),repeat=nationalPeople.filter(p=>p.elecciones_distintas>1),ever=nationalPeople.filter(p=>p.alguna_vez_electa);
 kpis([['Personas distintas en el periodo',num(nationalPeople.length,0),'Identidades nominales con al menos una candidatura'],['Volvieron a competir en otro año electoral',atlas17Ratio(repeat.length,nationalPeople.length),'Carrera completa observada en el corpus'],['Alguna vez resultaron electas',atlas17Ratio(ever.length,nationalPeople.length),'Carrera completa observada'],['Candidaturas registradas',num(ev.length,0),'Presidencia, vicepresidencias y diputaciones']]);
 table(renewal,['anio','personas','nuevas','recurrentes','recurrentes_pct','candidaturas','electas'],'Renovación y recurrencia por elección');
};

// Versión visible en metadatos de la aplicación.
if(D.meta)D.meta.version='1.9';
