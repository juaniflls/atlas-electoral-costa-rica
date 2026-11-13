/* Atlas V28: visor jerárquico complementario, no cambia los valores de otras gráficas. */
(function(){
 'use strict';
 const script=document.getElementById('atlas-v28-dataset');
 if(!script||window.__atlasV28Installed)return;
 window.__atlasV28Installed=true;
 let db;
 try{db=JSON.parse(script.textContent)}catch(e){console.error('Atlas V28: datos ilegibles',e);return}
 const esc=(x)=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const norm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
 const fmt=n=>Number(n||0).toLocaleString('es-CR',{maximumFractionDigits:0});
 const pct=n=>Number.isFinite(n)?n.toLocaleString('es-CR',{minimumFractionDigits:1,maximumFractionDigits:1})+' %':'—';
 const keys=Object.keys(db.places), provOrder=['San José','Alajuela','Cartago','Heredia','Guanacaste','Puntarenas','Limón'];
 const PROV_CODE={'San José':'1','Alajuela':'2','Cartago':'3','Heredia':'4','Guanacaste':'5','Puntarenas':'6','Limón':'7'};
 const colour=p=>db.colors[p]||'#8396a3';
 const state={year:2026,arena:0,round:1,scope:'Nacional',territory:'',detail:'Provincia',shown:'Porcentaje',extras:false,limit:'10'};
 let rows0=[],root=null;
 const rowsIndex=new Map();
 db.rows.forEach(r=>{const k=[r[0],r[1],r[2]].join('|');if(!rowsIndex.has(k))rowsIndex.set(k,[]);rowsIndex.get(k).push(r)});
 const place=(year,code)=>db.places[year+'|'+code]||['Provincia no identificada','Cantón no identificado','Distrito no identificado'];
 function dataRows(){return rowsIndex.get([state.year,state.arena,state.round].join('|'))||[]}
 function getTerritories(scope){
   const seen=new Map();for(const r of dataRows()){
    const code=r[3],p=place(state.year,code);
    const id=scope==='Provincia'?code[0]:scope==='Cantón'?code.slice(0,3):code;
    const name=scope==='Provincia'?p[0]:scope==='Cantón'?p[1]+' · '+p[0]:p[2]+' · '+p[1]+' · '+p[0];
    if(!seen.has(id))seen.set(id,name);
   }
   return [...seen].sort((a,b)=>a[0].localeCompare(b[0],'es',{numeric:true}));
 }
 function isInside(r){
  const code=r[3];if(state.scope==='Nacional')return true;
  if(state.scope==='Provincia')return code[0]===state.territory;
  if(state.scope==='Cantón')return code.slice(0,3)===state.territory;
  if(state.scope==='Distrito')return code===state.territory;
  return true;
 }
 function breakdown(){
  const level=state.detail;
  const map=new Map();
  for(const r of dataRows()){
    if(!isInside(r))continue;
    const code=r[3],parts=place(state.year,code);
    const id=level==='Total'?'TOTAL':level==='Provincia'?code[0]:level==='Cantón'?code.slice(0,3):code;
    const label=level==='Total'?(state.scope==='Nacional'?'Costa Rica':(state.scope==='Provincia'?parts[0]:state.scope==='Cantón'?parts[1]:parts[2])):level==='Provincia'?parts[0]:level==='Cantón'?parts[1]:parts[2];
    if(!map.has(id))map.set(id,{id,label,prov:parts[0],canton:parts[1],valid:0,blancos:0,nulos:0,abst:0,parties:new Map()});
    const g=map.get(id),n=r[5],p=r[4];
    if(p>=0){g.valid+=n;g.parties.set(p,(g.parties.get(p)||0)+n)}
    if(p===-1)g.blancos+=n;if(p===-2)g.nulos+=n;if(p===-3)g.abst+=n;
  }
  return [...map.values()].sort((a,b)=>provOrder.indexOf(a.prov)-provOrder.indexOf(b.prov)||a.canton.localeCompare(b.canton,'es')||a.label.localeCompare(b.label,'es'));
 }
 function validDetails(){const dims=['Total']; if(state.scope==='Nacional')dims.push('Provincia','Cantón','Distrito');if(state.scope==='Provincia')dims.push('Cantón','Distrito');if(state.scope==='Cantón')dims.push('Distrito');return dims}
 function select(id,items,value){return `<select id="v28-${id}">${items.map(([v,t])=>`<option value="${esc(v)}" ${String(v)===String(value)?'selected':''}>${esc(t)}</option>`).join('')}</select>`}
 function options(){
  const avail=validDetails();if(!avail.includes(state.detail))state.detail=avail[0];
  const regions=state.scope==='Nacional'?[]:getTerritories(state.scope);
  if(state.scope!=='Nacional' && !regions.some(x=>x[0]===state.territory))state.territory=regions[0]?.[0]||'';
  const rounds=state.arena===0&&[2002,2014,2018,2022].includes(state.year)?[[1,'Primera ronda'],[2,'Segunda ronda']]:[[1,'Elección ordinaria']];
  if(rounds.length===1)state.round=1;
  const pselect=state.scope==='Nacional'?'':`<label>Territorio ${select('territory',regions,state.territory)}</label>`;
  return `<div class="v28-fields"><label>Elección ${select('year',db.years.map(y=>[y,y]),state.year)}</label><label>Arena ${select('arena',[[0,'Presidencia'],[1,'Diputaciones']],state.arena)}</label><label>Ronda ${select('round',rounds,state.round)}</label><label>Ámbito ${select('scope',['Nacional','Provincia','Cantón','Distrito'].map(x=>[x,x]),state.scope)}</label>${pselect}<label>Desglose ${select('detail',avail.map(x=>[x,x==='Total'?'Resultado total':x]),state.detail)}</label><label>Valores ${select('shown',['Porcentaje','Cantidad','Ambos'].map(x=>[x,x]),state.shown)}</label><label>Partidos ${select('limit',[['10','10 principales + otros'],['todos','Todos los partidos']],'10'===state.limit?'10':'todos')}</label></div><div class="v28-actions"><label class="v28-check"><input id="v28-extras" type="checkbox" ${state.extras?'checked':''}>Incluir blancos, nulos y abstención</label><span id="v28-scope-status"></span></div>`;
 }
 function matrixView(){
  const rows=breakdown();rows0=rows;
  if(!rows.length)return `<p>No se encontraron registros para esta selección.</p>`;
  const totalVotes=new Map(); rows.forEach(g=>g.parties.forEach((v,k)=>totalVotes.set(k,(totalVotes.get(k)||0)+v)));
  const ranked=[...totalVotes].sort((a,b)=>b[1]-a[1]);
  const partyIds=state.limit==='todos'?ranked.map(x=>x[0]):ranked.slice(0,10).map(x=>x[0]);
  const hidden=new Set(ranked.map(x=>x[0]).filter(x=>!partyIds.includes(x)));
  const disp=(v,den)=>state.shown==='Cantidad'?fmt(v):state.shown==='Porcentaje'?pct(den?100*v/den:NaN):fmt(v)+' · '+pct(den?100*v/den:NaN);
  const visibleParty=(g,p)=>g.parties.get(p)||0;
  const headers=partyIds.map(p=>`<th class="v28-party" style="--party:${colour(db.parties[p])}" title="${esc(db.parties[p])}">${esc(db.parties[p])}</th>`).join('');
  const extraHead=state.extras?'<th>Blancos</th><th>Nulos</th><th>Abstención</th>':'';
  const tRows=rows.map(g=>{
   const other=[...hidden].reduce((n,p)=>n+(g.parties.get(p)||0),0);
   const showOther=hidden.size?`<td class="v28-value">${disp(other,g.valid)}</td>`:'';
   const vals=partyIds.map(p=>`<td class="v28-value" title="${esc(db.parties[p])} · ${fmt(visibleParty(g,p))}">${disp(visibleParty(g,p),g.valid)}</td>`).join('');
   const emit=g.valid+g.blancos+g.nulos,pad=emit+g.abst;
   const extras=state.extras?`<td>${disp(g.blancos,emit)}</td><td>${disp(g.nulos,emit)}</td><td>${disp(g.abst,pad)}</td>`:'';
   const drill=state.detail==='Total'?'':`<button class="v28-drill" type="button" data-drill="${esc(state.detail)}" data-code="${esc(g.id)}" title="Explorar este territorio">${state.detail==='Distrito'?'Ver resultado':'Desglosar'} ›</button>`;
   return `<tr><th class="v28-lab">${esc(g.label)} ${drill}<small>${g.label===g.prov?'':esc(g.prov+(state.detail==='Distrito'?' · '+g.canton:''))}</small></th>${vals}${showOther}${extras}<td class="v28-total">${fmt(g.valid)}</td></tr>`;
  }).join('');
  const summary=state.detail==='Total' && rows.length===1?`<div class="v28-summary-bars">${ranked.map(([id,n])=>`<div class="v28-summary-row"><span>${esc(db.parties[id])}</span><div class="v28-summary-track"><i style="width:${rows[0].valid?100*n/rows[0].valid:0}%;background:${colour(db.parties[id])}"></i></div><b>${pct(rows[0].valid?100*n/rows[0].valid:NaN)}</b></div>`).join('')}</div>`:'';
  const t=`<div class="v28-mat-scroll"><table class="v28-table"><thead><tr><th class="v28-lab">Territorio</th>${headers}${hidden.size?'<th>Otros partidos</th>':''}${extraHead}<th>Votos válidos</th></tr></thead><tbody>${tRows}</tbody></table></div>`;
  return `<div class="v28-figure-head"><div><h3>Resultados ${esc(state.scope==='Nacional'?'de Costa Rica':'del territorio seleccionado')} · ${esc(state.year)}</h3><p>${esc(state.arena===0?'Presidencia':'Diputaciones')}${state.round===2?' · Segunda ronda':''} · ${esc(state.detail)} · ${esc(state.shown)}</p></div><div><button data-export="csv">CSV</button><button data-export="svg">SVG</button><button data-export="png">PNG</button></div></div>${summary}${t}<p class="v28-note">Los porcentajes partidarios tienen como denominador los votos válidos de cada fila. Blancos y nulos utilizan votos emitidos; abstención utiliza padrón de la ronda. «Otros partidos» conserva la suma partidaria cuando se muestran solo los diez principales.</p>`;
 }
 function tab(){return root?.querySelector('.v28-preview')}
 function csv(){
  const t=tab().querySelector('table');if(!t)return '';
  return [...t.rows].map(tr=>[...tr.cells].map(cell=>'"'+cell.innerText.replace(/\s*\n\s*/g,' · ').replace(/"/g,'""')+'"').join(',')).join('\r\n')
 }
 function svgString(){
  const t=tab().querySelector('table'); if(!t)return '';
  const grid=[...t.rows].map(tr=>[...tr.cells].map(c=>c.innerText.replace(/\s+/g,' ').trim()));
  const colW=150,width=grid[0].length*colW+20, height=grid.length*39+35;
  const escapeSvg=x=>esc(x).slice(0,70);
  let str=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#fff"/>`;
  grid.forEach((line,j)=>line.forEach((text,i)=>{const x=i*colW+12,y=j*39+14;str+=`<rect x="${x-5}" y="${y-10}" width="${colW-3}" height="37" fill="${j===0?'#dbe9ed':j%2===0?'#f3f7f8':'#fff'}"/><text x="${x}" y="${y+10}" fill="#15394c" font-size="${j===0?11:10}" font-family="Arial,sans-serif">${escapeSvg(text)}</text>`}));
  return str+'</svg>';
 }
 function download(data,filename,type){const url=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1200)}
 function render(){if(!root)return;root.querySelector('.v28-controls').innerHTML=options();root.querySelector('.v28-preview').innerHTML=matrixView();root.querySelectorAll('select').forEach(el=>el.addEventListener('change',()=>{const id=el.id.slice(4);state[id]=['year','arena','round'].includes(id)?Number(el.value):el.value;if(id==='scope'){state.territory='';state.detail='Total'}if(id==='year'||id==='arena'){state.round=1;state.territory=''}render()}));
 root.querySelector('#v28-extras').addEventListener('change',ev=>{state.extras=ev.target.checked;render()});
 root.querySelectorAll('[data-export]').forEach(btn=>btn.addEventListener('click',()=>{
  const type=btn.dataset.export,base=`Atlas_${state.year}_${state.arena?'Diputaciones':'Presidencia'}_${state.detail}`.replace(/\s+/g,'_');
  if(type==='csv')download('\ufeff'+csv(),base+'.csv','text/csv;charset=utf-8');
  else if(type==='svg')download(svgString(),base+'.svg','image/svg+xml;charset=utf-8');
  else {const text=svgString(),im=new Image(),u=URL.createObjectURL(new Blob([text],{type:'image/svg+xml'}));im.onload=()=>{const cv=document.createElement('canvas');cv.width=im.width;cv.height=im.height;cv.getContext('2d').drawImage(im,0,0);cv.toBlob(blob=>{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=base+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1200)});URL.revokeObjectURL(u)};im.src=u}
 }));
 }
 function findMain(){
  // Las vistas del Atlas se regeneran al navegar; no altera la barra ni sustituye módulos anteriores.
  const heads=[...document.querySelectorAll('main h1, main h2, main h3, section h1, section h2, section h3')];
  return heads.find(h=>/^(presidencia y asamblea|presidencia y asamblea ·|presidencia y asamblea\s*·)/i.test((h.textContent||'').trim()));
 }
 function attach(){
  if(root?.isConnected)return;
  const h=findMain();if(!h)return;
  const region=h.closest('section')||h.parentElement?.parentElement;
  if(!region)return;
  const id='atlas-v28-visor';if(document.getElementById(id))return;
  root=document.createElement('section');root.className='v28-root';root.id=id;
  root.innerHTML='<div class="v28-top"><div class="v28-kicker">ATLAS ELECTORAL · CONSULTA TERRITORIAL</div><h2>Explorador de resultados por territorio</h2><p>Consulta nacional, provincial, cantonal y distrital. Seleccioná un territorio y su nivel de desglose sin abandonar la misma vista.</p></div><div class="v28-controls"></div><div class="v28-preview"></div>';
  root.addEventListener('click',ev=>{const b=ev.target.closest('[data-drill]');if(!b)return;const lev=b.dataset.drill;state.territory=b.dataset.code;if(lev==='Provincia'){state.scope='Provincia';state.detail='Cantón'}else if(lev==='Cantón'){state.scope='Cantón';state.detail='Distrito'}else {state.scope='Distrito';state.detail='Total'}render();root.scrollIntoView({block:'start',behavior:'smooth'})});
  // Inserta en la misma sección, sin crear un tercer módulo de navegación.
  h.insertAdjacentElement('afterend',root);render();
  const plotListener=function(){
   const graphs=[...region.querySelectorAll('.js-plotly-plot')];
   graphs.forEach(g=>{if(g.__v28Bound||typeof g.on!=='function')return;g.__v28Bound=true;
    g.on('plotly_click',event=>{const p=event?.points?.[0];const name=p?.location||p?.label||p?.hovertext||p?.customdata?.[0];let match=provOrder.find(pr=>norm(pr)===norm(name));
      if(match){state.scope='Provincia';state.territory=PROV_CODE[match];state.detail='Total';render();root.scrollIntoView({behavior:'smooth',block:'start'})}
    })})
  };plotListener();
 }
 const styles=`.v28-root{color:#193747;background:#fff;border:1px solid #d2e2e8;border-radius:18px;margin:22px 0;padding:0;overflow:hidden;box-shadow:0 12px 32px rgba(17,50,70,.06)}.v28-top{padding:24px 28px;background:linear-gradient(125deg,#0f3a50,#157b80);color:#fff}.v28-kicker{font-size:11px;letter-spacing:.19em;font-weight:800;opacity:.84}.v28-top h2{color:#fff!important;margin:7px 0 4px;font-weight:760}.v28-top p{margin:4px 0 0;opacity:.88;font-size:13px}.v28-controls{background:#eaf4f5;padding:17px 21px}.v28-fields{display:flex;flex-wrap:wrap;gap:10px}.v28-fields label{display:flex;flex:1 1 148px;flex-direction:column;gap:6px;color:#31556a;font-size:11px;font-weight:700}.v28-fields select{width:100%;padding:8px 10px;min-width:95px;border:1px solid #b9d4dd;border-radius:7px;background:#fff;color:#12354b;font-size:12px}.v28-actions{display:flex;justify-content:space-between;align-items:center;margin-top:11px}.v28-check{display:flex;align-items:center;gap:8px;font-size:12px;color:#31556a}.v28-preview{padding:17px 20px 22px}.v28-figure-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:4px 0 14px}.v28-figure-head h3{margin:0;color:#17384b;font-size:17px}.v28-figure-head p{font-size:12px;color:#607785;margin:4px 0}.v28-figure-head button{padding:6px 9px;margin-left:5px;background:#f7fcfc;border:1px solid #b9d4dd;color:#1c5264;border-radius:7px;cursor:pointer;font-weight:700}.v28-mat-scroll{overflow:auto;max-height:580px;border:1px solid #d7e5ea;border-radius:10px}.v28-table{border-collapse:separate;border-spacing:0;width:max-content;min-width:100%;font-size:12px}.v28-table th,.v28-table td{padding:9px 12px;border-bottom:1px solid #e4edf1;border-right:1px solid #edf2f5;white-space:nowrap;text-align:right;min-width:85px}.v28-table thead th{position:sticky;top:0;background:#deebef;z-index:2}.v28-table th.v28-party{background:var(--party);color:#fff;text-align:center;min-width:120px;max-width:150px;white-space:normal}.v28-table .v28-lab{text-align:left;position:sticky;left:0;background:#f5f9fa;z-index:1;min-width:220px}.v28-table .v28-lab small{display:block;color:#6d8492;font-size:10px;font-weight:400}.v28-table tbody tr:hover td,.v28-table tbody tr:hover th{background:#e4f4f2}.v28-value{font-variant-numeric:tabular-nums}.v28-drill{border:1px solid #91c8d0;color:#0d667a;background:#e8f7f6;border-radius:6px;padding:4px 7px;font-size:10px;cursor:pointer;margin-left:7px}.v28-summary-bars{padding:9px 7px 22px;display:grid;gap:7px;max-height:480px;overflow:auto}.v28-summary-row{display:grid;grid-template-columns:minmax(110px,220px) minmax(100px,1fr) 58px;gap:12px;align-items:center;font-size:11px;color:#264b5d}.v28-summary-track{height:11px;background:#edf4f6;border-radius:8px;overflow:hidden}.v28-summary-track i{display:block;height:100%;border-radius:8px}.v28-total{font-weight:750;background:#edf4f7}.v28-note{font-size:11px;color:#6b8490;line-height:1.6;margin:10px 2px 0}@media(max-width:730px){.v28-top{padding:18px}.v28-fields label{flex-basis:42%}.v28-preview{padding:10px}.v28-figure-head{flex-direction:column;align-items:flex-start}}`;
 const styleEl=document.createElement('style');styleEl.id='atlas-v28-css';styleEl.textContent=styles;document.head.appendChild(styleEl);
 let pending=false;const observer=new MutationObserver(()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;attach()})});observer.observe(document.documentElement,{childList:true,subtree:true});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach);else attach();

 // Estudio de bastiones dentro de Partidos y territorio: relevancia configurable,
 // evitando 100+ partidos como lista predeterminada.
 const bs={year:2026,arena:1,level:'Cantón',party:null,all:false};
 let bastionRoot=null;
 function findPartySection(){
    const hs=[...document.querySelectorAll('main h1,main h2,main h3,section h1,section h2,section h3')];
    return hs.find(h=>/partidos y territorio/i.test((h.textContent||'').trim()) && h.textContent.trim().length<100);
 }
 function relevantParties(){
    const byY=new Map();
    db.rows.forEach(r=>{
      if(r[1]!==bs.arena||r[2]!==1)return;
      if(!byY.has(r[0]))byY.set(r[0],{total:0,parties:new Map()});
      const year=byY.get(r[0]);
      if(r[4]>=0){year.total+=r[5];year.parties.set(r[4],(year.parties.get(r[4])||0)+r[5])}
    });
    const n=new Map();for(const [,v] of byY)for(const [p,vote] of v.parties)if(v.total&&100*vote/v.total>=3)n.set(p,(n.get(p)||0)+1);
    return [...n].filter(x=>x[1]>=2).map(x=>x[0]);
 }
 function makeBastions(){
    const rows=rowsIndex.get([bs.year,bs.arena,1].join('|'))||[];
    const national=new Map();let nt=0;
    for(const r of rows)if(r[4]>=0){nt+=r[5];national.set(r[4],(national.get(r[4])||0)+r[5])}
    let parts=bs.all?[...national.keys()]:relevantParties().filter(p=>national.has(p));
    parts.sort((a,b)=>(national.get(b)||0)-(national.get(a)||0));
    if(!parts.includes(bs.party))bs.party=parts[0]??null;
    let by=new Map();
    for(const r of rows){const placeData=place(bs.year,r[3]),code=r[3],id=bs.level==='Provincia'?code[0]:bs.level==='Cantón'?code.slice(0,3):code;
      if(!by.has(id))by.set(id,{place:bs.level==='Provincia'?placeData[0]:bs.level==='Cantón'?placeData[1]+' · '+placeData[0]:placeData[2]+' · '+placeData[1]+' · '+placeData[0],valid:0,target:0});
      if(r[4]>=0){const g=by.get(id);g.valid+=r[5];if(r[4]===bs.party)g.target+=r[5]}
    }
    const nat=nt?100*(national.get(bs.party)||0)/nt:0;
    const scores=[...by].map(([id,g])=>({...g,id,share:g.valid?100*g.target/g.valid:NaN,nat})).filter(g=>Number.isFinite(g.share)).map(g=>({...g,adv:g.share-g.nat})).sort((a,b)=>b.adv-a.adv);
    return {scores,nat,parts};
 }
 function renderBastions(){
   if(!bastionRoot)return;
   const b=makeBastions();
   const s=(id,values,value)=>`<select id="v28-b-${id}">${values.map(([v,t])=>`<option value="${esc(v)}" ${String(v)===String(value)?'selected':''}>${esc(t)}</option>`).join('')}</select>`;
   const opts=s('year',db.years.map(y=>[y,y]),bs.year)+s('arena',[[0,'Presidencia'],[1,'Diputaciones']],bs.arena)+s('level',['Provincia','Cantón','Distrito'].map(x=>[x,x]),bs.level)+s('party',b.parts.map(p=>[p,db.parties[p]]),bs.party);
   const sorted=b.scores.slice(0,25);
   const body=sorted.map((x,i)=>`<tr><td>${i+1}</td><th>${esc(x.place)}</th><td>${pct(x.share)}</td><td>${pct(x.nat)}</td><td class="${x.adv>=0?'v28-up':''}">${x.adv.toLocaleString('es-CR',{maximumFractionDigits:2,minimumFractionDigits:2})} pp</td></tr>`).join('');
   bastionRoot.innerHTML=`<div class="v28-top"><div class="v28-kicker">PARTIDOS Y TERRITORIO · ANÁLISIS COMPARABLE</div><h2>Bastiones electorales</h2><p>Ventaja del partido frente a su porcentaje nacional en la misma arena y elección.</p></div><div class="v28-bcontrols">${opts}<label><input type="checkbox" id="v28-b-all" ${bs.all?'checked':''}>Todos los partidos</label></div><div class="v28-preview"><p>Resultado nacional del partido: <strong>${pct(b.nat)}</strong>. Los territorios se ordenan por diferencia en puntos porcentuales, no por votos absolutos. La lista predeterminada exige ≥3 % nacional en dos elecciones.</p><div class="v28-mat-scroll"><table class="v28-table"><thead><tr><th>Puesto</th><th>Territorio</th><th>% local</th><th>% nacional</th><th>Ventaja</th></tr></thead><tbody>${body}</tbody></table></div><div class="v28-figure-head"><p>CSV auditable del ranking seleccionado</p><button id="v28-b-download">Descargar CSV</button></div></div>`;
   bastionRoot.querySelectorAll('select').forEach(el=>el.addEventListener('change',()=>{
      let key=el.id.slice(6);bs[key]=['year','arena','party'].includes(key)?Number(el.value):el.value;
      renderBastions()
   }));
   bastionRoot.querySelector('#v28-b-all').addEventListener('change',e=>{bs.all=e.target.checked;renderBastions()});
   bastionRoot.querySelector('#v28-b-download').addEventListener('click',()=>{
     const csv='Territorio,Porcentaje local,Porcentaje nacional,Ventaja pp\n'+b.scores.map(g=>[g.place,g.share.toFixed(3),g.nat.toFixed(3),g.adv.toFixed(3)].map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(',')).join('\r\n');
     download('\ufeff'+csv,'Atlas_Bastiones_'+bs.year+'_'+bs.level+'.csv','text/csv;charset=utf-8')
   });
 }
 function attachBastions(){
   if(bastionRoot?.isConnected)return;
   const h=findPartySection();if(!h)return;
   if(document.getElementById('atlas-v28-bastiones'))return;
   bastionRoot=document.createElement('section');bastionRoot.id='atlas-v28-bastiones';bastionRoot.className='v28-root';
   h.insertAdjacentElement('afterend',bastionRoot);renderBastions();
 }
 const bstyles=document.createElement('style');bstyles.textContent='.v28-bcontrols{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;padding:20px;background:#eaf4f5}.v28-bcontrols select{background:white;border:1px solid #bed1db;padding:9px;border-radius:8px;color:#173c50;max-width:100%}.v28-up{color:#117a6c;font-weight:800}';document.head.appendChild(bstyles);
 const bastionObserver=new MutationObserver(()=>{if(!bastionRoot?.isConnected)attachBastions()});bastionObserver.observe(document.documentElement,{childList:true,subtree:true});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attachBastions);else attachBastions();

})();

/* Compatibilidad puntual con las matrices de participación existentes en V27.
   Nunca crea una segunda sección ni modifica datos o trazas electorales. */
(function(){
 'use strict';
 let busy=false;
 function improve(){
  const sec=document.querySelector('#atlas-v27-participacion');
  if(!sec)return;
  const scale=sec.querySelector('#a27-p-scale'),mode=sec.querySelector('#a27-p-mode');
  if(!scale||!mode)return;
  const province=scale.value==='p',district=scale.value==='d';
  const top=mode.querySelector('option[value="top10"]'),complete=mode.querySelector('option[value="matrix"]');
  if(top){top.hidden=province;top.disabled=province;}
  if(complete){complete.hidden=district;complete.disabled=district;}
  if(province&&mode.value==='top10'){
   mode.value='matrix';mode.dispatchEvent(new Event('change',{bubbles:true}));return;
  }
  if(district&&mode.value==='matrix'){
   mode.value='top10';mode.dispatchEvent(new Event('change',{bubbles:true}));return;
  }
  const m=sec.querySelector('#a27-p-table-region table');
  if(m&&m.tHead&&m.tFoot&&m.tFoot.rows.length){
   const topRow=m.tHead.rows[0],bottomRow=m.tFoot.rows[0];
   if(topRow&&bottomRow&&topRow.cells.length===bottomRow.cells.length){
    for(let i=1;i<topRow.cells.length;i++){
     if(/^\s*(?:19\d\d|20\d\d)\s*$/.test(topRow.cells[i].textContent)){
      topRow.cells[i].textContent='';topRow.cells[i].title='Año identificado en el eje inferior';
     }
    }
   }
  }
  const existing=sec.querySelector('#v28-first-visible');
  if(mode.value!=='first'){if(existing)existing.remove();return;}
  const table=sec.querySelector('#a27-p-details table');
  if(!table)return;
  const named=[...table.querySelectorAll('tbody tr')].map(row=>[...row.cells].map(x=>x.textContent.trim()))
    .filter(c=>c.length>=4&&/^\d{4}$/.test(c[0]));
  if(!named.length)return;
  const signature=named.map(x=>x[0]+'-'+x[2]+'-'+x[3]).join('|');
  if(existing?.dataset.signature===signature)return;
  if(existing)existing.remove();
  const el=document.createElement('section');el.id='v28-first-visible';el.className='v28-first-visible';el.dataset.signature=signature;
  const caption=document.createElement('p');caption.textContent='Territorio que ocupa el primer lugar en cada elección';el.append(caption);
  const wrap=document.createElement('div');wrap.className='v28-first-list';
  for(const c of named){const card=document.createElement('span');card.className='v28-first-chip';card.textContent=c[0]+' · '+c[2]+' ('+c[3]+')';wrap.append(card)}
  el.append(wrap);
  const plot=sec.querySelector('#a27-p-plot');if(plot)plot.before(el);
 }
 const style=document.createElement('style');style.textContent='.v28-first-visible{padding:10px 18px 12px;background:#f1f9f9;border:1px solid #cde5e8;border-radius:10px;margin:9px 18px}.v28-first-visible p{font-size:11px;color:#2a6675;font-weight:750;margin:0 0 8px}.v28-first-list{display:flex;gap:7px;overflow:auto;padding:3px 1px 6px}.v28-first-chip{flex:0 0 auto;padding:7px 9px;border:1px solid #d4e5e8;border-radius:8px;font-size:10px;background:#fff;color:#214759;white-space:nowrap}';document.head.append(style);
 const obs=new MutationObserver(()=>{if(busy)return;busy=true;requestAnimationFrame(()=>{busy=false;improve()})});
 obs.observe(document.documentElement,{childList:true,subtree:true});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',improve);else improve();
})();
