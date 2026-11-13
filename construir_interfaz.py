from pathlib import Path
import re,json,hashlib,zipfile,shutil,nbformat
root=Path(__file__).resolve().parent
resources=root/'recursos'
base=(resources/'atlas_integracion_territorial.js').read_text(encoding='utf-8')
def change_section(source,begin,end,rep):
 a=source.index(begin);b=source.index(end,a);return source[:a]+rep+'\n'+source[b:]
base=change_section(base,'function integrateResults(){','function participationExplorer()', (resources/'resultados.txt').read_text())
base=change_section(base,'function partiesExplorer(){','function historicStrongholds()', (resources/'liderazgos.txt').read_text())
base=change_section(base,'function decorateIntro(){','// Conservar la navegación', (resources/'presentacion.txt').read_text()+'\n'+(resources/'analisis.txt').read_text()+'\n'+(resources/'personas.txt').read_text())
# Sección 2: mantener todas las figuras previas e insertar aquí el análisis territorial primero.
base=base.replace('container.append(sec);\n const $=id=>sec.querySelector(\'#\'+id);let active=[],mode=\'matrix\';',"(container.querySelector('.section-head')||container.firstChild)?.after(sec);\n const $=id=>sec.querySelector('#'+id);let active=[],mode='matrix';",1)
base=base.replace("const values=[['abst_pct','Abstencionismo'],['part_pct','Participación'],['valid_pct','Votos válidos / emitidos'],['blancos_pct','Votos en blanco / emitidos'],['nulos_pct','Votos nulos / emitidos'],['noval_pct','Votos no válidos / emitidos']];", "const values=[['abst_pct','Abstencionismo (%)'],['part_pct','Participación (%)'],['valid_pct','Votos válidos / emitidos (%)'],['blancos_pct','Votos en blanco / emitidos (%)'],['nulos_pct','Votos nulos / emitidos (%)'],['noval_pct','Votos no válidos / emitidos (%)'],['abstenciones','Abstenciones (cantidad)'],['emitidos','Votos emitidos (cantidad)'],['validos','Votos válidos (cantidad)'],['blancos','Votos blancos (cantidad)'],['nulos','Votos nulos (cantidad)']];")
base=base.replace("sec.innerHTML+=`<div class=\"a25-controls\">${select('a25-p-arena'", "sec.innerHTML+=`<div id=\"a26-participation-overview\" class=\"a26-metric-cards\"></div><div class=\"a25-controls\">${select('a25-p-arena'",1)
# La evolución de líderes no imprime 19 etiquetas superpuestas. Los nombres quedan en el cursor y en la tabla.
base=base.replace("mode:'lines+markers+text'","mode:'lines+markers'",1)
base=base.replace("textposition:'top center',textfont:{size:9},","",1)
# Matrices territoriales: los 19 años deben estar abajo en el eje X, no repetidos sobre la tabla.
base=base.replace('''let last='';let html='<table class="a25-matrix"><thead><tr><th>Provincia</th><th>Territorio</th>'+gridYears.map(yr=>`<th style="border-bottom:4px solid ${ERA[yr<=1974?0:yr<=1998?1:yr<=2022?2:3]}">${yr}</th>`).join('')+'</tr></thead><tbody>';''', '''let last='';let html='<table class="a25-matrix"><thead><tr><th>Provincia</th><th>Territorio</th><th colspan="'+gridYears.length+'">Elecciones históricas →</th></tr></thead><tbody>';''',1)
base=base.replace("$('a25-p-matrix').innerHTML=html+'</tbody></table>';", "$('a25-p-matrix').innerHTML=html+'</tbody><tfoot><tr><th>Provincia</th><th>Territorio</th>'+gridYears.map(yr=>`<th>${yr}</th>`).join('')+'</tr></tfoot></table>';",1)
base=base.replace("'Porcentaje del indicador'", "values.find(q=>q[0]===m)?.[1]||'Valor'",1)
# Para métricas de cantidad, nunca añadir el símbolo de porcentaje.
base=base.replace("${fmt(val,1)}%</td>","${fmt(val,m.endsWith('_pct')?1:0)}${m.endsWith('_pct')?'%':''}</td>")
base=base.replace("${fmt(val,2)}%\"", "${fmt(val,2)}${m.endsWith('_pct')?'%':''}\"")
base=base.replace("${fmt(r.porcentaje,2)} %</td>","${fmt(r.porcentaje,m.endsWith('_pct')?2:0)} ${m.endsWith('_pct')?'%':''}</td>")
# Tabla global de evolución y principales extremos: no modificar trazas anteriores.
needle="  const one=getRows(y,a,l,m).sort((x,z)=>order==='high'?z[m]-x[m]:x[m]-z[m]);"
addition="""  const national=dataMetric(y,a,'n','CR');
  const highlight=[['Abstencionismo',national?.abst_pct,' %'],['Participación',national?.part_pct,' %'],['Votos válidos',national?.validos,''],['Votos blancos',national?.blancos,''],['Votos nulos',national?.nulos,''],['Votos emitidos',national?.emitidos,'']];
  $('a26-participation-overview').innerHTML=highlight.map(([label,value,suffix])=>`<div><small>${label} · ${y}</small><strong>${fmt(value,suffix?2:0)}${suffix}</strong></div>`).join('');
"""
assert needle in base;base=base.replace(needle,addition+needle,1)
# Mejorar exportación nativa de tabla SVG para colores y ejes inferiores, no usar foreignObject.
a=base.index('function matrixSVG(dom,title){');b=base.index('function downloadMatrix(',a)
base=base[:a]+'''function matrixSVG(dom,title){
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
''' +base[b:]
# Reemplazar el bloque de wrappers para mejorar TODAS las secciones sin hacer que desaparezcan sus gráficos.
a=base.index('// Conservar la navegación');base=base[:a]+'''// La versión V26 interviene todas las secciones sin alterar las fórmulas de las figuras aprobadas.
const enhancements={gobierno:integrateResults,participacion:participationExplorer,partidos:()=>{partiesExplorer();historicStrongholds()},intro:decorateIntro,datos:atlasDataWorkbench,laboratorio:atlasLaboratory,perfiles:atlasPartyProfiles,papeletas:atlasPaperBallots,formulas:()=>atlasNominalExplorer('formulas'),candidaturas:()=>atlasNominalExplorer('candidaturas'),trayectorias:()=>atlasNominalExplorer('trayectorias'),apellidos:()=>atlasNominalExplorer('apellidos'),metodo:atlasMethods};
for(const name of Object.keys(views)){
 const previous=views[name];if(typeof previous!=='function')continue;
 views[name]=function(...args){const result=previous.apply(this,args);try{enhancements[name]?.();atlasGlobalPolish()}catch(error){console.error('Atlas V26 · sección '+name,error)}return result};
}
window.AtlasV26Integrado={version:'26.0',datasets:8,years:years.length,cantons:cantons.length,districts:districts.length,colorCatalog:colorMap.size};
// La portada inicial debe reflejar la V26 sin exigir cambiar de pestaña primero.
if(typeof state!=='undefined'&&state.tab==='intro'){Promise.resolve().then(()=>{if(state.tab==='intro')views.intro()})}
})();
'''

assert 'a25-previous' not in base[base.index('function partiesExplorer(){'):base.index('function historicStrongholds()')]
assert 'atlas-v26-detail' in base
outjs=resources/'atlas_interfaz_base.js';outjs.write_text(base,encoding='utf-8')
print('JS',len(base),'bytes')
