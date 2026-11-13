/* Atlas Electoral · motor de consulta territorial */
(()=>{
'use strict';
if(window.AtlasV27Integrado)return;
const node=document.getElementById('atlas-v24-data');
if(!node)return;
const V=JSON.parse(node.textContent);
const years=V.years, provinces=V.provinces;
const ERA=['#499383','#5478b4','#d58b4e','#8869b6'];
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/gi,'').toUpperCase().replace(/^PARTIDO/,'');
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const fmt=(n,d=0)=>Number.isFinite(Number(n))?Number(n).toLocaleString('es-CR',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const colorMap=new Map(Object.entries(V.party_colors||{}));
const extraColors={LIBERACIONNACIONAL:'#138746',UNIDADSOCIALCRISTIANA:'#1671aa',ACCIONCIUDADANA:'#e5a92e',FRENTEAMPLIO:'#d8aa31',AGENDACIUDADANA:'#db4c35',PUEBLOSOBERANO:'#18a8ac',NUEVAREPUBLICA:'#21b6c8'};
const partyColor=(p)=>colorMap.get(norm(p))||extraColors[norm(p)]||'#7c90a2';
window.atlasPartyColor=partyColor;
const metricFields=V.metrics_fields,voteFields=V.votes_fields;
const dataRows=V.metrics.map(r=>Object.fromEntries(metricFields.map((f,i)=>[f,r[i]])));
const voteRows=V.votes.map(r=>Object.fromEntries(voteFields.map((f,i)=>[f,r[i]])));
const leaderRows=V.leaders.map(r=>({year:r[0],arena:r[1],level:r[2],key:String(r[3]),party:r[4],votes:r[5],share:r[6]}));
const metrics=new Map(dataRows.map(r=>[`${r.year}|${r.arena}|${r.level}|${r.key}`,r]));
const leaders=new Map(leaderRows.map(r=>[`${r.year}|${r.arena}|${r.level}|${r.key}`,r]));
const votes=new Map();for(const r of voteRows){let k=`${r.year}|${r.arena}|${r.level}|${r.key}`;if(!votes.has(k))votes.set(k,[]);votes.get(k).push(r)}
for(const a of votes.values())a.sort((x,y)=>y.votes-x.votes);
const cantons=V.cantons.map(r=>({code:String(r[0]),province:r[1],name:r[2]}));
const districts=V.districts.map(r=>({code:String(r[0]),cantonCode:String(r[1]),province:r[2],canton:r[3],name:r[4]}));
const cantonIndex=new Map(cantons.map(r=>[r.code,r]));const districtIndex=new Map(districts.map(r=>[r.code,r]));
const names={L:'Diputaciones',P:'Presidencia · primera ronda',R:'Presidencia · segunda ronda'};
const haveRound=new Set([2002,2014,2018,2022]);
const label=(l,k)=>l==='p'?k:l==='c'?`${cantonIndex.get(k)?.name||k} · ${cantonIndex.get(k)?.province||''}`:`${districtIndex.get(k)?.name||k} · ${districtIndex.get(k)?.canton||''}`;
const key=(y,a,l,k)=>`${y}|${a}|${l}|${k}`;
const dataMetric=(y,a,l,k)=>metrics.get(key(y,a,l,k));
const dataVotes=(y,a,l,k)=>votes.get(key(y,a,l,k))||[];
const yearSort=(a,b)=>a-b;
function download(file,text,mime){const u=URL.createObjectURL(text instanceof Blob?text:new Blob([text],{type:mime||'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=u;a.download=file;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),3000)}
function csv(rows,file){if(!rows.length)return;const c=Object.keys(rows[0]),e=x=>'"'+String(x??'').replace(/"/g,'""')+'"';download(file,'\ufeff'+[c.map(e).join(','),...rows.map(r=>c.map(k=>e(r[k])).join(','))].join('\r\n'),'text/csv;charset=utf-8')}
function exportPlot(host,id,rows,filename){host.querySelectorAll('[data-atlas-export]').forEach(b=>b.onclick=async()=>{const t=b.dataset.atlasExport;if(t==='csv')return csv(rows(),filename()+'.csv');let el=host.querySelector('#'+id);if(el&&window.Plotly)await Plotly.downloadImage(el,{format:t,filename:filename(),width:1600,height:Math.max(760,el.offsetHeight),scale:t==='png'?2:1})})}
const buttons='<div class="a25-actions"><button data-atlas-export="png">PNG</button><button data-atlas-export="svg">SVG</button><button data-atlas-export="csv">CSV</button></div>';
const select=(id,label,options)=>`<label class="a25-field">${label}<select id="${id}">${options.map(([v,t])=>`<option value="${esc(v)}">${esc(t)}</option>`).join('')}</select></label>`;
function graph(target,traces,layout){if(!target||!window.Plotly)return;window.Plotly.react(target,traces,{height:480,font:{family:'Inter, system-ui, sans-serif',color:'#29475c'},paper_bgcolor:'#fff',plot_bgcolor:'#fff',margin:{l:160,r:75,t:35,b:70},...layout},{displaylogo:false,responsive:true,toImageButtonOptions:{format:'png',scale:2}})}
function block(title,description,id){const x=document.createElement('section');x.className='a25-block';x.id=id;x.innerHTML=`<div class="a25-header"><div><p class="a25-kicker">EXPLORACIÓN ELECTORAL</p><h3>${esc(title)}</h3><p>${esc(description)}</p></div></div>`;return x}
/* Sección 07 · extensión de la consulta ORIGINAL (sin crear otro visor electoral). */
function integrateResults(){
 const root=document.getElementById('atlas-v2317-seccion07');
 if(!root?.__atlasResultControl||root.querySelector('#atlas-v26-detail'))return;
 const shell=root.querySelector('.ar-shell'), originalControls=shell?.querySelector('.ar-controls');
 if(!shell||!originalControls)return;
 const area=document.createElement('div');area.id='atlas-v26-detail';area.className='a26-integrated';
 area.innerHTML=`<header class="a26-inline-head"><div><span class="a26-kicker">ESCRUTINIO · MISMA ELECCIÓN Y PROVINCIA</span><h3>Desglose de resultados electorales</h3><p>Elija el territorio desde el mapa o desde la selección superior. Consulte provincias, cantones y distritos sin salir de esta elección.</p></div></header>
 <nav id="a27-geo-nav" class="a27-geo-nav" aria-label="Niveles territoriales"><button type="button" data-level="n">Costa Rica</button><button type="button" data-level="p">Provincias</button><button type="button" data-level="c">Cantones</button><button type="button" data-level="d">Distritos</button></nav><div id="a27-geo-path" class="a27-geo-path"></div>
 <div class="a26-tools">${select('a26-detail-level','Desglose',[['n','Costa Rica'],['p','Provincias'],['c','Cantones'],['d','Distritos']])}${select('a26-detail-round','Ronda',[['P','Primera ronda'],['R','Segunda ronda']])}${select('a26-detail-zone','Selección territorial',[['all','Todos los territorios']])}${select('a26-detail-party','Partido',[['','Todos los partidos']])}</div>
 <div id="a27-province-jump" class="a27-province-jump"></div><div class="a26-metric-cards" id="a26-detail-summary"></div>
 <div class="a26-chart-title"><h4 id="a26-detail-title">Escrutinio territorial</h4>${buttons}</div>
 <div class="a26-dual"><div class="a26-plot" id="a26-detail-plot"></div><div class="a26-plot" id="a26-detail-map" hidden></div></div>
 <div class="a26-table-bar"><label>Buscar en los resultados <input id="a26-detail-search" type="search" placeholder="Cantón, distrito, partido…"/></label><span id="a26-detail-counter"></span></div>
 <div class="a25-tablewrap a26-big-table"><table id="a26-detail-table"></table></div><div class="a26-pagination"><button id="a26-detail-prev" type="button">Anterior</button><span id="a26-detail-page"></span><button id="a26-detail-next" type="button">Siguiente</button></div>
 <details class="a26-candidates"><summary><strong>Candidaturas y personas electas</strong><span>Fórmulas presidenciales y listas legislativas · abrir consulta nominal</span></summary>
 <div class="a26-tools"><label>Buscar persona o partido <input id="a26-nom-search" type="search" placeholder="Nombre, partido, cargo…"/></label>${select('a26-nom-status','Condición',[['all','Todas'],['yes','Electas'],['no','No electas']])}<button id="a26-nom-csv" type="button">Descargar candidaturas CSV</button></div>
 <p class="a26-footnote">Los votos legislativos pertenecen a listas partidarias, no a cada persona. Los votos presidenciales se atribuyen a la fórmula de su partido.</p>
 <div id="a26-nom-count"></div><div id="a26-nom-grid" class="a26-person-grid"></div><button id="a26-nom-more" type="button">Mostrar más candidaturas</button></details>`;
 const grid=shell.querySelector('.ar-grid');if(grid){const pair=[...grid.children];(pair[1]||pair[0]||grid).after(area)}else shell.append(area);
 const $=id=>area.querySelector('#'+id);let filtered=[],full=[],nominal=[],nominalFiltered=[],page=0,nomPage=0,current={},selectedCanton='';
 const mapDiv=$('a26-detail-map');$('a26-detail-level').value='p';
 function prepareGeo(y,a){
  const g=V.province_geojson;if(!g||!window.Plotly)return;
  const prov=provinces;const vals=prov.map(p=>{const rs=dataVotes(y,a,'p',p);return rs[0]?.share??null});
  const winners=prov.map(p=>dataVotes(y,a,'p',p)[0]);
  const colorIndex=[...new Set(winners.filter(Boolean).map(x=>norm(x.party)))];
  const z=winners.map(w=>w?colorIndex.indexOf(norm(w.party)):null);
  const shades=colorIndex.flatMap((name,i)=>{const col=partyColor(winners.find(w=>w&&norm(w.party)===name)?.party||name);return [[(i+.001)/Math.max(1,colorIndex.length),col],[(i+.999)/Math.max(1,colorIndex.length),col]]});
  Plotly.react(mapDiv,[{type:'choropleth',geojson:g,featureidkey:V.geo_name_key||'properties.provincia',locations:prov,z:z,colorscale:shades.length?shades:[[0,'#dce7ed'],[1,'#7f9cad']],showscale:false,marker:{line:{color:'#ffffff',width:1.6}},customdata:prov.map((p,i)=>[winners[i]?.party||'Sin datos',winners[i]?.votes||0,vals[i]]),hovertemplate:'%{location}<br>%{customdata[0]}<br>%{customdata[1]:,} votos · %{customdata[2]:.1f}%<extra></extra>'}],{geo:{scope:'world',projection:{type:'mercator'},fitbounds:'locations',showcoastlines:false,showframe:false,showland:false,bgcolor:'rgba(0,0,0,0)'},margin:{l:0,r:0,t:10,b:0},height:460,paper_bgcolor:'rgba(0,0,0,0)'},{displaylogo:false,responsive:true});
 }
 function readState(){const s=root.__atlasResultControl?.getState?.();if(!s)return null;return {year:Number(s.year),province:s.province||'Costa Rica',arena:s.arena==='Legislativa'?'L':$('a26-detail-round').value}}
 function sync(){const s=readState();if(!s)return;const y=s.year,p=s.province,a=s.arena,l=$('a26-detail-level').value;
  const round=$('a26-detail-round');round.closest('label').hidden=s.arena==='L';const rOpt=round.querySelector('option[value="R"]');rOpt.hidden=!haveRound.has(y);rOpt.disabled=!haveRound.has(y);
  if(!haveRound.has(y)&&round.value==='R'){round.value='P';s.arena='P'}
  const geo=l==='n'?[{key:'CR',name:'Costa Rica'}]:l==='p'?(p==='Costa Rica'?provinces.map(x=>({key:x,name:x})): [{key:p,name:p}]):l==='c'?cantons.filter(x=>p==='Costa Rica'||x.province===p).filter(x=>V.canton_years[x.code]?.includes(y)).map(x=>({key:x.code,name:x.name+' · '+x.province})):districts.filter(x=>(p==='Costa Rica'||x.province===p)&&(!selectedCanton||x.cantonCode===selectedCanton)).filter(x=>V.district_years[x.code]?.includes(y)).map(x=>({key:x.code,name:x.name+' · '+x.canton+' · '+x.province}));
  let old=$('a26-detail-zone').value;$('a26-detail-zone').innerHTML='<option value="all">Todos los territorios</option>'+geo.map(x=>`<option value="${esc(x.key)}">${esc(x.name)}</option>`).join('');if(old&&geo.some(x=>x.key===old))$('a26-detail-zone').value=old;
  const zone=$('a26-detail-zone').value;const selected=geo.filter(x=>zone==='all'||x.key===zone);
  const path=[y,p,l==='n'?'País':l==='p'?'Provincias':l==='c'?'Cantones':'Distritos'];if(selectedCanton&&l==='d')path.push(cantonIndex.get(selectedCanton)?.name||selectedCanton);
  $('a27-geo-path').textContent=path.join('  /  ');
  area.querySelectorAll('#a27-geo-nav [data-level]').forEach(button=>{button.classList.toggle('active',button.dataset.level===l);button.setAttribute('aria-pressed',button.dataset.level===l?'true':'false')});
  $('a27-province-jump').innerHTML=p==='Costa Rica'&&l==='p'?provinces.map(q=>`<button data-province="${esc(q)}" type="button">${esc(q)}</button>`).join(''):'';
  let result=selected.flatMap(x=>dataVotes(y,s.arena,l,x.key).map(r=>({Eleccion:y,Arena:names[s.arena],Provincia:p==='Costa Rica'?(l==='n'?'Costa Rica':l==='p'?x.key:l==='c'?cantonIndex.get(x.key)?.province:districtIndex.get(x.key)?.province):p,Division:l==='n'?'Nacional':l==='p'?'Provincia':l==='c'?'Cantón':'Distrito',Territorio:x.name,Codigo:x.key,Partido:r.party,Votos:r.votes,Porcentaje_validos:r.share})));
  full=result;const parties=[...new Set(result.map(x=>x.Partido))].sort((x,y)=>x.localeCompare(y,'es'));old=$('a26-detail-party').value;$('a26-detail-party').innerHTML='<option value="">Todos los partidos</option>'+parties.map(q=>`<option value="${esc(q)}">${esc(q)}</option>`).join('');if(parties.includes(old))$('a26-detail-party').value=old;
  current={year:y,arena:s.arena,province:p,level:l,zone,geo};let nation=dataMetric(y,s.arena,p==='Costa Rica'?'n':'p',p==='Costa Rica'?'CR':p);
  let mm=zone!=='all'?dataMetric(y,s.arena,l,zone):nation;
  $('a26-detail-summary').innerHTML=[['Votos válidos',fmt(mm?.validos)],['Emitidos',fmt(mm?.emitidos)],['Participación',fmt(mm?.part_pct,2)+' %'],['Abstención',fmt(mm?.abst_pct,2)+' %'],['Blancos',fmt(mm?.blancos)],['Nulos',fmt(mm?.nulos)]].map(([lab,val])=>`<div><small>${lab}</small><strong>${val}</strong></div>`).join('');
  $('a26-detail-title').textContent=`${names[s.arena]} · ${p} · ${y} · ${l==='n'?'Costa Rica':l==='p'?'Provincias':l==='c'?'Cantones':'Distritos'}`;
  const oldMap=root.querySelector('[data-role="map"]')?.closest('.ar-panel');if(oldMap){oldMap.hidden=s.arena==='R';} const oldBars=root.querySelector('[data-role="bars"]')?.closest('.ar-panel');if(oldBars)oldBars.hidden=s.arena==='R';const oldTable=root.querySelector('[data-role="body"]')?.closest('.ar-panel');if(oldTable)oldTable.hidden=s.arena==='R';const comp=root.querySelector('[data-role="comp-table"]')?.closest('.ar-integration');if(comp)comp.hidden=s.arena==='R';
  mapDiv.hidden=s.arena!=='R';if(s.arena==='R')prepareGeo(y,s.arena);else{mapDiv.replaceChildren();}
  const candidat=(V.nomination_rows||[]).filter(x=>x.year===y&&x.arena===(s.arena==='L'?'L':'P')&&(s.arena!=='L'||p==='Costa Rica'||x.province===p));
  nominal=candidat;nomPage=0;drawNominal();page=0;drawTable();
 }
 function drawTable(){const search=$('a26-detail-search').value.toLocaleLowerCase('es'),party=$('a26-detail-party').value;
  filtered=full.filter(x=>(!party||x.Partido===party)&&(!search||[x.Territorio,x.Provincia,x.Partido].some(v=>String(v).toLocaleLowerCase('es').includes(search))));
  const steps=90;page=Math.max(0,Math.min(page,Math.max(0,Math.ceil(filtered.length/steps)-1)));const rows=filtered.slice(page*steps,(page+1)*steps);
  $('a26-detail-counter').textContent=`${fmt(filtered.length)} resultados · ${fmt(full.length)} registros en selección`;
  $('a26-detail-table').innerHTML='<thead><tr><th>Territorio</th><th>Provincia</th><th>Partido</th><th>Votos</th><th>% de válidos</th><th>Detalle</th></tr></thead><tbody>'+rows.map(r=>`<tr><td>${esc(r.Territorio)}</td><td>${esc(r.Provincia)}</td><td><span class="a25-swatch" style="background:${partyColor(r.Partido)}"></span>${esc(r.Partido)}</td><td>${fmt(r.Votos)}</td><td><strong>${fmt(r.Porcentaje_validos,2)} %</strong></td><td>${current.level==='p'?`<button data-open-province="${esc(r.Codigo)}">Ver cantones</button>`:current.level==='c'?`<button data-open-canton="${esc(r.Codigo)}">Ver distritos</button>`:'—'}</td></tr>`).join('')+'</tbody>';
  $('a26-detail-page').textContent=`Página ${page+1} de ${Math.max(1,Math.ceil(filtered.length/steps))}`;
  $('a26-detail-prev').disabled=page===0;$('a26-detail-next').disabled=(page+1)*steps>=filtered.length;
  const rows2=filtered.slice(0,35).reverse();$('a26-detail-plot').hidden=false;graph($('a26-detail-plot'),[{type:'bar',orientation:'h',x:rows2.map(r=>r.Porcentaje_validos),y:rows2.map(r=>r.Partido+' · '+r.Territorio),marker:{color:rows2.map(r=>partyColor(r.Partido))},customdata:rows2.map(r=>r.Votos),hovertemplate:'%{y}<br>%{x:.2f}% · %{customdata:,} votos<extra></extra>'}],{height:Math.max(410,rows2.length*26+95),margin:{l:255,r:65,t:20,b:55},xaxis:{title:'% de votos válidos'}});
 }
 $('a26-detail-table').addEventListener('click',event=>{
  const prov=event.target.closest('[data-open-province]'),cant=event.target.closest('[data-open-canton]');
  if(prov){const dropdown=root.querySelector('[data-role="province"]');if(dropdown){dropdown.value=prov.dataset.openProvince;dropdown.dispatchEvent(new Event('change',{bubbles:true}));}selectedCanton='';$('a26-detail-level').value='c';sync();}
  if(cant){selectedCanton=cant.dataset.openCanton;$('a26-detail-level').value='d';sync();}
 });
 $('a27-geo-nav').addEventListener('click',event=>{const b=event.target.closest('[data-level]');if(!b)return;selectedCanton='';const original=root.querySelector('[data-role="province"]');if(b.dataset.level==='n'&&original){original.value='Costa Rica';original.dispatchEvent(new Event('change',{bubbles:true}))}$('a26-detail-level').value=b.dataset.level;sync()});
 $('a27-province-jump').addEventListener('click',event=>{const b=event.target.closest('[data-province]');if(!b)return;const d=root.querySelector('[data-role="province"]');if(d){d.value=b.dataset.province;d.dispatchEvent(new Event('change',{bubbles:true}));}$('a26-detail-level').value='c';sync()});
 function drawNominal(){const needle=$('a26-nom-search').value.toLowerCase(),status=$('a26-nom-status').value;
  nominalFiltered=nominal.filter(x=>(status==='all'||(status==='yes')===Boolean(x.elected))&&(!needle||[x.name,x.party,x.office].some(v=>String(v).toLowerCase().includes(needle))));
  const max=(nomPage+1)*70;$('a26-nom-count').textContent=`${fmt(nominalFiltered.length)} candidaturas registradas`; $('a26-nom-grid').innerHTML=nominalFiltered.slice(0,max).map(x=>`<div class="a25-nom"><span class="a25-swatch" style="background:${partyColor(x.party)}"></span><div><b>${esc(x.name)}</b><small>${esc(x.party)} · ${esc(x.office)}${x.province==='Nacional'?'':' · '+esc(x.province)}</small></div><span class="a25-outcome ${x.elected?'is-elected':''}">${x.elected?'✓ Electa':'Candidatura'}</span></div>`).join('');$('a26-nom-more').hidden=nominalFiltered.length<=max;
 }
 area.querySelectorAll('select').forEach(c=>c.addEventListener('change',e=>{if(e.target.id==='a26-detail-party')drawTable();else if(e.target.id==='a26-nom-status')drawNominal();else {if(e.target.id==='a26-detail-level')selectedCanton='';sync()}}));
 $('a26-detail-search').addEventListener('input',()=>{page=0;drawTable()});$('a26-nom-search').addEventListener('input',()=>{nomPage=0;drawNominal()});
 $('a26-detail-prev').onclick=()=>{page--;drawTable()};$('a26-detail-next').onclick=()=>{page++;drawTable()};$('a26-nom-more').onclick=()=>{nomPage++;drawNominal()};
 $('a26-nom-csv').onclick=()=>csv(nominalFiltered.map(x=>({eleccion:x.year,arena:x.arena,provincia:x.province,partido:x.party,persona:x.name,cargo:x.office,electa:x.elected})),'atlas_candidaturas_seleccionadas.csv');
 area.querySelectorAll('[data-atlas-export]').forEach(b=>b.addEventListener('click',async()=>{const ext=b.dataset.atlasExport,file=`atlas_resultados_${current.year}_${current.arena}_${current.level}`;
  if(ext==='csv')return csv(filtered,file+'.csv');const plot=$('a26-detail-plot');if(!plot.hidden&&plot.data?.length)await Plotly.downloadImage(plot,{format:ext,filename:file,width:1600,height:Math.max(750,plot.offsetHeight),scale:ext==='png'?2:1});else return downloadMatrix(matrixSVG(area.querySelector('.a26-big-table'),$('a26-detail-title').textContent),ext,file);}));
 root.addEventListener('change',e=>{if(!area.contains(e.target)){if(e.target.matches('[data-role=\"province\"]')){selectedCanton='';$('a26-detail-level').value=e.target.value==='Costa Rica'?'p':'c';}sync()}},true);
 root.addEventListener('click',e=>{if(!area.contains(e.target))setTimeout(sync,65)},true);
 root.addEventListener('atlas-results-updated',sync);
 const head=shell.querySelector('.ar-top');if(head){head.querySelector('.ar-eyebrow').textContent='CONSULTA ELECTORAL · RESULTADOS Y CANDIDATURAS';head.querySelector('h2').textContent='Resultados electorales · Presidencia y Asamblea';head.querySelector('p:not(.ar-eyebrow)').textContent='Explore la elección, su mapa provincial, la distribución partidaria y el detalle cantonal o distrital dentro de una misma consulta.';}
 sync();
}

/* Sección 02. Rankings comparables por puesto y matrices por territorio. */
function participationExplorer(){
 const container=document.getElementById('content');
 if(!container||container.querySelector('#atlas-v27-participacion'))return;
 const sec=block('Participación electoral · territorios y tendencias','Explore los indicadores y sus cambios entre elecciones, desde las provincias hasta los cantones y distritos administrativos.','atlas-v27-participacion');
 const fields=[['abst_pct','Abstencionismo (%)'],['part_pct','Participación (%)'],['valid_pct','Votos válidos / emitidos (%)'],['blancos_pct','Votos en blanco / emitidos (%)'],['nulos_pct','Votos nulos / emitidos (%)'],['noval_pct','Votos no válidos / emitidos (%)'],['abstenciones','Abstenciones (cantidad)'],['validos','Votos válidos (cantidad)'],['emitidos','Votos emitidos (cantidad)'],['blancos','Votos blancos (cantidad)'],['nulos','Votos nulos (cantidad)']];
 sec.innerHTML+=`<div class="a27-controls">${select('a27-p-arena','Elección',[['L','Diputaciones'],['P','Presidencia'],['R','Segunda ronda presidencial']])}${select('a27-p-scale','Escala territorial',[['p','Provincias'],['c','Cantones'],['d','Distritos']])}${select('a27-p-indicator','Indicador',fields)}${select('a27-p-mode','Forma de comparación',[['top10','Los diez primeros de cada elección'],['matrix','Matriz territorial completa'],['first','Primer territorio por elección'],['single','Ranking de una elección']])}${select('a27-p-direction','Orden',[['desc','Mayor a menor'],['asc','Menor a mayor']])}${select('a27-p-year','Elección de detalle',years.map(y=>[String(y),String(y)]))}</div>
 <div id="a27-p-status" class="a27-status"></div><div id="a27-p-kpis" class="a26-metric-cards" hidden></div>
 <div class="a27-section-title"><div><h4 id="a27-p-title"></h4><p id="a27-p-subtitle"></p></div>${buttons}</div>
 <div id="a27-p-table-region" class="a27-scroll-matrix"></div><div id="a27-p-plot" class="a27-p-plot" hidden></div><div id="a27-p-details" class="a27-small-table"></div>`;
 (container.querySelector('.section-head')||container.firstChild)?.after(sec);
 const $=id=>sec.querySelector('#'+id),palette={'San José':'#278e96','Alajuela':'#346ab2','Cartago':'#7859ad','Heredia':'#308c76','Guanacaste':'#c47b46','Puntarenas':'#297eaa','Limón':'#a65d87'};
 const nvalid=(v)=>v!==null&&v!==undefined&&Number.isFinite(Number(v));
 const unit=m=>m.endsWith('_pct')?'%':'';
 const dec=m=>m.endsWith('_pct')?1:0;
 const shown=(v,m)=>nvalid(v)?`${fmt(v,dec(m))}${unit(m)}`:'—';
 const territoryInfo=(l,r)=>l==='p'?{name:r.key,province:r.key,sub:''}:l==='c'?{name:cantonIndex.get(String(r.key))?.name||r.key,province:cantonIndex.get(String(r.key))?.province||'',sub:''}:{name:districtIndex.get(String(r.key))?.name||r.key,province:districtIndex.get(String(r.key))?.province||'',sub:districtIndex.get(String(r.key))?.canton||''};
 const universe=(y,a,l,m)=>dataRows.filter(r=>r.arena===a&&r.level===l&&r.year===y&&nvalid(r[m])).map(r=>({...r,...territoryInfo(l,r)}));
 const sort=(arr,m,dir)=>arr.sort((x,z)=>(dir==='desc'?+z[m]- +x[m]:+x[m]- +z[m])||String(x.key).localeCompare(String(z.key)));
 let exportRows=[],plot=false,matrixMode=false;
 function matrix(head,body,footer){return `<table class="a27-matrix"><thead>${head}</thead><tbody>${body}</tbody><tfoot>${footer}</tfoot></table>`}
 function heading(label,ys,first='Territorio'){return `<tr><th class="a27-freeze-col">${esc(label)}</th>${ys.map(y=>`<th>${y}</th>`).join('')}</tr>`}
 function rankMatrix(yset,a,l,m,dir){
  const ordered=new Map(yset.map(y=>[y,sort(universe(y,a,l,m),m,dir).slice(0,10)]));exportRows=[];
  let body='';
  for(let pos=0;pos<10;pos++){
   body+=`<tr><th class="a27-freeze-col a27-rank-label">${pos+1}.º</th>`;
   for(const y of yset){const r=(ordered.get(y)||[])[pos];if(!r){body+='<td class="a27-missing">—</td>';continue}
    exportRows.push({eleccion:y,puesto:pos+1,escala:l,provincia:r.province,canton:r.sub||'',territorio:r.name,codigo:r.key,indicador:m,valor:r[m]});
    const color=palette[r.province]||'#54809a';
    body+=`<td class="a27-rank-cell" style="--a27-territory-color:${color}" title="${esc(r.name)} · ${esc(r.sub)} · ${esc(r.province)} · ${y} · ${shown(r[m],m)}"><span class="a27-geo-label">${esc(r.name)}</span><small>${esc(r.sub?r.sub+' · '+r.province:r.province)}</small><strong>${shown(r[m],m)}</strong></td>`;
   }body+='</tr>';
  }
  $('a27-p-table-region').innerHTML=matrix(heading('Puesto',yset),body,heading('Puesto',yset));
  $('a27-p-subtitle').textContent=`Exactamente diez posiciones por elección. Cada puesto puede pertenecer a un territorio diferente en otro año. ${dir==='desc'?'Valores mayores primero.':'Valores menores primero.'}`;
 }
 function completeMatrix(yset,a,l,m){
  const items=l==='p'?provinces.map(p=>({key:p,name:p,province:p,sub:''})):l==='c'?cantons.map(c=>({key:c.code,name:c.name,province:c.province,sub:''})):districts.map(d=>({key:d.code,name:d.name,province:d.province,sub:d.canton}));
  items.sort((x,z)=>provinces.indexOf(x.province)-provinces.indexOf(z.province)||x.name.localeCompare(z.name,'es'));
  exportRows=[];let body='',last='';
  for(const u of items){if(last!==u.province){last=u.province;body+=`<tr class="a27-prov-divider"><th colspan="${yset.length+1}">${esc(last)}</th></tr>`}
   body+=`<tr><th class="a27-freeze-col" title="${esc(u.sub)} · ${esc(u.province)}">${esc(u.name)}${u.sub?`<small>${esc(u.sub)}</small>`:''}</th>`;
   for(const y of yset){const r=dataMetric(y,a,l,u.key);const val=r?.[m];const exists=l==='p'||(l==='c'?V.canton_years[u.key]:V.district_years[u.key])?.includes(y);
    const css=nvalid(val)?'a27-intensity':'a27-missing';const amt=nvalid(val)?Math.max(.12,Math.min(.96,Number(val)/(m.endsWith('_pct')?100:Math.max(1,Math.max(...yset.map(q=>Number(dataMetric(q,a,l,u.key)?.[m]||0))))))):0;
    exportRows.push({eleccion:y,escala:l,provincia:u.province,territorio:u.name,canton:u.sub,codigo:u.key,indicador:m,valor:nvalid(val)?val:null,estado:nvalid(val)?'Observado':exists?'Sin dato':'No existía'});
    body+=`<td class="${css}" ${nvalid(val)?`style="--a27-alpha:${amt.toFixed(3)}"`:''} title="${esc(u.name)} · ${y} · ${nvalid(val)?shown(val,m):exists?'Sin dato':'No existía en la elección'}">${nvalid(val)?shown(val,m):exists?'—':'×'}</td>`;
   }body+='</tr>';
  }
  if(l!=='d'){body+=`<tr class="a27-national"><th class="a27-freeze-col">Costa Rica</th>`+yset.map(y=>{const r=dataMetric(y,a,'n','CR');exportRows.push({eleccion:y,escala:'n',provincia:'Costa Rica',territorio:'Costa Rica',indicador:m,valor:r?.[m]??null});return `<td>${shown(r?.[m],m)}</td>`}).join('')+'</tr>'}
  $('a27-p-table-region').innerHTML=matrix(heading('Territorio',yset),body,heading('Territorio',yset));
  $('a27-p-subtitle').textContent=`Territorios agrupados por provincia; × significa que el territorio no figuraba en esa elección. El total nacional aparece al final cuando corresponde.`;
 }
 function singleYear(y,a,l,m,dir){
  const rank=sort(universe(y,a,l,m),m,dir).slice(0,10);
  exportRows=rank.map((r,i)=>({eleccion:y,puesto:i+1,provincia:r.province,canton:r.sub||'',territorio:r.name,codigo:r.key,indicador:m,valor:r[m]}));
  const b=rank.slice().reverse();$('a27-p-table-region').innerHTML='';$('a27-p-plot').hidden=false;plot=true;
  graph($('a27-p-plot'),[{type:'bar',orientation:'h',x:b.map(r=>r[m]),y:b.map(r=>r.name+(r.sub?' · '+r.sub:'')),marker:{color:b.map(r=>palette[r.province]||'#557f90')},text:b.map(r=>shown(r[m],m)),textposition:'outside',hovertemplate:'%{y}<br>%{x:,.2f}<extra></extra>'}],{height:525,margin:{l:290,r:100,t:30,b:65},xaxis:{title:fields.find(r=>r[0]===m)?.[1]}});
  $('a27-p-subtitle').textContent=`Diez territorios de ${y}, ordenados en todo el país, no por provincia.`;
 }
 function yearlyFirst(yset,a,l,m,dir){
  exportRows=yset.map(y=>{const r=sort(universe(y,a,l,m),m,dir)[0];return {eleccion:y,provincia:r?.province||'',territorio:r?.name||'',canton:r?.sub||'',codigo:r?.key||'',indicador:m,valor:r?.[m]??null}});
  $('a27-p-table-region').innerHTML='';$('a27-p-plot').hidden=false;plot=true;
  graph($('a27-p-plot'),[{type:'scatter',mode:'lines+markers',x:exportRows.map(q=>q.eleccion),y:exportRows.map(q=>q.valor),customdata:exportRows.map(q=>[q.territorio,q.canton,q.provincia]),line:{color:'#147b88',width:2.8},marker:{size:10,color:exportRows.map(q=>palette[q.provincia]||'#557f90')},hovertemplate:'%{x} · %{customdata[0]}<br>%{customdata[1]} · %{customdata[2]}<br>Valor: %{y:,.2f}<extra></extra>'}],{height:480,margin:{l:90,r:45,t:25,b:100},xaxis:{tickmode:'array',tickvals:yset,tickangle:-50,title:'Elección'},yaxis:{title:fields.find(q=>q[0]===m)?.[1]}});
  $('a27-p-subtitle').textContent='La serie representa el valor extremo de cada elección; el nombre del territorio aparece en la tabla y en el cursor.';
 }
 function draw(){
  const a=$('a27-p-arena').value,l=$('a27-p-scale').value,m=$('a27-p-indicator').value,view=$('a27-p-mode').value,dir=$('a27-p-direction').value,y=+$('a27-p-year').value;
  const ys=years.filter(z=>a!=='R'||haveRound.has(z));const one=y&&ys.includes(y)?y:ys[ys.length-1];
  $('a27-p-year').closest('label').hidden=view!=='single';
  $('a27-p-kpis').hidden=view!=='single';
  $('a27-p-title').textContent=`${fields.find(z=>z[0]===m)?.[1]} · ${names[a]} · ${l==='p'?'Provincias':l==='c'?'Cantones':'Distritos'}`;
  $('a27-p-table-region').hidden=false;$('a27-p-plot').hidden=true;$('a27-p-details').innerHTML='';matrixMode=false;plot=false;
  const national=dataMetric(one,a,'n','CR');
  $('a27-p-kpis').innerHTML=[['Abstencionismo',national?.abst_pct,'%'],['Participación',national?.part_pct,'%'],['Votos válidos',national?.validos,''],['Votos en blanco',national?.blancos,''],['Votos nulos',national?.nulos,''],['Emitidos',national?.emitidos,'']].map(([k,v,s])=>`<div><small>${k} · ${one}</small><strong>${shown(v,s?'part_pct':'validos')}</strong></div>`).join('');
  const actual=(view==='matrix'&&l==='d')?'top10':view;
  const description=actual==='top10'?'Diez puestos por elección':actual==='matrix'?'Matriz longitudinal de territorios':actual==='single'?'Clasificación de una elección':'Territorio principal en cada elección';
  $('a27-p-status').textContent=`${description} · ${ys.length} elecciones · ${l==='d'?'distritos administrativos':l==='c'?'cantones':'provincias'}`;
  if(actual==='top10'){rankMatrix(ys,a,l,m,dir);matrixMode=true}
  if(actual==='matrix'){completeMatrix(ys,a,l,m);matrixMode=true}
  if(actual==='single'){singleYear(one,a,l,m,dir)}
  if(actual==='first'){yearlyFirst(ys,a,l,m,dir)}
  if(actual==='first'||actual==='single'){
   $('a27-p-details').innerHTML='<table><thead><tr><th>Elección</th><th>#</th><th>Territorio</th><th>Provincia</th><th>Indicador</th></tr></thead><tbody>'+exportRows.map(r=>`<tr><td>${r.eleccion}</td><td>${r.puesto??'1'}</td><td>${esc(r.territorio)}</td><td>${esc(r.provincia)}</td><td>${shown(r.valor,m)}</td></tr>`).join('')+'</tbody></table>';
  }
 }
 sec.querySelectorAll('select').forEach(s=>s.addEventListener('change',draw));
 sec.querySelectorAll('[data-atlas-export]').forEach(b=>b.addEventListener('click',async()=>{
  const extension=b.dataset.atlasExport,file=`participacion_${$('a27-p-indicator').value}_${$('a27-p-scale').value}_${$('a27-p-mode').value}`;
  if(extension==='csv')return csv(exportRows,file+'.csv');
  if(matrixMode)return downloadMatrix(matrixSVG($('a27-p-table-region'),$('a27-p-title').textContent),extension,file);
  if(plot)await Plotly.downloadImage($('a27-p-plot'),{format:extension,filename:file,width:1750,height:850,scale:extension==='png'?2:1});
 }));
 $('a27-p-mode').value='top10';$('a27-p-scale').value='c';$('a27-p-year').value='2026';draw();
}

function matrixSVG(dom,title){
 const table=dom.querySelector('table');if(!table)return '<svg xmlns="http://www.w3.org/2000/svg"/>';
 const rect=table.getBoundingClientRect(),w=Math.ceil(Math.max(650,table.scrollWidth+32)),h=Math.ceil(table.scrollHeight+80);
 const cells=[...table.querySelectorAll('th,td')];
 let s=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#fff"/><text x="18" y="29" font-family="Arial" font-weight="700" font-size="19" fill="#184358">${esc(title)}</text>`;
 for(const cell of cells){const r=cell.getBoundingClientRect(),st=getComputedStyle(cell),x=r.left-rect.left+12,y=r.top-rect.top+52,fill=st.backgroundColor==='rgba(0, 0, 0, 0)'?'#f6f9fb':st.backgroundColor;
  const color=cell.querySelector('.a26-party-cell')?getComputedStyle(cell.querySelector('.a26-party-cell')).backgroundColor:fill;
  s+=`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(1,r.width-2).toFixed(1)}" height="${Math.max(1,r.height-1).toFixed(1)}" rx="2" fill="${esc(color)}"/>`;
  const text=cell.textContent.trim().slice(0,31),textColor=cell.querySelector('.a26-party-cell')||cell.classList.contains('a25-leader')?'#ffffff':'#274c60';
  if(text)s+=`<text x="${(x+4).toFixed(1)}" y="${(y+r.height*.69).toFixed(1)}" font-family="Arial" font-size="${r.width<66?9:11}" fill="${textColor}">${esc(text)}</text>`;
 }
 return s+'</svg>';
}
function downloadMatrix(svg,kind,file){if(kind==='svg')return download(file+'.svg',svg,'image/svg+xml');if(kind!=='png')return;const u=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'})),im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;c.getContext('2d').drawImage(im,0,0);c.toBlob(b=>{if(b)download(file+'.png',b,'image/png');URL.revokeObjectURL(u)})};im.onerror=()=>URL.revokeObjectURL(u);im.src=u}
/* Sección 08. Los mapas/matrices provinciales originales son la vista inicial y no se sustituyen. */
function partiesExplorer(){
 const container=document.getElementById('content');if(!container||document.getElementById('atlas-v26-leadership'))return;
 const head=[...container.querySelectorAll('.atlas17-subhead,h2,h3,h4')].find(h=>/Liderazgos por provincia y arena/i.test(h.textContent));
 const oldCharts=[...container.querySelectorAll('.card,article.card,section.card')].filter(c=>/Partido más votado por provincia|Liderazgos provinciales y referencia de los colores/i.test(c.querySelector('h3')?.textContent||''));
 const sec=block('Liderazgos provinciales y cantonales','Consulte los primeros lugares por partido en las 19 elecciones. Alterne entre provincias y cantones.','atlas-v26-leadership');
 sec.innerHTML+=`<div class="a26-tools">${select('a26-win-level','División territorial',[['p','Provincias'],['c','Cantones']])}${select('a26-win-arena','Arena',[['L','Diputaciones'],['P','Presidencia · primera ronda']])}</div>
 <div class="a26-canton-only" id="a26-canton-content" hidden><div class="a26-chart-title"><h4>Matriz histórica de partidos más votados</h4>${buttons}</div><div class="a26-canton-wrap" id="a26-win-matrix"></div><div class="a26-election-case" id="a26-win-case">Seleccione una celda para consultar el partido ganador y el detalle de votos.</div></div>`;
 if(head){head.after(sec)}else container.prepend(sec);
 const $=id=>sec.querySelector('#'+id);let active=[];
 function render(){const l=$('a26-win-level').value,a=$('a26-win-arena').value;
  $('a26-canton-content').hidden=l!=='c';oldCharts.forEach(c=>c.hidden=l==='c');
  // La vista de provincias conserva su posición en la sección.
  if(l!=='c')return;
  const cats=provinces.flatMap(p=>cantons.filter(x=>x.province===p).sort((x,y)=>x.name.localeCompare(y.name,'es')));let last='';active=[];
  let html='<table class="a26-history-matrix"><thead><tr><th class="a26-first-col">Provincia</th><th class="a26-second-col">Cantón</th><th colspan="19" class="a26-grid-heading">ELECCIONES HISTÓRICAS →</th></tr></thead><tbody>';
  for(const c of cats){if(c.province!==last){last=c.province;html+=`<tr class="a26-prov-row"><th colspan="21">${esc(last)}</th></tr>`}
   html+=`<tr><td class="a26-province-col"></td><th class="a26-canton-col">${esc(c.name)}</th>`;
   for(const yr of years){const w=leaders.get(key(yr,a,'c',c.code));const exist=V.canton_years[c.code]?.includes(yr);active.push({anio:yr,provincia:c.province,canton:c.name,codigo:c.code,partido:w?.party??'',votos:w?.votes??null,porcentaje:w?.share??null,estado:!exist?'No existía en esa elección':w?'Con resultados':'Sin observación'});
    html+=w?`<td><button type="button" class="a26-party-cell" data-canton="${c.code}" data-year="${yr}" style="background:${partyColor(w.party)}" title="${esc(w.party)} · ${yr} · ${fmt(w.votes)} votos · ${fmt(w.share,2)}%"><span>${fmt(w.share,0)}%</span></button></td>`:`<td class="a26-no-cell" title="${exist?'Sin registro':'Cantón no existente o sin observación histórica'}">${exist?'—':'×'}</td>`;
   }html+='</tr>';
  }
  html+='<tr class="a26-national"><th colspan="2">Costa Rica · Partido más votado</th>'+years.map(yr=>{const w=leaders.get(key(yr,a,'n','CR'));return w?`<td><button type="button" class="a26-party-cell" data-canton="CR" data-year="${yr}" style="background:${partyColor(w.party)}" title="${esc(w.party)} · ${fmt(w.votes)} votos">${fmt(w.share,0)}%</button></td>`:'<td>—</td>'}).join('')+'</tr>';
  html+='</tbody><tfoot><tr><th>Provincia</th><th>Cantón</th>'+years.map(yr=>`<th>${yr}</th>`).join('')+'</tr></tfoot></table>';
  $('a26-win-matrix').innerHTML=html;
 }
 $('a26-win-matrix').addEventListener('click',e=>{const button=e.target.closest('[data-canton]');if(!button)return;const code=button.dataset.canton,y=+button.dataset.year,a=$('a26-win-arena').value,l=code==='CR'?'n':'c',w=leaders.get(key(y,a,l,code));if(!w)return;
  const associated=dataVotes(y,a,l,code).slice(0,12);const territory=code==='CR'?'Costa Rica':cantonIndex.get(code)?.name+' · '+cantonIndex.get(code)?.province;
  $('a26-win-case').innerHTML=`<div class="a26-case-title"><span class="a26-color-dot" style="background:${partyColor(w.party)}"></span><div><span>${y} · ${esc(territory)} · ${esc(names[a])}</span><h4>${esc(w.party)}</h4><p>${fmt(w.votes)} votos · ${fmt(w.share,2)}% de válidos</p></div></div><div class="a26-case-parties">${associated.map(r=>`<div><span class="a25-swatch" style="background:${partyColor(r.party)}"></span>${esc(r.party)} <strong>${fmt(r.share,2)}%</strong></div>`).join('')}</div><button class="a26-primary" id="a26-win-profile">Abrir ficha histórica del partido</button>`;
  $('a26-win-profile').onclick=()=>{window.AtlasV26SelectedParty=w.party;const nav=document.querySelector('[data-tab="perfiles"]');if(nav)nav.click();else window.gotoTab?.('perfiles')};
 });
 sec.querySelectorAll('select').forEach(e=>e.addEventListener('change',render));
 sec.querySelectorAll('[data-atlas-export]').forEach(b=>b.addEventListener('click',()=>{const ext=b.dataset.atlasExport,file=`liderazgo_cantonal_${$('a26-win-arena').value}`;if(ext==='csv')return csv(active,file+'.csv');return downloadMatrix(matrixSVG($('a26-win-matrix'),'Liderazgo cantonal · '+names[$('a26-win-arena').value]),ext,file)}));
 render();
}

function historicStrongholds(){
 const container=document.getElementById('content');if(!container||document.getElementById('atlas-v25-bastiones'))return;
 const sec=block('Bastiones electorales · fortaleza y persistencia','Compare las organizaciones con participación reiterada y apoyo significativo. Consulte ventajas sobre el porcentaje nacional y su recurrencia histórica.','atlas-v25-bastiones');
 const statistics=new Map();for(const r of voteRows.filter(r=>r.level==='n'&&r.arena==='L')){const k=norm(r.party);if(!statistics.has(k))statistics.set(k,{party:r.party,years:new Set(),max:0,total:0,elected:false});const q=statistics.get(k);q.years.add(r.year);q.max=Math.max(q.max,r.share||0);q.total+=r.votes||0;}
 const electa=new Set((V.nomination_rows||[]).filter(r=>r.arena==='L'&&r.elected).map(r=>norm(r.party)));for(const [k,v] of statistics)v.elected=electa.has(k);
 const all=[...statistics.values()].filter(q=>q.years.size>=2&&(q.elected||q.max>=3)).sort((a,b)=>b.years.size-a.years.size||b.total-a.total).map(q=>q.party);
 if(!all.length)return;
 sec.innerHTML+=`<div class="a25-controls">${select('a25-b-arena','Arena',[['L','Diputaciones'],['P','Presidencia']])}${select('a25-b-level','Territorio',[['c','Cantón'],['d','Distrito'],['p','Provincia']])}${select('a25-b-party','Partido',all.map(p=>[p,p]))}${select('a25-b-scope','Evaluación',[['historic','Persistencia histórica'],['year','Ventaja en una elección']])}${select('a25-b-year','Elección',years.map(y=>[y,y]))}</div><div class="a25-charts-heading"><h4 id="a25-b-title">Bastiones electorales</h4>${buttons}</div><div id="a25-b-chart" class="a25-plot"></div><div class="a25-tablewrap"><table id="a25-b-table"></table></div><div id="a25-b-case" class="a25-case">Seleccione un territorio para examinar sus resultados a lo largo del tiempo.</div><div id="a25-b-trend" class="a25-plot"></div>`;
 container.append(sec);const $=id=>sec.querySelector('#'+id);let current=[];
 function build(){const a=$('a25-b-arena').value,l=$('a25-b-level').value,p=$('a25-b-party').value,year=+$('a25-b-year').value,scope=$('a25-b-scope').value;
  $('a25-b-year').closest('label').hidden=scope==='historic';
  const national=new Map(voteRows.filter(r=>r.level==='n'&&r.arena===a&&norm(r.party)===norm(p)).map(r=>[r.year,r.share]));
  const records=voteRows.filter(r=>r.arena===a&&r.level===l&&norm(r.party)===norm(p)&&national.has(r.year)).map(r=>({eleccion:r.year,territorio:label(l,String(r.key)),codigo:String(r.key),partido:r.party,votos:r.votes,porcentaje_local:r.share,porcentaje_pais:national.get(r.year),ventaja_pp:r.share-national.get(r.year)}));
  let grouped=new Map();for(const r of records){if(!grouped.has(r.codigo))grouped.set(r.codigo,[]);grouped.get(r.codigo).push(r)}
  current=[...grouped].map(([k,rs])=>{const arr=scope==='year'?rs.filter(r=>r.eleccion===year):rs;const positive=arr.filter(r=>r.ventaja_pp>0);
   return {codigo:k,territorio:rs[0].territorio,partido:p,elecciones_observadas:arr.length,elecciones_con_ventaja:positive.length,porcentaje_elecciones_con_ventaja:arr.length?100*positive.length/arr.length:null,ventaja_media_pp:arr.length?arr.reduce((s,r)=>s+r.ventaja_pp,0)/arr.length:null,ventaja_maxima_pp:arr.length?Math.max(...arr.map(r=>r.ventaja_pp)):null};}).filter(r=>r.elecciones_observadas);
  current.sort((x,y)=>scope==='historic'?y.elecciones_con_ventaja-x.elecciones_con_ventaja||y.ventaja_media_pp-x.ventaja_media_pp:y.ventaja_media_pp-x.ventaja_media_pp);
  const top=current.slice(0,18).reverse();$('a25-b-title').textContent=`${p} · ${scope==='historic'?'Persistencia territorial':'Ventaja territorial '+year}`;
  $('a25-b-table').innerHTML='<thead><tr><th>Territorio</th><th>Elecciones analizadas</th><th>Con ventaja</th><th>% con ventaja</th><th>Ventaja media (pp)</th></tr></thead><tbody>'+current.slice(0,30).map(r=>`<tr><td>${esc(r.territorio)}</td><td>${r.elecciones_observadas}</td><td>${r.elecciones_con_ventaja}</td><td>${fmt(r.porcentaje_elecciones_con_ventaja,1)}%</td><td>${fmt(r.ventaja_media_pp,2)}</td></tr>`).join('')+'</tbody>';
  const xs=top.map(r=>scope==='historic'?r.elecciones_con_ventaja:r.ventaja_media_pp);
  graph($('a25-b-chart'),[{type:'bar',orientation:'h',y:top.map(r=>r.territorio),x:xs,customdata:top.map(r=>r.codigo),marker:{color:partyColor(p)},text:top.map(r=>scope==='historic'?`${r.elecciones_con_ventaja}/${r.elecciones_observadas}`:fmt(r.ventaja_media_pp,2)+' pp'),textposition:'outside',hovertemplate:'%{y}<br>%{text}<extra></extra>'}],{height:Math.max(520,top.length*29+110),margin:{l:270,r:70,t:20,b:80},xaxis:{title:scope==='historic'?'Elecciones con ventaja sobre Costa Rica':'Ventaja porcentual respecto al país (pp)'}});
  $('a25-b-chart').removeAllListeners?.('plotly_click');$('a25-b-chart').on?.('plotly_click',ev=>{const code=ev.points?.[0]?.customdata;if(!code)return;const series=(grouped.get(code)||[]).sort((x,y)=>x.eleccion-y.eleccion);
   $('a25-b-case').innerHTML=`<strong>${esc(series[0]?.territorio||'')}</strong> · ${esc(p)}<p>Porcentajes locales frente al país en las elecciones observadas.</p>`;
   graph($('a25-b-trend'),[{type:'scatter',mode:'lines+markers',x:series.map(r=>r.eleccion),y:series.map(r=>r.ventaja_pp),line:{color:partyColor(p),width:2.5},marker:{size:9},hovertemplate:'%{x}<br>%{y:+.2f} pp<extra></extra>'}],{height:300,margin:{l:70,r:25,t:15,b:58},xaxis:{title:'Elección',tickmode:'array',tickvals:years,tickangle:-45},yaxis:{title:'Ventaja local (pp)',zeroline:true}});
  });
 }
 sec.querySelectorAll('select').forEach(e=>e.addEventListener('change',build));
 exportPlot(sec,'a25-b-chart',()=>current,()=>`bastiones_${$('a25-b-party').value.replace(/[^a-z0-9]+/gi,'_')}`);
 build();
}
function decorateIntro(){
 const el=document.getElementById('content');if(!el||el.querySelector('#atlas-v26-intro'))return;
 const photo=el.querySelector('.intro-photo')?.src||'';
 el.innerHTML=`<div id="atlas-v26-intro"><section class="a26-big-hero"><div><div class="a26-eyebrow">CIENCIA POLÍTICA · CIENCIA DE DATOS · INVESTIGACIÓN ELECTORAL</div><h2>Atlas Electoral de Costa Rica<br/>1953–2026</h2><p>73 años de historia electoral para consultar, comparar y comprender. Resultados presidenciales y legislativos, cantones, distritos, partidos, candidaturas, personas electas y representación política en una sola aplicación autónoma.</p><div class="a26-jump-row"><button type="button" onclick="gotoTab('panorama')">Explorar panorama</button><button type="button" onclick="gotoTab('gobierno')">Resultados electorales</button><button type="button" onclick="gotoTab('partidos')">Bastiones territoriales</button><button type="button" onclick="gotoTab('datos')">Centro de datos</button></div></div><div class="a26-identity">${photo?`<img class="a26-avatar" src="${photo}" alt="Fotografía de Juan Ignacio Garbanzo Fallas"/>`:''}<div class="a26-eyebrow">AUTOR Y DESARROLLADOR</div><h3>Juan Ignacio Garbanzo Fallas</h3><p>Politólogo · Economista en formación · Científico de datos. Investigación y desarrollo de ciencia de datos político-electoral en el marco de la Práctica Profesional de Ciencias Políticas (UCR), vinculada al IFED del Tribunal Supremo de Elecciones.</p><div class="a26-jump-row"><a href="https://www.linkedin.com/in/juan-ignacio-garbanzo-fallas-34ba65219" target="_blank" rel="noopener noreferrer">LinkedIn</a><a href="https://github.com/juaniflls" target="_blank" rel="noopener noreferrer">GitHub personal</a><a href="https://github.com/juaniflls/atlas-electoral-costa-rica" target="_blank" rel="noopener noreferrer">Repositorio del proyecto</a></div></div></section>
 <div class="a26-feature-cards"><div><span class="a26-kicker">COBERTURA</span><h3>19 elecciones</h3><p>1953–2026: Presidencia y Diputaciones con cuatro segundas rondas.</p></div><div><span class="a26-kicker">TERRITORIO</span><h3>7 provincias · 84 cantones</h3><p>Hasta 492 distritos administrativos observados en 2026. Series históricas según vigencia territorial.</p></div><div><span class="a26-kicker">INTEGRACIÓN</span><h3>8 bases de datos</h3><p>Resultados, candidaturas, diputaciones, organizaciones y diseño documental.</p></div><div><span class="a26-kicker">ETAPA POSTERIOR</span><h3>9.ª base prevista</h3><p>Diseños de papeletas presidenciales, una vez construida y validada su base documental.</p></div></div>
 <section class="intro-block"><div class="intro-blockhead"><div><div class="eyebrow">¿QUÉ PUEDO HACER AQUÍ?</div><h3>Explorar y analizar resultados con contexto</h3></div><p>Las secciones se organizan por pregunta electoral y se complementan entre sí.</p></div><div class="intro-featuregrid"><div class="intro-feature"><span class="num">01</span><h4>Participación y abstención</h4><p>Gráficas históricas, rankings territoriales, voto válido, blancos, nulos y cambios entre elecciones.</p></div><div class="intro-feature"><span class="num">02</span><h4>Presidencia y Asamblea</h4><p>Mapa provincial, escrutinio por territorio, segunda vuelta, composición legislativa y candidaturas.</p></div><div class="intro-feature"><span class="num">03</span><h4>Partidos y bastiones</h4><p>Liderazgos electorales, comparación de arenas, cuotas locales y persistencia de apoyos.</p></div><div class="intro-feature"><span class="num">04</span><h4>Personas y candidaturas</h4><p>Trayectorias, postulaciones simultáneas, diputaciones electas y relaciones nominales documentadas.</p></div><div class="intro-feature"><span class="num">05</span><h4>Explorador de datos</h4><p>Filtros, selección de variables y exportaciones personalizadas CSV/JSON, sin conexión.</p></div><div class="intro-feature"><span class="num">06</span><h4>Laboratorio estadístico</h4><p>Correlaciones, tendencias, agrupamientos exploratorios y consulta de series territoriales.</p></div></div></section>
 <section class="intro-block intro-methodgrid"><div class="intro-panel"><div class="eyebrow">METODOLOGÍA</div><h3>De documentos a indicadores reproducibles</h3><p>Las bases históricas se preservan, extraen, normalizan y concilian. Python reconstruye indicadores y Plotly presenta análisis en un HTML autocontenido. Las divisiones territoriales se identifican mediante códigos y años de existencia.</p><div class="intro-pipeline"><div class="intro-step"><b>01 · Inventario</b>Fuentes electorales</div><div class="intro-step"><b>02 · Digitalización</b>Extracción y preservación</div><div class="intro-step"><b>03 · Conciliación</b>Partidos y territorios</div><div class="intro-step"><b>04 · Integración</b>Ocho bases actuales</div><div class="intro-step"><b>05 · Análisis</b>Python y ciencia política</div><div class="intro-step"><b>06 · Entrega</b>HTML y datos abiertos</div></div></div><div class="intro-panel"><div class="eyebrow">CÓMO UTILIZAR EL ATLAS</div><h3>Elección, arena y territorio</h3><p>Seleccione primero una elección. Después compare Presidencia y Diputaciones, utilice la provincia como punto de entrada y consulte cantones y distritos desde el mismo explorador. Las celdas coloreadas muestran organizaciones partidarias y los valores son descargables.</p><p>Las cuatro épocas históricas se estudian mediante un notebook de investigación independiente; el Atlas público ofrece la serie completa sin fraccionarla.</p><p>Las candidaturas a diputaciones se votan como listas partidarias, por lo que sus votos no se atribuyen a personas individuales.</p></div></section></div>`;
}

/* Herramientas transversales: consulta personalizada, laboratorio y perfiles históricos. */
function atlasDataWorkbench(){
 const container=document.getElementById('content');if(!container||document.getElementById('atlas-v26-data'))return;
 const sec=block('Centro de datos · consulta personalizable','Seleccione una base, filtre su universo, elija columnas y descargue exactamente los registros consultados.','atlas-v26-data');
 const sources={
  metricas:{title:'Participación y escrutinio territorial',data:dataRows},
  votos:{title:'Votos por partido y territorio',data:voteRows},
  lideres:{title:'Primer lugar de cada territorio',data:leaderRows},
  quiebre:{title:'Distancia agregada presidencial–legislativa',data:(V.quiebre||[]).map(r=>({year:r[0],level:r[1],key:String(r[2]),quiebre_pp:r[3]}))},
  candidaturas:{title:'Candidaturas y resultados',data:V.nomination_rows||[]}
 };
 sec.innerHTML+=`<div class="a26-tools">${select('a26-data-set','Base de datos',Object.entries(sources).map(([k,v])=>[k,v.title]))}${select('a26-data-year','Elección',[['all','Todas las elecciones'],...years.map(y=>[String(y),String(y)])])}${select('a26-data-arena','Arena',[['all','Ambas arenas'],['P','Presidencial 1.ª ronda'],['L','Legislativa'],['R','Presidencial 2.ª ronda']])}${select('a26-data-level','Escala territorial',[['all','Todas las escalas'],['n','Nacional'],['p','Provincia'],['c','Cantón'],['d','Distrito']])}<label>Buscar partido, persona o código<input id="a26-data-search" type="search" placeholder="Partido, nombre, territorio…"/></label></div>
 <div class="a26-tools"><label>Operación<select id="a26-data-operation"><option value="detail">Consulta de registros</option><option value="aggregate">Resumen por dimensión</option><option value="pivot">Cruce de filas y columnas</option></select></label>${select('a26-data-group','Agrupar por',[['year','Año'],['arena','Arena'],['party','Partido'],['province','Provincia'],['level','Escala'],['key','Código territorial']])}${select('a27-data-row','Filas (X)',[['key','Territorio / código'],['party','Partido'],['year','Año'],['arena','Arena'],['level','División territorial'],['province','Provincia'],['office','Cargo']])}${select('a27-data-column','Columnas (Y)',[['year','Elección'],['arena','Arena'],['level','División territorial'],['party','Partido'],['province','Provincia'],['office','Cargo']])}${select('a26-data-measure','Indicador numérico',[['votes','Votos'],['validos','Votos válidos'],['abstenciones','Abstenciones'],['share','% votos válidos'],['part_pct','Participación %'],['abst_pct','Abstención %'],['quiebre_pp','Quiebre (pp)']])}<label>Función<select id="a26-data-agg"><option value="sum">Suma</option><option value="mean">Promedio</option><option value="max">Máximo</option><option value="min">Mínimo</option></select></label></div>
 <div class="a26-fields-head"><strong>Columnas de exportación</strong><button type="button" id="a26-data-all">Seleccionar todas</button><button type="button" id="a26-data-clear">Limpiar selección</button></div><div class="a26-field-list" id="a26-data-fields"></div>
 <div class="a27-source-download"><div><strong>Bases de datos del Atlas</strong><span>Ocho archivos Excel incluidos en el paquete del proyecto.</span></div><a href="Atlas_Bases_Electorales_Originales.zip" download="Atlas_Bases_Electorales_Originales.zip">Descargar ocho bases Excel (ZIP)</a><details><summary>Archivos incluidos</summary><p>Resultados presidenciales, resultados legislativos, candidaturas presidenciales, candidaturas legislativas, diputaciones electas, diseño de papeletas legislativas, partidos políticos y partidos cancelados.</p></details></div><div class="a26-exportbar"><span id="a26-data-count"></span><button id="a26-data-csv" class="a26-primary" type="button">Descargar CSV personalizado</button><button id="a26-data-json" type="button">Descargar JSON</button></div><div class="a25-tablewrap"><table id="a26-data-table"></table></div><p class="a26-footnote">Se muestran 120 registros por página de consulta; la exportación incluye todas las filas filtradas.</p>`;
 container.prepend(sec);
 const $=id=>sec.querySelector('#'+id);let selection=[],columns=[],shown=[];
 function compute(){let set=sources[$('a26-data-set').value].data;const yr=$('a26-data-year').value,arena=$('a26-data-arena').value,level=$('a26-data-level').value,search=$('a26-data-search').value.toLowerCase();
  let filtered=set.filter(r=>(yr==='all'||String(r.year)===yr)&&(arena==='all'||!('arena'in r)||r.arena===arena)&&(level==='all'||!('level'in r)||r.level===level)&&(!search||[r.party,r.Partido,r.name,r.key,r.province,r.office].some(s=>String(s||'').toLowerCase().includes(search))));
  if($('a26-data-operation').value==='aggregate'){
   const key=$('a26-data-group').value,value=$('a26-data-measure').value,mode=$('a26-data-agg').value,g=new Map();for(const r of filtered){if(r[key]===undefined)continue;const x=Number(r[value]);if(!Number.isFinite(x))continue;const k=String(r[key]);if(!g.has(k))g.set(k,[]);g.get(k).push(x)}
   filtered=[...g].map(([k,items])=>({[key]:k,observaciones:items.length,[`${mode}_${value}`]:mode==='sum'?items.reduce((a,b)=>a+b,0):mode==='max'?Math.max(...items):mode==='min'?Math.min(...items):items.reduce((a,b)=>a+b,0)/items.length})).sort((a,b)=>b.observaciones-a.observaciones)
  }
  if($('a26-data-operation').value==='pivot'){
   const rowField=$('a27-data-row').value,colField=$('a27-data-column').value,metric=$('a26-data-measure').value,method=$('a26-data-agg').value;
   const pivot=new Map(),colSet=new Set();
   for(const r of filtered){if(r[rowField]==null||r[colField]==null)continue;const val=Number(r[metric]);if(!Number.isFinite(val))continue;const rw=String(r[rowField]),cl=String(r[colField]);colSet.add(cl);if(!pivot.has(rw))pivot.set(rw,new Map());const mm=pivot.get(rw);if(!mm.has(cl))mm.set(cl,[]);mm.get(cl).push(val)}
   const columns=[...colSet].sort((a,b)=>a.localeCompare(b,'es',{numeric:true})).slice(0,80);
   const reduce=arr=>method==='sum'?arr.reduce((a,b)=>a+b,0):method==='mean'?arr.reduce((a,b)=>a+b,0)/arr.length:method==='min'?Math.min(...arr):Math.max(...arr);
   filtered=[...pivot].map(([r,m])=>Object.assign({[rowField]:r},...columns.map(c=>({[c]:m.get(c)?.length?reduce(m.get(c)):null})))).sort((a,b)=>String(a[rowField]).localeCompare(String(b[rowField]),'es',{numeric:true}));
  }
  selection=filtered;
  const fields=[...new Set(filtered.slice(0,100).flatMap(r=>Object.keys(r)))];const former=$('a26-data-fields').querySelectorAll('input');let checked=new Set([...former].filter(e=>e.checked).map(e=>e.value));
  if(!fields.every(f=>$('a26-data-fields').querySelector(`input[value="${f}"]`)))checked=new Set(fields);
  $('a26-data-fields').innerHTML=fields.map(f=>`<label class="a26-field-chip"><input type="checkbox" value="${esc(f)}" ${checked.has(f)?'checked':''}/> ${esc(f)}</label>`).join('');
  render();
 }
 function render(){columns=[...$('a26-data-fields').querySelectorAll('input:checked')].map(e=>e.value);shown=selection.slice(0,120);$('a26-data-count').textContent=`${fmt(selection.length)} registros · ${columns.length} columnas seleccionadas`;
  $('a26-data-table').innerHTML='<thead><tr>'+columns.map(f=>`<th>${esc(f)}</th>`).join('')+'</tr></thead><tbody>'+shown.map(r=>'<tr>'+columns.map(f=>`<td>${esc(typeof r[f]==='number'?fmt(r[f],String(f).includes('pct')||String(f).includes('share')?2:0):r[f]??'')}</td>`).join('')+'</tr>').join('')+'</tbody>';
 }
 $('a26-data-fields').addEventListener('change',render);sec.querySelectorAll('select').forEach(el=>el.addEventListener('change',compute));$('a26-data-search').addEventListener('input',compute);
 $('a26-data-all').onclick=()=>{$('a26-data-fields').querySelectorAll('input').forEach(x=>x.checked=true);render()};$('a26-data-clear').onclick=()=>{$('a26-data-fields').querySelectorAll('input').forEach(x=>x.checked=false);render()};
 function resultData(){return selection.map(r=>Object.fromEntries(columns.map(c=>[c,r[c]])))}
 $('a26-data-csv').onclick=()=>csv(resultData(),'atlas_consulta_personalizada.csv');$('a26-data-json').onclick=()=>download('atlas_consulta_personalizada.json',JSON.stringify(resultData(),null,2),'application/json');compute();
}
function atlasLaboratory(){
 const container=document.getElementById('content');if(!container||document.getElementById('atlas-v26-lab'))return;
 const sec=block('Laboratorio de ciencia de datos electoral','Análisis reproducible de indicadores: exploración, correlación, regresión descriptiva y agrupamiento de territorios.','atlas-v26-lab');
 const measures=[['part_pct','Participación (%)'],['abst_pct','Abstención (%)'],['valid_pct','Voto válido / emitidos (%)'],['blancos_pct','Blancos / emitidos (%)'],['nulos_pct','Nulos / emitidos (%)'],['noval_pct','Voto no válido / emitidos (%)'],['validos','Votos válidos (n)'],['abstenciones','Abstenciones (n)']];
 sec.innerHTML+=`<div class="a26-tools">${select('a26-lab-arena','Arena',[['P','Presidencial'],['L','Legislativa'],['R','Segunda ronda']])}${select('a26-lab-level','Unidad de análisis',[['p','Provincia × elección'],['c','Cantón × elección'],['d','Distrito × elección']])}${select('a26-lab-x','Variable X',measures)}${select('a26-lab-y','Variable Y',measures)}${select('a26-lab-task','Método',[['scatter','Dispersión y correlación'],['trend','Series temporales'],['cluster','Agrupamiento K-means']])}${select('a26-lab-k','Número de grupos (K)',[[2,'2'],[3,'3'],[4,'4'],[5,'5'],[6,'6']])}</div>
 <div class="a26-metric-cards" id="a26-lab-stats"></div><div class="a26-chart-title"><h4 id="a26-lab-title">Exploración estadística</h4>${buttons}</div><div id="a26-lab-plot" class="a26-plot"></div><div class="a25-tablewrap"><table id="a26-lab-table"></table></div><p class="a26-footnote">Los resultados estadísticos muestran asociaciones descriptivas y patrones de los agregados territoriales; no identifican efectos causales ni comportamientos de personas individuales.</p>`;
 container.prepend(sec);const $=id=>sec.querySelector('#'+id);let output=[];
 function draw(){const a=$('a26-lab-arena').value,l=$('a26-lab-level').value,x=$('a26-lab-x').value,y=$('a26-lab-y').value,task=$('a26-lab-task').value;
  $('a26-lab-k').closest('label').hidden=task!=='cluster';let raw=dataRows.filter(r=>r.arena===a&&r.level===l&&Number.isFinite(Number(r[x]))&&Number.isFinite(Number(r[y])));
  if(raw.length>20000){raw=raw.filter((_,i)=>i%Math.ceil(raw.length/20000)===0)}
  const xx=raw.map(r=>+r[x]),yy=raw.map(r=>+r[y]),n=raw.length;let mx=xx.reduce((a,b)=>a+b,0)/(n||1),my=yy.reduce((a,b)=>a+b,0)/(n||1);
  const sxx=xx.reduce((s,v)=>s+(v-mx)**2,0),syy=yy.reduce((s,v)=>s+(v-my)**2,0),sxy=xx.reduce((s,v,i)=>s+(v-mx)*(yy[i]-my),0);const r=sxx>0&&syy>0?sxy/Math.sqrt(sxx*syy):null;
  const slope=sxx>0?sxy/sxx:null,intercept=slope==null?null:my-slope*mx;
  let colors=raw.map(()=> '#247f8b');let labels=raw.map(row=>`${row.year} · ${label(l,String(row.key))}`);
  output=raw.map((row,i)=>({anio:row.year,arena:a,nivel:l,territorio:label(l,String(row.key)),codigo:row.key,variable_x:x,valor_x:xx[i],variable_y:y,valor_y:yy[i]}));
  if(task==='cluster'&&n>0){const k=Math.min(+$('a26-lab-k').value,n),sx=Math.sqrt(sxx/(n||1))||1,sy=Math.sqrt(syy/(n||1))||1;
   const points=raw.map((_,i)=>[(xx[i]-mx)/sx,(yy[i]-my)/sy]);let centers=Array.from({length:k},(_,i)=>points[Math.floor(i*(points.length-1)/Math.max(1,k-1))].slice());let assignment=new Array(n).fill(0);
   for(let t=0;t<25;t++){assignment=points.map(p=>centers.reduce((best,c,ci)=>{const dist=(p[0]-c[0])**2+(p[1]-c[1])**2;return dist<best.dist?{idx:ci,dist}:best},{idx:0,dist:Infinity}).idx);centers=centers.map((c,ci)=>{const set=points.filter((_,i)=>assignment[i]===ci);return set.length?[set.reduce((s,z)=>s+z[0],0)/set.length,set.reduce((s,z)=>s+z[1],0)/set.length]:c})}
   colors=assignment.map(i=>['#1f7988','#b87c4e','#785b9b','#27935e','#be556d','#aab05a'][i]);output.forEach((r,i)=>r.grupo=assignment[i]+1);
  }
  $('a26-lab-title').textContent=task==='cluster'?'Agrupamiento K-means descriptivo':task==='trend'?'Evolución de los indicadores':'Relación entre indicadores';
  const traces=task==='trend'?[{type:'scatter',mode:'markers',x:raw.map(r=>r.year),y:yy,marker:{color:colors,size:7,opacity:.6},text:labels,hovertemplate:'%{text}<br>%{y:.2f}<extra></extra>'}]:[{type:'scattergl',mode:'markers',x:xx,y:yy,marker:{color:colors,size:8,opacity:.6,line:{width:0}},text:labels,hovertemplate:'%{text}<br>X: %{x:.2f}<br>Y: %{y:.2f}<extra></extra>'}];
  if(task==='scatter'&&slope!=null){const lo=Math.min(...xx),hi=Math.max(...xx);traces.push({type:'scatter',mode:'lines',x:[lo,hi],y:[intercept+slope*lo,intercept+slope*hi],name:'Ajuste lineal',line:{color:'#b66e49',dash:'dash',width:2}})}
  graph($('a26-lab-plot'),traces,{height:550,margin:{l:75,r:30,t:20,b:85},xaxis:{title:task==='trend'?'Elección':measures.find(q=>q[0]===x)?.[1]},yaxis:{title:measures.find(q=>q[0]===y)?.[1]},showlegend:task==='scatter'});
  $('a26-lab-stats').innerHTML=[['Observaciones',fmt(n)],['Correlación de Pearson',r==null?'—':fmt(r,3)],['Pendiente lineal',slope==null?'—':fmt(slope,3)],['R²',r==null?'—':fmt(r*r,3)]].map(([k,v])=>`<div><small>${k}</small><strong>${v}</strong></div>`).join('');
  $('a26-lab-table').innerHTML='<thead><tr><th>Elección</th><th>Territorio</th><th>X</th><th>Y</th></tr></thead><tbody>'+output.slice(0,150).map(q=>`<tr><td>${q.anio}</td><td>${esc(q.territorio)}</td><td>${fmt(q.valor_x,2)}</td><td>${fmt(q.valor_y,2)}</td></tr>`).join('')+'</tbody>';
 }
 sec.querySelectorAll('select').forEach(x=>x.addEventListener('change',draw));sec.querySelectorAll('[data-atlas-export]').forEach(b=>b.addEventListener('click',async()=>{const ex=b.dataset.atlasExport;if(ex==='csv')return csv(output,'atlas_laboratorio_analisis.csv');await Plotly.downloadImage($('a26-lab-plot'),{format:ex,filename:'atlas_laboratorio',width:1550,height:850,scale:ex==='png'?2:1})}));
 $('a26-lab-y').value='noval_pct';draw();
}
function atlasPartyProfiles(){
 const container=document.getElementById('content');if(!container||document.getElementById('atlas-v26-profiles'))return;
 const sec=block('Perfil histórico integrado de organizaciones políticas','Resultados, presencia territorial, candidaturas, votos y antecedentes jurídicos disponibles en las bases.','atlas-v26-profiles');
 const partyNames=[...new Set(voteRows.filter(r=>r.level==='n').map(r=>r.party))].sort((x,y)=>x.localeCompare(y,'es'));
 sec.innerHTML+=`<div class="a26-tools">${select('a26-profile-party','Organización política',partyNames.map(p=>[p,p]))}${select('a26-profile-arena','Arena',[['P','Presidencial'],['L','Legislativa']])}</div><div id="a26-profile-head"></div><div class="a26-chart-title"><h4>Trayectoria de votos y presencia electoral</h4>${buttons}</div><div id="a26-profile-plot" class="a26-plot"></div><div class="a25-tablewrap"><table id="a26-profile-table"></table></div><details><summary>Candidaturas vinculadas al partido</summary><div id="a26-profile-noms" class="a26-person-grid"></div><button id="a26-profile-csv" type="button">Descargar candidaturas de este partido</button></details>`;
 container.prepend(sec);const $=id=>sec.querySelector('#'+id);let output=[],nominal=[];
 function draw(){let name=$('a26-profile-party').value,a=$('a26-profile-arena').value;const rs=voteRows.filter(r=>r.level==='n'&&r.arena===a&&norm(r.party)===norm(name)).sort((u,v)=>u.year-v.year);
  output=rs.map(r=>({Eleccion:r.year,Partido:name,Arena:names[a],Votos:r.votes,Porcentaje:r.share}));nominal=(V.nomination_rows||[]).filter(r=>norm(r.party)===norm(name));
  const yearsSeen=rs.length?rs.map(r=>r.year).join(' · '):'Sin registros en esta arena';
  $('a26-profile-head').innerHTML=`<div class="a26-profile-hero" style="--a26-party:${partyColor(name)}"><div class="a26-profile-swatch"></div><div><h3>${esc(name)}</h3><p>${fmt(rs.length)} elecciones con votos en la arena seleccionada · ${fmt(nominal.length)} candidaturas nominales en el corpus</p><small>${esc(yearsSeen)}</small></div></div>`;
  const tr=[{type:'scatter',mode:'lines+markers',name:'Cuota nacional',x:rs.map(r=>r.year),y:rs.map(r=>r.share),line:{color:partyColor(name),width:3},marker:{size:9},customdata:rs.map(r=>r.votes),hovertemplate:'%{x}: %{y:.2f}% · %{customdata:,} votos<extra></extra>'}];
  graph($('a26-profile-plot'),tr,{height:440,margin:{l:75,r:35,t:30,b:75},xaxis:{title:'Elección',tickmode:'array',tickvals:years,tickangle:-45},yaxis:{title:'% de votos válidos'}});
  $('a26-profile-table').innerHTML='<thead><tr><th>Elección</th><th>Votos</th><th>Cuota nacional</th><th>Primeros lugares cantonales</th><th>Primeros lugares distritales</th></tr></thead><tbody>'+rs.map(r=>`<tr><td>${r.year}</td><td>${fmt(r.votes)}</td><td>${fmt(r.share,2)} %</td><td>${leaders.get(key(r.year,a,'c','101'))?'': ''}${leaderRows.filter(x=>x.year===r.year&&x.arena===a&&x.level==='c'&&norm(x.party)===norm(name)).length}</td><td>${leaderRows.filter(x=>x.year===r.year&&x.arena===a&&x.level==='d'&&norm(x.party)===norm(name)).length}</td></tr>`).join('')+'</tbody>';
  $('a26-profile-noms').innerHTML=nominal.slice(0,300).map(x=>`<div class="a25-nom"><span class="a25-swatch" style="background:${partyColor(name)}"></span><div><b>${esc(x.name)}</b><small>${x.year} · ${esc(x.office)} · ${esc(x.province)}</small></div><span class="a25-outcome ${x.elected?'is-elected':''}">${x.elected?'✓ Electa':'Candidatura'}</span></div>`).join('');
 }
 sec.querySelectorAll('select').forEach(x=>x.addEventListener('change',draw));
 sec.querySelectorAll('[data-atlas-export]').forEach(b=>b.addEventListener('click',async()=>{const ex=b.dataset.atlasExport;if(ex==='csv')return csv(output,'atlas_perfil_partido.csv');await Plotly.downloadImage($('a26-profile-plot'),{format:ex,filename:'perfil_electoral',width:1600,height:820,scale:ex==='png'?2:1})}));
 $('a26-profile-csv').onclick=()=>csv(nominal.map(x=>({anio:x.year,partido:x.party,persona:x.name,cargo:x.office,provincia:x.province,electa:x.elected})),'atlas_perfil_candidaturas.csv');
 if(window.AtlasV26SelectedParty&&partyNames.some(n=>norm(n)===norm(window.AtlasV26SelectedParty)))$('a26-profile-party').value=partyNames.find(n=>norm(n)===norm(window.AtlasV26SelectedParty));draw();
}
function atlasPaperBallots(){
 const container=document.getElementById('content');if(!container||document.getElementById('atlas-v26-ballots'))return;
 const sec=block('Documentación de papeletas por arena','La base documental legislativa está disponible; el diseño presidencial se incorporará una vez concluida su codificación.','atlas-v26-ballots');
 sec.innerHTML+=`<div class="a26-tools">${select('a26-ballot-arena','Tipo de papeleta',[['L','Diputaciones'],['P','Presidencia · base prevista']])}</div><div id="a26-ballot-content"></div>`;
 container.prepend(sec);const field=sec.querySelector('#a26-ballot-arena');function draw(){sec.querySelector('#a26-ballot-content').innerHTML=field.value==='P'?'<div class="a26-pending"><strong>Base presidencial en preparación</strong><p>Este apartado está previsto en la arquitectura; no muestra registros simulados.</p></div>':'<p class="a26-footnote">Consulte debajo los diseños legislativos históricos, las características documentales y su relación con las elecciones.</p>';}
 field.addEventListener('change',draw);draw();
}
function atlasGlobalPolish(){
 const content=document.getElementById('content');if(!content)return;
 // La intervención global conserva los gráficos existentes; mejora rótulos y estructura de lectura.
 const namesList={apellidos:'Nombres y conexiones nominales',trayectorias:'Personas y carreras electorales',mapas:'Cartografía provincial',datos:'Explorador y descarga de datos',laboratorio:'Laboratorio de análisis electoral',metodo:'Metodología, bases y fuentes'};
 const tab=[...document.querySelectorAll('.navbutton')].find(x=>x.classList.contains('active'));
 if(tab){const k=[...document.querySelectorAll('.navbutton')].indexOf(tab);if(k>=0)document.body.dataset.atlasTab=tab.textContent.trim()}
 const header=content.querySelector('.section-head');if(header){header.classList.add('a26-section-heading')}
 for(const box of content.querySelectorAll('.card,.panel'))box.classList.add('a26-card');
}

/* Candidaturas, fórmulas, personas y recurrencias usan el mismo universo nominal ya conciliado. */
function atlasNominalExplorer(section){
 const container=document.getElementById('content');if(!container||document.getElementById('atlas-v26-nominal'))return;
 const configured=section==='formulas'?'P':section==='candidaturas'?'all':'all';
 const title={candidaturas:'Consulta integrada de candidaturas',formulas:'Fórmulas presidenciales: personas y resultados',trayectorias:'Personas y recurrencia electoral',apellidos:'Exploración de nombres y coincidencias nominales'}[section]||'Consulta nominal';
 const sec=block(title,'Filtre por elección, partido, cargo y persona. Cada registro mantiene su candidatura y su resultado; las coincidencias nominales no acreditan parentesco.','atlas-v26-nominal');
 const parties=[...new Set((V.nomination_rows||[]).map(r=>r.party))].sort((a,b)=>a.localeCompare(b,'es'));
 sec.innerHTML+=`<div class="a26-tools">${select('a26-n-year','Elección',[['all','Todas'],...years.map(y=>[String(y),String(y)])])}${select('a26-n-arena','Arena',[['all','Ambas'],['P','Presidencial y vicepresidencias'],['L','Legislativa']])}${select('a26-n-party','Partido',[['all','Todos'],...parties.map(p=>[p,p])])}${select('a26-n-outcome','Resultado',[['all','Todas'],['yes','Electas'],['no','No electas']])}${select('a26-n-frequency','Trayectoria',[['all','Todas las personas'],['multiple','Más de una candidatura'],['single','Una candidatura registrada']])}<label>Buscar nombre o cargo<input id="a26-n-search" type="search" placeholder="Nombre, apellido, candidatura..."/></label></div>
 <div class="a26-metric-cards" id="a26-n-summary"></div><div class="a26-exportbar"><span id="a26-n-count"></span><button id="a26-n-download" class="a26-primary" type="button">Descargar candidaturas CSV</button></div><div class="a26-person-grid" id="a26-n-list"></div><button type="button" id="a26-n-next">Mostrar más registros</button><div class="a26-election-case" id="a26-n-case">Seleccione una persona para consultar sus candidaturas y resultados registrados.</div>`;
 (container.querySelector('.section-head')||container.firstChild)?.after(sec);
 const $=id=>sec.querySelector('#'+id);const nom=V.nomination_rows||[],freq=new Map();for(const r of nom){const n=norm(r.name);freq.set(n,(freq.get(n)||0)+1)}
 if(configured!=='all')$('a26-n-arena').value=configured;
 let current=[],page=0;
 function render(){const yr=$('a26-n-year').value,a=$('a26-n-arena').value,p=$('a26-n-party').value,o=$('a26-n-outcome').value,frequency=$('a26-n-frequency').value,search=$('a26-n-search').value.toLowerCase();
  current=nom.filter(x=>(yr==='all'||String(x.year)===yr)&&(a==='all'||x.arena===a)&&(p==='all'||x.party===p)&&(o==='all'||Boolean(x.elected)===(o==='yes'))&&(!search||[x.name,x.office,x.party].some(v=>String(v).toLowerCase().includes(search)))&&(frequency==='all'||(freq.get(norm(x.name))>1)===(frequency==='multiple')));
  const people=new Set(current.map(x=>norm(x.name))).size,success=current.filter(x=>x.elected).length;
  $('a26-n-summary').innerHTML=[['Candidaturas',fmt(current.length)],['Personas nominales',fmt(people)],['Resultados electos',fmt(success)],['Con más de una candidatura',fmt(new Set(current.filter(x=>freq.get(norm(x.name))>1).map(x=>norm(x.name))).size)]].map(([k,v])=>`<div><small>${k}</small><strong>${v}</strong></div>`).join('');
  $('a26-n-count').textContent=`${fmt(current.length)} registros · selección completa descargable`;
  const rows=current.slice(0,(page+1)*100);$('a26-n-list').innerHTML=rows.map((x,i)=>`<button type="button" class="a26-person-option" data-nom="${i}"><span class="a25-swatch" style="background:${partyColor(x.party)}"></span><div><strong>${esc(x.name)}</strong><small>${x.year} · ${esc(x.party)} · ${esc(x.office)} · ${esc(x.province)}</small></div><span class="a25-outcome ${x.elected?'is-elected':''}">${x.elected?'✓ Electa':'No electa'}</span></button>`).join('');
  $('a26-n-next').hidden=rows.length===current.length;
 }
 $('a26-n-list').addEventListener('click',e=>{const b=e.target.closest('[data-nom]');if(!b)return;const person=current[+b.dataset.nom];if(!person)return;const records=nom.filter(x=>norm(x.name)===norm(person.name)).sort((a,b)=>a.year-b.year);
  $('a26-n-case').innerHTML=`<h4>${esc(person.name)} · ${fmt(records.length)} candidaturas registradas</h4><div class="a26-person-timeline">${records.map(x=>`<div><b>${x.year}</b><span>${esc(x.party)} · ${esc(x.office)} · ${esc(x.province)}</span><strong>${x.elected?'✓ Electa':'No electa'}</strong></div>`).join('')}</div>`;
 });
 $('a26-n-next').onclick=()=>{page++;render()};sec.querySelectorAll('select').forEach(e=>e.addEventListener('change',()=>{page=0;render()}));$('a26-n-search').addEventListener('input',()=>{page=0;render()});
 $('a26-n-download').onclick=()=>csv(current.map(x=>({eleccion:x.year,arena:x.arena,provincia:x.province,partido:x.party,nombre:x.name,cargo:x.office,electa:x.elected})),'atlas_candidaturas_consulta.csv');render();
}
function atlasMethods(){const c=document.getElementById('content');if(!c||c.querySelector('#atlas-v26-methods'))return;
 const sec=block('Arquitectura y cobertura de fuentes','Ocho bases de datos integradas y una novena base documental presidencial prevista para una etapa posterior.','atlas-v26-methods');
 sec.innerHTML+=`<div class="a26-feature-cards"><div><h3>19 elecciones</h3><p>1953–2026, con resultados presidenciales y legislativos.</p></div><div><h3>84 cantones</h3><p>Cobertura 2026; 65 en 1953. Se preservan códigos y vigencia histórica.</p></div><div><h3>Distritos administrativos</h3><p>492 en 2026, y 508 códigos diferentes presentes a lo largo del corpus.</p></div><div><h3>Cuatro segundas rondas</h3><p>2002, 2014, 2018 y 2022. Resultados de ronda explícitos.</p></div></div><p class="a26-footnote">Los indicadores de abstención de elecciones simultáneas se integran mediante la conciliación territorial ya realizada. Se mantienen separados los votos válidos, blancos y nulos de cada papeleta. Una ausencia territorial histórica no se equipara a cero.</p>`;
 (c.querySelector('.section-head')||c.firstChild)?.after(sec);
}

// La versión V26 interviene todas las secciones sin alterar las fórmulas de las figuras aprobadas.
const enhancements={gobierno:integrateResults,participacion:participationExplorer,partidos:()=>{partiesExplorer();historicStrongholds()},intro:decorateIntro,datos:atlasDataWorkbench,laboratorio:atlasLaboratory,perfiles:atlasPartyProfiles,papeletas:atlasPaperBallots,formulas:()=>atlasNominalExplorer('formulas'),candidaturas:()=>atlasNominalExplorer('candidaturas'),trayectorias:()=>atlasNominalExplorer('trayectorias'),apellidos:()=>atlasNominalExplorer('apellidos'),metodo:atlasMethods};
for(const name of Object.keys(views)){
 const previous=views[name];if(typeof previous!=='function')continue;
 views[name]=function(...args){const result=previous.apply(this,args);try{enhancements[name]?.();atlasGlobalPolish()}catch(error){console.error('Atlas V26 · sección '+name,error)}return result};
}
window.AtlasV27Integrado={version:'27.0',datasets:8,years:years.length,cantons:cantons.length,districts:districts.length,colorCatalog:colorMap.size};
// La portada inicial debe reflejar la V26 sin exigir cambiar de pestaña primero.
if(typeof state!=='undefined'&&state.tab==='intro'){Promise.resolve().then(()=>{if(state.tab==='intro')views.intro()})}
})();
