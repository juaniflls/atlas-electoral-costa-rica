/* Atlas Electoral V24.0 — capa adicional, preserva las visualizaciones V23.31. */
(()=>{
  'use strict';
  if(window.atlasV24Territorial)return;
  const node=document.getElementById('atlas-v24-data');
  if(!node)return;
  const V=JSON.parse(node.textContent);
  const years=V.years;
  const era=y=>y<=1974?0:y<=1998?1:y<=2022?2:3;
  const eraColors=['#a9d1c6','#aec2e5','#edc7a5','#d4bde6'];
  const es=(x)=>String(x??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  const fmt=(n,d=1)=>Number.isFinite(Number(n))?Number(n).toLocaleString('es-CR',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
  const safe=(str)=>String(str??'').replace(/[^a-z0-9]+/gi,'_').slice(0,65);
  const idx=(arr,k)=>new Map(arr.map(r=>[k(r),r]));
  const terms={abst_pct:'Abstencionismo',part_pct:'Participación',valid_pct:'Voto válido',noval_pct:'Voto no válido',blancos_pct:'Votos blancos',nulos_pct:'Votos nulos',emip_pct:'Votos emitidos'};
  const names={P:'Presidencia · primera ronda',L:'Diputaciones',R:'Presidencia · segunda ronda'};
  const runoffYears=new Set(V.metrics.filter(r=>r[1]==='R').map(r=>r[0]));
  const regions=new Map(V.cantons.map(r=>[r[0],{code:r[0],province:r[1],name:r[2]}]));
  const districts=new Map(V.districts.map(r=>[r[0],{code:r[0],parent:r[1],province:r[2],canton:r[3],name:r[4]}]));
  const mrows=V.metrics.map(r=>Object.fromEntries(V.metrics_fields.map((f,i)=>[f,r[i]])));
  const prows=V.votes.map(r=>Object.fromEntries(V.votes_fields.map((f,i)=>[f,r[i]])));
  const leader=V.leaders.map(r=>({year:r[0],arena:r[1],level:r[2],key:String(r[3]),party:r[4],votes:r[5],share:r[6]}));
  const metricIndex=idx(mrows,r=>`${r.year}/${r.arena}/${r.level}/${r.key}`);
  const leaderIndex=idx(leader,r=>`${r.year}/${r.arena}/${r.level}/${r.key}`);
  const voteByLocation=new Map();
  for(const r of prows){const k=`${r.year}/${r.arena}/${r.level}/${r.key}`;if(!voteByLocation.has(k))voteByLocation.set(k,[]);voteByLocation.get(k).push(r)}
  for(const v of voteByLocation.values())v.sort((a,b)=>b.votes-a.votes);
  const pick=(year,arena,level,key)=>metricIndex.get(`${year}/${arena}/${level}/${key}`);
  const list=(year,arena,level,key)=>voteByLocation.get(`${year}/${arena}/${level}/${key}`)||[];
  const color=s=>typeof semanticColor==='function'?semanticColor(s):'#268b94';
  function dl(filename,content,mime){const url=URL.createObjectURL(new Blob([content],{type:mime}));const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000)}
  function csvData(rows,filename){if(!rows?.length)return;const cols=Object.keys(rows[0]);const quote=x=>'"'+String(x??'').replace(/"/g,'""')+'"';dl(filename,'\ufeff'+[cols.map(quote).join(','),...rows.map(r=>cols.map(k=>quote(r[k])).join(','))].join('\r\n'),'text/csv;charset=utf-8')}
  function actions(id){return `<div class="v24-actions"><button data-export="${id}:png">PNG</button><button data-export="${id}:svg">SVG</button><button data-export="${id}:csv">CSV</button></div>`}
  function listenExport(host,id,fig,rows,filename){for(const b of host.querySelectorAll('[data-export^="'+id+':"]'))b.addEventListener('click',async()=>{const fmt=b.dataset.export.split(':')[1];if(fmt==='csv')return csvData(rows,filename+'.csv');if(typeof Plotly!=='undefined'&&fig){await Plotly.downloadImage(fig,{format:fmt,filename,width:1400,height:780,scale:fmt==='png'?2:1})}})}
  function section(target,id,title,desc){if(!target||document.getElementById(id))return null;const c=document.createElement('section');c.id=id;c.className='v24-section';c.innerHTML=`<div class="v24-head"><div><span class="v24-eyebrow">ATLAS ELECTORAL · ANÁLISIS TERRITORIAL</span><h3>${title}</h3><p>${desc}</p></div></div>`;target.append(c);return c}
  const select=(id,label,opts)=>`<label>${label}<select id="${id}">${opts.map(([v,t])=>`<option value="${es(v)}">${es(t)}</option>`).join('')}</select></label>`;
  function redrawPlot(id,traces,layout){const e=document.getElementById(id);if(!e||!window.Plotly)return;Plotly.react(e,traces,{font:{family:'Arial, sans-serif',color:'#183646'},paper_bgcolor:'#fff',plot_bgcolor:'#fff',margin:{l:185,r:35,t:38,b:90},...layout},{responsive:true,displaylogo:false,toImageButtonOptions:{format:'png',scale:2}})}
  function bindInputs(host,callback){host.querySelectorAll('select,input').forEach(n=>n.addEventListener('change',callback))}
  const renderRegions=(year,arena)=>{
    return V.cantons.filter(r=>V.canton_years[r[0]]?.includes(year)).map(r=>r[0]);
  };
  function resultsPanel(){
    const root=document.getElementById('content'); const sec=section(root,'atlas24-results','Resultados por provincia, cantón y distrito','Consulte el escrutinio territorial de cada elección, compare partidos y descargue los datos del territorio seleccionado. Los mapas provinciales permanecen en la vista principal.');
    if(!sec)return;
    sec.innerHTML+=`<div class="v24-controls">${select('v24r-year','Elección',years.map(y=>[y,y]))}${select('v24r-arena','Elección y ronda',Object.entries(names).map(([a,n])=>[a,n]))}${select('v24r-level','División territorial',[['p','Provincia'],['c','Cantón'],['d','Distrito']])}${select('v24r-province','Provincia',V.provinces.map(x=>[x,x]))}${select('v24r-canton','Cantón',[])}${select('v24r-district','Distrito',[])}</div>
    <div class="v24-kpis" id="v24r-kpis"></div><div class="v24-chart-head"><div><h4 id="v24r-title">Voto válido por partido</h4><p>Porcentajes sobre votos válidos en la arena y territorio seleccionados</p></div>${actions('v24r')}</div><div id="v24r-plot" class="v24-plot"></div><div class="v24-tablewrap"><table id="v24r-table"></table></div>`;
    const el=id=>document.getElementById(id);let current=[];
    function populate(){let year=Number(el('v24r-year').value),p=el('v24r-province').value;
      const rOption=el('v24r-arena').querySelector('option[value="R"]');if(rOption){rOption.disabled=!runoffYears.has(year);rOption.hidden=!runoffYears.has(year)}if(!runoffYears.has(year)&&el('v24r-arena').value==='R')el('v24r-arena').value='P';
      let cc=[...regions.values()].filter(c=>c.province===p&&V.canton_years[c.code]?.includes(year));
      el('v24r-canton').innerHTML=cc.map(c=>`<option value="${c.code}">${es(c.name)}</option>`).join('');
      const c=el('v24r-canton').value;
      el('v24r-district').innerHTML=[...districts.values()].filter(d=>d.parent===c&&V.district_years[d.code]?.includes(year)).map(d=>`<option value="${d.code}">${es(d.name)}</option>`).join('');
    }
    function draw(){
      const y=+el('v24r-year').value,a=el('v24r-arena').value,l=el('v24r-level').value,p=el('v24r-province').value;
      el('v24r-canton').closest('label').hidden=l==='p';el('v24r-district').closest('label').hidden=l!=='d';
      const k=l==='p'?p:l==='c'?el('v24r-canton').value:el('v24r-district').value;
      const geo=l==='p'?p:l==='c'?regions.get(k)?.name:districts.get(k)?.name;
      const rows=list(y,a,l,k),m=pick(y,a,l,k);
      current=rows.map((r,i)=>({posicion:i+1,anio:y,arena:names[a],provincia:p,territorio:geo||k,codigo:k,partido:r.party,votos:r.votes,porcentaje_validos:+Number(r.share||0).toFixed(4)}));
      el('v24r-title').textContent=`${names[a]} · ${geo||p} · ${y}`;
      el('v24r-kpis').innerHTML=[['Votos válidos',m?.validos,0],['Participación',m?.part_pct,1,'%'],['Abstencionismo',m?.abst_pct,1,'%'],['Voto no válido',m?.noval_pct,2,'%']].map(([t,n,d,suffix=''])=>`<div><small>${t}</small><b>${fmt(n,d)}${suffix}</b></div>`).join('');
      el('v24r-table').innerHTML='<thead><tr><th>Partido</th><th>Votos</th><th>% válidos</th></tr></thead><tbody>'+rows.map(r=>`<tr><td><span class="v24-dot" style="background:${color(r.party)}"></span>${es(r.party)}</td><td>${fmt(r.votes,0)}</td><td>${fmt(r.share,2)} %</td></tr>`).join('')+'</tbody>';
      const drawrows=rows.slice(0,18).reverse();
      redrawPlot('v24r-plot',[{type:'bar',orientation:'h',x:drawrows.map(r=>r.share),y:drawrows.map(r=>r.party),marker:{color:drawrows.map(r=>color(r.party))},customdata:drawrows.map(r=>r.votes),hovertemplate:'%{y}<br>%{x:.2f}% · %{customdata:,} votos<extra></extra>',text:drawrows.map(r=>`${fmt(r.share,1)} %`),textposition:'outside'}],{height:Math.max(400,drawrows.length*35+135),xaxis:{title:'Porcentaje de votos válidos'},yaxis:{automargin:true},margin:{l:210,r:68,t:15,b:75}})
    }
    el('v24r-year').value=state.focus;el('v24r-province').value=state.province==='Nacional'?'San José':state.province;populate();draw();
    el('v24r-year').addEventListener('change',()=>{populate();draw()});el('v24r-province').addEventListener('change',()=>{populate();draw()});
    el('v24r-canton').addEventListener('change',()=>{const y=+el('v24r-year').value,c=el('v24r-canton').value;el('v24r-district').innerHTML=[...districts.values()].filter(d=>d.parent===c&&V.district_years[d.code]?.includes(y)).map(d=>`<option value="${d.code}">${es(d.name)}</option>`).join('');draw()});
    for(const id of ['v24r-arena','v24r-level','v24r-district'])el(id).addEventListener('change',draw);
    sec.querySelectorAll('[data-export^="v24r:"]').forEach(b=>b.addEventListener('click',async()=>{const type=b.dataset.export.split(':')[1];const fn='resultados_'+el('v24r-year').value+'_'+safe(el('v24r-province').value);if(type==='csv')return csvData(current,fn+'.csv');await Plotly.downloadImage(el('v24r-plot'),{format:type,filename:fn,width:1450,height:Math.max(650,current.slice(0,18).length*38+150),scale:type==='png'?2:1})}));
  }
  function rankingPanel(){
    const sec=section(document.getElementById('content'),'atlas24-rankings','Comparador histórico de participación electoral','Identifique territorios con los valores mayores o menores por elección. Cambie la arena, la variable y la escala sin perder las series históricas.');if(!sec)return;
    sec.innerHTML+=`<div class="v24-controls">${select('v24p-year','Elección',years.map(y=>[y,y]))}${select('v24p-arena','Arena',Object.entries(names).map(([a,n])=>[a,n]))}${select('v24p-level','Unidad territorial',[['p','Provincias'],['c','Cantones'],['d','Distritos']])}${select('v24p-metric','Indicador',Object.entries(terms).map(([k,v])=>[k,v]))}${select('v24p-order','Orden',[['top','Valores mayores'],['bottom','Valores menores']])}</div><div class="v24-chart-head"><div><h4 id="v24p-title"></h4><p>Porcentajes por territorio · Top 10</p></div>${actions('v24p')}</div><div id="v24p-plot" class="v24-plot"></div><div class="v24-tablewrap"><table id="v24p-table"></table></div>`;
    const el=id=>document.getElementById(id);let selected=[];
    function label(r){return r.level==='p'?r.key:r.level==='c'?`${regions.get(String(r.key))?.name||r.key} · ${regions.get(String(r.key))?.province||''}`:`${districts.get(String(r.key))?.name||r.key} · ${districts.get(String(r.key))?.canton||''}`}
    function draw(){const y=+el('v24p-year').value,a=el('v24p-arena').value,l=el('v24p-level').value,m=el('v24p-metric').value,order=el('v24p-order').value;
      const all=mrows.filter(r=>r.year===y&&r.arena===a&&r.level===l&&r[m]!=null).sort((x,z)=>order==='top'?z[m]-x[m]:x[m]-z[m]);
      selected=all.map((r,i)=>({posicion:i+1,eleccion:y,arena:names[a],territorio:label(r),codigo:r.key,indicador:terms[m],porcentaje:r[m],validos:r.validos,emitidos:r.emitidos,abstenciones:r.abstenciones}));
      const top=selected.slice(0,10);el('v24p-title').textContent=`${terms[m]} · ${names[a]} · ${y}`;
      el('v24p-table').innerHTML='<thead><tr><th>Posición</th><th>Territorio</th><th>%</th></tr></thead><tbody>'+top.map(r=>`<tr><td>${r.posicion}</td><td>${es(r.territorio)}</td><td><strong>${fmt(r.porcentaje,2)} %</strong></td></tr>`).join('')+'</tbody>';
      redrawPlot('v24p-plot',[{type:'bar',orientation:'h',x:top.map(x=>x.porcentaje).reverse(),y:top.map(x=>x.territorio).reverse(),marker:{color:'#208d95'},text:top.map(x=>`${fmt(x.porcentaje,1)} %`).reverse(),textposition:'outside',hovertemplate:'%{y}<br>%{x:.2f}%<extra></extra>'}],{height:530,margin:{l:255,r:45,t:20,b:65},xaxis:{title:'Porcentaje'}})
    }
    el('v24p-year').value=state.focus;draw();bindInputs(sec,draw);
    sec.querySelectorAll('[data-export^="v24p:"]').forEach(b=>b.addEventListener('click',async()=>{let type=b.dataset.export.split(':')[1];if(type==='csv')return csvData(selected,'ranking_territorial_'+el('v24p-year').value+'.csv');await Plotly.downloadImage(el('v24p-plot'),{format:type,filename:'ranking_territorial_'+el('v24p-year').value,width:1450,height:780,scale:type==='png'?2:1})}));
  }
  function cantonMatrix(){
    const sec=section(document.getElementById('content'),'atlas24-canton','Liderazgos por cantón y elección','Matriz de partidos con más votos. Las provincias agrupan sus cantones y cada columna representa una elección; los años de ausencia territorial se muestran con un guion.');if(!sec)return;
    sec.innerHTML+=`<div class="v24-controls">${select('v24c-arena','Arena',[['L','Diputaciones'],['P','Presidencia']])}${select('v24c-level','Cobertura territorial',[['c','84 cantones por provincia'],['p','7 provincias']])}</div><div class="v24-chart-head"><div><h4>Liderazgo territorial · 1953–2026</h4><p>Color por partido ganador; consultar cifra y porcentaje colocando el cursor en cada casilla.</p></div>${actions('v24c')}</div><div class="v24-matrixwrap" id="v24c-matrix"></div>`;
    const el=id=>document.getElementById(id);let rows=[];
    function geo(level){if(level==='p')return V.provinces.map(p=>({province:p,name:p,key:p}));return V.provinces.flatMap(p=>V.cantons.filter(c=>c[1]===p).map(c=>({province:p,name:c[2],key:c[0]})))}
    const cell=(r,y,arena,l)=>{const live=l==='p'||V.canton_years[r.key]?.includes(y);if(!live)return null;return leaderIndex.get(`${y}/${arena}/${l}/${r.key}`)||null};
    function makeSVG(){const g=geo(el('v24c-level').value),l=el('v24c-level').value,a=el('v24c-arena').value;
      const cw=68,rh=27,left=315,top=90,w=left+cw*years.length+30,h=top+g.length*rh+50;
      let s=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="white"/><text x="16" y="26" font-family="Arial" font-size="20" font-weight="700" fill="#183646">Liderazgos territoriales · ${a==='L'?'Diputaciones':'Presidencia'}</text>`;
      years.forEach((y,i)=>{s+=`<rect x="${left+i*cw}" y="53" width="${cw-2}" height="5" fill="${eraColors[era(y)]}"/><text x="${left+i*cw+cw/2}" y="77" font-family="Arial" font-size="12" fill="#34505f" text-anchor="middle">${y}</text>`});
      let last='';g.forEach((r,i)=>{const y=top+i*rh;if(r.province!==last){last=r.province;s+=`<rect x="0" y="${y}" width="100%" height="1.5" fill="#b1c7d0"/>`}
        s+=`<text x="10" y="${y+19}" font-size="12" font-family="Arial" font-weight="${r.province===r.name?'bold':'normal'}" fill="#23475a">${es(r.name)}</text>`;
        years.forEach((yr,j)=>{const x=left+j*cw,v=cell(r,yr,a,l),fill=v?color(v.party):'#e8edf0';s+=`<rect x="${x}" y="${y}" width="${cw-2}" height="${rh-2}" rx="2" fill="${fill}" stroke="#fff"/>`;if(!v)s+=`<text x="${x+cw/2}" y="${y+19}" font-size="11" text-anchor="middle" font-family="Arial" fill="#82959f">—</text>`});
      });return s+'</svg>'}
    function draw(){const g=geo(el('v24c-level').value),l=el('v24c-level').value,a=el('v24c-arena').value;
      rows=g.flatMap(r=>years.map(y=>{const v=cell(r,y,a,l);return {eleccion:y,arena:names[a],provincia:r.province,territorio:r.name,codigo:r.key,estado:v?'Con resultados':'Sin registro territorial',partido_ganador:v?.party||'',votos_ganador:v?.votes??'',porcentaje_validos:v?.share??''}}));
      let last='',s='<table class="v24-matrix"><thead><tr><th>Provincia</th><th>Cantón / provincia</th>'+years.map(y=>`<th><span style="border-bottom:4px solid ${eraColors[era(y)]}">${y}</span></th>`).join('')+'</tr></thead><tbody>';
      for(const r of g){if(r.province!==last){last=r.province;s+=`<tr class="v24-group"><th colspan="${2+years.length}">${es(last)}</th></tr>`}
        s+=`<tr><td>${es(r.province)}</td><th>${es(r.name)}</th>`+years.map(y=>{const v=cell(r,y,a,l);return v?`<td class="v24-cell" title="${es(v.party)} · ${fmt(v.votes,0)} votos · ${fmt(v.share,2)}%" style="--cell:${color(v.party)}"><span>${fmt(v.share,0)}%</span></td>`:`<td class="v24-cell missing" title="Sin observación territorial">—</td>`}).join('')+'</tr>';
      }el('v24c-matrix').innerHTML=s+'</tbody></table>';
    }
    draw();bindInputs(sec,draw);
    sec.querySelectorAll('[data-export^="v24c:"]').forEach(b=>b.addEventListener('click',()=>{const t=b.dataset.export.split(':')[1];if(t==='csv')return csvData(rows,'liderazgo_cantonal_historico.csv');const svg=makeSVG();if(t==='svg')return dl('liderazgo_cantonal_historico.svg',svg,'image/svg+xml');const blob=new Blob([svg],{type:'image/svg+xml'}),url=URL.createObjectURL(blob),im=new Image();im.onload=()=>{const canvas=document.createElement('canvas');canvas.width=im.naturalWidth;canvas.height=im.naturalHeight;canvas.getContext('2d').drawImage(im,0,0);canvas.toBlob(png=>{if(png)dl('liderazgo_cantonal_historico.png',png,'image/png');URL.revokeObjectURL(url)})};im.src=url}));
  }
  function strongholdPanel(){
    const sec=section(document.getElementById('content'),'atlas24-bastiones','Bastiones electorales y ventajas territoriales','Compare el porcentaje local del partido con su porcentaje nacional en la misma elección. La diferencia se expresa en puntos porcentuales y puede explorarse por cantón o distrito.');if(!sec)return;
    const allParties=[...new Set(prows.filter(r=>r.arena==='P'||r.arena==='L').map(r=>r.party))].sort((a,b)=>a.localeCompare(b,'es'));
    sec.innerHTML+=`<div class="v24-controls">${select('v24b-year','Elección',years.map(y=>[y,y]))}${select('v24b-arena','Arena',[['L','Diputaciones'],['P','Presidencia']])}${select('v24b-level','División',[['c','Cantones'],['d','Distritos'],['p','Provincias']])}${select('v24b-party','Partido',allParties.map(n=>[n,n]))}</div><div class="v24-chart-head"><div><h4 id="v24b-title">Ventajas electorales territoriales</h4><p>Porcentaje territorial menos porcentaje nacional del mismo partido</p></div>${actions('v24b')}</div><div id="v24b-plot" class="v24-plot"></div><div class="v24-tablewrap"><table id="v24b-table"></table></div>`;
    const el=id=>document.getElementById(id);let current=[];
    function lbl(l,k){return l==='c'?(regions.get(String(k))?.name+' · '+regions.get(String(k))?.province):l==='d'?(districts.get(String(k))?.name+' · '+districts.get(String(k))?.canton):k}
    function draw(){let y=+el('v24b-year').value,a=el('v24b-arena').value,l=el('v24b-level').value,p=el('v24b-party').value;
      let national=list(y,a,'n','CR').find(r=>r.party===p)?.share||0;
      const available=prows.filter(r=>r.year===y&&r.arena===a&&r.level===l&&r.party===p).map(r=>({eleccion:y,partido:p,arena:names[a],territorio:lbl(l,r.key),codigo:r.key,votos:r.votes,cuota_territorial:r.share,cuota_nacional:national,diferencia_pp:r.share-national})).sort((x,z)=>z.diferencia_pp-x.diferencia_pp);
      current=available;const top=current.slice(0,15);el('v24b-title').textContent=`${p} · ${y} · ventajas territoriales`;
      el('v24b-table').innerHTML='<thead><tr><th>Territorio</th><th>Votos</th><th>% local</th><th>% nacional</th><th>Ventaja (pp)</th></tr></thead><tbody>'+top.map(r=>`<tr><td>${es(r.territorio)}</td><td>${fmt(r.votos,0)}</td><td>${fmt(r.cuota_territorial,2)} %</td><td>${fmt(r.cuota_nacional,2)} %</td><td><strong>${r.diferencia_pp>=0?'+':''}${fmt(r.diferencia_pp,2)}</strong></td></tr>`).join('')+'</tbody>';
      const t=top.slice().reverse();redrawPlot('v24b-plot',[{type:'bar',orientation:'h',x:t.map(r=>r.diferencia_pp),y:t.map(r=>r.territorio),marker:{color:color(p)},text:t.map(r=>`${r.diferencia_pp>=0?'+':''}${fmt(r.diferencia_pp,1)} pp`),textposition:'outside',hovertemplate:'%{y}<br>%{x:+.2f} puntos porcentuales<extra></extra>'}],{height:600,margin:{l:290,r:75,t:20,b:65},xaxis:{title:'Diferencia frente al porcentaje nacional (pp)',zeroline:true,zerolinewidth:2}})
    }
    el('v24b-year').value=state.focus;const defaultParties=prows.filter(r=>r.year===state.focus&&r.arena==='L'&&r.level==='n');el('v24b-party').value=defaultParties.sort((a,b)=>b.votes-a.votes)[0]?.party||allParties[0];draw();bindInputs(sec,draw);
    sec.querySelectorAll('[data-export^="v24b:"]').forEach(b=>b.addEventListener('click',async()=>{let type=b.dataset.export.split(':')[1];if(type==='csv')return csvData(current,'bastiones_'+el('v24b-year').value+'.csv');await Plotly.downloadImage(el('v24b-plot'),{format:type,filename:'bastiones_'+el('v24b-year').value,width:1450,height:800,scale:type==='png'?2:1})}));
  }
  // Añade nuevos módulos a las mismas secciones; las gráficas aprobadas siguen intactas.
  for(const [key,extras] of [['participacion',[rankingPanel]],['gobierno',[resultsPanel]],['partidos',[cantonMatrix,strongholdPanel]]]){
    const before=views[key];if(typeof before!=='function')continue;
    views[key]=function(...args){let result=before.apply(this,args);for(const ext of extras){try{ext()}catch(err){console.error('Atlas V24',key,err)}}return result};
  }
  window.atlasV24Territorial={version:'24.0',metrics:mrows.length,votes:prows.length};
})();
