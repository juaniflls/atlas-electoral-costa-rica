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
 const personStatus=[{resultado:'Alguna candidatura electa',personas:personWins.length},{resultado:'Sin elección en la selección',personas:personLoss.length}];
 plot('Outcome a nivel de personas',[{type:'bar',orientation:'h',x:personStatus.map(r=>r.personas),y:personStatus.map(r=>r.resultado),text:personStatus.map(r=>r.personas),textposition:'outside',marker:{color:['#168278','#b8a16d']}}],personStatus,{height:300,xTitle:'Personas nominales',note:'Cada persona aparece una vez según exista o no al menos una candidatura electa dentro de los filtros actuales.'});
 const rateRows=atlasOutcomeBars(rows);plot('Tasa de elección por experiencia y movilidad',[{type:'bar',orientation:'h',x:rateRows.map(r=>r.porcentaje),y:rateRows.map(r=>r.grupo),customdata:rateRows.map(r=>[r.electas,r.candidaturas]),text:rateRows.map(r=>`${num(r.porcentaje,1)}% · ${r.electas}/${r.candidaturas}`),textposition:'outside',marker:{color:rateRows.map(r=>r.grupo.includes('cambia')?'#637cac':'#168278')},hovertemplate:'%{y}<br>%{x:.1f} % · %{customdata[0]} / %{customdata[1]} candidaturas<extra></extra>'}],rateRows,{height:430,xTitle:'Candidaturas electas / candidaturas del grupo (%)',note:'Cada grupo usa su propio denominador. Cambio de partido o provincia describe una asociación observada con el outcome, no un efecto causal.'});
 table(rateRows,['grupo','candidaturas','electas','no_electas','porcentaje','criterio'],'Numeradores y denominadores de las tasas');
 const byYear=group(rows,'anio').map(([anio,g])=>({anio,candidaturas:g.length,electas:g.filter(r=>r.electa).length,no_electas:g.filter(r=>!r.electa).length,tasa:pct(g.filter(r=>r.electa).length,g.length)})).sort((a,b)=>a.anio-b.anio);
 plot('Outcome de candidaturas por elección',[{type:'bar',name:'Electas',x:byYear.map(r=>r.anio),y:byYear.map(r=>r.electas),marker:{color:'#168278'}},{type:'bar',name:'No electas',x:byYear.map(r=>r.anio),y:byYear.map(r=>r.no_electas),marker:{color:'#b8a16d'}}],byYear,{yTitle:'Candidaturas',layout:{barmode:'stack'},note:'Conteo de eventos. La tabla conserva también la tasa porcentual de cada elección.'});
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
 if(edges.length){const left=uniq(edges.map(r=>r.origen)),right=uniq(edges.map(r=>r.destino));plot('Flujos auditables entre una participación y la siguiente',[{type:'sankey',orientation:'h',arrangement:'snap',node:{label:[...left.map(x=>'Origen · '+x),...right.map(x=>'Destino · '+x)],pad:28,thickness:19},link:{source:edges.map(r=>left.indexOf(r.origen)),target:edges.map(r=>left.length+right.indexOf(r.destino)),value:edges.map(r=>r.transiciones),customdata:edges.map(r=>r.recorrido),hovertemplate:'%{customdata}<br>%{value} transiciones<extra></extra>'}}],edges,{height:Math.max(360,Math.max(left.length,right.length)*42+160),note:'Grosor = transiciones entre participaciones consecutivas en elecciones distintas. Cambie la dimensión para ver outcome, cargos o movilidad. El selector y el clic permiten inspeccionar las personas.',onClick:evt=>{const value=evt.points?.[0]?.customdata;if(value&&edges.some(r=>r.recorrido===value)){local.outflow=value;render()}}});
  table(edges,['recorrido','transiciones','personas'],'Resumen de flujos visibles');
  const selectedRows=described.filter(r=>sel==='Todos'||`${r.origen} → ${r.destino}`===sel);
  add('<section class="card"><h3>Personas del flujo seleccionado</h3><div class="person-result-grid">'+atlasUniquePersonRows(selectedRows).slice(0,60).map(r=>`<div class="person-result">${atlasPersonButton(r)}${atlasResultBadge(r.electa_destino,r.resultado_destino+' después')}<span class="mini">${r.anio_origen} ${esc(r.cargo_origen)} → ${r.anio} ${esc(r.cargo_destino)}</span></div>`).join('')+'</div></section>');
  table(selectedRows,['nombre','anio_origen','anio','cargo_origen','cargo_destino','resultado_origen','resultado_destino','partido_origen','partido_destino','provincia_origen','provincia_destino','cambia_partido','cambia_provincia','id_origen','id_destino','id_persona'],'Filas que sustentan el flujo seleccionado');
 }else note('No hay transiciones que cumplan los filtros actuales.');

 add('<div class="extension-heading">PUENTES ENTRE CARGOS · NO SOLO TRANSICIONES CONSECUTIVAS</div>');
 const roleOpts=['Diputación','Presidencia','Primera Vicepresidencia','Segunda Vicepresidencia'],bFrom=local.bridgeFrom||'Diputación',bTo=local.bridgeTo||'Presidencia',bFromResult=local.bridgeFromResult||'Todos',bToResult=local.bridgeToResult||'Todos';
 controls([['bridgeFrom','Cargo previo',roleOpts,bFrom],['bridgeFromResult','Outcome previo',['Todos','Electa','No electa'],bFromResult],['bridgeTo','Cargo posterior',roleOpts,bTo],['bridgeToResult','Outcome posterior',['Todos','Electa','No electa'],bToResult]]);
 let bridges=(D.puentes_cargos||[]).filter(r=>r.anio>=state.from&&r.anio<=state.to&&r.cargo_origen===bFrom&&r.cargo_destino===bTo&&(bFromResult==='Todos'||r.resultado_origen===bFromResult)&&(bToResult==='Todos'||r.resultado_destino===bToResult));
 if(provinciaComparable&&state.province!=='Nacional')bridges=bridges.filter(r=>r.provincia_origen===state.province||r.provincia_destino===state.province);
 bridges=bridges.filter(r=>(bridgeParty==='Todos'||(r.cambia_partido?'Cambió partido':'Mantuvo partido')===bridgeParty)&&(bridgeProvince==='Todos'||(r.provincia_origen==='Nacional'||r.provincia_destino==='Nacional'?'No comparable':r.cambia_provincia?'Cambió provincia':'Mantuvo provincia')===bridgeProvince));
 const bridgePeople=atlasUniquePersonRows(bridges),bridgeEdges=group(bridges,r=>r.resultado_origen+' → '+r.resultado_destino).map(([recorrido,g])=>({recorrido,origen:g[0].resultado_origen,destino:g[0].resultado_destino,pares:g.length,personas:uniq(g.map(r=>r.id_persona)).length}));
 kpis([['Personas con el puente',bridgePeople.length,`${bFrom} → ${bTo}`],['Pares documentados',bridges.length,'Una persona puede aportar varios pares de candidaturas'],['Electas en destino',atlasCount(bridgePeople.filter(p=>bridges.some(r=>r.id_persona===p.id_persona&&r.electa_destino)).length,bridgePeople.length),'Personas con al menos un outcome electo en el cargo posterior'],['Cambio de partido',atlasCount(atlasUniquePersonRows(bridges.filter(r=>r.cambia_partido)).length,bridgePeople.length),'Personas con al menos un par entre partidos distintos']]);
 if(bridgeEdges.length){const left=uniq(bridgeEdges.map(r=>r.origen)),right=uniq(bridgeEdges.map(r=>r.destino));plot(`${bFrom} → ${bTo}: outcome antes y después`,[{type:'sankey',node:{label:[...left.map(x=>`${bFrom} · ${x}`),...right.map(x=>`${bTo} · ${x}`)],pad:30,thickness:22},link:{source:bridgeEdges.map(r=>left.indexOf(r.origen)),target:bridgeEdges.map(r=>left.length+right.indexOf(r.destino)),value:bridgeEdges.map(r=>r.personas),customdata:bridgeEdges.map(r=>r.recorrido),hovertemplate:'%{customdata}<br>%{value} personas nominales<extra></extra>'}}],bridgeEdges,{height:330,note:'Este puente busca cualquier candidatura anterior del cargo de origen y cualquier candidatura posterior del cargo de destino. Por eso no se limita a participaciones consecutivas.'});}
 add('<section class="card"><h3>Quiénes forman este puente de carrera</h3><div class="person-result-grid">'+bridgePeople.slice(0,80).map(r=>`<div class="person-result">${atlasPersonButton(r)}<span class="mini">${esc(bFrom)} → ${esc(bTo)}</span></div>`).join('')+'</div></section>');
 table(bridges,['nombre','anio_origen','anio','cargo_origen','resultado_origen','cargo_destino','resultado_destino','partido_origen','partido_destino','provincia_origen','provincia_destino','cambia_partido','cambia_provincia','anos_entre','id_persona'],'Pares de candidaturas que sustentan el puente entre cargos');

 add('<div class="extension-heading">DE DÓNDE VIENEN QUIENES RESULTARON ELECTOS</div>');
 const anteCargo=local.anteCargo||'Presidencia';controls([['anteCargo','Cargo electo a explicar',roleOpts,anteCargo]]);
 let antecedents=(D.antecedentes_cargos_electos||[]).filter(r=>r.cargo===anteCargo&&r.anio>=state.from&&r.anio<=state.to);if(state.province!=='Nacional'&&anteCargo==='Diputación')antecedents=antecedents.filter(r=>r.provincia===state.province);
 const anteGroups=group(antecedents,'antecedente').map(([antecedente,g])=>({antecedente,casos:g.length,personas:uniq(g.map(r=>r.id_persona)).length,porcentaje:pct(g.length,antecedents.length)})).sort((a,b)=>b.casos-a.casos);
 let anteSel=(local.anteCategory&&anteGroups.some(r=>r.antecedente===local.anteCategory))?local.anteCategory:'Todos';local.anteCategory=anteSel;controls([['anteCategory','Antecedente para inspeccionar',['Todos',...anteGroups.map(r=>r.antecedente)],anteSel]]);
 const priorDeputy=antecedents.filter(r=>r.diputacion_electa_previa),priorPresCand=antecedents.filter(r=>r.presidencia_candidata_previa);
 kpis([['Resultados electos',antecedents.length,`${anteCargo} dentro del periodo`],['Con elección previa',atlasCount(antecedents.filter(r=>r.antecedente==='Elección previa observada').length,antecedents.length),'En cualquier cargo previo del corpus'],['Con diputación electa previa',atlasCount(priorDeputy.length,antecedents.length),'Antes del cargo electo seleccionado'],['Con candidatura presidencial previa',atlasCount(priorPresCand.length,antecedents.length),'Antes del cargo electo seleccionado']]);
 if(anteGroups.length)plot(`Antecedentes antes de resultar electo en ${anteCargo}`,[{type:'bar',orientation:'h',x:anteGroups.map(r=>r.porcentaje),y:anteGroups.map(r=>r.antecedente),customdata:anteGroups.map(r=>r.casos),text:anteGroups.map(r=>`${num(r.porcentaje,1)}% · N=${r.casos}`),textposition:'outside',marker:{color:['#168278','#637cac','#b8a16d']}}],anteGroups,{height:330,xTitle:'Porcentaje de resultados electos (%)',note:'“Sin candidatura previa observada” significa que no existe una candidatura anterior en el corpus 1953–2026; no afirma ausencia de actividad política fuera de estas bases.'});
 const anteRows=antecedents.filter(r=>anteSel==='Todos'||r.antecedente===anteSel);
 add('<section class="card"><h3>Personas en el antecedente seleccionado</h3><div class="person-result-grid">'+anteRows.slice(0,80).map(r=>`<div class="person-result">${atlasPersonButton(r)}<span class="mini">${r.anio} · ${esc(r.cargo)} · ${esc(r.antecedente)}</span></div>`).join('')+'</div></section>');
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
// General bridge summary: stage outcomes are based on the actual selected ordered pairs.
// When either role is Todos, do not query an imaginary role named Todos.
function atlas20AllRoleBridgePeople(rows,fromRole,toRole){
 return group(rows,'id_persona').map(([pid,g0])=>{
  const g=g0.slice().sort((a,b)=>a.anio_origen-b.anio_origen||a.anio-b.anio);
  return {id_persona:pid,nombre:g[g.length-1].nombre,pares:g,
   destino_candidaturas:g.length,destino_alguna_vez_electa:g.some(r=>r.resultado_destino==='Electa'),
   destino_primera_eleccion:(g.filter(r=>r.resultado_destino==='Electa').map(r=>r.anio).sort((a,b)=>a-b)[0]||null),
   origen_alguna_electa:g.some(r=>r.resultado_origen==='Electa'),cambio_partido:g.some(r=>r.cambia_partido),
   fromRole:fromRole==='Todos'?'cualquier cargo':fromRole,
   toRole:toRole==='Todos'?'algún cargo posterior':toRole};
 });
}
function atlas20StageDescription(role,outcome,stage){
 const subject=role==='Todos'?'cualquier cargo':role==='Diputación'?'diputación':role==='Presidencia'?'presidencia':role.toLowerCase();
 const result=outcome==='Todos'?'(electa o no electa)':outcome==='Electa'?'electa':'no electa';
 return `${stage}: ${subject} ${result}`;
}
function atlas20Context(from,fromResult,to,toResult,party,province){
 const filters=[party==='Todos'?'Partido: cualquier continuidad':`Partido: ${party}`,
  province==='Todos'?'Provincia: cualquier movilidad':`Provincia: ${province}`];
 return `${filters.join(' · ')} · ${state.province} · ${state.from}–${state.to}`;
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
 const ids=new Set(rows.map(r=>r.id_persona)), origins=new Set(rows.map(r=>r.id_evento));let transitions=(D.transiciones_resultados||[]).filter(r=>r.anio>=state.from&&r.anio<=state.to&&ids.has(r.id_persona)&&origins.has(r.id_origen));
 if(state.province!=='Nacional')transitions=transitions.filter(r=>r.provincia_origen===state.province||r.provincia_destino===state.province);
 const flowMode=local.oflowdim||'Resultado de candidaturas';
 const flowArena=local.oflowarena||'Todas las candidaturas';
 const flowOriginOutcome=local.ofloworiginoutcome||'Todos';
 const flowArenaOptions=['Todas las candidaturas','Solo diputaciones','Solo Presidencia y Vicepresidencias'];
 controls([['oflowarena','Población de los flujos',flowArenaOptions,flowArena],['ofloworiginoutcome','Resultado de candidatura de origen',['Todos','Electa','No electa'],flowOriginOutcome],['oflowdim','Qué comparar entre una elección y la siguiente',['Resultado de candidaturas','Cargo + resultado','Cambio de cargo','Cambio de partido + resultado','Cambio de provincia + resultado'],flowMode]]);
 const isDip=c=>c==='Diputación';
 // Los movimientos entre arenas se preservan exclusivamente en la vista Todas.
 let flowRows=transitions.filter(r=>(flowOriginOutcome==='Todos'||r.resultado_origen===flowOriginOutcome)&&(flowArena==='Todas las candidaturas'||(flowArena==='Solo diputaciones'?(isDip(r.cargo_origen)&&isDip(r.cargo_destino)):(!isDip(r.cargo_origen)&&!isDip(r.cargo_destino)))));if(flowMode==='Cambio de provincia + resultado')flowRows=flowRows.filter(r=>r.provincia_origen!=='Nacional'&&r.provincia_destino!=='Nacional');
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
 if(edges.length){const left=uniq(edges.map(r=>r.origen)),right=uniq(edges.map(r=>r.destino));plot(`Flujos auditables entre una elección y la siguiente · ${flowArena}`,[{type:'sankey',orientation:'h',arrangement:'snap',node:{label:[...left,...right],pad:28,thickness:19},link:{source:edges.map(r=>left.indexOf(r.origen)),target:edges.map(r=>left.length+right.indexOf(r.destino)),value:edges.map(r=>r.personas),customdata:edges.map(r=>r.recorrido),hovertemplate:'%{customdata}<br>%{value} personas<extra></extra>'}}],edges,{height:Math.max(360,Math.max(left.length,right.length)*42+160),subtitle:`Población: ${flowArena} · Origen: ${local.ocargo||'Todos los cargos'} (${flowOriginOutcome}) · Partido: ${labelText(local.oparty||'Todos')} · Sexo: ${local.osex||'Todos'} · Destino: siguiente elección distinta · ${state.from}–${state.to}`,note:'Grosor = personas nominales únicas por flujo. La tabla conserva también el número de pares de candidaturas. Las vistas por arena exigen que origen y destino sean de esa arena; los cruces entre arenas quedan en Todas. El selector actualiza los nombres que aparecen debajo.',onClick:evt=>{const value=evt.points?.[0]?.customdata;if(value&&edges.some(r=>r.recorrido===value)){local.outflow=value;render()}}});
  const selectedRows=described.filter(r=>sel==='Todos'||`${r.origen} → ${r.destino}`===sel);
  const flowPack0=atlas18FlowCards(selectedRows,0,48),flowPages=atlas18PageOptions(flowPack0.people.length,48),flowPage=Math.min(+(local.outflowpage||0),flowPages.length-1);if(flowPages.length>1)controls([['outflowpage',`Página de personas · ${num(flowPack0.people.length,0)} personas`,flowPages,flowPage]]);const flowPack=atlas18FlowCards(selectedRows,flowPage,48);
  add(`<div class="selected-detail"><span class="mini">Población: ${esc(flowArena)} · Origen: ${esc(local.ocargo||'Todos los cargos')} (${esc(flowOriginOutcome)}) · Sexo: ${esc(local.osex||'Todos')}</span><br><b>Diagrama: ${esc(flowMode)}</b><br><strong>${num(flowPack.people.length,0)} personas distintas</strong><br>${num(selectedRows.length,0)} pares de candidaturas sustentan este flujo. ${esc(sel==='Todos'?'Se muestran todos los recorridos de este filtro.':sel)}</div>`);
  add('<section class="card"><h3>Personas del flujo seleccionado</h3><p class="chart-note">Las tarjetas muestran todas las combinaciones del flujo para cada persona en la página actual. Verde = electa; ámbar = no electa. La tabla inferior contiene todos los registros.</p>'+flowPack.html+'</section>');
  table(edges,['recorrido','personas','pares'],'Resumen de flujos');table(selectedRows,['nombre','anio_origen','anio','cargo_origen','resultado_origen','cargo_destino','resultado_destino','destino_electa_despues','partido_origen','partido_destino','provincia_origen','provincia_destino','cambia_partido','cambia_provincia','id_persona'],'Registros que sustentan el flujo seleccionado');
 }else note('No hay transiciones que cumplan los filtros actuales.');

 add('<div class="atlas17-subhead">Puentes entre cargos · cualquier candidatura anterior y posterior</div>');
 // Matriz general antes del detalle.
 let allBridges=(D.puentes_cargos||[]).filter(r=>r.anio>=state.from&&r.anio<=state.to);
 const matrixRows=[];for(const from of roleOpts)for(const to of roleOpts){const g=allBridges.filter(r=>r.cargo_origen===from&&r.cargo_destino===to),persons=uniq(g.map(r=>r.id_persona));if(persons.length)matrixRows.push({cargo_origen:from,cargo_destino:to,personas:persons.length,pares:g.length});}
 if(matrixRows.length){const z=roleOpts.map(from=>roleOpts.map(to=>matrixRows.find(r=>r.cargo_origen===from&&r.cargo_destino===to)?.personas??0));plot('Matriz de trayectorias entre cargos (incluye el mismo cargo en distintos años)',[{type:'heatmap',x:roleOpts,y:roleOpts,z,texttemplate:'%{z}',colorscale:[[0,'#f0f5f5'],[1,'#167d8d']],hovertemplate:'Origen: %{y}<br>Destino: %{x}<br>%{z} personas<extra></extra>'}],matrixRows,{height:470,xTitle:'Cargo posterior',yTitle:'Cargo anterior',note:'Cuenta personas nominales únicas con al menos una candidatura anterior en el cargo de fila y una candidatura posterior en el cargo de columna. Cero es ausencia observada en el corpus.'});}
 const bFrom=local.bridgeFrom||'Diputación',bTo=local.bridgeTo||'Presidencia',bFromResult=local.bridgeFromResult||'Todos',bToResult=local.bridgeToResult||'Todos';
 controls([['bridgeFrom','Cargo anterior',['Todos',...roleOpts],bFrom],['bridgeFromResult','Resultado de esa candidatura',['Todos','Electa','No electa'],bFromResult],['bridgeTo','Cargo posterior',['Todos',...roleOpts],bTo],['bridgeToResult','Resultado de esa candidatura',['Todos','Electa','No electa'],bToResult]]);
 const bridgeParty=local.bridgeParty||'Todos';
 const provinciaComparable=['Diputación','Todos'].includes(bFrom)&&['Diputación','Todos'].includes(bTo);
 if(!provinciaComparable)local.bridgeProvince='Todos';
 const bridgeProvince=provinciaComparable?(local.bridgeProvince||'Todos'):'Todos';
 controls([['bridgeParty','Continuidad de partido',['Todos','Mantuvo partido','Cambió partido'],bridgeParty],['bridgeProvince','Continuidad provincial',['Todos','Mantuvo provincia','Cambió provincia','No comparable'],bridgeProvince]]);
 if(!provinciaComparable){const pc=$('bridgeProvince');if(pc){pc.disabled=true;pc.title='Las candidaturas presidenciales y vicepresidenciales tienen ámbito nacional: la movilidad provincial no es comparable.';}
 note('El filtro de continuidad provincial se aplica a pares de candidaturas a diputación con provincias verificables. Los cargos nacionales no se atribuyen a provincias. La continuidad partidaria se estudia en todos los cargos.');}

 let bridges=allBridges.filter(r=>(bFrom==='Todos'||r.cargo_origen===bFrom)&&(bTo==='Todos'||r.cargo_destino===bTo)&&(bFromResult==='Todos'||r.resultado_origen===bFromResult)&&(bToResult==='Todos'||r.resultado_destino===bToResult));
 if(provinciaComparable&&state.province!=='Nacional')bridges=bridges.filter(r=>r.provincia_origen===state.province||r.provincia_destino===state.province);
 bridges=bridges.filter(r=>(bridgeParty==='Todos'||(r.cambia_partido?'Cambió partido':'Mantuvo partido')===bridgeParty)&&(bridgeProvince==='Todos'||(r.provincia_origen==='Nacional'||r.provincia_destino==='Nacional'?'No comparable':r.cambia_provincia?'Cambió provincia':'Mantuvo provincia')===bridgeProvince));
 // Cruce auditable EN EL EXPLORADOR ORIGINAL: outcome de candidatura posterior por movilidad.
 const mb=[['Mantiene partido',r=>!r.cambia_partido],['Cambia partido',r=>!!r.cambia_partido],['Mantiene provincia',r=>r.provincia_origen!=='Nacional'&&r.provincia_destino!=='Nacional'&&!r.cambia_provincia],['Cambia provincia',r=>r.provincia_origen!=='Nacional'&&r.provincia_destino!=='Nacional'&&!!r.cambia_provincia]];
 const mobil=mb.map(([grupo,fn])=>{const g=bridges.filter(fn),w=g.filter(r=>r.resultado_destino==='Electa').length;return {grupo,pares:g.length,electas:w,no_electas:g.length-w,porc_electas:g.length?100*w/g.length:null,porc_no_electas:g.length?100*(g.length-w)/g.length:null,personas:uniq(g.map(r=>r.id_persona)).length}}).filter(r=>r.pares);
 const bridgeCaption=atlas20Context(bFrom,bFromResult,bTo,bToResult,bridgeParty,bridgeProvince);
 const fromDesc=atlas20StageDescription(bFrom,bFromResult,'Anterior');
 const toDesc=atlas20StageDescription(bTo,bToResult,'Posterior');
 const bridgeTitle=(bFrom==='Todos'&&bTo==='Todos'&&bFromResult==='Todos'&&bToResult==='Todos')?
  'Resultados de candidaturas posteriores · todas las trayectorias':
  `Resultados posteriores · ${fromDesc} → ${toDesc}`;
 if(mobil.length){plot(bridgeTitle,[
  {type:'bar',name:'Electa',y:mobil.map(r=>r.grupo),x:mobil.map(r=>r.porc_electas),orientation:'h',marker:{color:'#168278'},text:mobil.map(r=>`${num(r.porc_electas,1)} % · ${r.electas}`),textposition:'inside'},
  {type:'bar',name:'No electa',y:mobil.map(r=>r.grupo),x:mobil.map(r=>r.porc_no_electas),orientation:'h',marker:{color:'#b98e60'},text:mobil.map(r=>`${num(r.porc_no_electas,1)} % · ${r.no_electas}`),textposition:'inside'}
 ],mobil,{height:380,subtitle:bridgeCaption,xTitle:'Porcentaje dentro de cada grupo (%)',layout:{barmode:'stack',xaxis:{range:[0,100]}},note:'Cada barra suma 100 % de los pares cronológicos de su grupo, no necesariamente personas únicas. Los cargos nacionales no tienen provincia electoral comparable; por ello solo se incluyen los pares con dos provincias conocidas en las barras provinciales.'});table(mobil,['grupo','pares','personas','electas','no_electas','porc_electas','porc_no_electas'],'Resultados de las rutas filtradas por movilidad');}
 const bridgePeople=(bFrom==='Todos'||bTo==='Todos')?atlas20AllRoleBridgePeople(bridges,bFrom,bTo):atlas17BridgePeople(bridges,bFrom,bTo),destWins=bridgePeople.filter(r=>r.destino_alguna_vez_electa),destNever=bridgePeople.filter(r=>!r.destino_alguna_vez_electa);
 kpis([['Personas con este puente',num(bridgePeople.length,0),`${bFrom==='Todos'?'Cualquier cargo':bFrom} → ${bTo==='Todos'?'cualquier cargo':bTo}`],['Alguna vez electas en el cargo posterior',atlas17Ratio(destWins.length,bridgePeople.length),`Resultados posteriores en ${bTo==='Todos'?'todos los cargos':bTo}`],['Nunca electas en el cargo posterior',atlas17Ratio(destNever.length,bridgePeople.length),`Aunque sí registran candidatura posterior en ${bTo}`],['Con cambio de partido',atlas17Ratio(bridgePeople.filter(r=>r.cambio_partido).length,bridgePeople.length),'En al menos uno de los pares observados']]);
 if(bridgePeople.length){const bridgeStatus=[{situacion:`Alguna vez electa en ${bTo==='Todos'?'un cargo posterior':bTo}`,personas:destWins.length},{situacion:`Nunca electa en ${bTo==='Todos'?'un cargo posterior':bTo}`,personas:destNever.length}];plot(`Trayectorias: resultados en ${bTo==='Todos'?'cargos posteriores':bTo}`,[{type:'bar',orientation:'h',x:bridgeStatus.map(r=>r.personas),y:bridgeStatus.map(r=>r.situacion),marker:{color:['#168278','#b8a16d']},text:bridgeStatus.map(r=>`${r.personas} · ${num(pct(r.personas,bridgePeople.length),1)}%`),textposition:'outside'}],bridgeStatus,{height:300,subtitle:bridgeCaption,xTitle:'Personas nominales',note:'Una persona que perdió una o más veces y luego ganó el cargo posterior cuenta como “Alguna vez electa”. Esto evita confundir una derrota intermedia con el resultado final de su trayectoria.'});
 add('<section class="card"><h3>Quiénes forman este puente de carrera</h3><p class="chart-note">Cada tarjeta muestra los años y el outcome exacto de las candidaturas que forman el puente. Abra el nombre para ver toda la trayectoria.</p>'+atlas17CareerCards(bridgePeople)+'</section>');
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
 add('<section class="card"><h3>Personas del antecedente seleccionado</h3><p class="chart-note">Cada tarjeta muestra la trayectoria documentada hasta el resultado electo analizado. Verde = electa; ámbar = no electa. Abra el nombre para ver toda la carrera.</p>'+antePack.html+'</section>');
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

async function atlasV5ExportNode(id, format='png', filename='Atlas_Exportacion'){
 // ATLAS_VECTOR_EXPORT_V5: elementos SVG nativos, sin HTML/CSS incrustado.
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

/* ATLAS_V5_COMPATIBLE_PATCH
 * Ampliación no destructiva de la última capa de la interfaz.
 * No depende del texto exacto de atlas_final.js; se puede aplicar a clones V2.0
 * o a copias parcialmente parcheadas. No sustituye la aplicación existente.
 */
(function atlasV5Enhance(){
  const stamp='ATLAS_V5_COMPATIBLE_PATCH';
  if (typeof views==='undefined' || typeof views.outcomes!=='function' || typeof plot!=='function') {
    throw new Error('El paquete no expone las funciones esperadas del Atlas. Compruebe que recursos/atlas_final.js corresponda a la versión 2.0.');
  }
  const milestones=[
    {year:1998,label:'Cuota 40 %',detail:'Ley 7653 (1996): cuota mínima de candidaturas'},
    {year:2002,label:'Puestos elegibles',detail:'TSE 1863-1999: aplicación en posiciones elegibles'},
    {year:2014,label:'Paridad vertical',detail:'Código Electoral de 2009: paridad y alternancia'},
    {year:2018,label:'Paridad horizontal',detail:'TSE 3603-E8-2016: encabezamientos provinciales'}
  ];
  // Amplía opciones del gráfico EXISTENTE sin modificar barras, datos ni resultados.
  const previousPlot=plot;
  plot=function(titleText,traces,rows,opts={}){
    if(titleText==='Composición por sexo a través del tiempo'){
      const years=new Set(traces.flatMap(t=>Array.isArray(t.x)?t.x.map(Number):[]));
      const active=['Diputación propietaria','Suplencia legislativa','Diputación electa'].includes(pop) ? milestones.filter(m=>years.has(m.year)) : [];
      const configured=Array.isArray(opts.layout?.shapes)&&opts.layout.shapes.some(s=>active.some(m=>Number(s.x0)===m.year && s.type==='line'));
      if(active.length && !configured){
        const shapes=active.map(m=>({type:'line',xref:'x',yref:'paper',x0:m.year,x1:m.year,y0:0,y1:1,line:{color:'#b28744',width:1.75,dash:'dot'}}));
        const annotations=active.map((m,i)=>({xref:'x',yref:'paper',x:m.year,y:i%2?1.18:1.09,text:`${m.year} · ${m.label}`,showarrow:false,textangle:-30,font:{size:10,color:'#755c32'},bgcolor:'rgba(255,250,241,.97)',bordercolor:'rgba(178,135,68,.36)',borderpad:3}));
        opts={...opts,height:Math.max(opts.height||420,515),layout:{...(opts.layout||{}),shapes:[...(opts.layout?.shapes||[]),...shapes],annotations:[...(opts.layout?.annotations||[]),...annotations],margin:{...(opts.layout?.margin||{}),t:145}},note:[opts.note,'Líneas doradas: hitos en la elección de aplicación (1998: cuota 40 %; 2002: puestos elegibles; 2014: paridad vertical; 2018: paridad horizontal). Normas: Ley 7653/1996; TSE 1863-1999; Código Electoral 2009; TSE 3603-E8-2016. La coincidencia temporal no demuestra causalidad.'].filter(Boolean).join(' ')};
      }
    }
    if(titleText==='Evolución del indicador territorial' && (local.rmetric||'indice_representacion')==='indice_representacion'){
      const hasLine=opts.layout?.shapes?.some(s=>s.yref==='y'&&Number(s.y0)===1&&Number(s.y1)===1);
      if(!hasLine){
        opts={...opts,layout:{...(opts.layout||{}),shapes:[...(opts.layout?.shapes||[]),{type:'line',xref:'paper',yref:'y',x0:0,x1:1,y0:1,y1:1,line:{color:'#b45353',width:2,dash:'dot'}}]},note:[opts.note,'La línea roja y = 1 expresa igualdad descriptiva entre peso en escaños y peso en padrón, no la regla constitucional de distribución por población.'].filter(Boolean).join(' ')};
      }
    }
    return previousPlot(titleText,traces,rows,opts);
  };

  // Los controles se montan sobre el bloque VISIBLE, cualquiera que sea su
  // implementación interna. Esto evita modificar versiones antiguas de views.outcomes.
  function ensurePersonExports(){
    const roots=Array.from(document.querySelectorAll('#content .card'));
    const wanted=new Map([
      ['Personas del flujo seleccionado','Atlas_ExitoElectoral_FlujoSeleccionado'],
      ['Quiénes forman este puente de carrera','Atlas_ExitoElectoral_PuenteCarrera'],
      ['Personas del antecedente seleccionado','Atlas_ExitoElectoral_AntecedenteSeleccionado'],
      ['Personas en el antecedente seleccionado','Atlas_ExitoElectoral_AntecedenteSeleccionado']
    ]);
    roots.forEach(root=>{
      const heading=root.querySelector('h3');
      if(!heading)return;
      const name=heading.textContent.trim();
      if(!wanted.has(name) || root.dataset.atlasV5Export==='yes')return;
      root.dataset.atlasV5Export='yes';
      if(!root.id)root.id='atlas_v5_people_'+Array.from(root.parentNode.children).indexOf(root)+'_'+Math.floor(Math.random()*100000);
      // Reemplazar solamente los controles exportadores del bloque de personas.
      // Los botones de las figuras Plotly y de las tablas no se modifican.
      let head=heading.closest('.card-head');
      if(!head){head=document.createElement('div');head.className='card-head';heading.parentNode.insertBefore(head,heading);head.appendChild(heading);}
      head.querySelectorAll('.exports').forEach(el=>el.remove());
      const tools=document.createElement('div');tools.className='exports';
      for(const kind of ['PNG','SVG']){
        const b=document.createElement('button');b.type='button';b.textContent=kind;
        b.title=`Descargar los nombres y trayectorias de esta página como ${kind}`;
        b.addEventListener('click',()=>atlasV5ExportNode(root.id,kind.toLowerCase(),wanted.get(name)));
        tools.appendChild(b);
      }
      head.appendChild(tools);
      const mini=root.querySelector('.card-head .mini');
      if(!mini){
        const scope=document.createElement('span');scope.className='mini';
        scope.textContent=`${state.from}–${state.to} · ${state.province} · cargo: ${local.ocargo||'Todos'} · partido: ${local.oparty||'Todos'} · sexo: ${local.osex||'Todos'}`;
        heading.insertAdjacentElement('afterend',scope);
      }
    });
  }

  function addTransitionRates(){
    const titles=Array.from(document.querySelectorAll('#content .card h3')).map(x=>x.textContent.trim());
    if(titles.includes('Tasa de elección posterior según continuidad de partido'))return;
    const rows=typeof atlasFilteredOutcomes==='function'?atlasFilteredOutcomes():[];
    const ids=new Set(rows.map(r=>r.id_persona));
    let transitions=(D.transiciones_resultados||[]).filter(r=>r.anio>=state.from&&r.anio<=state.to&&ids.has(r.id_persona));
    if(state.province!=='Nacional')transitions=transitions.filter(r=>r.provincia_origen===state.province||r.provincia_destino===state.province);
    add('<div class="extension-heading">LECTURA PORCENTUAL DE LOS FLUJOS · PARTIDO Y PROVINCIA</div>');
    add('<div class="clarity-box"><b>Complemento, no sustitución.</b> Los diagramas de flujo muestran personas y transiciones. Las dos tasas siguientes se calculan con el número de transiciones como denominador; una persona puede aportar varias. Son asociaciones descriptivas, no pruebas causales.</div>');
    const context=`${state.from}–${state.to} · ${state.province} · Cargo: ${local.ocargo||'Todos'} · Sexo: ${local.osex||'Todos'} · Partido: ${labelText(local.oparty||'Todos')}`;
    const one=(which,title)=>{
      const a=which==='provincia'?transitions.filter(r=>r.provincia_origen!=='Nacional'&&r.provincia_destino!=='Nacional'):transitions;
      const key=which==='provincia'?'cambia_provincia':'cambia_partido';
      const groups=[[`Mantiene ${which}`,false],[`Cambia ${which}`,true]];
      const stats=groups.map(([grupo,change])=>{
        const g=a.filter(r=>Boolean(r[key])===change),won=g.filter(r=>Boolean(r.electa_destino)).length;
        return {grupo,transiciones:g.length,electas_despues:won,no_electas_despues:g.length-won,tasa:g.length?100*won/g.length:null,personas:uniq(g.map(r=>r.id_persona)).length};
      });
      const validRows=stats.filter(x=>x.transiciones>0);
      if(!validRows.length){note(`No hay transiciones para ${title} con los filtros actuales.`);return;}
      plot(title,[{type:'bar',orientation:'h',x:validRows.map(r=>r.tasa),y:validRows.map(r=>r.grupo),text:validRows.map(r=>`${num(r.tasa,1)} % · ${r.electas_despues}/${r.transiciones}`),textposition:'outside',marker:{color:validRows.map(r=>r.grupo.startsWith('Mantiene')?'#168278':'#637cac')},customdata:validRows.map(r=>[r.electas_despues,r.transiciones,r.personas]),hovertemplate:'%{y}<br>Electas: %{customdata[0]}/%{customdata[1]} transiciones · %{customdata[2]} personas<br>%{x:.2f} %<extra></extra>'}],validRows,{height:310,xTitle:'Transiciones con elección posterior / transiciones del grupo (%)',subtitle:context,note:'N = transiciones registradas entre elecciones distintas. El gráfico complementa el Sankey; mantener el partido o la provincia no implica causalidad ni una recomendación individual.'});
      table(stats,['grupo','transiciones','electas_despues','no_electas_despues','tasa','personas'],`Auditoría · ${title}`);
    };
    one('partido','Tasa de elección posterior según continuidad de partido');
    one('provincia','Tasa de elección posterior según continuidad de provincia');
  }
  const previousOutcomes=views.outcomes;
  views.outcomes=function(...args){
    const result=previousOutcomes.apply(this,args);
    ensurePersonExports();
    // V19: el explorador consolidado ya muestra tasas y los pares que las sustentan.
    return result;
  };
})();



/* ATLAS_V6_READABILITY_PATCH
 * Mejoras de legibilidad para el artículo: género y éxito electoral.
 */
(function atlasV6ReadabilityPatch(){
  const stamp='ATLAS_V6_READABILITY_PATCH';
  if(typeof views==='undefined' || typeof plot!=='function') return;
  const milestones=[
    {year:1998,label:'1998 · Cuota 40 %',detail:'Ley 7653 (1996): cuota mínima de candidaturas'},
    {year:2002,label:'2002 · Puestos elegibles',detail:'TSE 1863-1999: aplicación en posiciones elegibles'},
    {year:2014,label:'2014 · Paridad vertical',detail:'Código Electoral de 2009: paridad y alternancia'},
    {year:2018,label:'2018 · Paridad horizontal',detail:'TSE 3603-E8-2016: encabezamientos provinciales'}
  ];
  const previousPlot=plot;
  plot=function(titleText,traces,rows,opts={}){
    let title=titleText;
    let nextTraces=Array.isArray(traces)?traces.map(t=>({...t})):traces;
    let nextOpts={...(opts||{})};
    const sexTitleMatch=String(titleText||'').startsWith('Composición por sexo');
    if(sexTitleMatch){
      const pop=(typeof local!=='undefined' && local.sexpop)?local.sexpop:'Diputación propietaria';
      const party=(typeof local!=='undefined' && local.sexparty)?labelText(local.sexparty):'Todos';
      if(titleText==='Composición por sexo a través del tiempo' && pop) title=`Composición por sexo a través del tiempo · ${pop}`;
      if(Array.isArray(nextTraces)){
        nextTraces=nextTraces.map(t=>({
          ...t,
          textfont:{size:10,color:'#ffffff'},
          insidetextanchor:'middle',
          cliponaxis:false
        }));
      }
      if(String(title).includes('a través del tiempo') || titleText==='Composición por sexo entre candidaturas electas' || titleText==='Composición por sexo entre candidaturas no electas'){
        const years=new Set((Array.isArray(nextTraces)?nextTraces:[]).flatMap(t=>Array.isArray(t.x)?t.x.map(Number):[]));
        const active=['Diputación propietaria','Suplencia legislativa','Diputación electa'].includes(pop) ? milestones.filter(m=>years.has(m.year)) : [];
        const shapes=active.map(m=>({type:'line',xref:'x',yref:'paper',x0:m.year,x1:m.year,y0:0,y1:1,line:{color:'#b28744',width:1.75,dash:'dot'}}));
        const yRows=[1.08,1.14,1.08,1.14];
        const annotations=active.map((m,i)=>({xref:'x',yref:'paper',x:m.year,y:yRows[i%yRows.length],text:m.label,showarrow:false,textangle:0,xanchor:'center',font:{size:10,color:'#755c32'},bgcolor:'rgba(255,250,241,.98)',bordercolor:'rgba(178,135,68,.38)',borderpad:3}));
        nextOpts={
          ...nextOpts,
          height:Math.max(nextOpts.height||420,560),
          subtitle:[nextOpts.subtitle, `${state.from}–${state.to} · ${state.province} · Población: ${pop||'No especificada'} · Partido: ${party}`].filter(Boolean).join(' · '),
          layout:{
            ...(nextOpts.layout||{}),
            barmode:'stack',
            yaxis:{...((nextOpts.layout||{}).yaxis||{}), range:[0,100]},
            shapes:[...(((nextOpts.layout||{}).shapes)||[]), ...shapes],
            annotations:[...(((nextOpts.layout||{}).annotations)||[]), ...annotations],
            margin:{...(((nextOpts.layout||{}).margin)||{}), t:170}
          },
          note:[nextOpts.note,active.length?'Líneas doradas: hitos de la normativa electoral relativos a candidaturas legislativas.':null].filter(Boolean).join(' ')
        };
      } else {
        nextOpts={...nextOpts, subtitle:[nextOpts.subtitle, `${state.from}–${state.to} · ${state.province} · Población: ${pop||'No especificada'} · Partido: ${party}`].filter(Boolean).join(' · ')};
      }
    }
    if(titleText==='Tasa de elección posterior según continuidad de partido'){
      title='Tasa de elección posterior según continuidad de partido · candidaturas posteriores';
      nextTraces=(Array.isArray(nextTraces)?nextTraces:[nextTraces]).map(t=>({...t,textposition:'outside',cliponaxis:false}));
      nextOpts={...nextOpts,xTitle:'Porcentaje de transiciones del grupo que terminan en una candidatura electa (%)',subtitle:[nextOpts.subtitle,'Lectura: de todas las transiciones observadas en cada grupo, ¿qué porcentaje terminó en una candidatura electa posterior?'].filter(Boolean).join(' · '),note:[nextOpts.note,'N del rótulo = candidaturas electas posteriores / transiciones observadas dentro del grupo.'].filter(Boolean).join(' '),height:340};
    }
    if(titleText==='Tasa de elección posterior según continuidad de provincia'){
      title='Tasa de elección posterior según continuidad de provincia · candidaturas posteriores';
      nextTraces=(Array.isArray(nextTraces)?nextTraces:[nextTraces]).map(t=>({...t,textposition:'outside',cliponaxis:false}));
      nextOpts={...nextOpts,xTitle:'Porcentaje de transiciones del grupo que terminan en una candidatura electa (%)',subtitle:[nextOpts.subtitle,'Lectura: de todas las transiciones observadas en cada grupo, ¿qué porcentaje terminó en una candidatura electa posterior?'].filter(Boolean).join(' · '),note:[nextOpts.note,'N del rótulo = candidaturas electas posteriores / transiciones observadas dentro del grupo.'].filter(Boolean).join(' '),height:340};
    }
    return previousPlot(title,nextTraces,rows,nextOpts);
  };

  const previousGenero=views.genero;
  views.genero=function(...args){
    local.sexpop=local.sexpop||'Diputación propietaria';
    const result=previousGenero.apply(this,args);
    const pop=local.sexpop||'Diputación propietaria';
    let base=[], outcomeApplicable=true;
    if(pop==='Diputación propietaria')base=period(D.candidaturas).filter(r=>r.tipo==='Propietaria');
    else if(pop==='Suplencia legislativa'){base=period(D.candidaturas).filter(r=>r.tipo==='Suplencia'); outcomeApplicable=false;}
    else if(pop==='Diputación electa'){base=period(D.electas); outcomeApplicable=false;}
    else base=period(D.formulas,false).filter(r=>r.cargo===pop);
    const parties=['Todos',...uniq(base.map(r=>r.partido).filter(Boolean)).sort()];
    const party=(parties.includes(local.sexparty)?local.sexparty:'Todos');
    base=base.filter(r=>party==='Todos'||r.partido===party);
    const makeComp=(rows,title,noteText)=>{
      const ys=yearsVisible();
      const comp=ys.flatMap(anio=>{const g=rows.filter(r=>r.anio===anio), den=g.filter(r=>['Mujer','Hombre'].includes(r.sexo)).length; return ['Mujer','Hombre'].map(sexo=>({anio,sexo,registros:g.filter(r=>r.sexo===sexo).length,total_con_sexo:den,porcentaje:pct(g.filter(r=>r.sexo===sexo).length,den)}));});
      const visible=ys.filter(y=>comp.some(r=>r.anio===y&&r.total_con_sexo>0));
      if(!visible.length){note(`No hay registros suficientes para “${title}” con los filtros actuales.`); return;}
      plot(title,['Mujer','Hombre'].map(sexo=>({type:'bar',name:sexo,x:visible,y:visible.map(y=>comp.find(r=>r.anio===y&&r.sexo===sexo)?.porcentaje??0),customdata:visible.map(y=>comp.find(r=>r.anio===y&&r.sexo===sexo)?.registros??0),marker:{color:sexColors[sexo]},text:visible.map(y=>{const z=comp.find(r=>r.anio===y&&r.sexo===sexo); return `${num(z?.porcentaje??0,1)}% · N=${z?.registros??0}`;}),hovertemplate:'%{x}<br>'+sexo+': %{customdata} registros · %{y:.1f}%<extra></extra>'})),comp,{height:420,yTitle:'Composición (%)',layout:{barmode:'stack',yaxis:{range:[0,100]}},note:noteText});
    };
    if(outcomeApplicable){
      add('<div class="atlas17-subhead">Lectura anual de electas y no electas por sexo</div>');
      makeComp(base.filter(r=>Boolean(r.electa)),'Composición por sexo entre candidaturas electas','Cada columna suma 100% entre Mujer y Hombre solo dentro de las candidaturas electas de la población seleccionada.');
      makeComp(base.filter(r=>!Boolean(r.electa)),'Composición por sexo entre candidaturas no electas','Cada columna suma 100% entre Mujer y Hombre solo dentro de las candidaturas no electas de la población seleccionada.');
    }
    return result;
  };
})();


/* ATLAS_V7_REPRESENTACION_HTML
   Este módulo transforma las mismas tablas oficiales embebidas en el HTML.
   No depende del notebook, de imágenes estáticas, de internet ni de un servidor.
   Las tres series son nacionales; los controles Desde, Hasta y Elección de
   detalle son efectivos. La clasificación por partido con escaños se refiere
   a obtener al menos una diputación en el conjunto del país en ese año.
*/
(function(){
  'use strict';
  const sColor='#c56c4f',rColor='#137d79',sColor2='#b58a45';
  const alias={'LIBERACION NACIONAL':'PLN','UNION NACIONAL':'UN','UNIFICACION NACIONAL':'PUN','UNIDAD':'UNIDAD','UNIDAD SOCIAL CRISTIANA':'PUSC','ACCION CIUDADANA':'PAC','PROGRESO SOCIAL DEMOCRATICO':'PPSD','PUEBLO SOBERANO':'PPSO'};
  const short=p=>alias[p]||String(p).slice(0,14);
  let _cache=null;
  function makeRecords(){
    if(_cache)return _cache;
    const votes=D.votos.filter(r=>r.provincia==='Nacional'&&r.arena==='Legislativa'&&Number(r.ronda)===1);
    const seats=D.escanos.filter(r=>r.provincia==='Nacional');
    const gov=D.presidencia_asamblea;
    const byVote=new Map(),bySeat=new Map(),byGov=new Map();
    const key=(year,party)=>year+'|'+party;
    votes.forEach(r=>{const k=key(r.anio,r.partido);if(byVote.has(k))throw Error('Votos duplicados: '+k);byVote.set(k,r)});
    seats.forEach(r=>{const k=key(r.anio,r.partido);if(bySeat.has(k))throw Error('Escaños duplicados: '+k);bySeat.set(k,r)});
    gov.forEach(r=>byGov.set(r.anio,r));
    const years=[...new Set(votes.map(r=>r.anio))].sort((a,b)=>a-b);
    const totals=[];const winners=[];const presidential=[];
    for(const year of years){
      const v= votes.filter(r=>r.anio===year);
      const total=v.reduce((s,r)=>s+Number(r.votos||0),0);
      const withSeats=v.reduce((s,r)=>s+(Number(bySeat.get(key(year,r.partido))?.escanos||0)>0?Number(r.votos||0):0),0);
      const withoutSeats=total-withSeats;
      const seatsYear=seats.filter(r=>r.anio===year);
      const chamber=seatsYear.reduce((s,r)=>s+Number(r.escanos||0),0);
      if(!total||!chamber)throw Error('Falta padrón válido o magnitud en '+year);
      const row={anio:year,votos_validos:total,votos_con_escanos:withSeats,votos_sin_escanos:withoutSeats,pct_con_escanos:100*withSeats/total,pct_sin_escanos:100*withoutSeats/total};
      totals.push(row);
      const leader=[...v].sort((a,b)=>Number(b.votos)-Number(a.votos)||a.partido.localeCompare(b.partido,'es'))[0];
      const leaderSeats=Number(bySeat.get(key(year,leader.partido))?.escanos||0);
      winners.push({anio:year,partido:leader.partido,abreviatura:short(leader.partido),votos:Number(leader.votos),votos_pct:100*leader.votos/total,escanos:leaderSeats,total_escanos:chamber,escanos_pct:100*leaderSeats/chamber,brecha_pp:100*leaderSeats/chamber-100*leader.votos/total});
      const g=byGov.get(year);
      if(!g)throw Error('No hay Presidencia electa para '+year);
      const gv=byVote.get(key(year,g.partido));
      if(!gv)throw Error('No hay voto legislativo del partido presidencial electo '+year+'/'+g.partido);
      const gs=Number(bySeat.get(key(year,g.partido))?.escanos||0);
      if(Math.abs(gs-Number(g.escanos))>.001)throw Error('Inconsistencia de bancada para '+year);
      presidential.push({anio:year,presidencia:g.nombre,partido:g.partido,abreviatura:short(g.partido),votos:Number(gv.votos),votos_pct:100*gv.votos/total,escanos:gs,total_escanos:chamber,escanos_pct:100*gs/chamber,brecha_pp:100*gs/chamber-100*gv.votos/total,partido_lider_legislativo:leader.partido,coincide_lider_legislativo:g.partido===leader.partido});
      const original=D.metricas.find(m=>m.anio===year&&m.provincia==='Nacional'&&m.arena==='Legislativa'&&m.ronda===1);
      if(!original||Math.abs(Number(original.validos)-total)>.001||Math.abs(Number(original.voto_sin_escanos_pct)-row.pct_sin_escanos)>1e-6)throw Error('La serie de votos sin escaño no coincide con la validación del Atlas para '+year);
    }
    _cache={totals,winners,presidential};return _cache;
  }
  function shown(rows){return rows.filter(r=>r.anio>=state.from&&r.anio<=state.to)}
  function tracesForShares(rows){
    // Una sola variable independiente: la cuota destinada a partidos sin diputaciones.
    // La cuota con diputaciones es su complemento 100 - cuota sin diputaciones.
    // Gráfico de tallos y puntos (lollipop), NO barras apiladas ni dos líneas redundantes.
    const xs=[],ys=[];
    rows.forEach(r=>{xs.push(r.anio,r.anio,null);ys.push(0,r.pct_sin_escanos,null)});
    return [
      {type:'scatter',mode:'lines',showlegend:false,hoverinfo:'skip',
       x:xs,y:ys,line:{color:'rgba(197,108,79,0.43)',width:2.4}},
      {type:'scatter',mode:'markers',showlegend:false,name:'Partidos sin diputaciones',
       x:rows.map(r=>r.anio),y:rows.map(r=>r.pct_sin_escanos),
       customdata:rows.map(r=>[r.pct_con_escanos]),
       marker:{color:sColor,size:12,symbol:'circle',line:{color:'#ffffff',width:1.5}},
       hovertemplate:'Elección %{x}<br><b>Sin diputaciones: %{y:.2f} %</b><br>Con diputaciones: %{customdata[0]:.2f} %<extra></extra>'}
    ];
  }
  function compareTraces(rows){
    const years=rows.map(r=>r.anio), parties=rows.map(r=>r.partido);
    return [
      {type:'bar',name:'Votos legislativos válidos (%)',x:years,y:rows.map(r=>r.votos_pct),customdata:parties,marker:{color:rColor},hovertemplate:'%{x} · %{customdata}<br>Votos legislativos: %{y:.2f}%<extra></extra>'},
      {type:'bar',name:'Escaños en la Asamblea (%)',x:years,y:rows.map(r=>r.escanos_pct),customdata:parties,marker:{color:sColor2},hovertemplate:'%{x} · %{customdata}<br>Escaños: %{y:.2f}%<extra></extra>'}
    ]
  }
  function integrity(){
    const {totals,winners,presidential}=makeRecords();
    if(totals.length!==19||winners.length!==19||presidential.length!==19)throw Error('La serie debe cubrir las 19 elecciones.');
    return true;
  }
  views.representacion_voto=function(){
    const {totals,winners,presidential}=makeRecords();
    const total=shown(totals),leaders=shown(winners),gov=shown(presidential);
    const focus=total.find(r=>r.anio===state.focus),flead=leaders.find(r=>r.anio===state.focus),fgov=gov.find(r=>r.anio===state.focus);
    title('Votos y escaños','Evolución de la proporción del voto válido obtenido por partidos con y sin diputaciones y comparación de votos y escaños de las principales fuerzas.');
    note('<b>Ámbito nacional.</b> Estas comparaciones corresponden a la Asamblea Legislativa completa. Los filtros <b>Desde, Hasta y Elección de detalle</b> funcionan. El selector de provincia no cambia esta vista, porque el criterio es conseguir al menos una diputación en el país. «Sin escaños» significa sin representación partidaria directa, no ausencia de representación jurídica del electorado.');
    if(!total.length){add('<div class="empty">Sin observaciones para este intervalo.</div>');return}
    const f=focus||total[total.length-1],l=flead||leaders[leaders.length-1],g=fgov||gov[gov.length-1];
    kpis([
      ['Voto sin escaños · '+f.anio,num(f.pct_sin_escanos,2)+' %','Porcentaje de los votos válidos'],
      ['Voto con escaños · '+f.anio,num(f.pct_con_escanos,2)+' %','Porcentaje de los votos válidos'],
      ['Líder legislativo · '+l.anio,num(l.escanos,0)+' / '+num(l.total_escanos,0),esc(labelText(l.partido))+' · diputaciones'],
      ['Partido presidencial · '+g.anio,num(g.escanos_pct,2)+' %',esc(labelText(g.partido))+' · bancada']
    ]);
    if(!focus)note('La elección de detalle está fuera del intervalo. Las tarjetas muestran la última elección del periodo.',true);
    const maxShare=Math.max(...total.map(r=>r.pct_sin_escanos));
    const topShare=Math.max(5,Math.ceil((maxShare+2)/5)*5);
    plot('Voto válido destinado a partidos sin diputaciones',tracesForShares(total),total,
      {height:485,subtitle:'Nacional · '+state.from+'–'+state.to,
       xTitle:'Elección',yTitle:'Porcentaje del voto válido (%)',
       layout:{yaxis:{range:[0,topShare],title:{text:'Porcentaje del voto válido (%)'},ticksuffix:' %',dtick:5},
               showlegend:false,hovermode:'closest',margin:{l:88,r:50,t:30,b:85}},
       note:'Cada punto indica la proporción de votos válidos destinados a partidos que no obtuvieron ninguna diputación. La parte restante (100 % menos ese valor) corresponde a partidos con diputaciones. Pase el cursor por los puntos para consultar ambas proporciones.'});
    table(total,['anio','pct_con_escanos','pct_sin_escanos'],'Evolución del voto válido por acceso a diputaciones (%)');
    note('El partido legislativo más votado no coincide necesariamente con el ganador de la Presidencia. Los porcentajes de escaños se calculan sobre el total de diputaciones de cada elección.');
    plot('Líder de votos legislativos · votos frente a escaños',compareTraces(leaders),leaders,{height:510,yTitle:'Porcentaje (%)',layout:{barmode:'group',yaxis:{range:[0,90],title:{text:'Porcentaje (%)'}}},note:'Pase el cursor sobre un año para identificar el partido. Comparación de porcentaje de sufragios válidos y de escaños del mismo partido.'});
    table(leaders,['anio','partido','votos','votos_pct','escanos','total_escanos','escanos_pct','brecha_pp'],'Líder legislativo · votos y representación parlamentaria');
    note('Para el partido presidencial electo se utiliza la candidatura ganadora definitiva, incluida la segunda ronda cuando corresponde. Se comparan sus votos legislativos y sus escaños, no sus votos presidenciales.');
    plot('Partido presidencial electo · voto legislativo y bancada',compareTraces(gov),gov,{height:510,yTitle:'Porcentaje (%)',layout:{barmode:'group',yaxis:{range:[0,90],title:{text:'Porcentaje (%)'}}},note:'El ganador de la Presidencia y el líder del voto legislativo pueden ser partidos diferentes; la tabla permite identificarlos.'});
    table(gov,['anio','presidencia','partido','votos','votos_pct','escanos','total_escanos','escanos_pct','brecha_pp','partido_lider_legislativo','coincide_lider_legislativo'],'Presidencia electa · partido, votos legislativos y bancada');
    add('<div class="notice">Fuente: Atlas Electoral de Costa Rica 1953–2026. Las series utilizan votos válidos legislativos, escaños y partido presidencial electo, con denominadores nacionales consistentes.</div>');
  };
  integrity();
  window.ATLAS_V7_REPRESENTACION_HTML_OK=true;
})();



















/* ATLAS_V10_PRESIDENCIA_LEGISLATIVA · 1953–2026
   Ampliaciones integradas a las pestañas existentes. Sin franjas históricas interpretativas.
   Autoría del proyecto: Juan Ignacio Garbanzo Fallas.
*/
(function(){
'use strict';
const AS=['Legislativa','Presidencial'];
const AV=['General','Legislativa','Presidencial'];
const cc={'Legislativa':'#137b78','Presidencial':'#b67e38'};
const yrs=()=>Y.filter(y=>y>=state.from&&y<=state.to);
const complete=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v));
const n=v=>Number(v);
const sorted=(a,k='anio')=>a.slice().sort((x,y)=>n(x[k])-n(y[k]));
const vChoice=id=>AV.includes(local[id])?local[id]:'General';
const sel=(id,label='Vista de resultados')=>{const v=vChoice(id);controls([[id,label,AV,v]]);return v};
const arenalist=v=>v==='General'?AS:[v];
const mf=(a,p='Nacional')=>(D.metricas||[]).filter(r=>r.arena===a&&n(r.ronda)===1&&r.provincia===p&&yrs().includes(n(r.anio)));
const val=(a,k)=>complete(a?.[k])?n(a[k]):null;
const labelsArena={Legislativa:'Asamblea Legislativa',Presidencial:'Presidencia'};
const aria=(view)=>view==='General'?'General_Presidencial_Legislativa':view;
const positive=(r)=>r&&n(r.escanos)>0;
const norm=x=>String(x??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
const slug=s=>String(s||'figura').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,92);
// Nombres inequívocos en PNG/SVG/CSV; no se altera la base de datos.
const plotOriginal10=plot;
plot=function(t,traces,rows,opts={}){
  const before=cid;
  if(t==='Abstencionismo legislativo nacional · 1953–2026')return;
  const out=plotOriginal10(t,traces,rows,opts);
  if(cid>before){
    const id='chart'+cid,child=$(id),a=child?.closest('article.card');
    const titleLow=String(t).toLowerCase();
    const inferred=titleLow.includes('presidencial')&&!titleLow.includes('legislativ')?'Presidencial':titleLow.includes('legislativ')&&!titleLow.includes('presidencial')?'Legislativa':'General';
    const v=opts.arenaVista||opts.arena||inferred;
    const base=`Atlas_${slug(state.tab)}_${slug(aria(v))}_${slug(t)}_${state.from}_${state.to}`;
    if(child)child.atlasFilename=base;
    if(a){const b=a.querySelectorAll('.exports button');if(b[2])b[2].onclick=()=>csv(chartRows[id]||[],base+'.csv');}
  }
  return out;
};
const exportOld=exportFigure;
exportFigure=async function(id,format){
 const node=$(id);if(!node?.data)return;
 const name=node.atlasFilename||`Atlas_${slug(state.tab)}_${state.from}_${state.to}`;
 const oldTitle=node.layout?.title,oldMargin=node.layout?.margin;
 try{await Plotly.relayout(node,{title:{text:node.atlasTitle+'<br><sup>'+node.atlasScope+'</sup>',font:{size:19},x:.04},margin:{...oldMargin,t:92}});
 await Plotly.downloadImage(node,{format,width:1600,height:Math.max(900,Math.round((node.clientHeight||430)*1.8)),scale:format==='png'?2:1,filename:name});}
 finally{await Plotly.relayout(node,{title:oldTitle||{},margin:oldMargin});}
};
function header(label){add(`<div class="atlas17-subhead">${esc(label)}</div>`)}
function plotTrend(key,titleText,view){
 const picked=arenalist(view),series=picked.map(a=>({a,rows:sorted(mf(a))}));
 const tr=series.map(({a,rows})=>({type:'scatter',mode:'lines+markers',name:labelsArena[a],x:rows.map(r=>n(r.anio)),y:rows.map(r=>val(r,key)),line:{color:cc[a],width:3,dash:a==='Presidencial'?'dash':'solid'},marker:{size:8,symbol:a==='Presidencial'?'diamond':'circle'},hovertemplate:`Elección %{x}<br>${labelsArena[a]}: %{y:.2f}<extra></extra>`}));
 const rows=series.flatMap(({a,rows})=>rows.map(r=>({...r,vista:a,valor:val(r,key)})));
 if(!rows.length)return;
 plot(titleText,tr,rows,{arenaVista:view,height:440,xTitle:'Elección',yTitle:metricLabels[key]||key,subtitle:`${view==='General'?'Comparación entre arenas':labelsArena[view]} · total nacional · ${state.from}–${state.to}`,layout:{xaxis:{type:'linear',tickmode:'array',tickvals:yrs(),tickangle:-50}},note:'Primera ronda presidencial y votación legislativa. Cada serie utiliza sus datos y denominadores propios; no se promedian las provincias.'});
}
function heatMetric(key,titleText,arena){
 const xx=yrs(),provs=P.slice(),series=mf(arena,'Nacional');
 const row=(D.metricas||[]).filter(r=>r.arena===arena&&n(r.ronda)===1&&P.includes(r.provincia)&&yrs().includes(n(r.anio)));
 const lookup=new Map(row.map(r=>[r.provincia+'|'+r.anio,r]));
 const z=provs.map(p=>xx.map(y=>val(lookup.get(p+'|'+y),key)));
 plot(titleText,[{type:'heatmap',x:xx.map(String),y:provs,z,colorscale:[[0,'#edf5f4'],[.5,'#6eb7ad'],[1,'#0b615d']],hoverongaps:false,xgap:2,ygap:2,texttemplate:local.values==='No'?undefined:'%{z:.1f}',textfont:{size:11},colorbar:{title:{text:key.endsWith('_pct')?'%':'Valor'},thickness:15},hovertemplate:'%{y} · %{x}<br>%{z:.2f}<extra></extra>'}],row,{arenaVista:arena,height:490,xTitle:'Elección',yTitle:'Provincia',subtitle:`${labelsArena[arena]} · siete provincias · ${state.from}–${state.to}`,layout:{xaxis:{type:'category',categoryorder:'array',categoryarray:xx.map(String),tickangle:-50},margin:{l:105,r:95,t:35,b:85}},note:'Los porcentajes proceden de los registros de cada provincia y elección. El total nacional se calcula por separado mediante sumas de numeradores y denominadores.'});
}
// Partidos sin curules: partido sin escaños legislativos en todo el país en ese año.
function votosPresNoCurul(){
 const electos=new Set((D.escanos||[]).filter(r=>r.provincia==='Nacional'&&positive(r)).map(r=>`${r.anio}|${r.partido}`));
 const votos=(D.votos||[]).filter(r=>r.arena==='Presidencial'&&n(r.ronda)===1&&r.provincia==='Nacional'&&yrs().includes(n(r.anio)));
 return yrs().map(y=>{const g=votos.filter(r=>n(r.anio)===y),total=g.reduce((a,r)=>a+n(r.votos||0),0),sin=g.filter(r=>!electos.has(y+'|'+r.partido));
 const votes=sin.reduce((a,r)=>a+n(r.votos||0),0);return{anio:y,partidos_sin_curul:sin.length,votos_sin_curul:votes,votos_validos_presidenciales:total,porcentaje:total?100*votes/total:null}});
}
function makeNoCurul(){const rows=votosPresNoCurul().filter(r=>complete(r.porcentaje));
 plot('Voto presidencial a partidos sin diputaciones electas · serie histórica',[{type:'scatter',mode:'lines+markers',x:rows.map(r=>r.anio),y:rows.map(r=>r.porcentaje),customdata:rows.map(r=>[r.partidos_sin_curul,r.votos_sin_curul]),marker:{color:'#bd8750',size:9},line:{color:'#bd8750',width:3},hovertemplate:'%{x}<br>%{y:.2f} % de los votos presidenciales<br>%{customdata[0]} partidos sin curul<br>%{customdata[1]} votos<extra></extra>'}],rows,{arenaVista:'Presidencial',height:425,xTitle:'Elección',yTitle:'Porcentaje de votos presidenciales (%)',layout:{xaxis:{tickmode:'array',tickvals:yrs(),tickangle:-50}},note:'Numerador: votos presidenciales de primera ronda obtenidos por organizaciones que no consiguieron ninguna diputación a escala nacional en la misma elección. Denominador: total de votos presidenciales válidos. No equivale a votos legislativos sin escaños.'});
 table(rows,['anio','partidos_sin_curul','votos_sin_curul','votos_validos_presidenciales','porcentaje'],'Detalle auditable · partidos presidenciales sin curules');
}
// Bastiones medidos por resultados; una victoria aislada no es evidencia de bastión.
function basAll(arena){
 const rows=(D.metricas||[]).filter(r=>r.arena===arena&&n(r.ronda)===1&&P.includes(r.provincia)&&Number.isFinite(n(r.anio))&&r.ganador);
 const m=new Map();for(const r of rows){const k=r.provincia+'|'+r.ganador;const a=m.get(k)||[];a.push(r);m.set(k,a)}
 return [...m].map(([k,g])=>{g.sort((a,b)=>n(a.anio)-n(b.anio));let streak=1,maxStreak=1;for(let i=1;i<g.length;i++){if(Y.indexOf(n(g[i].anio))===Y.indexOf(n(g[i-1].anio))+1)streak++;else streak=1;maxStreak=Math.max(maxStreak,streak)}
 const province=g[0].provincia,partido=g[0].ganador,obs=new Set(rows.filter(r=>r.provincia===province).map(r=>r.anio)).size;
 return {arena,provincia:province,partido,elecciones_ganadas:g.length,elecciones_observadas:obs,porcentaje_victorias:obs?100*g.length/obs:null,racha_maxima:maxStreak,primera_victoria:n(g[0].anio),ultima_victoria:n(g[g.length-1].anio),voto_medio_en_victorias:g.reduce((s,r)=>s+n(r.concentracion_1||0),0)/g.length,margen_medio_pp:g.reduce((s,r)=>s+n(r.margen||0),0)/g.length};}).sort((a,b)=>b.elecciones_ganadas-a.elecciones_ganadas||b.racha_maxima-a.racha_maxima);
}
function bastions(arena){
 const a=basAll(arena);const top=a.slice(0,18);if(!top.length)return;
 plot(`Fortalezas territoriales ${arena==='Presidencial'?'presidenciales':'legislativas'} · cuota media de votos y persistencia`,[{type:'bar',orientation:'h',x:top.slice().reverse().map(r=>r.voto_medio_en_victorias),y:top.slice().reverse().map(r=>labelText(r.partido)+' · '+r.provincia),customdata:top.slice().reverse().map(r=>[r.racha_maxima,r.porcentaje_victorias,r.elecciones_ganadas]),marker:{color:cc[arena]},text:top.slice().reverse().map(r=>`${r.elecciones_ganadas} · racha ${r.racha_maxima}`),textposition:'outside',hovertemplate:'%{y}<br>Voto medio en victorias: %{x:.1f}%<br>Elecciones ganadas: %{customdata[2]}<br>Racha máxima: %{customdata[0]}<extra></extra>'}],top,{arenaVista:arena,height:630,xTitle:'Porcentaje medio de votos válidos en las elecciones ganadas (%)',subtitle:`${labelsArena[arena]} · fortaleza y victorias provinciales 1953–2026`,note:'Cada barra es una combinación partido–provincia. La racha es el máximo de elecciones nacionales consecutivas ganadas (no años naturales). Es un indicador descriptivo de persistencia, no una clasificación automática de bastión político.'});
 table(a,['provincia','partido','elecciones_ganadas','elecciones_observadas','porcentaje_victorias','racha_maxima','primera_victoria','ultima_victoria','voto_medio_en_victorias','margen_medio_pp'],'Historial provincial de partidos ganadores');
}
function winnerMap(arena){
 // Matriz territorial: siete provincias más una fila nacional para comparar
 // el ganador agregado de la elección con los liderazgos provinciales.
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
 const toneOverride={
  'NUEVA REPUBLICA':'#39bced',
  'PUEBLO SOBERANO':'#0da4b5',
  'RESTAURACION NACIONAL':'#1d84d6',
  'UNIDAD SOCIAL CRISTIANA':'#0057b8',
  'UNIDAD':'#6d7d88',
  'UNIFICACION NACIONAL':'#a7b2ba',
  'REPUBLICANO':'#caa11a',
  'REPUBLICANO NACIONAL':'#caa11a'
 };
 const showProvince=p=>p==='Nacional'?'Costa Rica':p;
 const rows=(D.metricas||[])
  .filter(r=>r.arena===arena&&n(r.ronda)===1&&yrs().includes(n(r.anio))&&r.ganador&&(P.includes(r.provincia)||r.provincia==='Nacional'))
  .map(r=>({...r,provincia_vista:showProvince(r.provincia)}));
 if(!rows.length)return;
 const parties=uniq(rows.map(r=>r.ganador)).sort((a,b)=>String(labelText(a)).localeCompare(String(labelText(b)),'es'));
 const documented=parties.filter(p=>!!partyPalette[p]?.color);
 const undocumented=parties.filter(p=>!partyPalette[p]?.color);
 const toneFor=p=>toneOverride[norm(p)]||partyPalette[p]?.color||'#8796a0';
 const traces=parties.map(p=>{
  const a=rows.filter(r=>r.ganador===p);
  const tone=toneFor(p);
  return {type:'scatter',mode:'markers',name:labelText(p),x:a.map(r=>String(r.anio)),y:a.map(r=>r.provincia_vista),
   customdata:a.map(r=>[labelText(p),r.concentracion_1,r.margen,r.provincia_vista]),
   marker:{symbol:'square',size:19,color:tone,line:{color:'#fff',width:1.15}},
   hovertemplate:'Elección %{x}<br>Territorio: %{customdata[3]}<br>%{customdata[0]}<br>Cuota del primero: %{customdata[1]:.2f}%<br>Margen: %{customdata[2]:.2f} pp<extra></extra>'};
 });
 const years=yrs().map(String);
 const provinceOrder=['Costa Rica',...P];
 plot(`Partido más votado por provincia · ${labelsArena[arena]}`,traces,rows,{arenaVista:arena,height:Math.max(560,545+Math.ceil(parties.length/5)*24),xTitle:'Elección',yTitle:'Provincia',
  subtitle:`${labelsArena[arena]} · siete provincias + Costa Rica · 1953–2026`,layout:{
   xaxis:{type:'category',categoryorder:'array',categoryarray:years,tickangle:-45,showgrid:true},
   yaxis:{type:'category',categoryorder:'array',categoryarray:provinceOrder,showgrid:true},
   margin:{l:118,r:35,t:35,b:Math.min(285,122+Math.ceil(parties.length/4)*18)},
   legend:{orientation:'h',x:0,y:-.26,font:{size:10},tracegroupgap:4}
  },note:`Se añade una fila nacional («Costa Rica») para comparar el partido más votado del agregado nacional con los liderazgos provinciales. Los tonos se ajustaron levemente para diferenciar mejor denominaciones visualmente cercanas (por ejemplo Nueva República, Restauración Nacional y Unidad Social Cristiana). ${documented.length} denominaciones conservan referencia documentada en el catálogo de divisas; las ${undocumented.length} históricas sin tono verificado siguen identificándose por nombre en la leyenda y al pasar el cursor.`});
 table(rows.map(r=>({anio:r.anio,provincia:r.provincia_vista,partido_mas_votado:r.ganador,voto_pct:r.concentracion_1,ventaja_pp:r.margen,fuente_color:partyPalette[r.ganador]?.fuente||'Color de apoyo para diferenciación visual en la matriz'})),['anio','provincia','partido_mas_votado','voto_pct','ventaja_pp','fuente_color'],'Liderazgos provinciales y referencia de los colores');
}

function votoDiferenciadoNacional(){
 const m=(D.metricas||[]).filter(r=>r.arena==='Legislativa'&&n(r.ronda)===1&&r.provincia==='Nacional'&&yrs().includes(n(r.anio))&&complete(r.divergencia_arenas));return sorted(m);
}
function tabDivergencia(){const rows=votoDiferenciadoNacional();if(rows.length)plot('Diferencia agregada entre voto presidencial y legislativo · 1953–2026',[{type:'scatter',mode:'lines+markers',x:rows.map(r=>n(r.anio)),y:rows.map(r=>n(r.divergencia_arenas)),marker:{color:'#19837d',size:8},line:{color:'#19837d',width:3},hovertemplate:'%{x}<br>Diferencia agregada: %{y:.2f} pp<extra></extra>'}],rows,{arenaVista:'General',height:430,xTitle:'Elección',yTitle:'Distancia entre distribuciones (pp)',layout:{xaxis:{tickmode:'array',tickvals:yrs(),tickangle:-50}},note:'Distancia de variación total: ½ × suma de diferencias absolutas entre cuotas de votos válidos de los partidos en ambas arenas. No identifica el voto dividido de personas concretas. La matriz provincial está en esta misma sección.'});}

function bastionsComparado(){
 const leg=basAll('Legislativa'),pres=basAll('Presidencial');
 const grouped=new Map();for(const r of [...leg,...pres]){const k=r.provincia+'|'+r.partido;const g=grouped.get(k)||{provincia:r.provincia,partido:r.partido,Legislativa:0,Presidencial:0};g[r.arena]=r.elecciones_ganadas;grouped.set(k,g);}
 const rows=[...grouped.values()].sort((a,b)=>(b.Legislativa+b.Presidencial)-(a.Legislativa+a.Presidencial)).slice(0,18).reverse();
 const names=rows.map(r=>labelText(r.partido)+' · '+r.provincia);
 plot('Liderazgos territoriales comparados · Presidencia y diputaciones',[
  {type:'bar',name:'Legislativa',orientation:'h',y:names,x:rows.map(r=>r.Legislativa),marker:{color:cc.Legislativa},text:rows.map(r=>r.Legislativa),textposition:'outside'},
  {type:'bar',name:'Presidencial',orientation:'h',y:names,x:rows.map(r=>r.Presidencial),marker:{color:cc.Presidencial},text:rows.map(r=>r.Presidencial),textposition:'outside'}],rows,{arenaVista:'General',height:640,xTitle:'Elecciones provinciales encabezadas',layout:{barmode:'group',margin:{l:230,r:65,t:30,b:95}},note:'La comparación usa únicamente las primeras rondas presidenciales. Una provincia puede tener un partido líder presidencial diferente del legislativo. El recuento no indica por sí solo durabilidad organizativa o causalidad territorial.'});
 table(rows,['provincia','partido','Legislativa','Presidencial'],'Victorias provinciales por partido y arena');
}
function transicionesPorArena(){
 header('Movilidad electoral por tipo de candidatura · 3 vistas');
 const view=sel('v10transicion');
 const rows=(D.transiciones_resultados||[]).filter(r=>n(r.anio)>=state.from&&n(r.anio)<=state.to&&n(r.anio)>n(r.anio_origen)&&
  (view==='General'||(view==='Legislativa'&&r.cargo_origen==='Diputación'&&r.cargo_destino==='Diputación')||(view==='Presidencial'&&r.cargo_origen!=='Diputación'&&r.cargo_destino!=='Diputación')));
 const groups=['Electa','No electa'].map(outcome=>{const arr=rows.filter(r=>r.resultado_destino===outcome);const denom=arr.length;return{resultado:outcome,pares:denom,personas:uniq(arr.map(r=>r.id_persona)).length,cambiaron_partido:arr.filter(r=>r.cambia_partido).length,cambio_partido_pct:denom?100*arr.filter(r=>r.cambia_partido).length/denom:null,comparable_provincia:arr.filter(r=>r.provincia_origen!=='Nacional'&&r.provincia_destino!=='Nacional').length,cambiaron_provincia:arr.filter(r=>r.cambia_provincia).length};});
 plot('Resultado posterior y continuidad partidaria · '+view,[
  {type:'bar',name:'Mantuvo partido',x:groups.map(r=>r.resultado),y:groups.map(r=>r.pares-r.cambiaron_partido),marker:{color:'#137f79'},text:groups.map(r=>r.pares-r.cambiaron_partido),textposition:'inside'},
  {type:'bar',name:'Cambió partido',x:groups.map(r=>r.resultado),y:groups.map(r=>r.cambiaron_partido),marker:{color:'#be8b4c'},text:groups.map(r=>r.cambiaron_partido),textposition:'inside'}],groups,{arenaVista:view,layout:{barmode:'stack'},height:380,xTitle:'Outcome exacto de candidatura posterior',yTitle:'Pares consecutivos de candidaturas',note:'Se incluyen transiciones entre elecciones consecutivas de cada persona nominal; la vista Legislativa incluye solo Diputación→Diputación y la vista Presidencial solo cargos de fórmulas presidenciales. Las transiciones mixtas se conservan en General y en los puentes de carrera.'});
 table(groups,['resultado','pares','personas','cambiaron_partido','cambio_partido_pct','comparable_provincia','cambiaron_provincia'],'Resultados y movilidad por arena');
}

function electionTransitions(){
 const bridges=(D.puentes_cargos||[]).filter(r=>n(r.anio)>n(r.anio_origen)&&n(r.anio)>=state.from&&n(r.anio)<=state.to);
 const prev=local.bridgeFrom||'Diputación',next=local.bridgeTo||'Presidencia',out1=local.bridgeFromResult||'Todos',out2=local.bridgeToResult||'Todos';
 const party=local.bridgeV10Party||'Todos',province=local.bridgeV10Province||'Todos';
 header('Puentes cronológicos · resultados exactos y movilidad');
 controls([['bridgeV10Party','Partido entre las dos candidaturas',['Todos','Mantuvo partido','Cambió partido'],party],['bridgeV10Province','Provincia entre las dos candidaturas',['Todos','Mantuvo provincia','Cambió provincia'],province]]);
 const data=bridges.filter(r=>r.cargo_origen===prev&&r.cargo_destino===next&&(out1==='Todos'||r.resultado_origen===out1)&&(out2==='Todos'||r.resultado_destino===out2)&&(party==='Todos'||!!r.cambia_partido===(party==='Cambió partido'))&&(province==='Todos'||(r.provincia_origen!=='Nacional'&&r.provincia_destino!=='Nacional'&&!!r.cambia_provincia===(province==='Cambió provincia'))));
 const g=['Electa','No electa'].map(outcome=>{const a=data.filter(r=>r.resultado_destino===outcome);return{resultado:outcome,pares:a.length,personas:uniq(a.map(r=>r.id_persona)).length,con_cambio_partido:a.filter(r=>r.cambia_partido).length,con_cambio_provincia:a.filter(r=>r.cambia_provincia).length,porcentaje_cambio_partido:a.length?100*a.filter(r=>r.cambia_partido).length/a.length:null,porcentaje_cambio_provincia:a.length?100*a.filter(r=>r.cambia_provincia).length/a.length:null}});
 plot(`De ${prev} a ${next} · elección posterior y cambios observados`,[
 {type:'bar',name:'Mantuvo partido',x:g.map(r=>r.resultado),y:g.map(r=>r.pares-r.con_cambio_partido),marker:{color:'#168278'},text:g.map(r=>r.pares-r.con_cambio_partido),textposition:'inside'},
 {type:'bar',name:'Cambió partido',x:g.map(r=>r.resultado),y:g.map(r=>r.con_cambio_partido),marker:{color:'#bc8b46'},text:g.map(r=>r.con_cambio_partido),textposition:'inside'}
 ],g,{arenaVista:'General',height:410,xTitle:'Resultado de la candidatura posterior',yTitle:'Pares de candidaturas',layout:{barmode:'stack'},note:'El desenlace Electa/No electa corresponde a la candidatura posterior exacta, no al éxito alcanzado en cualquier otra elección. Cada barra contiene los pares cronológicos, no personas únicas. La tabla también muestra los porcentajes internos de cambio de provincia y de partido.'});
 table(g,['resultado','pares','personas','con_cambio_partido','porcentaje_cambio_partido','con_cambio_provincia','porcentaje_cambio_provincia'],'Outcome posterior y porcentajes dentro de cada outcome');
 table(data,['nombre','anio_origen','anio','cargo_origen','resultado_origen','cargo_destino','resultado_destino','partido_origen','partido_destino','cambia_partido','provincia_origen','provincia_destino','cambia_provincia','id_persona'],'Pares cronológicos exactos que sustentan el resultado');
 note('En las fórmulas presidenciales la provincia registrada es Nacional, no una provincia de inscripción personal. Por ello el cambio provincial solo se evalúa cuando ambos extremos tienen provincia comparable. Una coincidencia nominal no es prueba de identidad civil.');
}

function participationRank(arena){
 const rows=(D.metricas||[]).filter(r=>r.arena===arena&&n(r.ronda)===1&&P.includes(r.provincia)&&yrs().includes(n(r.anio)));
 const ys=yrs(),lookup=new Map(rows.map(r=>[r.provincia+'|'+r.anio,r]));
 const ranks=new Map();for(const y of ys){const r=rows.filter(x=>n(x.anio)===y&&complete(x.participacion_pct)).sort((a,b)=>n(b.participacion_pct)-n(a.participacion_pct));r.forEach((x,i)=>ranks.set(x.provincia+'|'+y,i+1));}
 const z=P.map(p=>ys.map(y=>ranks.get(p+'|'+y)??null));
 plot(`Ranking provincial de participación · ${labelsArena[arena]}`,[{type:'heatmap',x:ys.map(String),y:P,z,zmin:1,zmax:7,colorscale:[[0,'#0d6964'],[.5,'#a9d8d1'],[1,'#f2f7f5']],reversescale:false,texttemplate:'%{z:.0f}',textfont:{size:11},colorbar:{title:{text:'Puesto'},tickvals:[1,2,3,4,5,6,7]},xgap:2,ygap:2,hovertemplate:'%{y} · %{x}<br>Puesto %{z:.0f}<extra></extra>'}],rows,{arenaVista:arena,height:485,xTitle:'Elección',yTitle:'Provincia',layout:{xaxis:{type:'category',categoryorder:'array',categoryarray:ys.map(String),tickangle:-50},margin:{l:110,r:85,t:35,b:85}},note:'Puesto 1 = provincia con mayor participación (%) en esa elección y arena. Cada porcentaje utiliza su propio padrón y votos emitidos. Los empates, si los hay, se ordenan de forma determinista.'});
}
function padronBreakdown(view){
 const ars=arenalist(view);const colors={'Voto válido':'#147e77','Blancos':'#86b5bc','Nulos':'#b98c53','Abstenciones':'#bdcdd7'};
 for(const arena of ars){
 const rr=sorted(mf(arena));const a=rr.map(r=>{const p=n(r.padron);return{anio:r.anio,arena,validos:p?100*n(r.validos)/p:null,blancos:p?100*n(r.blancos)/p:null,nulos:p?100*n(r.nulos)/p:null,abstenciones:p?100*n(r.abstenciones)/p:null,padron:p}});
 const xs=a.map(r=>String(r.anio));const cats=[['Voto válido','validos'],['Blancos','blancos'],['Nulos','nulos'],['Abstenciones','abstenciones']];
 const traces=cats.map(([name,key])=>({type:'bar',name,x:xs,y:a.map(r=>r[key]),text:a.map(r=>r[key]>=12?num(r[key],1)+'%':''),textposition:'inside',textfont:{size:10,color:'#fff'},marker:{color:colors[name]},hovertemplate:`${name}<br>Elección %{x}: %{y:.2f}% del padrón<extra></extra>`}));
 plot(`Composición del padrón electoral · ${labelsArena[arena]}`,traces,a,{arenaVista:arena,height:485,xTitle:'Elección',yTitle:'Porcentaje del padrón (%)',layout:{barmode:'stack',xaxis:{type:'category',categoryorder:'array',categoryarray:xs,tickangle:-50},yaxis:{range:[0,100.4]}},note:'Cada porcentaje utiliza el padrón de la arena correspondiente. Se suman votos válidos, blancos, nulos y abstenciones; una diferencia residual, si existiera por fuente o redondeo, debe verificarse en las tablas oficiales.'});
 }
}

function ofertaClasificada(){
 const cats=['Presidencial y legislativa','Solo legislativa','Solo presidencial'];const rows=(D.oferta_partidos||[]).filter(r=>yrs().includes(n(r.anio))&&cats.includes(r.oferta));
 const years=yrs(),vals=years.map(y=>{const x=rows.filter(r=>n(r.anio)===y),total=x.length;const r={anio:y,total};for(const c of cats){const count=x.filter(r=>r.oferta===c).length;r[c+'_n']=count;r[c+'_pct']=total?100*count/total:null}return r});
 const tr=cats.map((c,i)=>({type:'bar',name:c,x:years.map(String),y:vals.map(r=>r[c+'_pct']),text:vals.map(r=>r[c+'_pct']===null?'':`${num(r[c+'_pct'],1)}%`),textposition:'inside',insidetextanchor:'middle',textfont:{color:'#fff',size:10},marker:{color:['#167f79','#c29049','#a55579'][i]},customdata:vals.map(r=>[r[c+'_n'],r.total]),hovertemplate:`${c}<br>%{x}<br>%{y:.1f}%<br>%{customdata[0]} de %{customdata[1]} partidos<extra></extra>`}));
 plot('Oferta partidaria · porcentajes visibles por arena',tr,vals,{arenaVista:'General',height:500,xTitle:'Elección',yTitle:'Porcentaje de organizaciones (%)',layout:{barmode:'stack',xaxis:{type:'category',categoryorder:'array',categoryarray:years.map(String),tickangle:-50},yaxis:{range:[0,100]}},note:'Cada columna representa el 100% de las denominaciones que compitieron en al menos una de las dos arenas. Los porcentajes visibles y los valores absolutos se conservan en la tabla.'});
}
function nombreRegistro(){
 header('Registros de cancelación y oferta observada · filtros diferenciados');
 const scales=['Todos',...uniq((D.cancelados||[]).map(r=>r.Escala).filter(Boolean))].sort();const scale=local.n10scale||'Todos',oferta=local.n10oferta||'Todos';
 controls([['n10scale','Escala de inscripción',scales,scale],['n10oferta','Competencia observada',['Todos','Presidencial y legislativa','Solo legislativa','Solo presidencial','Sin correspondencia exacta'],oferta]]);
 const byName=new Map();for(const r of D.oferta_partidos||[]){const k=norm(r.partido);if(!byName.has(k))byName.set(k,new Set());byName.get(k).add(r.oferta)}
 const rows=(D.cancelados||[]).map(r=>{const match=byName.get(norm(r['Nombre del partido']));return {...r,oferta_observada:match?[...match].sort().join(' / '):'Sin correspondencia exacta',registro_en_oferta:!!match}}).filter(r=>(scale==='Todos'||r.Escala===scale)&&(oferta==='Todos'||(oferta==='Sin correspondencia exacta'?!r.registro_en_oferta:r.oferta_observada.includes(oferta))));
 table(rows,['Nombre del partido','Escala','Provincia','Fecha de inscripción','Fecha de cancelación','Nombre repetido','oferta_observada','registro_en_oferta','Referencia'],'Registro jurídico y oferta electoral por coincidencia de denominación');
 note('El cruce textual entre inscripciones/cancelaciones y oferta histórica es exploratorio. Una coincidencia de nombre no demuestra continuidad jurídica, identidad de organización o inscripción durante todos los años de la serie.');
}
const wrap=(name,more)=>{const fn=views[name];if(typeof fn==='function')views[name]=function(...a){const ans=fn.apply(this,a);more();return ans;}};
wrap('competencia',()=>{header('Comparador presidencial y legislativo · fragmentación');const v=sel('v10competencia');plotTrend('nep','Número efectivo de partidos · tres vistas',v);plotTrend('concentracion_1','Cuota de votos del partido más votado · tres vistas',v);});
wrap('participacion',()=>{header('Abstencionismo y participación · ambas arenas electorales');const v=sel('v10participacion');plotTrend('abstencion_pct','Abstencionismo nacional · vista por arena',v);for(const a of arenalist(v)){heatMetric('abstencion_pct',`Abstencionismo por provincia · ${labelsArena[a]}`,a);participationRank(a);}padronBreakdown(v);plotTrend('invalidos_pct','Voto blanco y nulo agregado · voto no válido',v);});
wrap('panorama',()=>{header('Series históricas comparables por arena');const v=sel('v10panorama');plotTrend('partidos_con_votos','Organizaciones que recibieron votos · Presidencia y Asamblea',v);});
wrap('dualidad',()=>{header('Diferencia agregada · evolución nacional');tabDivergencia();});
// Se integra la comparación de ambas arenas en Votos y escaños (V12).
wrap('partidos',()=>{header('Liderazgos por provincia y arena');const v=sel('v10partidos');for(const a of arenalist(v)){winnerMap(a);}});
/* Se conserva el explorador V7 con sus perfiles, flujos y puentes: no se añade un segundo explorador V10. */
// Los filtros nuevos del registro se integran como gráfico en la V12, no como tablas duplicadas.
// Información explícita sobre la cobertura documental presidencial.
wrap('papeletas',()=>{note('La base de diseño documental actualmente disponible corresponde a papeletas legislativas. La incorporación de papeletas presidenciales requiere una octava base verificada; no se simulan sus características.');});
window.ATLAS_V10_INTEGRADO_OK=true;
})();

/* ATLAS_V95_PUBLICO_DEPURADO
   No crea pestañas nuevas ni añade franjas históricas al HTML público.
   La divergencia agregada se muestra en una única matriz provincial histórica.
   No se confunde divergencia agregada con identificación de voto cruzado individual.
*/
(function(){
 'use strict';
 const provincias=['San José','Alajuela','Cartago','Heredia','Guanacaste','Puntarenas','Limón'];
 const anio=r=>Number(r.anio);
 const finito=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v));
 const entre=r=>anio(r)>=state.from&&anio(r)<=state.to;
 const metricasLeg=()=> (D.metricas||[]).filter(r=>r.arena==='Legislativa'&&Number(r.ronda)===1&&entre(r));
 // Se conserva la ampliación original de la matriz de participación con fila Nacional.
 const graficarAntes=plot;
 plot=function(nombre,trazas,filas,opciones={}){
   if(nombre==='Territorios y elecciones'&&trazas?.length===1&&trazas[0]?.type==='heatmap'){
     const original=trazas[0],campo=local.pm||'abstencion_pct';
     const totales=metricasLeg().filter(r=>r.provincia==='Nacional');
     const agregado=(original.x||[]).map(y=>{
       const f=totales.find(r=>anio(r)===Number(y));
       return f&&finito(f[campo])?Number(f[campo]):null;
     });
     return graficarAntes('Territorios y elecciones · provincias y total nacional',
       [{...original,y:[...original.y,'Nacional'],z:[...original.z,agregado]}],
       [...(filas||[]),...totales],{...opciones,height:460,subtitle:'Siete provincias y total nacional',note:'Nacional se obtiene de los totales y denominadores oficiales, no del promedio aritmético de las provincias.'});
   }
   // Retirar solo la curva de divergencia entre arenas que generaba una interpretación confusa.
   // V14: recuperar el indicador longitudinal del Atlas original.

   // Retirar la curva alternativa de divergencia de V9.
   if(nombre==='Divergencia electoral nacional · serie histórica 1953–2026') return;
   return graficarAntes(nombre,trazas,filas,opciones);
 };
 function matrizVotoDiferenciado(){
   const filas=metricasLeg().filter(r=>provincias.includes(r.provincia));
   const anios=[...new Set(filas.map(anio))].filter(Number.isFinite).sort((a,b)=>a-b);
   if(!anios.length){note('No se encontraron elecciones provinciales para este intervalo.',true);return;}
   const indice=new Map(filas.map(r=>[`${r.provincia}|${anio(r)}`,r]));
   const z=provincias.map(prov=>anios.map(y=>{
     const f=indice.get(`${prov}|${y}`);
     return f&&finito(f.divergencia_arenas)?Number(f.divergencia_arenas):null;
   }));
   const datos=provincias.flatMap((prov,i)=>anios.map((y,j)=>({
     anio:y,provincia:prov,diferencia_agregada_pp:z[i][j],
     interpretacion:z[i][j]===null?'Sin dato comparable':'Distancia entre distribuciones de votos'
   })));
   const observados=datos.filter(r=>r.diferencia_agregada_pp!==null);
   if(!observados.length){note('Las bases no contienen todavía porcentajes comparables entre ambas arenas para estas elecciones.',true);return;}
   const xs=anios.map(String);
   // Celdas deliberadamente claras para que los números escritos siempre sean legibles.
   const escala=[[0,'#f2f7f7'],[.2,'#d8eae7'],[.5,'#9bcfca'],[.8,'#59a4a0'],[1,'#317e86']];
   plot('Voto presidencial y legislativo · diferencia agregada por provincia y elección',[
     {type:'heatmap',x:xs,y:provincias,z,colorscale:escala,zmin:0,
      colorbar:{title:{text:'Diferencia<br>(pp)'},ticksuffix:' pp',thickness:15,len:.82},
      texttemplate:'%{z:.1f}',textfont:{size:11,color:'#163c49'},
      hoverongaps:false,hovertemplate:'%{y} · elección %{x}<br>Diferencia agregada: %{z:.2f} pp<extra></extra>',
      xgap:2,ygap:3}
   ],observados,{
     height:495,xTitle:'Elección',yTitle:'Provincia',
     subtitle:'Siete provincias · elecciones 1953–2026 · cada celda indica puntos porcentuales (pp)',
     layout:{xaxis:{type:'category',categoryorder:'array',categoryarray:xs,tickangle:-52,tickmode:'array',tickvals:xs,ticktext:xs},
             yaxis:{type:'category',categoryorder:'array',categoryarray:provincias,autorange:'reversed'},
             margin:{l:120,r:100,t:32,b:85}},
     note:'Cómo leer: 0 pp indica distribuciones partidarias iguales entre las papeletas presidencial y legislativa; valores mayores indican diferencias más pronunciadas. Indicador = ½ × suma de diferencias absolutas entre los porcentajes de voto de cada partido en ambas arenas. No identifica cuántas personas quebraron su voto ni permite inferencias individuales.'
   });
   table(datos,['anio','provincia','diferencia_agregada_pp','interpretacion'],
         'Valores de la matriz · provincias y elecciones (pp)');
 }
 const vistaParticipacionOriginal=views.participacion;
 views.participacion=function(...args){
   const resultado=vistaParticipacionOriginal.apply(this,args);
   const serie=metricasLeg().filter(r=>r.provincia==='Nacional'&&finito(r.abstencion_pct)).sort((a,b)=>anio(a)-anio(b));
   if(!serie.length)return resultado;
   plot('Abstencionismo legislativo nacional · 1953–2026',[
     {type:'scatter',mode:'lines+markers',name:'Abstencionismo nacional',
      x:serie.map(anio),y:serie.map(r=>Number(r.abstencion_pct)),
      line:{color:'#138079',width:3},marker:{color:'#138079',size:8},
      hovertemplate:'Elección %{x}<br>Abstencionismo: %{y:.2f}%<extra></extra>'}
   ],serie,{height:450,xTitle:'Elección',yTitle:'Abstencionismo (%)',
     layout:{showlegend:false,xaxis:{type:'linear',tickmode:'array',tickvals:serie.map(anio),tickangle:-50},yaxis:{rangemode:'tozero'}},
     note:'Abstencionismo legislativo nacional observado por elección. La serie completa se representa sin destacar ningún año ni proponer períodos históricos.'});
   return resultado;
 };
 const vistaDualOriginal=views.dualidad;
 views.dualidad=function(...args){
   const r=vistaDualOriginal.apply(this,args);
   // V14 añade su propia lectura provincial y ranking, sin duplicar esta matriz.
   return r;
 };
 // Oferta por arena: se conservan los porcentajes de las tres categorías y sus recuentos.
 const categorias=['Solo presidencial','Solo legislativa','Presidencial y legislativa'];
 const colores={'Solo presidencial':'#a55579','Solo legislativa':'#c29049','Presidencial y legislativa':'#138079'};
 function proporcionOferta(){
   const fuentes=(D.oferta_partidos||[]).filter(r=>entre(r)&&r.partido&&categorias.includes(r.oferta));
   if(!fuentes.length){note('No hay clasificación de oferta electoral disponible para este período.',true);return;}
   const unicos=new Set(),conteos=new Map();
   for(const r of fuentes){
     const y=anio(r),id=`${y}|${r.partido}`;
     if(unicos.has(id))continue;
     unicos.add(id);
     const obj=conteos.get(y)||{anio:y};obj[r.oferta]=(obj[r.oferta]||0)+1;conteos.set(y,obj);
   }
   const resumen=[...conteos.values()].sort((a,b)=>a.anio-b.anio).map(r=>{
     const total=categorias.reduce((s,k)=>s+(r[k]||0),0),fila={anio:r.anio,total_partidos:total};
     for(const cat of categorias){fila[cat+'_n']=r[cat]||0;fila[cat+'_pct']=total?100*(r[cat]||0)/total:0;}
     return fila;
   });
   const elecciones=resumen.map(r=>String(r.anio));
   const graficos=categorias.map(cat=>({type:'bar',name:cat,x:elecciones,
       y:resumen.map(r=>r[cat+'_pct']),marker:{color:colores[cat],line:{color:'#fff',width:.7}},
       text:resumen.map(r=>r[cat+'_pct']>=10?r[cat+'_pct'].toFixed(1)+'%':''),
       textposition:'inside',insidetextanchor:'middle',textfont:{color:'#fff',size:11},
       customdata:resumen.map(r=>[r[cat+'_n'],r.total_partidos,r[cat+'_pct']]),
       hovertemplate:cat+'<br>Elección %{x}: %{customdata[2]:.1f}%<br>%{customdata[0]} de %{customdata[1]} partidos<extra></extra>'
   }));
   plot('Composición porcentual de la oferta partidaria por arena',graficos,resumen,{
     height:520,xTitle:'Elección',yTitle:'Proporción de organizaciones (%)',
     layout:{barmode:'stack',bargap:.18,uniformtext:{mode:'hide',minsize:9},
       xaxis:{type:'category',categoryorder:'array',categoryarray:elecciones,tickmode:'array',tickvals:elecciones,ticktext:elecciones,tickangle:-52},
       yaxis:{range:[0,100],title:{text:'Porcentaje de organizaciones (%)'}}},
     note:'Cada barra suma 100 % de organizaciones identificadas en la elección: no son porcentajes de votos. Las tres categorías coinciden con la clasificación original de oferta partidaria.'
   });
   table(resumen,['anio','total_partidos',...categorias.flatMap(c=>[c+'_n',c+'_pct'])],
     'Oferta por arena · recuentos y proporciones (%)');
 }
 const vistaPartidosOriginal=views.partidos;
 views.partidos=function(...args){const r=vistaPartidosOriginal.apply(this,args);proporcionOferta();return r;};
 window.ATLAS_V95_DEPURADO_OK=true;
})();
