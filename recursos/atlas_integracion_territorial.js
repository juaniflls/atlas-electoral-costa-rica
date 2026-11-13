/* Atlas V25 · Integración territorial en visores existentes. No crea un tercer explorador. */
(()=>{
'use strict';
if(window.AtlasV25Integrado)return;
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
function integrateResults(){
  const root=document.getElementById('atlas-v2317-seccion07');if(!root?.__atlasResultControl||root.querySelector('#atlas-v25-territorial'))return;
  const shell=root.querySelector('.ar-shell');if(!shell)return;
  const sec=block('Detalle cantonal y distrital de la elección','Los resultados siguen la elección, arena y provincia del explorador superior. Seleccione aquí únicamente el nivel de detalle y la ronda presidencial.','atlas-v25-territorial');
  sec.innerHTML+=`<div class="a25-controls">${select('a25-r-level','Desglose',[['p','Provincia / Costa Rica'],['c','Cantón'],['d','Distrito']])}${select('a25-r-canton','Cantón',[])}${select('a25-r-district','Distrito',[])}${select('a25-r-round','Ronda presidencial',[['P','Primera ronda'],['R','Segunda ronda']])}</div><div id="a25-r-status" class="a25-status"></div><div id="a25-r-kpis" class="a25-kpis"></div><div class="a25-charts-heading"><h4 id="a25-r-title">Resultados electorales</h4>${buttons}</div><div id="a25-r-chart" class="a25-plot"></div><div class="a25-tablewrap"><table id="a25-r-table"></table></div><div class="a25-charts-heading"><h4>Candidaturas y resultados nominales</h4></div><p class="a25-subtle">Las candidaturas presidenciales se votan por fórmula partidaria. Las legislativas se votan por lista, no por persona individual.</p><div class="a25-controls">${select('a25-r-party','Filtrar candidaturas por partido',[['','Todos los partidos']])}</div><div id="a25-r-candidates" class="a25-candidates"></div>`;
  const where=shell.querySelector('.ar-grid');(where||shell).before(sec);
  const $=id=>sec.querySelector('#'+id);let current=[],currentYear=0,currentProv='',currentArena='';
  const nomination=V.nomination_rows||[];
  function sync(){
    if(!root.isConnected)return;
    const st=root.__atlasResultControl?.getState?.();if(!st)return;
    const y=Number(st.year),p=st.province,a=st.arena==='Legislativa'?'L':$('a25-r-round').value;
    $('a25-r-round').closest('label').hidden=st.arena==='Legislativa';
    const r=$('a25-r-round').querySelector('option[value="R"]');r.disabled=!haveRound.has(y);r.hidden=!haveRound.has(y);
    if(!haveRound.has(y)&&$('a25-r-round').value==='R')$('a25-r-round').value='P';
    const level=$('a25-r-level').value;
    if(p==='Costa Rica'&&level!=='p'){
      $('a25-r-status').textContent='Para consultar cantones o distritos, seleccioná primero una provincia en el mapa o en el selector superior.';
      $('a25-r-kpis').innerHTML='';$('a25-r-chart').replaceChildren();$('a25-r-table').innerHTML='';$('a25-r-candidates').innerHTML='';return;
    }
    $('a25-r-status').textContent='';
    const c=[...cantons].filter(x=>x.province===p&&V.canton_years[x.code]?.includes(y));
    const oldC=$('a25-r-canton').value;
    $('a25-r-canton').innerHTML=c.map(x=>`<option value="${x.code}">${esc(x.name)}</option>`).join('');
    if(c.some(x=>x.code===oldC))$('a25-r-canton').value=oldC;
    const cc=$('a25-r-canton').value,d=[...districts].filter(x=>x.cantonCode===cc&&V.district_years[x.code]?.includes(y));
    const oldD=$('a25-r-district').value;
    $('a25-r-district').innerHTML=d.map(x=>`<option value="${x.code}">${esc(x.name)}</option>`).join('');
    if(d.some(x=>x.code===oldD))$('a25-r-district').value=oldD;
    $('a25-r-canton').closest('label').hidden=level==='p';$('a25-r-district').closest('label').hidden=level!=='d';
    const k=level==='p'?(p==='Costa Rica'?'CR':p):level==='c'?cc:$('a25-r-district').value;
    if(!k){$('a25-r-status').textContent='El territorio no dispone de observaciones en esta elección.';return;}
    const m=dataMetric(y,a,p==='Costa Rica'?'n':level,k),rows=dataVotes(y,a,p==='Costa Rica'?'n':level,k);
    const partCandidates=nomination.filter(x=>Number(x.year)===y&&x.arena===(a==='L'?'L':'P')&&(a!=='L'||p==='Costa Rica'||x.province===p));
    const partyList=[...new Set(partCandidates.map(x=>x.party))].sort((a,b)=>a.localeCompare(b,'es'));
    const oldParty=$('a25-r-party').value;
    $('a25-r-party').innerHTML='<option value="">Todos los partidos</option>'+partyList.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
    if(partyList.includes(oldParty))$('a25-r-party').value=oldParty;
    const selected=nomination.filter(x=>Number(x.year)===y&&x.arena===(a==='L'?'L':'P')&&(a!=='L'||p==='Costa Rica'||x.province===p)&&(!$('a25-r-party').value||norm(x.party)===norm($('a25-r-party').value)));
    $('a25-r-candidates').innerHTML=selected.length?selected.slice(0,450).map(x=>`<div class="a25-nom"><span class="a25-swatch" style="background:${partyColor(x.party)}"></span><div><b>${esc(x.name)}</b><small>${esc(x.party)} · ${esc(x.office)}${x.province&&x.province!=='Nacional'?' · '+esc(x.province):''}</small></div><span class="a25-outcome ${x.elected?'is-elected':''}">${x.elected?'✓ Electa':'Candidatura'}</span></div>`).join(''):'<p class="a25-subtle">No hay candidaturas nominales conciliadas para esta selección.</p>';
    current=rows.map((r,i)=>({posicion:i+1,eleccion:y,arena:names[a],provincia:p,nivel:p==='Costa Rica'?'Nacional':level,territorio:label(level,k),codigo:k,partido:r.party,votos:r.votes,porcentaje_validos:r.share}));
    currentYear=y;currentProv=p;currentArena=a;
    $('a25-r-title').textContent=`${names[a]} · ${p==='Costa Rica'?'Costa Rica':label(level,k)} · ${y}`;
    $('a25-r-kpis').innerHTML=[['Votos válidos',fmt(m?.validos)],['Participación',fmt(m?.part_pct,2)+' %'],['Abstencionismo',fmt(m?.abst_pct,2)+' %'],['Blancos',fmt(m?.blancos)],['Nulos',fmt(m?.nulos)]].map(([k,v])=>`<div><small>${k}</small><b>${v}</b></div>`).join('');
    $('a25-r-table').innerHTML='<thead><tr><th>Partido</th><th>Votos</th><th>% válidos</th></tr></thead><tbody>'+rows.map(r=>`<tr><td><span class="a25-swatch" style="background:${partyColor(r.party)}"></span>${esc(r.party)}</td><td>${fmt(r.votes)}</td><td>${fmt(r.share,2)} %</td></tr>`).join('')+'</tbody>';
    const top=rows.slice(0,20).reverse();graph($('a25-r-chart'),[{type:'bar',orientation:'h',x:top.map(r=>r.share),y:top.map(r=>r.party),marker:{color:top.map(r=>partyColor(r.party))},text:top.map(r=>fmt(r.share,1)+' %'),textposition:'outside',customdata:top.map(r=>r.votes),hovertemplate:'%{y}<br>%{x:.2f}% · %{customdata:,} votos<extra></extra>'}],{height:Math.max(390,top.length*34+110),margin:{l:225,r:95,t:20,b:65},xaxis:{title:'Porcentaje de votos válidos',rangemode:'tozero'},yaxis:{automargin:true}});
  }
  sec.querySelectorAll('select').forEach(e=>e.addEventListener('change',sync));
  root.addEventListener('change',e=>{if(sec.contains(e.target))return;setTimeout(sync,20)},true);
  root.addEventListener('click',e=>{if(sec.contains(e.target))return;setTimeout(sync,60)},true);
  root.addEventListener('atlas-results-updated',()=>setTimeout(sync,10));
  exportPlot(sec,'a25-r-chart',()=>current,()=>`resultados_${currentYear}_${currentArena}_${currentProv.replace(/\W+/g,'_')}`);
  sync();
}
function participationExplorer(){
 if(document.getElementById('atlas-v25-participacion'))return;
 const container=document.getElementById('content');if(!container)return;
 const sec=block('Participación y comportamiento del voto · historia territorial','Matriz de 19 elecciones por provincia o cantón, rankings anuales y evolución de los territorios extremos. Las cifras se calculan para cada arena y elección.','atlas-v25-participacion');
 const values=[['abst_pct','Abstencionismo'],['part_pct','Participación'],['valid_pct','Votos válidos / emitidos'],['blancos_pct','Votos en blanco / emitidos'],['nulos_pct','Votos nulos / emitidos'],['noval_pct','Votos no válidos / emitidos']];
 sec.innerHTML+=`<div class="a25-controls">${select('a25-p-arena','Arena',[['P','Presidencia'],['L','Diputaciones'],['R','Segunda ronda']])}${select('a25-p-level','Territorio',[['p','Provincias'],['c','Cantones'],['d','Distritos · 10 destacados']])}${select('a25-p-ind','Indicador',values)}${select('a25-p-view','Visualización',[['matrix','Matriz histórica'],['ranks','Top 10 por elección'],['leaders','Territorios extremos · 19 elecciones']])}${select('a25-p-year','Elección',years.map(x=>[x,x]))}${select('a25-p-order','Orden',[['high','Mayor a menor'],['low','Menor a mayor']])}</div><div class="a25-charts-heading"><div><h4 id="a25-p-title">Participación territorial</h4><p class="a25-subtle">Años en el eje horizontal; agrupación por provincia en cantones.</p></div>${buttons}</div><div id="a25-p-matrix" class="a25-matrixwrap"></div><div id="a25-p-plot" class="a25-plot"></div><div class="a25-tablewrap"><table id="a25-p-table"></table></div>`;
 container.append(sec);
 const $=id=>sec.querySelector('#'+id);let active=[],mode='matrix';
 const getRows=(y,a,l,metric)=>dataRows.filter(r=>r.year===y&&r.arena===a&&r.level===l&&r[metric]!=null);
 const geo=(level)=>level==='p'?provinces.map(p=>({key:p,province:p,name:p})):level==='c'?cantons.map(c=>({key:c.code,province:c.province,name:c.name})):districts.map(d=>({key:d.code,province:d.province,name:d.name+' · '+d.canton}));
 function value(row,y,a,l,m){return dataMetric(y,a,l,row.key)?.[m]}
 function draw(){const a=$('a25-p-arena').value,l=$('a25-p-level').value,m=$('a25-p-ind').value,v=$('a25-p-view').value,y=+$('a25-p-year').value,order=$('a25-p-order').value;
  mode=v;$('a25-p-year').closest('label').hidden=v!=='ranks';$('a25-p-order').closest('label').hidden=v==='matrix';
  if(a==='R'&&v==='matrix'){$('a25-p-title').textContent='Segunda ronda · 2002, 2014, 2018 y 2022';}
  else $('a25-p-title').textContent=`${values.find(z=>z[0]===m)?.[1]} · ${a==='P'?'Presidencia':a==='L'?'Diputaciones':'Segunda ronda'} · ${l==='c'?'Cantones':l==='p'?'Provincias':'Distritos'}`;
  const one=getRows(y,a,l,m).sort((x,z)=>order==='high'?z[m]-x[m]:x[m]-z[m]);
  const annual=years.filter(yr=>a!=='R'||haveRound.has(yr));
  if(v==='ranks'){
    const t=one.slice(0,10).map((r,i)=>({puesto:i+1,eleccion:y,territorio:label(l,String(r.key)),provincia:l==='p'?r.key:l==='c'?cantonIndex.get(String(r.key))?.province:districtIndex.get(String(r.key))?.province,indicador:m,porcentaje:r[m]}));active=t;
    $('a25-p-matrix').hidden=true;$('a25-p-plot').hidden=false;
    const b=t.slice().reverse();graph($('a25-p-plot'),[{type:'bar',orientation:'h',x:b.map(r=>r.porcentaje),y:b.map(r=>r.territorio),marker:{color:'#307e8b'},text:b.map(r=>fmt(r.porcentaje,2)+'%'),textposition:'outside'}],{height:490,margin:{l:260,r:70,t:20,b:60},xaxis:{title:'Porcentaje (%)'}});
    $('a25-p-table').innerHTML='<thead><tr><th>#</th><th>Territorio</th><th>Provincia</th><th>%</th></tr></thead><tbody>'+t.map(r=>`<tr><td>${r.puesto}</td><td>${esc(r.territorio)}</td><td>${esc(r.provincia)}</td><td>${fmt(r.porcentaje,2)}%</td></tr>`).join('')+'</tbody>';return;
  }
  if(v==='leaders'){
    const t=annual.map(yr=>{const r=getRows(yr,a,l,m).sort((x,z)=>order==='high'?z[m]-x[m]:x[m]-z[m])[0];return {eleccion:yr,territorio:r?label(l,String(r.key)):'Sin dato',provincia:r?(l==='p'?r.key:l==='c'?cantonIndex.get(String(r.key))?.province:districtIndex.get(String(r.key))?.province):'',porcentaje:r?.[m]??null}});active=t;
    $('a25-p-matrix').hidden=true;$('a25-p-plot').hidden=false;
    graph($('a25-p-plot'),[{type:'scatter',mode:'lines+markers+text',x:t.map(r=>r.eleccion),y:t.map(r=>r.porcentaje),text:t.map(r=>r.territorio),textposition:'top center',textfont:{size:9},line:{color:'#16898b',width:2.4},marker:{size:9,color:t.map(r=>ERA[r.eleccion<=1974?0:r.eleccion<=1998?1:r.eleccion<=2022?2:3])},customdata:t.map(r=>r.provincia),hovertemplate:'%{x} · %{text}<br>%{y:.2f}% · %{customdata}<extra></extra>'}],{height:560,margin:{l:75,r:36,t:64,b:98},xaxis:{title:'Elección',tickmode:'array',tickvals:annual,tickangle:-60},yaxis:{title:'Porcentaje del indicador'}});
    $('a25-p-table').innerHTML='<thead><tr><th>Elección</th><th>Territorio principal</th><th>Provincia</th><th>%</th></tr></thead><tbody>'+t.map(r=>`<tr><td>${r.eleccion}</td><td>${esc(r.territorio)}</td><td>${esc(r.provincia)}</td><td>${fmt(r.porcentaje,2)} %</td></tr>`).join('')+'</tbody>';return;
  }
  $('a25-p-matrix').hidden=false;$('a25-p-plot').hidden=true;
  let g=geo(l),gridYears=annual;
  if(l==='d'){
    const best=new Set(annual.flatMap(yr=>getRows(yr,a,l,m).sort((x,z)=>z[m]-x[m]).slice(0,10).map(r=>String(r.key))));
    g=g.filter(x=>best.has(x.key));
  }
  active=g.flatMap(r=>gridYears.map(yr=>({eleccion:yr,provincia:r.province,territorio:r.name,codigo:r.key,indicador:m,porcentaje:value(r,yr,a,l,m)??null})));
  const all=active.filter(r=>r.porcentaje!=null).map(r=>r.porcentaje),min=Math.min(...all),max=Math.max(...all);
  let last='';let html='<table class="a25-matrix"><thead><tr><th>Provincia</th><th>Territorio</th>'+gridYears.map(yr=>`<th style="border-bottom:4px solid ${ERA[yr<=1974?0:yr<=1998?1:yr<=2022?2:3]}">${yr}</th>`).join('')+'</tr></thead><tbody>';
  for(const r of g){if(r.province!==last){last=r.province;html+=`<tr class="a25-group"><th colspan="${gridYears.length+2}">${esc(last)}</th></tr>`}
   html+=`<tr><td>${esc(r.province)}</td><th>${esc(r.name)}</th>`+gridYears.map(yr=>{const val=value(r,yr,a,l,m);if(val==null){let seen=(l==='p'?true:l==='c'?V.canton_years[r.key]?.includes(yr):V.district_years[r.key]?.includes(yr));return `<td class="a25-na" title="${seen?'Sin valor disponible':'Sin registro de este territorio para la elección'}">${seen?'—':'×'}</td>`}const t=(val-min)/(max-min||1),alpha=.13+.81*t;return `<td class="a25-metric" style="background:rgba(23,128,139,${alpha.toFixed(3)});color:${alpha>.49?'white':'#213e50'}" title="${esc(r.name)} · ${yr} · ${fmt(val,2)}%">${fmt(val,1)}%</td>`}).join('')+'</tr>';
  }
  $('a25-p-matrix').innerHTML=html+'</tbody></table>';
  $('a25-p-table').innerHTML='<thead><tr><th>Universo</th><th>Elecciones</th><th>Observaciones</th></tr></thead><tbody><tr><td>'+esc(l==='c'?'Cantones':l==='p'?'Provincias':'Distritos destacados')+'</td><td>'+gridYears.length+'</td><td>'+active.filter(r=>r.porcentaje!=null).length+'</td></tr></tbody>';
 }
 sec.querySelectorAll('select').forEach(e=>e.addEventListener('change',draw));
 sec.querySelectorAll('[data-atlas-export]').forEach(b=>b.addEventListener('click',async()=>{const type=b.dataset.atlasExport,filename=`participacion_${$('a25-p-ind').value}_${$('a25-p-level').value}_${mode}`;if(type==='csv')return csv(active,filename+'.csv');if(mode==='matrix'){const svg=matrixSVG($('a25-p-matrix'),$('a25-p-title').textContent);return downloadMatrix(svg,type,filename);}await Plotly.downloadImage($('a25-p-plot'),{format:type,filename,width:1500,height:800,scale:type==='png'?2:1});}));
 draw();
}
function matrixSVG(dom,title){
 const table=dom.querySelector('table'),rows=table?[...table.querySelectorAll('tr')]:[];
 const w=Math.max(1180,rows[0]?.children.length*70+330||1180),h=95+rows.length*27;
 let s=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="white"/><text x="16" y="30" font-size="22" font-family="Arial" font-weight="700" fill="#164254">${esc(title)}</text>`;
 let yy=56;for(const row of rows){let x=16;for(const cell of row.children){const isGroup=row.classList.contains('a25-group'),txt=cell.textContent.trim();const width=cell===row.children[0]?130:cell===row.children[1]?190:70;
  const fill=isGroup?'#d8eaec':cell.style.backgroundColor|| (cell.classList.contains('a25-na')?'#e7ecf0':'#f3f7f9');s+=`<rect x="${x}" y="${yy}" width="${width-2}" height="25" fill="${esc(fill)}"/><text x="${x+5}" y="${yy+17}" font-size="${txt.length>19?9:11}" font-family="Arial" fill="${cell.classList.contains('a25-leader')?'#fff':'#34596c'}">${esc(txt.slice(0,28))}</text>`;x+=width;if(isGroup)break;
 }yy+=27;}
 return s+'</svg>'
}
function downloadMatrix(svg,kind,file){if(kind==='svg')return download(file+'.svg',svg,'image/svg+xml');if(kind!=='png')return;const u=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'})),im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;c.getContext('2d').drawImage(im,0,0);c.toBlob(b=>{if(b)download(file+'.png',b,'image/png');URL.revokeObjectURL(u)})};im.onerror=()=>URL.revokeObjectURL(u);im.src=u}
function partiesExplorer(){
 const container=document.getElementById('content');if(!container||document.getElementById('atlas-v25-partidos'))return;
 // La matriz provincial aprobada se conserva; la escala cantonal se integra como una vista alternativa.
 const sec=block('Liderazgos por territorio y arena','Misma pregunta: ¿qué partido encabezó la votación? Elija entre siete provincias o cantones agrupados por provincia.','atlas-v25-partidos');
 sec.innerHTML+=`<div class="a25-controls">${select('a25-c-level','División',[['p','Provincia'],['c','Cantón']])}${select('a25-c-arena','Arena',[['L','Diputaciones'],['P','Presidencia']])}</div><div class="a25-charts-heading"><h4>Partido más votado · 1953–2026</h4>${buttons}</div><div class="a25-matrixwrap" id="a25-c-matrix"></div><div class="a25-case" id="a25-c-case"><p>Seleccioná cualquier casilla para ver el partido, los votos y el porcentaje de esa elección.</p></div>`;
 // Se inserta dentro de la sección de partidos, junto al bloque de liderazgo ya existente.
 const heading=[...container.querySelectorAll('.atlas17-subhead,h2,h3,h4')].find(h=>/Liderazgos por provincia y arena/i.test(h.textContent));
 if(heading){
   heading.textContent='Liderazgos por territorio y arena';
   const legacyCards=[...container.querySelectorAll('article.card,section.card')].filter(c=>{
     const text=c.querySelector('.card-head h3')?.textContent||'';
     return /^(Partido más votado por provincia|Liderazgos provinciales y referencia de los colores)/i.test(text);
   });
   if(legacyCards.length){
     const archive=document.createElement('details');archive.className='a25-previous';
     const summary=document.createElement('summary');summary.textContent='Consultar las visualizaciones provinciales anteriores';archive.append(summary);
     for(const c of legacyCards)archive.append(c);
     heading.after(sec,archive);
     archive.addEventListener('toggle',()=>{if(archive.open&&window.Plotly){archive.querySelectorAll('.js-plotly-plot').forEach(n=>window.Plotly.Plots?.resize(n));}});
   }else heading.after(sec);
 }else container.append(sec);
 const $=id=>sec.querySelector('#'+id);let active=[];
 function geo(l){return l==='p'?provinces.map(p=>({key:p,province:p,name:p})):provinces.flatMap(p=>cantons.filter(c=>c.province===p).map(c=>({key:c.code,province:p,name:c.name})))}
 function draw(){const l=$('a25-c-level').value,a=$('a25-c-arena').value,g=geo(l);let last='';
  active=g.flatMap(r=>years.map(y=>{const live=l==='p'||V.canton_years[r.key]?.includes(y),w=leaders.get(key(y,a,l,r.key));return {eleccion:y,provincia:r.province,territorio:r.name,codigo:r.key,estado:!live?'Territorio sin registro en esta elección':w?'Con resultados':'Sin resultado',partido:w?.party||'',votos:w?.votes??'',porcentaje:w?.share??''}}));
  let h='<table class="a25-matrix"><thead><tr><th>Provincia</th><th>Territorio</th>'+years.map(y=>`<th style="border-bottom:4px solid ${ERA[y<=1974?0:y<=1998?1:y<=2022?2:3]}">${y}</th>`).join('')+'</tr></thead><tbody>';
  for(const r of g){if(r.province!==last){last=r.province;h+=`<tr class="a25-group"><th colspan="21">${esc(last)}</th></tr>`}
   h+=`<tr><td>${esc(r.province)}</td><th>${esc(r.name)}</th>`+years.map(y=>{const w=leaders.get(key(y,a,l,r.key)),live=l==='p'||V.canton_years[r.key]?.includes(y);return w?`<td class="a25-leader" style="background:${partyColor(w.party)}" data-canton="${esc(r.key)}" data-year="${y}" title="${esc(w.party)} · ${fmt(w.votes)} votos · ${fmt(w.share,2)}%"><span>${fmt(w.share,0)}%</span></td>`:`<td class="a25-na" title="${live?'Sin dato de liderazgo':'Territorio sin registro electoral en ese año'}">${live?'—':'×'}</td>`}).join('')+'</tr>';
  }
  h+='<tr class="a25-country"><th colspan="2">Costa Rica · partido más votado</th>'+years.map(y=>{const w=leaders.get(key(y,a,'n','CR'));return w?`<td style="background:${partyColor(w.party)}" class="a25-leader" data-canton="CR" data-year="${y}" title="${esc(w.party)} · ${fmt(w.votes)} votos · ${fmt(w.share,2)}%">${fmt(w.share,0)}%</td>`:'<td class="a25-na">—</td>'}).join('')+'</tr>';
  $('a25-c-matrix').innerHTML=h+'</tbody></table>';
 }
 $('a25-c-matrix').addEventListener('click',ev=>{const td=ev.target.closest('[data-canton]');if(!td)return;
  const y=Number(td.dataset.year),k=td.dataset.canton,a=$('a25-c-arena').value,l=k==='CR'?'n':$('a25-c-level').value,w=leaders.get(key(y,a,l,k));if(!w)return;
  const geoName=k==='CR'?'Costa Rica':label(l,k);
  const matching=voteRows.filter(r=>r.year===y&&r.arena===a&&r.level===l&&String(r.key)===k).sort((x,z)=>z.votes-x.votes);
  $('a25-c-case').innerHTML=`<div class="a25-casehead"><span class="a25-swatch" style="background:${partyColor(w.party)}"></span><div><small>${y} · ${esc(names[a])} · ${esc(geoName)}</small><h4>${esc(w.party)}</h4><p><strong>${fmt(w.votes)} votos</strong> · ${fmt(w.share,2)}% de votos válidos</p></div></div><div class="a25-minilist">${matching.slice(0,12).map(q=>`<div><span class="a25-swatch" style="background:${partyColor(q.party)}"></span>${esc(q.party)} <strong>${fmt(q.share,2)}%</strong></div>`).join('')}</div><button type="button" class="a25-link" id="a25-go-profile">Consultar perfil del partido en sección 17</button>`;
  $('a25-go-profile')?.addEventListener('click',()=>{const n=[...document.querySelectorAll('#navigation button, #navigation a')].find(e=>/Perfiles de partidos/i.test(e.textContent));if(n){n.click();}else alert('Abra «Perfiles de partidos» en la navegación.')});
 });
 sec.querySelectorAll('select').forEach(e=>e.addEventListener('change',draw));
 sec.querySelectorAll('[data-atlas-export]').forEach(b=>b.addEventListener('click',()=>{const type=b.dataset.atlasExport;const filename='liderazgos_'+$('a25-c-level').value+'_'+$('a25-c-arena').value;if(type==='csv')return csv(active,filename+'.csv');downloadMatrix(matrixSVG($('a25-c-matrix'),'Liderazgos electorales · '+$('a25-c-level').value),type,filename)}));
 draw();
 // El bloque original no se elimina; la escala cantonal y provincial se consulta desde este control principal.
}
function historicStrongholds(){
 const container=document.getElementById('content');if(!container||document.getElementById('atlas-v25-bastiones'))return;
 const sec=block('Bastiones electorales · concentración y persistencia','Identifique dónde cada partido mantiene una ventaja relativa frente a su resultado nacional y durante cuántas elecciones observa ese apoyo.','atlas-v25-bastiones');
 const all=[...new Set(voteRows.filter(r=>r.level==='n'&&(r.arena==='P'||r.arena==='L')).map(r=>r.party))].sort((a,b)=>a.localeCompare(b,'es'));
 sec.innerHTML+=`<div class="a25-controls">${select('a25-b-arena','Arena',[['L','Diputaciones'],['P','Presidencia']])}${select('a25-b-level','Territorio',[['c','Cantón'],['d','Distrito'],['p','Provincia']])}${select('a25-b-party','Partido',all.map(p=>[p,p]))}${select('a25-b-scope','Evaluación',[['historic','Persistencia histórica'],['year','Ventaja en una elección']])}${select('a25-b-year','Elección',years.map(y=>[y,y]))}</div><div class="a25-charts-heading"><h4 id="a25-b-title">Bastiones electorales</h4>${buttons}</div><div id="a25-b-chart" class="a25-plot"></div><div class="a25-tablewrap"><table id="a25-b-table"></table></div><div id="a25-b-case" class="a25-case">Seleccioná una barra para examinar la serie electoral del territorio.</div><div id="a25-b-trend" class="a25-plot"></div>`;
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
 const el=document.getElementById('content');if(!el)return;
 for(const node of el.querySelectorAll('p,span,div')){
  if(node.children.length)continue;let v=node.textContent.trim();if(/^(Siete bases históricas|7 bases históricas|Siete bases conectadas|7 bases conectadas)$/i.test(v))node.textContent='Ocho bases históricas integradas';
 }
 const hero=el.querySelector('.intro-hero');if(hero&&!hero.querySelector('.a25-intro-link')){
  const links=hero.querySelector('.intro-links')||hero;
  const a=document.createElement('a');a.className='intro-link a25-intro-link';a.href='https://github.com/juaniflls';a.target='_blank';a.rel='noopener noreferrer';a.textContent='GitHub · proyectos y ciencia de datos';links.append(a);
  const note=document.createElement('p');note.className='a25-subtle';note.textContent='Ocho bases históricas integradas · Base de diseño de papeletas presidenciales prevista para una etapa posterior. Formación en Ciencia Política y Economía, con desarrollo profesional en ciencia de datos.';hero.append(note);
 }
}
// Conservar la navegación, las gráficas aprobadas y el código original de todos los demás módulos.
for(const [name,enhance] of [['gobierno',integrateResults],['participacion',participationExplorer],['partidos',()=>{partiesExplorer();historicStrongholds()}],['intro',decorateIntro]]){
 const original=views[name];if(typeof original!=='function')continue;
 views[name]=function(...args){const value=original.apply(this,args);try{enhance()}catch(e){console.error('Atlas integrado',name,e)}return value};
}
window.AtlasV25Integrado={version:'25.0',metricas:dataRows.length,votos:voteRows.length,colors:colorMap.size,integrated:true};
})();
