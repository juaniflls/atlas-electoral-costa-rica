"""Figuras PNG del estudio, sin exportaciones adicionales ni HTML."""
from __future__ import annotations

from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.ticker as mtick
import numpy as np
import pandas as pd

from atlas_estudio_partidos import EPOCAS, datos_estudio, resumir

COLORS = {'Una provincia':'#a05c3b','Dos a seis provincias':'#aa84bf',
          'Siete provincias':'#257e92','Nacional (verificado)':'#186b91',
          'Provincial (verificado)':'#d68d32','Sin verificación registral':'#929ca8'}
ORDER = ['Una provincia','Dos a seis provincias','Siete provincias']


def estilo(ax, porcentaje=False):
    ax.spines[['top','right']].set_visible(False)
    ax.grid(axis='y',alpha=.16)
    ax.set_axisbelow(True)
    if porcentaje: ax.yaxis.set_major_formatter(mtick.PercentFormatter())


def guardar(fig, carpeta, nombre):
    fig.savefig(carpeta / f'{nombre}.png',dpi=200,bbox_inches='tight',facecolor='white')
    plt.close(fig)


def bandas(ax, ypos=False):
    for i,(nombre, a, b) in enumerate(EPOCAS):
        ax.axvspan(a-.8,b+.8,alpha=.055,color=['#17826e','#466db3','#c48b44','#8668a6'][i])


def lineas(df, y, nombre, ylabel, carpeta, grupos='cobertura', porcentaje=False):
    fig,ax=plt.subplots(figsize=(13.8,5.8))
    for g,part in df.groupby(grupos,sort=False):
        part=part.sort_values('anio')
        ax.plot(part.anio,part[y],marker='o',linewidth=2.4,label=str(g),color=COLORS.get(g))
    bandas(ax);estilo(ax,porcentaje)
    ax.set_xticks(sorted(df.anio.unique()))
    ax.tick_params(axis='x',rotation=45)
    ax.set_ylabel(ylabel);ax.set_title(nombre,loc='left',weight='bold',fontsize=15)
    ax.legend(loc='upper center',bbox_to_anchor=(.5,-.20),ncol=3,frameon=False)
    guardar(fig,carpeta,y+'_'+grupos)


def generar_pngs(raiz: Path, destino: Path | None=None):
    raiz=Path(raiz)
    destino=Path(destino) if destino else raiz/'investigacion'/'figuras_partidos_territorio_cuatro_epocas'
    destino.mkdir(parents=True,exist_ok=True)
    d=datos_estudio(raiz/'salidas'/'datos',raiz/'Base_partidos_cancelados.xlsx')
    oferta=d['oferta']
    # Solo organizaciones que compitieron legislativamente.
    elec=oferta[oferta.provincias_legislativas.gt(0)].copy()
    res=resumir(elec,['anio','cobertura'])
    lineas(res,'partidos','Organizaciones participantes · cobertura territorial','Partidos por elección',destino)
    lineas(res,'propietarias','Candidaturas propietarias · cobertura territorial','Candidaturas',destino)
    lineas(res,'declaratorias','Diputaciones electas · cobertura territorial','Escaños',destino)
    lineas(res,'tasa_pct','Tasa descriptiva de elección · candidaturas propietarias','Porcentaje (%)',destino,porcentaje=True)
    res['proporcion_candidaturas']=res.propietarias / res.groupby('anio').propietarias.transform('sum') * 100
    res['proporcion_escanos']=res.declaratorias / res.groupby('anio').declaratorias.transform('sum') * 100
    lineas(res,'proporcion_candidaturas','Cuota de candidaturas propietarias · cobertura','Porcentaje (%)',destino,porcentaje=True)
    lineas(res,'proporcion_escanos','Composición de la Asamblea · cobertura','Porcentaje (%)',destino,porcentaje=True)

    # Arena electoral: distingue la presencia de candidatura presidencial de
    # la escala registral y permite seguir las candidaturas legislativas.
    arena=resumir(elec,['anio','arena'])
    fig,axs=plt.subplots(2,1,figsize=(13.8,9.1),sharex=True)
    for label,g in arena.groupby('arena'):
        color='#167d8d' if label=='Con candidatura presidencial' else '#b58a4d'
        axs[0].plot(g.anio,g.propietarias,'o-',label=label,color=color,linewidth=2.3)
        axs[1].plot(g.anio,g.tasa_pct,'o-',label=label,color=color,linewidth=2.3)
    for ax in axs: bandas(ax);estilo(ax);ax.legend(frameon=False)
    axs[0].set_ylabel('Candidaturas propietarias');axs[1].set_ylabel('Tasa de elección (%)')
    axs[1].set_xticks(sorted(arena.anio.unique()));axs[1].tick_params(axis='x',rotation=45)
    fig.suptitle('Participación presidencial del partido y representación legislativa',weight='bold',fontsize=16)
    guardar(fig,destino,'arena_presidencial_y_legislativa')

    # Tasas y concentración territorial provinciales: se compara contra el
    # total de escaños adjudicados EN LA PROVINCIA en cada elección.
    esc=d['electas']
    provincia=esc.groupby(['anio','provincia','cobertura']).size().rename('diputaciones').reset_index()
    provincia_total=esc.groupby(['anio','provincia']).size().rename('total').reset_index()
    provincia=provincia.merge(provincia_total,on=['anio','provincia'],validate='many_to_one')
    provincia['cuota_pct']=100*provincia.diputaciones/provincia.total
    local=provincia[provincia.cobertura.eq('Una provincia')]
    fig,axs=plt.subplots(1,2,figsize=(15,5.7))
    c=local.groupby('provincia').diputaciones.sum().sort_values()
    c.plot.barh(ax=axs[0],color='#a05c3b');estilo(axs[0]);axs[0].set_title('Escaños acumulados de partidos de cobertura uniprovincial')
    # Denominador histórico: total de escaños adjudicados por provincia.
    t=esc.groupby('provincia').size()
    p=(100*c/t.reindex(c.index)).sort_values()
    p.plot.barh(ax=axs[1],color='#257e92');estilo(axs[1]);axs[1].set_title('Participación en todos los escaños de cada provincia')
    axs[1].set_xlabel('Porcentaje histórico (%)')
    fig.suptitle('Representación de partidos con cobertura de una sola provincia',weight='bold',fontsize=15)
    guardar(fig,destino,'incidencia_provincial')

    # La escala legal se visualiza exclusivamente sobre la fracción del corpus
    # que tiene un registro exacto vigente; NO se normaliza como si fuera total.
    legal=elec[elec.escala_juridica.ne('Sin verificación registral')]
    leg=resumir(legal,['anio','escala_juridica'])
    lineas(leg,'propietarias','Candidaturas por inscripción jurídica verificada','Candidaturas verificadas',destino,grupos='escala_juridica')
    lineas(leg,'tasa_pct','Éxito de candidaturas por inscripción verificada','Porcentaje (%)',destino,grupos='escala_juridica',porcentaje=True)

    # Cierre exacto y no silencioso.
    assert int(res.groupby('anio').declaratorias.sum().sum())==len(esc)
    assert int(res.groupby('anio').propietarias.sum().sum())==int(elec.propietarias.sum())
    return {'archivos_png':len(list(destino.glob('*.png'))),
            'carpeta':str(destino),'auditoria':d['auditoria']}
