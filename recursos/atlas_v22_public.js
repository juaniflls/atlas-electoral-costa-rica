/* ATLAS_V22_PUBLIC_PRODUCT · interfaces auditables, datos y visualización sin alterar gráficos existentes */
(function atlasV22Public(){
  'use strict';
  const yearBounds=()=>Y.filter(y=>y>=state.from&&y<=state.to);
  let chamberTimer=null;
  function stopSequence(){if(chamberTimer!==null){clearInterval(chamberTimer);chamberTimer=null;}}
  const renderPerson=r=>{
    const key=r.id_persona || (D.eventos||[]).find(e=>e.anio===r.anio&&e.cargo===r.cargo&&e.nombre===r.nombre)?.id_persona;
    return key?`<button type="button" class="v22-person" data-v22-person="${esc(key)}" title="Abrir trayectoria nominal">${esc(r.nombre)}</button>`:esc(r.nombre);
  };
  document.addEventListener('click',e=>{
    const person=e.target.closest('[data-v22-person]');
    if(person){local.credentialperson=person.dataset.v22Person;local.credentialpage=0;stopSequence();if(views.credenciales){gotoTab('credenciales')}else{local.person=person.dataset.v22Person;gotoTab('trayectorias')}return;}
    const seat=e.target.closest('[data-v22-party]');
    if(seat){local.gparty=local.gparty===seat.dataset.v22Party?'Todos':seat.dataset.v22Party;stopSequence();render();return;}
    const play=e.target.closest('#v22-chamber-play');
    if(play){if(chamberTimer!==null){stopSequence();render();return;}
      const years=yearBounds();if(years.length<2)return;
      let k=years.indexOf(state.focus);if(k<0||k===years.length-1)k=-1;
      chamberTimer=setInterval(()=>{if(state.tab!=='gobierno'){stopSequence();return;}
        k++;if(k>=years.length){stopSequence();return;}
        state.focus=years[k];if($('focus'))$('focus').value=state.focus;render();
        if(k===years.length-1)stopSequence();
      },1450);render();
    }
  });
  const oldGoto=gotoTab;
  gotoTab=function(tab){if(tab!=='gobierno')stopSequence();return oldGoto(tab);};
  // En el módulo de fórmulas no se repiten las dos figuras de sexo; permanecen en Sexo y representación.
  views.formulas=function(){
    title('Fórmulas presidenciales · archivo histórico','Explore, elección por elección, las candidaturas a la Presidencia y ambas Vicepresidencias; identifique las fórmulas electas y consulte sus integrantes.');
    note('El año de detalle se modifica en el filtro superior «Elección de detalle». Los registros describen candidaturas y resultados electorales; no deben confundirse con duración efectiva del ejercicio del cargo.');
    const all=period(D.formulas,false),parties=uniq(all.map(r=>r.partido)).sort((a,b)=>labelText(a).localeCompare(labelText(b),'es'));
    const current=parties.includes(local.fp)?local.fp:'Todos';
    controls([['fp','Partido político',['Todos',...parties.map(p=>[p,labelText(p)])],current]]);
    const visible=all.filter(r=>(!local.fp||local.fp==='Todos'||r.partido===local.fp)),year=state.focus,chosen=visible.filter(r=>r.anio===year),
      groups=group(chosen,r=>r.formula||r.partido+'-'+r.anio).map(([key,rows])=>({key,rows,party:rows[0].partido,elected:rows.some(r=>r.electa)}));
    groups.sort((a,b)=>Number(b.elected)-Number(a.elected)||labelText(a.party).localeCompare(labelText(b.party),'es'));
    kpis([['Elección',year,'Detalle seleccionado'],['Fórmulas',groups.length,'Listas presidenciales documentadas'],['Fórmulas electas',groups.filter(x=>x.elected).length,'Resultado en la fuente'],['Candidaturas',chosen.length,'Presidencia y vicepresidencias registradas']]);
    const cargoOrder=['Presidencia','Primera Vicepresidencia','Segunda Vicepresidencia'];
    add(`<div class="v22-archive-heading"><div><h3>Fórmulas que compitieron en ${year}</h3><p>Organizadas por partido, cargo y resultado registrado. Seleccione un nombre para consultar su trayectoria cuando exista identificación nominal.</p></div></div>`);
    if(!groups.length)note('No hay fórmulas documentadas con estos filtros para la elección seleccionada. No se representan candidaturas inexistentes.');
    else add(`<div class="v22-formula-grid">${groups.map(g=>{
      const members=cargoOrder.map(role=>g.rows.find(r=>r.cargo===role));
      const count=g.rows.filter(r=>r.electa).length;
      return `<article class="v22-formula-card ${g.elected?'v22-winner':''}" style="--formula-color:${semanticColor(g.party)}"><header><span class="v22-status">${g.elected?'Fórmula electa':'Candidatura registrada'}</span><h3>${esc(labelText(g.party))}</h3></header><div class="v22-formula-people">${cargoOrder.map((role,i)=>`<div class="v22-formula-person"><span class="v22-role">${esc(role)}</span><strong>${members[i]?renderPerson(members[i]):'Sin registro en esta base'}</strong></div>`).join('')}</div><footer>${g.elected?`Resultado electo documentado · ${count} cargo(s) electo(s)`:'Sin elección de la fórmula presidencial'} · ${esc(g.key)}</footer></article>`;
    }).join('')}</div>`);
    const history=D.ejecutivo_electo.filter(r=>r.cargo==='Presidencia'&&r.anio>=state.from&&r.anio<=state.to&&(!local.fp||local.fp==='Todos'||r.partido===local.fp)).sort((a,b)=>a.anio-b.anio);
    add('<section class="card v22-history"><h3>Presidencias electas · recorrido histórico</h3><p class="chart-note">Esta cronología distingue quién resultó electo en cada elección. Los procesos de segunda ronda y los periodos de ejercicio requieren las fuentes oficiales correspondientes.</p><div class="v22-history-track">'+history.map(r=>`<button type="button" class="v22-year-chip ${r.anio===year?'current':''}" data-v22-year="${r.anio}"><small>${r.anio}</small><b>${esc(r.nombre)}</b><span>${esc(labelText(r.partido))}</span></button>`).join('')+'</div></section>');
    document.querySelectorAll('[data-v22-year]').forEach(el=>el.onclick=()=>{state.focus=+el.dataset.v22Year;$('focus').value=state.focus;render()});
    table(chosen,['anio','partido','cargo','nombre','sexo','electa','formula','orden'],'Registro auditable de candidaturas de la elección');
  };
  // Hemiciclo interactivo complementario. Se preservan barras, lista provincial y tablas del módulo original.
  const oldGov=views.gobierno;
  views.gobierno=function(){oldGov();
    const chamber=D.camara_electa.filter(r=>r.anio===state.focus),all=chamber.slice().sort((a,b)=>labelText(a.partido).localeCompare(labelText(b.partido),'es')||a.provincia.localeCompare(b.provincia,'es')||(+a.posicion||0)-(+b.posicion||0));
    if(!all.length)return;
    const n=all.length,expected=state.focus<=1958?45:57;
    const ringCounts=n===45?[11,15,19]:n===57?[14,19,24]:null;
    const rings=ringCounts||[Math.floor(n*.24),Math.floor(n*.33),n-Math.floor(n*.24)-Math.floor(n*.33)];
    const points=[];let offset=0;
    rings.forEach((count,layer)=>{const radius=95+layer*52;for(let i=0;i<count;i++){
      const angle=Math.PI-(i+.5)*Math.PI/count;const r=all[offset++];if(!r)continue;
      const x=460+radius*Math.cos(angle),y=292-radius*Math.sin(angle);const focus=local.gparty==='Todos'||!local.gparty||local.gparty===r.partido;
      points.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="10.7" fill="${semanticColor(r.partido)}" stroke="white" stroke-width="1.6" opacity="${focus?1:.19}" tabindex="0" role="button" data-v22-party="${esc(r.partido)}"><title>${esc(r.nombre)} · ${esc(r.provincia)} · ${esc(labelText(r.partido))}</title></circle>`);
    }});
    const by=group(chamber,'partido').map(([party,arr])=>({party,count:arr.length})).sort((a,b)=>b.count-a.count),root=$('content');
    const card=document.createElement('section');card.className='card v22-chamber';
    card.innerHTML=`<div class="v22-chamber-head"><div><h3>Hemiciclo histórico · Asamblea electa de ${state.focus}</h3><p>Seleccione un punto o una bancada para resaltar su composición inicial. Cada punto representa una diputación electa.</p></div><button type="button" class="button primary" id="v22-chamber-play" aria-label="Reproducir evolución histórica de las Asambleas">${chamberTimer!==null?'Pausar':'▶ Reproducir historia'}</button></div><div class="v22-chamber-layout"><svg viewBox="0 0 920 338" role="img" aria-label="Hemiciclo con ${n} puntos, uno por diputación electa" class="v22-hemicycle"><path d="M 195 295 A 265 265 0 0 1 725 295" fill="none" stroke="#e8eff2" stroke-width="1"/>${points.join('')}<text x="460" y="266" text-anchor="middle" class="v22-seats-total">${n}</text><text x="460" y="290" text-anchor="middle" class="v22-seats-label">diputaciones</text></svg><div class="v22-chamber-legend">${by.map(r=>`<button class="v22-party-chip" type="button" data-v22-party="${esc(r.party)}"><i style="background:${semanticColor(r.party)}"></i><span>${esc(labelText(r.party))}</span><strong>${r.count}</strong></button>`).join('')}</div></div><p class="chart-note">${n===expected?'Magnitud histórica verificada':'Advertencia: cantidad de registros distinta de la magnitud histórica esperada'} · ${state.focus<=1958?'45 escaños en 1953 y 1958':'57 escaños desde 1962'}. La composición se refiere a diputaciones electas, no a cambios de bancada durante el periodo.</p>`;
    const chart=[...root.querySelectorAll('.card')].find(el=>el.textContent.includes('Composición partidaria de la Asamblea'));
    if(chart)root.insertBefore(card,chart);else root.appendChild(card);
    card.querySelectorAll('[data-v22-party]').forEach(el=>{el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click()}})});
  };
  // Catálogo de variables aplicado a la tabla ya seleccionada, sin alterar descarga, filtros ni CSV.
  const oldData=views.datos;
  views.datos=function(){oldData();const k=local.raw;
    if(!k||!Array.isArray(D[k]))return;
    const rows=D[k],cols=Object.keys(rows[0]||{}), sample=rows.slice(0,Math.min(rows.length,2000));
    const descriptions={anio:'Año de la elección',provincia:'Provincia o agregado nacional',partido:'Denominación partidaria normalizada',arena:'Tipo de elección: presidencial o legislativa',ronda:'Primera o segunda ronda cuando corresponda',padron:'Personas habilitadas para votar',emitidos:'Votos emitidos',validos:'Votos válidos',blancos:'Votos en blanco',nulos:'Votos nulos',abstenciones:'Personas del padrón que no emitieron voto',abstencion_pct:'Abstenciones divididas entre padrón × 100',participacion_pct:'Votos emitidos divididos entre padrón × 100',nep:'Número efectivo de partidos por votos: 1 / suma de cuotas al cuadrado',nep_escanos:'Número efectivo de partidos por escaños',gallagher:'Desproporcionalidad entre votos y escaños',divergencia_arenas:'Distancia agregada entre distribuciones presidenciales y legislativas',id_persona:'Clave nominal de enlace; no equivale a identidad civil certificada',electa:'Resultado electoral de la candidatura documentada',cargo:'Cargo electoral disputado',sexo:'Sexo consignado por la fuente',formula:'Identificador de la fórmula presidencial',cambio_partido:'Indicio de cambio de denominación partidaria entre participaciones',cambio_provincia:'Cambio de provincia entre participaciones legislativas documentadas'};
    const info=cols.map(key=>{const miss=sample.filter(r=>r[key]===null||r[key]===undefined||r[key]==='').length;const seen=sample.find(r=>r[key]!==null&&r[key]!==undefined&&r[key]!=='')?.[key];
      const typ=typeof seen==='number'?'Numérica':typeof seen==='boolean'?'Lógica':'Texto / identificador';
      return `<tr data-v22-field="${esc(key.toLowerCase())}"><td><code>${esc(key)}</code></td><td>${typ}</td><td>${esc(descriptions[key]||'Campo disponible en la tabla fuente; consulte su procedencia y unidades antes de interpretarlo.')}</td><td>${sample.length?num(miss/sample.length*100,1)+' %':'—'}</td></tr>`;
    }).join('');
    add(`<section class="card v22-schema"><div class="v22-schema-head"><div><h3>Diccionario interactivo de variables</h3><p>Examine las ${cols.length} columnas efectivamente disponibles en «${esc(k)}», sus tipos y sus valores faltantes. No confundir 0 con ausencia de información.</p></div><label>Buscar campo<input id="v22-schema-search" type="search" placeholder="Ej.: nep, partido, voto…"></label></div><div class="table-scroll"><table class="v22-schema-table"><thead><tr><th>Campo</th><th>Tipo observado</th><th>Definición / cautela</th><th>Faltantes (muestra)</th></tr></thead><tbody>${info}</tbody></table></div><p class="chart-note">Faltantes calculados sobre las primeras ${sample.length} filas de la tabla completa (muestra técnica, no estimación poblacional). Conserve las fuentes y el diccionario de integración para análisis académico.</p></section>`);
    const field=$('v22-schema-search');if(field)field.oninput=()=>{const q=field.value.toLowerCase().trim();document.querySelectorAll('[data-v22-field]').forEach(el=>el.hidden=!el.textContent.toLowerCase().includes(q))};
  };
  // Laboratorio: mostrar tamaño, cobertura y cautela interpretativa de los cruces seleccionados.
  const oldLab=views.laboratorio;
  views.laboratorio=function(){oldLab();const dataset=local.ds||'metricas',base=dataset==='metricas'?D.metricas.filter(r=>r.ronda===1&&r.provincia!=='Nacional'&&r.arena===(local.la||'Legislativa')):D.panel.filter(r=>r.provincia!=='Nacional');
    const filtered=period(base),numeric=Object.keys(base[0]||{}).filter(k=>k!=='anio'&&base.some(r=>typeof r[k]==='number'));
    const x=numeric.includes(local.lx)?local.lx:(dataset==='metricas'?'nep':'porcentaje_Legislativa');const y=numeric.includes(local.ly)?local.ly:(dataset==='metricas'?'abstencion_pct':'mujeres_pct');
    const points=filtered.filter(r=>Number.isFinite(+r[x])&&Number.isFinite(+r[y])&&r[x]!==null&&r[y]!==null);const n=points.length;
    const mx=n?points.reduce((s,r)=>s+(+r[x]),0)/n:0,my=n?points.reduce((s,r)=>s+(+r[y]),0)/n:0;
    const cv=points.reduce((s,r)=>{const dx=r[x]-mx,dy=r[y]-my;s.a+=dx*dy;s.b+=dx*dx;s.c+=dy*dy;return s},{a:0,b:0,c:0});
    const corr=n>2&&cv.b>0&&cv.c>0?cv.a/Math.sqrt(cv.b*cv.c):null;
    add(`<section class="card v22-lab-audit"><h3>Ficha de lectura del cruce</h3><div class="v22-lab-stats"><div><small>Observaciones completas</small><strong>${num(n,0)}</strong></div><div><small>Provincias observadas</small><strong>${num(uniq(points.map(r=>r.provincia)).length,0)}</strong></div><div><small>Años con datos</small><strong>${num(uniq(points.map(r=>r.anio)).length,0)}</strong></div><div><small>Correlación de Pearson (r)</small><strong>${corr===null?'No calculable':num(corr,3)}</strong></div></div><p><b>Variables:</b> ${esc(metricLabels[x]||x)} y ${esc(metricLabels[y]||y)}. Se excluyen únicamente las filas sin ambos valores numéricos. El coeficiente es descriptivo, no demuestra causalidad, independencia de observaciones ni significación estadística.</p></section>`);
  };
  // Glosario público: sin falsas promesas de inferencia individual del quiebre de voto.
  const oldMethod=views.metodo;
  views.metodo=function(){oldMethod();
    const terms=[
      ['Número efectivo de partidos (NEP)','1 / Σ pᵢ², donde pᵢ es la proporción de votos válidos de cada partido. Mide fragmentación efectiva, no el número de partidos inscritos.'],
      ['NEP de escaños','La misma fórmula usando proporciones de diputaciones, no de votos. Describe fragmentación parlamentaria.'],
      ['Participación electoral','Votos emitidos ÷ padrón × 100. No confundir con votos válidos ÷ padrón.'],
      ['Abstencionismo','Abstenciones ÷ padrón × 100. Puede calcularse separadamente para presidencial y legislativo.'],
      ['Votos blancos y nulos','Son categorías distintas de votos no válidos, con denominador explícito en cada indicador. Un cero observado no equivale a dato ausente.'],
      ['Concentración de los dos primeros','Suma de cuotas de voto válido de los dos partidos con más votos en esa arena y elección.'],
      ['Quiebre del voto agregado','½ × Σ |pᵢ presidencial − pᵢ legislativo|, comparando el mismo conjunto de denominaciones. Expresa distancia entre distribuciones, en puntos porcentuales, y no identifica personas que votaron distinto.'],
      ['Índice de Gallagher','Raíz cuadrada de ½ × suma de las diferencias cuadráticas entre porcentajes de votos y de escaños. Depende del nivel de agregación.'],
      ['Volatilidad nominal','Distancia en puntos porcentuales de cuotas partidarias entre elecciones sucesivas según nombres normalizados; cambios de nombre y coaliciones limitan la interpretación.'],
      ['Doble postulación','Coincidencia documentada de una candidatura presidencial y otra legislativa de la misma identidad nominal en la misma elección. Requiere validación y no implica doble elección.'],
      ['Rutas de candidaturas','Transiciones cronológicas entre candidaturas de años distintos. La permanencia partidaria se refiere a nombres normalizados; la movilidad provincial es interpretable entre candidaturas territorializadas.'],
      ['Bastión electoral','Fortaleza territorial persistente de una organización observada en los datos. Una victoria aislada no prueba resiliencia ni persistencia histórica.'],
      ['Periodo histórico exploratorio','Los intervalos de predominio territorial del PLN, competencia bipartidista y pluralización multipartidista son periodizaciones analíticas provisionales; 2026 no constituye por sí sola una nueva etapa consolidada.'],
      ['Candidatura electa','Resultado asentado en la base electoral; no significa permanencia en el cargo durante todo el periodo ni ausencia de renuncias posteriores.'],
      ['Denominación y continuidad','La coincidencia de nombre entre registros no demuestra identidad jurídica, programática, orgánica ni continuidad del partido.'],
      ['Procedencia y cobertura','Las siete fuentes primarias se conservan por separado; los derivados y las normalizaciones deben auditarse con declaratorias, resultados, papeletas y registros oficiales del TSE.']
    ];
    add(`<section class="card v22-glossary"><h3>Glosario metodológico y fórmulas</h3><p>Definiciones operativas para interpretar los paneles y reproducir las mediciones. Se distinguen observación, asociación y explicación causal.</p><div class="v22-glossary-grid">${terms.map(([title,desc])=>`<details><summary>${esc(title)}</summary><p>${esc(desc)}</p></details>`).join('')}</div><p class="chart-note">Fuentes de referencia: bases oficiales TSE, declaratorias y registro partidario, normativa electoral y diccionario del código reproducible. Verifique la fórmula efectiva en <code>recursos/atlas_pipeline.py</code> antes de reutilizar un indicador en publicaciones.</p></section>`);
  };
})();
