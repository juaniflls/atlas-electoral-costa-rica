"""Exportaciones editoriales del Atlas (solo PNG). No crea HTML ni modifica fuentes.
Periodización descriptiva propuesta, aplicada con separadores exactos entre elecciones.
"""
from pathlib import Path
from collections import defaultdict
from functools import lru_cache
import math,re,unicodedata
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap,Normalize
from matplotlib.patches import Patch,Rectangle
from matplotlib import patheffects as pe

YEARS=[1953,1958,1962,1966,1970,1974,1978,1982,1986,1990,1994,1998,2002,2006,2010,2014,2018,2022,2026]
PROVS=['San José','Alajuela','Cartago','Heredia','Guanacaste','Puntarenas','Limón']
ARENAS=['Legislativa','Presidencial']
A_COL={'Legislativa':'#087f7d','Presidencial':'#b77742'}
PERIODS=[(-.5,5.5,'Predominio territorial del PLN','#9ec9be'),(5.5,11.5,'Competencia bipartidista','#a8badf'),(11.5,17.5,'Pluralización multipartidista','#e9c19e'),(17.5,18.5,'2026','#cbb4d7')]
PLOT_BLUE='#225873'

def _style():
    plt.rcParams.update({'font.family':'DejaVu Sans','font.size':11,'axes.titlesize':15,'axes.labelsize':11,'axes.spines.top':False,'axes.spines.right':False,'axes.edgecolor':'#8fa2a9','axes.labelcolor':'#294653','text.color':'#203c4b','xtick.color':'#345666','ytick.color':'#345666','grid.color':'#dfe8ec','axes.axisbelow':True,'figure.facecolor':'white','savefig.facecolor':'white'})

def _clean(x):
    return re.sub(r'[^a-z0-9]+','_',unicodedata.normalize('NFKD',str(x)).encode('ascii','ignore').decode('ascii').lower()).strip('_')

def _fig(title,subtitle='',w=16.5,h=8.5,legend=False):
    fig=plt.figure(figsize=(w,h),dpi=130)
    left=.085 if not legend else .10;right=.91;bottom=.17 if legend else .145
    ax=fig.add_axes([left,bottom,right-left,.65])
    fig.text(left,.968,title,fontsize=19,fontweight='semibold',color='#1b3e4c',ha='left',va='top')
    fig.text(left,.932,subtitle,fontsize=10,color='#577382',ha='left',va='top')
    return fig,ax

def _header(fig,ax,shade=True):
    # The four label bands use exactly the same x coordinates as 19 election slots.
    pos=ax.get_position();band=fig.add_axes([pos.x0,pos.y1+.027,pos.width,.050]);band.set_xlim(-.5,18.5);band.set_ylim(0,1)
    band.axis('off')
    for l,r,name,color in PERIODS:
        band.add_patch(Rectangle((l,0),r-l,1,color=color,linewidth=0))
        band.text((l+r)/2,.5,name,ha='center',va='center',fontsize=8 if r-l>1 else 8.5,color='#234657')
    for edge in [5.5,11.5,17.5]:
        band.axvline(edge,color='#637d8e',lw=1,linestyle='--')
        ax.axvline(edge,color='#667a8a',lw=1.25,ls=(0,(2,3)),zorder=12)
    if shade:
        for l,r,_,color in PERIODS:
            ax.axvspan(l,r,color=color,alpha=.11,lw=0,zorder=-1)

def _xyears(ax):
    ax.set_xlim(-.5,18.5);ax.set_xticks(np.arange(19));ax.set_xticklabels(YEARS,rotation=50,ha='right',fontsize=9)
    ax.set_xlabel('Elección',labelpad=8)

def _footer(fig,ax,note):
    box=ax.get_position();fig.text(box.x0,.042,note,fontsize=8.4,color='#526c79',ha='left',va='bottom',wrap=True)

def _save(fig,p):
    p.parent.mkdir(parents=True,exist_ok=True)
    fig.savefig(p,dpi=230,pil_kwargs={'compress_level':6})
    plt.close(fig)

def _m_lookup(data):
    return {(int(r['anio']),r['provincia'],r['arena']):r for r in data['metricas'] if int(r['ronda'])==1}

def _val(d,k,year,arena,prov='Nacional'):
    v=d.get((year,prov,arena),{}).get(k)
    try:return float(v) if v is not None and np.isfinite(float(v)) else np.nan
    except (ValueError,TypeError):return np.nan

def _national(d,arena,key,title,unit,out):
    values=np.array([_val(d,key,y,arena) for y in YEARS]);
    if np.isfinite(values).sum()<4:return None
    fig,ax=_fig(title,arena+' · Nacional · 1953–2026')
    _header(fig,ax,True)
    col=A_COL[arena];ax.plot(np.arange(19),values,marker='o',ms=6.4,lw=2.7,color=col,zorder=5)
    ax.fill_between(np.arange(19),values, np.nanmin(values)*.96,alpha=.045,color=col)
    for idx in [5,11,17,18]:
        if np.isfinite(values[idx]):
            # Etiquetas de referencia: sobre fondo blanco y sin quedar recortadas por el eje.
            shift=(-12,12) if idx==18 else (0,11)
            ax.annotate(f'{values[idx]:.1f}',(idx,values[idx]),xytext=shift,textcoords='offset points',fontsize=9.5,
                        fontweight='semibold',color=col,ha='right' if idx==18 else 'center',va='bottom',zorder=15,
                        bbox={'boxstyle':'round,pad=.20','fc':'white','ec':'none','alpha':.90})
    ax.set_ylabel(unit);ax.grid(axis='y',alpha=.75);_xyears(ax)
    a,b=np.nanmin(values),np.nanmax(values);lo=max(0,a-0.15*(b-a or 1));hi=b+.22*(b-a or 1)
    if hi>lo:ax.set_ylim(lo,hi)
    _footer(fig,ax,'Etapas analíticas provisionales; la discontinuidad de 2026 aún no acredita una nueva etapa consolidada.')
    _save(fig,out);return out

def _heat(d,arena,key,title,out,unit='%',ranking=False):
    is_participation=key in ('abstencion_pct','participacion_pct')
    labels=PROVS+(['Nacional'] if is_participation else [])
    arr=np.array([[_val(d,key,y,arena,p) for y in YEARS] for p in labels]);
    if np.isfinite(arr).sum()<4:return None
    fig,ax=_fig(title,arena+(' · Siete provincias y total nacional' if is_participation else ' · Siete provincias')+' · 1953–2026',h=8.5 if is_participation else 8.1)
    cmap=LinearSegmentedColormap.from_list('atlasheat',['#eff5f7','#a6c8d2','#24647a']);cmap.set_bad('#f5f5f5')
    z=np.ma.masked_invalid(arr)
    im=ax.imshow(z,aspect='auto',cmap=cmap,interpolation='nearest',vmin=np.nanmin(arr),vmax=np.nanmax(arr))
    ax.set_yticks(np.arange(len(labels)));ax.set_yticklabels(labels,fontsize=10)
    # Enfatizar solo Nacional, manteniendo idénticos valores y paleta.
    if is_participation:
        ax.get_yticklabels()[-1].set_fontweight('bold')
    for i in range(len(labels)):
        for j in range(19):
            if np.isfinite(arr[i,j]):
                rgba=im.cmap(im.norm(arr[i,j]));light=.2126*rgba[0]+.7152*rgba[1]+.0722*rgba[2]
                ax.text(j,i,f'{arr[i,j]:.1f}',va='center',ha='center',fontsize=7.8,
                        fontweight='bold' if is_participation and i==len(labels)-1 else 'normal',
                        color='#fff' if light<.55 else '#173c4d')
    ax.set_xticks(np.arange(-.5,19,.999));ax.set_xticklabels([]);ax.tick_params(which='major',length=0)
    ax.set_xticks(np.arange(19));ax.set_xticklabels(YEARS,rotation=50,ha='right',fontsize=8.8);ax.set_xlabel('Elección')
    ax.set_xlim(-.5,18.5);ax.set_ylim(len(labels)-.5,-.5)
    for x in np.arange(-.5,19,1):ax.axvline(x,color='white',lw=1.1,zorder=2)
    for y in np.arange(-.5,len(labels),1):ax.axhline(y,color='white',lw=1.1,zorder=2)
    if is_participation:ax.axhline(6.5,color='#294653',lw=2.4,zorder=8)
    # La barra de color redimensiona ax. Crear las franjas DESPUÉS garantiza
    # que 1974/1978, 1998/2002 y 2022/2026 coincidan con sus celdas.
    cb=fig.colorbar(im,ax=ax,fraction=.020,pad=.021);cb.set_label(unit)
    _header(fig,ax,False)
    _footer(fig,ax,'Siete provincias y, cuando aplica, total Nacional oficial (no promedio provincial). Las franjas corresponden a periodización analítica provisional.')
    _save(fig,out);return out

def _winner(d,data,arena,out):
    col={r['partido']:r.get('color') for r in data['colores_partidos'] if r.get('color')}
    winner=[[d.get((y,p,arena),{}).get('ganador') for y in YEARS] for p in PROVS]
    parties=sorted({v for row in winner for v in row if v})
    fig,ax=_fig('Partido más votado por provincia','Elecciones '+arena.lower()+'s · Divisas de referencia cuando están documentadas',h=9.9,legend=True)
    old=ax.get_position();ax.set_position([old.x0,.275,old.width,.525])
    for j,p in enumerate(PROVS):
        for i,y in enumerate(YEARS):
            party=winner[j][i]
            if party:
                ax.scatter(i,j,s=195,c=col.get(party,'#89969e'),marker='s',edgecolors='white',linewidths=.7,zorder=5)
    _header(fig,ax,True)
    _xyears(ax);ax.set_ylim(6.5,-.5);ax.set_yticks(range(7));ax.set_yticklabels(PROVS)
    ax.grid(axis='x',color='#e4eaed')
    handles=[plt.Line2D([0],[0],linestyle='',marker='s',markersize=8,markerfacecolor=col.get(p,'#89969e'),markeredgecolor='#fff',label=p.title()) for p in parties]
    if handles:fig.legend(handles=handles,loc='lower center',bbox_to_anchor=(.5,.105),ncol=min(5,max(2,math.ceil(len(handles)/3))),frameon=False,fontsize=8)
    fig.text(.10,.018,'Partido de primer lugar por votos provinciales. Los tonos sin color verificable aparecen en gris; igual nombre no garantiza continuidad jurídica.',fontsize=8.4,color='#526c79')
    _save(fig,out);return out

def _padron(d,arena,out):
    fig,ax=_fig('Composición del padrón electoral',arena+' · Porcentaje del padrón nacional por elección',h=9)
    cats=[('Votos válidos','validos','#117d80'),('Blancos','blancos','#9bb5ba'),('Nulos','nulos','#bd8053'),('Abstenciones','abstenciones','#8295bb')]
    bottom=np.zeros(19)
    for name,key,c in cats:
        vals=np.array([100*(d.get((y,'Nacional',arena),{}).get(key) or 0)/(d.get((y,'Nacional',arena),{}).get('padron') or np.nan) for y in YEARS]);vals=np.nan_to_num(vals,nan=0)
        ax.bar(range(19),vals,bottom=bottom,width=.75,color=c,label=name,edgecolor='white',linewidth=.4)
        for j,v in enumerate(vals):
            if v>13:ax.text(j,bottom[j]+v/2,f'{v:.0f}%',ha='center',va='center',fontsize=8,color='white')
        bottom+=vals
    _header(fig,ax,False);_xyears(ax);ax.set_ylim(0,100);ax.set_ylabel('% del padrón');ax.legend(ncol=4,loc='upper center',bbox_to_anchor=(.5,-.17),frameon=False,fontsize=10)
    _footer(fig,ax,'Suma de votos válidos, blancos, nulos y abstenciones. Denominador: padrón de la arena y elección correspondientes.')
    _save(fig,out);return out

def _sin_sca(data,d,arena,out):
    if arena=='Legislativa':
        vals=np.array([_val(d,'voto_sin_escanos_pct',y,arena) for y in YEARS])
    else:
        sets={(r['anio'],r['partido']) for r in data['escanos'] if r['provincia']=='Nacional' and (r.get('escanos') or 0)>0}
        vals=[]
        for y in YEARS:
            g=[r for r in data['votos'] if r['anio']==y and r['arena']=='Presidencial' and r['provincia']=='Nacional' and r['ronda']==1]
            den=sum(r['votos'] or 0 for r in g);num=sum(r['votos'] or 0 for r in g if (y,r['partido']) not in sets);vals.append(100*num/den if den else np.nan)
        vals=np.array(vals)
    fig,ax=_fig('Voto válido a partidos sin diputaciones','Arena '+arena+' · 1953–2026',h=8.4)
    _header(fig,ax,True);ax.plot(range(19),vals,color=A_COL[arena],lw=2.7,marker='o',ms=6)
    ax.set_ylabel('Porcentaje de votos válidos (%)');ax.grid(axis='y');_xyears(ax);ax.set_ylim(0,max(vals)*1.18+1)
    _footer(fig,ax,'Legislativa: partidos sin escaños / voto válido legislativo. Presidencial: voto de primera ronda de partidos sin diputaciones / voto válido presidencial. No son las mismas papeletas.')
    _save(fig,out);return out

def _offers(data,out):
    c={'Presidencial y legislativa':'#16817d','Solo legislativa':'#bd8a4e','Solo presidencial':'#aa6281'};years={y:defaultdict(set) for y in YEARS}
    for r in data['oferta_partidos']:
        if r.get('oferta') in c and r.get('anio') in years: years[r['anio']][r['oferta']].add(r['partido'])
    fig,ax=_fig('Composición porcentual de la oferta partidaria','Organizaciones observadas por arena electoral · 1953–2026',h=9)
    bot=np.zeros(19)
    for name,color in c.items():
        vals=np.array([100*len(years[y][name])/sum(len(years[y][t]) for t in c) if sum(len(years[y][t]) for t in c) else 0 for y in YEARS]);ax.bar(range(19),vals,bottom=bot,width=.75,color=color,edgecolor='white',lw=.6,label=name)
        for j,v in enumerate(vals):
            if v>=13:ax.text(j,bot[j]+v/2,f'{v:.0f}%',ha='center',va='center',color='white',fontsize=8)
        bot+=vals
    _header(fig,ax,False);_xyears(ax);ax.set_ylim(0,100);ax.set_ylabel('Porcentaje de organizaciones (%)');ax.legend(ncol=3,loc='upper center',bbox_to_anchor=(.5,-.17),frameon=False,fontsize=9)
    _footer(fig,ax,'Proporciones de organizaciones, no de votos. Las categorías son excluyentes por año según la base integrada de oferta electoral.')
    _save(fig,out);return out

def _quiebre(d,out):
    arr=np.array([[_val(d,'divergencia_arenas',y,'Legislativa',p) for y in YEARS] for p in PROVS]);
    fig,ax=_fig('Quiebre del voto · contraste agregado por provincia','Distancia entre distribuciones presidenciales y legislativas (pp) · 1953–2026',h=8.5)
    cmap=LinearSegmentedColormap.from_list('voto',['#f1f5f8','#b3cadb','#315a81']);im=ax.imshow(np.ma.masked_invalid(arr),cmap=cmap,aspect='auto')
    for i in range(7):
        for j in range(19):
            if np.isfinite(arr[i,j]):ax.text(j,i,f'{arr[i,j]:.1f}',ha='center',va='center',fontsize=8,color='white' if im.norm(arr[i,j])>.63 else '#203d4d')
    _header(fig,ax,False);_xyears(ax);ax.set_ylim(6.5,-.5);ax.set_yticks(range(7));ax.set_yticklabels(PROVS)
    for x in np.arange(-.5,19):ax.axvline(x,color='white',lw=.8)
    for y in np.arange(-.5,7):ax.axhline(y,color='white',lw=.8)
    fig.colorbar(im,ax=ax,fraction=.022,pad=.03).set_label('Distancia (pp)')
    _footer(fig,ax,'Quiebre del voto como diferencia agregada: ½ × Σ |cuota presidencial del partido − cuota legislativa|. No mide directamente votantes individuales.')
    _save(fig,out);return out


def _compare(d,key,title,unit,out):
    fig,ax=_fig(title+' · comparación de arenas','Elecciones legislativas y presidenciales · 1953–2026',h=8.4)
    _header(fig,ax,True)
    for a in ARENAS:
        vals=np.array([_val(d,key,y,a) for y in YEARS])
        ax.plot(range(19),vals,lw=2.5,marker='o' if a=='Legislativa' else 'D',markersize=5.2,label=a,color=A_COL[a])
    ax.set_ylabel(unit);ax.grid(axis='y');_xyears(ax)
    ax.legend(loc='upper left',frameon=False,ncol=2)
    _footer(fig,ax,'Mismo indicador, calculado con el voto válido y los registros propios de cada arena. No implica identidad jurídica entre denominaciones partidarias.')
    _save(fig,out);return out

def _gender(data,arena,poblacion,categoria,out):
    rr=[r for r in data['composicion_sexo'] if r.get('provincia')=='Nacional' and r.get('poblacion')==poblacion and r.get('categoria')==categoria and r.get('sexo')=='Mujer']
    lk={int(r['anio']):r.get('porcentaje') for r in rr}
    yy=np.array([float(lk[y]) if lk.get(y) is not None else np.nan for y in YEARS])
    if np.isfinite(yy).sum()<4:return None
    fig,ax=_fig('Representación femenina · '+categoria,poblacion+' · % de mujeres · '+arena)
    _header(fig,ax,True)
    ax.plot(range(19),yy,lw=2.7,marker='o',ms=6,color='#ac5b84');ax.grid(axis='y')
    ax.set_ylabel('Mujeres dentro de la categoría (%)');ax.set_ylim(0,max(60,np.nanmax(yy)*1.12));_xyears(ax)
    _footer(fig,ax,'Las observaciones faltantes no se imputan como cero. La serie describe candidaturas o personas electas según la población indicada, no un efecto causal de reformas normativas.')
    _save(fig,out);return out

def _offer_absolute(data,out):
    cat=['Presidencial y legislativa','Solo legislativa','Solo presidencial'];cl=['#16817d','#bd8a4e','#aa6281']
    years={y:defaultdict(set) for y in YEARS}
    for r in data['oferta_partidos']:
        if r.get('oferta') in cat and r.get('anio') in years: years[r['anio']][r['oferta']].add(r['partido'])
    fig,ax=_fig('Oferta partidaria por arena','Número de organizaciones observadas por elección · 1953–2026',h=8.8)
    bottom=np.zeros(19)
    for c,color in zip(cat,cl):
        vals=np.array([len(years[y][c]) for y in YEARS]);ax.bar(range(19),vals,width=.75,bottom=bottom,color=color,label=c,edgecolor='white',lw=.4)
        for j,v in enumerate(vals):
            if v>=2.5:ax.text(j,bottom[j]+v/2,str(v),ha='center',va='center',fontsize=8,color='white')
        bottom+=vals
    _header(fig,ax,False);_xyears(ax);ax.set_ylabel('Número de organizaciones');ax.grid(axis='y')
    ax.legend(loc='upper center',bbox_to_anchor=(.5,-.16),ncol=3,frameon=False,fontsize=9)
    _footer(fig,ax,'Las barras corresponden a organizaciones identificadas en las arenas; no deben interpretarse como proporciones de votos válidos.')
    _save(fig,out);return out


def _seat_share_graph(data,who,out):
    """Figuras 4/5 del manuscrito; cuota de voto legislativo y cuota de escaños.
    'leader': fuerza con más sufragios legislativos. 'government': partido de la presidencia electa.
    """
    vote={(int(r['anio']),r['partido']):float(r['votos'] or 0) for r in data['votos'] if r.get('provincia')=='Nacional' and r.get('arena')=='Legislativa' and r.get('ronda')==1}
    seats={(int(r['anio']),r['partido']):float(r['escanos'] or 0) for r in data['escanos'] if r.get('provincia')=='Nacional'}
    government={int(r['anio']):r['partido'] for r in data['presidencia_asamblea'] if r.get('partido')}
    vals=[]
    for y in YEARS:
        avail={p:v for (year,p),v in vote.items() if year==y}
        if not avail: continue
        party=max(avail,key=avail.get) if who=='leader' else government.get(y)
        if not party:continue
        tot_votes=sum(avail.values());tot_seats=sum(v for (year,p),v in seats.items() if year==y)
        if not tot_votes or not tot_seats:continue
        vals.append((y,party,100*avail.get(party,0)/tot_votes,100*seats.get((y,party),0)/tot_seats))
    if len(vals)<15:raise ValueError('Serie legislativa/presidencial con escaños incompleta')
    title='Partido más votado en diputaciones: votos y escaños' if who=='leader' else 'Partido presidencial electo: voto legislativo y bancada'
    fig,ax=_fig(title,'Porcentajes nacionales · 1953–2026',h=8.8)
    xs=np.arange(len(vals));bw=.36
    if who=='leader':
        ax.plot(xs,[r[2] for r in vals],color='#167f7b',lw=2.7,marker='o',ms=6.5,label='Votos legislativos válidos (%)')
        ax.plot(xs,[r[3] for r in vals],color='#b99151',lw=2.7,marker='D',ms=6,label='Escaños en la Asamblea (%)')
    else:
        ax.bar(xs-bw/2,[r[2] for r in vals],width=bw,color='#167f7b',label='Votos legislativos válidos (%)')
        ax.bar(xs+bw/2,[r[3] for r in vals],width=bw,color='#b99151',label='Escaños en la Asamblea (%)')
    ax.set_ylabel('Porcentaje (%)');ax.grid(axis='y');ax.set_ylim(0,max(max(x[2],x[3]) for x in vals)*1.22)
    _header(fig,ax,False);_xyears(ax)
    ax.legend(loc='upper center',bbox_to_anchor=(.5,-.17),ncol=2,frameon=False,fontsize=9)
    _footer(fig,ax,('Partido más votado en diputaciones: ambas cuotas son legislativas.' if who=='leader' else 'El partido de la Presidencia se identifica por su victoria presidencial; ambas cuotas se calculan con votos legislativos y curules, no con votos presidenciales.'))
    _save(fig,out);return out

def _rank_quiebre(d,out):
    """Ranking 1–7 de cada elección y ranking global según promedio de distancia en pp."""
    values=np.array([[_val(d,'divergencia_arenas',y,'Legislativa',p) for y in YEARS] for p in PROVS]);
    rank=np.full(values.shape,np.nan)
    for j in range(len(YEARS)):
        valid=[i for i in range(len(PROVS)) if np.isfinite(values[i,j])]
        for place,i in enumerate(sorted(valid,key=lambda i:(-values[i,j],i)),1):rank[i,j]=place
    means=np.array([np.nanmean(a) if np.isfinite(a).any() else np.nan for a in values])
    valid=[i for i in range(len(PROVS)) if np.isfinite(means[i])]
    global_rank=np.full(7,np.nan)
    for place,i in enumerate(sorted(valid,key=lambda i:(-means[i],i)),1):global_rank[i]=place
    table=np.column_stack([rank,global_rank])
    fig,ax=_fig('Ranking provincial del quiebre del voto','Puesto 1 = mayor distancia entre las distribuciones · 1953–2026',h=9.2,w=17)
    old=ax.get_position();ax.set_position([old.x0,.21,old.width,.60])
    import matplotlib.colors as mc
    colors=['#294f74','#46799c','#6396a6','#85b0a4','#a4b8a0','#c9b39a','#b7938c']
    cmap=mc.ListedColormap(colors);cmap.set_bad('#f4f6f7')
    ax.imshow(np.ma.masked_invalid(table),aspect='auto',cmap=cmap,vmin=.5,vmax=7.5)
    for i in range(7):
        for j in range(20):
            if np.isfinite(table[i,j]):ax.text(j,i,f'{table[i,j]:.0f}',ha='center',va='center',fontsize=9,color='white' if table[i,j]<4 else '#243e4d',fontweight='bold' if j==19 else 'normal')
    ax.set_yticks(range(7));ax.set_yticklabels(PROVS);ax.set_xticks(range(20));ax.set_xticklabels([*map(str,YEARS),'GLOBAL'],rotation=48,ha='right',fontsize=8.8)
    ax.set_xlim(-.5,19.5);ax.set_ylim(6.5,-.5);ax.axvline(18.5,color='#243e4d',lw=2.2)
    for i in np.arange(-.5,20.5,1):ax.axvline(i,color='white',lw=.85)
    for i in np.arange(-.5,7.5,1):ax.axhline(i,color='white',lw=.85)
    # Historic top strips are restricted to 19 real election slots.
    pos=ax.get_position();bar=fig.add_axes([pos.x0,pos.y1+.027,pos.width*19/20,.05]);bar.axis('off');bar.set_xlim(-.5,18.5);bar.set_ylim(0,1)
    for l,r,name,c in PERIODS:bar.add_patch(Rectangle((l,0),r-l,1,facecolor=c));bar.text((l+r)/2,.5,name,ha='center',va='center',fontsize=8,color='#234657')
    for edge in (5.5,11.5,17.5):ax.axvline(edge,color='#536d7c',ls=(0,(2,3)),lw=1.35)
    ax.set_xlabel('Elección y ranking global',labelpad=8)
    _footer(fig,ax,'GLOBAL: ranking del promedio de distancia (pp) de cada provincia entre las 19 elecciones. Igual ponderación por elección, no número de personas que dividieron su voto.')
    _save(fig,out);return out


def _seat_access(data,out):
    valid={(int(r['anio']),r['partido']):float(r['votos'] or 0) for r in data['votos'] if r.get('provincia')=='Nacional' and r.get('arena')=='Legislativa' and r.get('ronda')==1}
    seats={(int(r['anio']),r['partido']):float(r['escanos'] or 0) for r in data['escanos'] if r.get('provincia')=='Nacional'}
    withSeats=[];without=[]
    for y in YEARS:
        group=[p for (year,p),v in valid.items() if year==y and v>0]
        withSeats.append(sum(seats.get((y,p),0)>0 for p in group))
        without.append(sum(seats.get((y,p),0)<=0 for p in group))
    fig,ax=_fig('Oferta partidaria y acceso a la Asamblea Legislativa','Organizaciones con votos válidos según obtención de diputaciones · 1953–2026',h=8.7)
    _header(fig,ax,False);_xyears(ax)
    for vals,name,color in [(withSeats,'Partidos con diputaciones','#16817d'),(without,'Partidos sin diputaciones','#b97653')]:
        ax.plot(range(19),vals,marker='o',lw=2.5,ms=6,label=name,color=color)
    ax.set_ylabel('Organizaciones con votos válidos');ax.grid(axis='y');ax.set_ylim(bottom=0)
    ax.legend(frameon=False,loc='upper left',ncol=2)
    _footer(fig,ax,'El acceso a la Asamblea se mide por al menos una diputación nacional en la misma elección. No se suman las candidaturas no registradas.')
    _save(fig,out)

def _seat_access_presidencial(data,out):
    """Only parties with presidential first-round valid votes; who won seats in the legislative arena.
    The output records the overlap, NOT presidential votes to elect legislators.
    """
    seat={(int(r['anio']),r['partido']) for r in data['escanos']
          if r.get('provincia')=='Nacional' and (r.get('escanos') or 0)>0}
    with_seat=[];no_seat=[]
    for year in YEARS:
        votes=[r for r in data['votos'] if int(r['anio'])==year
               and r.get('arena')=='Presidencial' and r.get('provincia')=='Nacional'
               and int(r.get('ronda',1))==1 and (r.get('votos') or 0)>0]
        parties=set(r['partido'] for r in votes)
        with_seat.append(sum((year,p) in seat for p in parties))
        no_seat.append(sum((year,p) not in seat for p in parties))
    fig,ax=_fig('Oferta presidencial y acceso a diputaciones',
                'Partidos con votos presidenciales según obtención de curules legislativas · 1953–2026',h=8.7)
    _header(fig,ax,False);_xyears(ax)
    for vals,label,col in ((with_seat,'Partidos presidenciales con diputaciones','#16817d'),
                           (no_seat,'Partidos presidenciales sin diputaciones','#b97653')):
        ax.plot(range(len(YEARS)),vals,marker='o',lw=2.5,ms=6,label=label,color=col)
    ax.set_ylabel('Partidos con votos presidenciales válidos');ax.grid(axis='y');ax.set_ylim(bottom=0)
    ax.legend(frameon=False,loc='upper left',ncol=1,fontsize=9)
    _footer(fig,ax,'La condición de obtener diputaciones proviene de la elección legislativa; no equivale a votar diputados con la papeleta presidencial.')
    _save(fig,out);return out

def _sin_escanos_comparativa(data,d,out):
    """Two vote-denominator series, with one parliament seat-status criterion."""
    seat={(int(r['anio']),r['partido']) for r in data['escanos']
          if r.get('provincia')=='Nacional' and (r.get('escanos') or 0)>0}
    fig,ax=_fig('Voto válido a partidos sin diputaciones · dos arenas',
                'Primera ronda presidencial y elección legislativa · 1953–2026',h=8.6)
    _header(fig,ax,True);_xyears(ax)
    for arena in ARENAS:
        vals=[]
        for year in YEARS:
            rows=[r for r in data['votos'] if int(r['anio'])==year and r.get('arena')==arena
                  and r.get('provincia')=='Nacional' and int(r.get('ronda',1))==1]
            den=sum(float(r.get('votos') or 0) for r in rows)
            num=sum(float(r.get('votos') or 0) for r in rows if (year,r['partido']) not in seat)
            vals.append(100*num/den if den else np.nan)
        if arena=='Legislativa':
            check=np.array([_val(d,'voto_sin_escanos_pct',y,arena) for y in YEARS])
            if not np.allclose(check,vals,atol=.02,equal_nan=True):
                raise ValueError('La tasa legislativa comparativa difiere de la tasa validada')
        ax.plot(range(len(YEARS)),vals,marker='o',lw=2.6,ms=6,label=arena,color=A_COL[arena])
    ax.set_ylim(bottom=0);ax.set_ylabel('Porcentaje del voto válido (%)');ax.grid(axis='y')
    ax.legend(loc='upper left',frameon=False,ncol=2)
    _footer(fig,ax,'Se contrasta voto válido de cada arena dirigido a partidos sin curules legislativas. Denominadores distintos; no representa votos individuales perdidos.')
    _save(fig,out);return out

def _rank_participacion(d,out):
    vals=np.array([[_val(d,'participacion_pct',y,'Legislativa',p) for y in YEARS] for p in PROVS])
    rank=np.full(vals.shape,np.nan)
    for j in range(19):
        idx=[i for i in range(7) if np.isfinite(vals[i,j])]
        for pos,i in enumerate(sorted(idx,key=lambda i:(-vals[i,j],i)),1):rank[i,j]=pos
    import matplotlib.colors as colors
    cmap=colors.ListedColormap(['#294f74','#46799c','#6396a6','#85b0a4','#a4b8a0','#c9b39a','#b7938c']);cmap.set_bad('#f7f7f7')
    fig,ax=_fig('Ranking provincial de participación legislativa','Puesto 1 = provincia con mayor participación de su padrón · 1953–2026',h=8.1)
    ax.imshow(np.ma.masked_invalid(rank),aspect='auto',cmap=cmap,vmin=.5,vmax=7.5)
    _header(fig,ax,False);_xyears(ax);ax.set_ylim(6.5,-.5)
    ax.set_yticks(range(7));ax.set_yticklabels(PROVS)
    for i in range(7):
        for j in range(19):
            if np.isfinite(rank[i,j]):ax.text(j,i,str(int(rank[i,j])),ha='center',va='center',fontsize=8.5,color='white' if rank[i,j]<4 else '#203d4d')
    for x in np.arange(-.5,19,.999):ax.axvline(x,color='white',lw=.9)
    for y in np.arange(-.5,7):ax.axhline(y,color='white',lw=.9)
    _footer(fig,ax,'Se compara el porcentaje de participación dentro de cada provincia en una misma elección. Los valores porcentuales originales se encuentran en la matriz de participación.')
    _save(fig,out)

def _rank_heat(d,arena,key,out):
    """Ranking provincial por elección y global por PROMEDIO DE TASAS (no promedios de puestos).
    La fila Nacional no participa en este ranking de siete provincias.
    """
    import matplotlib.colors as mc
    values=np.array([[_val(d,key,y,arena,p) for y in YEARS] for p in PROVS])
    rank=np.full((7,19),np.nan)
    for j in range(19):
        valid=[i for i in range(7) if np.isfinite(values[i,j])]
        for pos,i in enumerate(sorted(valid,key=lambda i:(-values[i,j],i)),1):rank[i,j]=pos
    mean=np.array([np.nanmean(r) if np.isfinite(r).any() else np.nan for r in values])
    global_rank=np.full(7,np.nan)
    valid=[i for i in range(7) if np.isfinite(mean[i])]
    for pos,i in enumerate(sorted(valid,key=lambda i:(-mean[i],i)),1):global_rank[i]=pos
    table=np.column_stack([rank,global_rank]);who='Participación' if key=='participacion_pct' else 'Abstencionismo'
    fig,ax=_fig('Ranking provincial de '+who.lower(),arena+' · Puesto 1 = mayor tasa · GLOBAL = promedio de porcentajes',w=17,h=9.2)
    old=ax.get_position();ax.set_position([old.x0,.205,old.width,.605])
    cmap=mc.ListedColormap(['#294f74','#46799c','#6396a6','#85b0a4','#a4b8a0','#c9b39a','#b7938c']);cmap.set_bad('#f4f6f7')
    ax.imshow(np.ma.masked_invalid(table),aspect='auto',cmap=cmap,vmin=.5,vmax=7.5)
    for i in range(7):
        for j in range(20):
            if np.isfinite(table[i,j]):
                ax.text(j,i,f'{table[i,j]:.0f}',ha='center',va='center',fontsize=9,
                        color='#fff' if table[i,j]<4 else '#243e4d',fontweight='bold' if j==19 else 'normal')
    ax.set_yticks(range(7));ax.set_yticklabels(PROVS);ax.set_xticks(range(20))
    ax.set_xticklabels([*map(str,YEARS),'GLOBAL'],rotation=48,ha='right',fontsize=8.8)
    ax.set_xlim(-.5,19.5);ax.set_ylim(6.5,-.5);ax.axvline(18.5,color='#243e4d',lw=2.2)
    for x in np.arange(-.5,20.5,1):ax.axvline(x,color='white',lw=.85)
    for y in np.arange(-.5,7.5,1):ax.axhline(y,color='white',lw=.85)
    pos=ax.get_position();bar=fig.add_axes([pos.x0,pos.y1+.027,pos.width*19/20,.05]);bar.axis('off')
    bar.set_xlim(-.5,18.5);bar.set_ylim(0,1)
    for l,r,name,c in PERIODS:
        bar.add_patch(Rectangle((l,0),r-l,1,facecolor=c))
        bar.text((l+r)/2,.5,name,ha='center',va='center',fontsize=8,color='#234657')
    for edge in (5.5,11.5,17.5):ax.axvline(edge,color='#536d7c',ls=(0,(2,3)),lw=1.35)
    ax.set_xlabel('Elección y ranking global',labelpad=8)
    _footer(fig,ax,'GLOBAL es el puesto por promedio de tasas provinciales (%) de las 19 elecciones, con igual peso por elección. Nacional se excluye del ranking.')
    _save(fig,out);return out

def _design_families(data,out):
    """Documentary evidence: do not impute absent years as zero."""
    rows=[r for r in data['papeletas'] if r.get('anio') in YEARS and r.get('provincia') in PROVS and r.get('Familia de diseño')]
    cats=sorted({r['Familia de diseño'] for r in rows}); lookup={(int(r['anio']),r['provincia']):r['Familia de diseño'] for r in rows}
    import matplotlib.colors as colors
    palette=['#1a726d','#47759a','#ae8859','#865b8c','#be745f','#72979d','#5b779d','#a59466','#538c72','#7778a9']
    colorlist=[palette[i%len(palette)] for i in range(len(cats))]
    fig,ax=_fig('Familias documentadas de diseño de papeletas legislativas','Codificación por provincia y elección; no presume conservación del original',h=9.7,legend=True)
    old=ax.get_position();ax.set_position([old.x0,.28,old.width,.51]);_header(fig,ax,False)
    for i,p in enumerate(PROVS):
        for j,y in enumerate(YEARS):
            c=lookup.get((y,p))
            if c:ax.scatter(j,i,s=205,marker='s',c=colorlist[cats.index(c)],edgecolor='white',linewidth=.6)
    _xyears(ax);ax.set_ylim(6.5,-.5);ax.set_yticks(range(7));ax.set_yticklabels(PROVS);ax.grid(axis='x',alpha=.45)
    handles=[plt.Line2D([0],[0],linestyle='',marker='s',markersize=8,markerfacecolor=c,markeredgecolor='white',label=cat) for cat,c in zip(cats,colorlist)]
    if handles:fig.legend(handles=handles,loc='lower center',bbox_to_anchor=(.5,.105),ncol=2,frameon=False,fontsize=8.2)
    fig.text(.10,.018,'La categoría refleja registros de la base de diseño; no acredita por sí sola que exista un original físico por provincia y elección.',fontsize=8.5,color='#526c79')
    _save(fig,out)

def export_figuras(data,root,phase="todo"):
    """Exporta PNG reproducibles separados por arena. No crea HTML ni SVG."""
    import shutil
    root=Path(root);_style();d=_m_lookup(data)
    if phase=="todo" and root.exists():shutil.rmtree(root)
    dirs={a:root/('Legislativo' if a=='Legislativa' else 'Presidencial') for a in ARENAS}
    comparative=root/'Comparativas'
    for p in [*dirs.values(),comparative]:p.mkdir(parents=True,exist_ok=True)
    if phase=='V18_incremental':
        a=dirs['Presidencial']/'Atlas_Presidencial_Oferta_y_Acceso_Asamblea.png'
        b=comparative/'Atlas_Comparativa_Voto_Sin_Diputaciones_Dos_Arenas.png'
        _seat_access_presidencial(data,a)
        _sin_escanos_comparativa(data,d,b)
        return {'total':2,'Presidencial':str(a),'Comparativas':str(b)}
    done=[]
    metrics=[('nep','Número efectivo de partidos','NEP'),('concentracion_1','Cuota de votos del partido más votado','Porcentaje (%)'),('concentracion_2','Concentración de los dos primeros','Porcentaje (%)'),('margen','Margen entre primero y segundo','Diferencia (pp)'),('volatilidad_nominal','Volatilidad nominal','Puntos porcentuales'),('abstencion_pct','Abstencionismo','Porcentaje del padrón (%)'),('participacion_pct','Participación','Porcentaje del padrón (%)'),('invalidos_pct','Votos blancos y nulos','Porcentaje de emitidos (%)'),('partidos_con_votos','Organizaciones con votos válidos','Número de organizaciones')]
    for arena in ARENAS:
        if phase not in ("todo", "Legislativo" if arena=="Legislativa" else "Presidencial"):continue
        sub=dirs[arena];slug=arena
        for key,title,unit in metrics:
            p=sub/f'Atlas_{slug}_{key}_historico.png'
            if _national(d,arena,key,title,unit,p):done.append(str(p))
        for key,title in [('abstencion_pct','Abstencionismo provincial'),('participacion_pct','Participación provincial')]:
            p=sub/f'Atlas_{slug}_{key}_matriz_historica.png'
            if _heat(d,arena,key,title,p):done.append(str(p))
        for key,filename in [('participacion_pct','ranking_participacion'),('abstencion_pct','ranking_abstencionismo')]:
            p=sub/f'Atlas_{slug}_{filename}_global_historico.png'
            if _rank_heat(d,arena,key,p):done.append(str(p))
        for fn,name in [(_winner,'liderazgo_provincial'),(_padron,'composicion_padron'),(_sin_sca,'voto_partidos_sin_escanos')]:
            p=sub/f'Atlas_{slug}_{name}_historico.png'
            if fn is _winner:fn(d,data,arena,p)
            elif fn is _padron:fn(d,arena,p)
            else:fn(data,d,arena,p)
            done.append(str(p))
    if phase in ('todo','Legislativo'):
      p=dirs['Legislativa']/'Atlas_Figura_02_Oferta_Acceso_Asamblea.png'
      _seat_access(data,p);done.append(str(p))
      for key,title,unit in [('indice_representacion','Índice provincial de escaños respecto del padrón','Índice de representación'),('brecha_representacion_pp','Brecha provincial entre escaños y padrón','Diferencia (pp)')]:
        rd={(int(r['anio']),r['provincia'],r['arena']):r for r in data['representacion_territorial'] if r.get('provincia') in PROVS}
        p=dirs['Legislativa']/f'Atlas_Legislativa_{key}_matriz_historica.png'
        if _heat(rd,'Legislativa',key,title,p,unit):done.append(str(p))
    # Las dos figuras nacionales del artículo: líder legislativo y partido presidencial electo.
    for who,arena in [('leader','Legislativa'),('government','Presidencial')]:
        if phase not in ('todo','Legislativo' if arena=='Legislativa' else 'Presidencial'):continue
        p=dirs[arena]/('Atlas_Figura_04_Lider_Legislativo_Votos_Escanos.png' if who=='leader' else 'Atlas_Figura_05_Partido_Presidencial_Bancada.png')
        _seat_share_graph(data,who,p);done.append(str(p))
    # Solo las comparaciones analíticamente indivisibles van en la carpeta Comparativas.
    if phase in ('todo','Comparativas'):
      for fn,name in [(_offers,'Oferta_Composicion_Porcentual'),(_offer_absolute,'Oferta_Partidaria_Absoluta')]:
        p=comparative/f'Atlas_{name}.png';fn(data,p);done.append(str(p))
      for fn,name in [(_quiebre,'Quiebre_Voto_Provincia'),(_rank_quiebre,'Quiebre_Voto_Ranking_Provincial_Global')]:
        p=comparative/f'Atlas_{name}.png';fn(d,p);done.append(str(p))
    if phase in ('todo','Presidencial'):
        dest=dirs['Presidencial']/'Atlas_Presidencial_Oferta_y_Acceso_Asamblea.png'
        _seat_access_presidencial(data,dest);done.append(str(dest))
    if phase in ('todo','Comparativas'):
        dest=comparative/'Atlas_Comparativa_Voto_Sin_Diputaciones_Dos_Arenas.png'
        _sin_escanos_comparativa(data,d,dest);done.append(str(dest))
    stats={x.name:len(list(x.glob('*.png'))) for x in [*dirs.values(),comparative]}
    return {'total':len(done),**stats,'directorio':str(root)}

if __name__ == '__main__':
    import sys,json
    root=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path.cwd()
    phase=sys.argv[2] if len(sys.argv)>2 else 'todo'
    data=json.loads((root/'salidas'/'datos'/'datos_integrados.json').read_text(encoding='utf-8'))
    print(json.dumps(export_figuras(data,root/'Figuras_historicas_capitulos',phase),ensure_ascii=False),flush=True)
