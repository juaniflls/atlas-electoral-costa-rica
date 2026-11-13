"""Estudio reproducible de candidaturas, escaños y territorio (1953–2026).

No infiere escala jurídica a partir de la cobertura observada. Los registros
jurídicos solamente se incorporan ante una coincidencia exacta y unívoca de
nombre normalizado e intervalo de inscripción/cancelación.
"""
from __future__ import annotations

import re
import unicodedata
from pathlib import Path

import numpy as np
import pandas as pd

EPOCAS = [("1953–1974", 1953, 1974), ("1978–1998", 1978, 1998),
          ("2002–2022", 2002, 2022), ("2026", 2026, 2026)]
COLORES = {"Nacional (verificado)": "#186b91",
           "Provincial (verificado)": "#d68d32",
           "Sin verificación registral": "#929ca8"}


def normalizar(s):
    if pd.isna(s):
        return ""
    s = unicodedata.normalize("NFKD", str(s))
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", re.sub(r"[^A-Z0-9 ]", " ", s.upper())).strip()


def epoca(anio):
    for nombre, inicio, fin in EPOCAS:
        if inicio <= int(anio) <= fin:
            return nombre
    raise ValueError(f"Elección fuera de las épocas del proyecto: {anio}")


def datos_estudio(carpeta_datos: Path, ruta_cancelados: Path):
    carpeta_datos = Path(carpeta_datos)
    cand = pd.read_csv(carpeta_datos / "candidaturas.csv", low_memory=False)
    esc = pd.read_csv(carpeta_datos / "electas.csv", low_memory=False)
    oferta = pd.read_csv(carpeta_datos / "oferta_partidos.csv", low_memory=False)
    reg = pd.read_excel(ruta_cancelados, sheet_name="Datos")
    assert cand.id.notna().all() and cand.id.is_unique, "ID de candidatura ausente o repetido"
    assert esc.id_registro.notna().all() and esc.id_registro.is_unique
    assert len(esc) == 1059, "Cotejar la fuente electoral antes de modificar controles"
    assert oferta[['anio', 'partido']].duplicated().sum() == 0
    assert set(cand.anio) == set(esc.anio) == set(oferta.anio)

    # La pertenencia a una organización depende de su registro, no de la
    # extensión territorial de su campaña. Un registro cancelado no basta
    # para certificar la escala de organizaciones que siguen activas.
    reg = reg.rename(columns={"Nombre del partido": "nombre_registro",
                              "Fecha de inscripción": "inscripcion",
                              "Fecha de cancelación": "cancelacion",
                              "Escala": "escala_registro",
                              "Provincia": "provincia_registro"})
    reg['nombre_norm'] = reg.nombre_registro.map(normalizar)
    reg['inscripcion'] = pd.to_datetime(reg.inscripcion, errors='coerce')
    reg['cancelacion'] = pd.to_datetime(reg.cancelacion, errors='coerce')
    reg['escala_registro'] = reg.escala_registro.astype(str).str.strip().str.title()

    oferta = oferta.copy()
    oferta['nombre_norm'] = oferta.partido.map(normalizar)
    oferta['cobertura'] = np.select(
        [oferta.provincias_legislativas.eq(1), oferta.provincias_legislativas.between(2, 6),
         oferta.provincias_legislativas.eq(7)],
        ['Una provincia', 'Dos a seis provincias', 'Siete provincias'],
        default='Cobertura no verificada')
    oferta['arena'] = np.where(oferta.oferta.eq('Presidencial y legislativa'),
                               'Con candidatura presidencial', 'Solo legislativa')
    oferta['escala_juridica'] = 'Sin verificación registral'
    oferta['id_registro_juridico'] = ''
    oferta['criterio_juridico'] = 'Sin registro único vigente en fuente de cancelaciones'
    oferta['provincia_registro'] = ''
    for ix, r in oferta.iterrows():
        # La elección ocurre a principio de año; no se asignan registros
        # incorporados posteriormente a ese proceso.
        fecha = pd.Timestamp(year=int(r.anio), month=2, day=1)
        matches = reg[reg.nombre_norm.eq(r.nombre_norm)
                      & reg.inscripcion.notna() & reg.inscripcion.le(fecha)
                      & reg.cancelacion.notna() & reg.cancelacion.ge(fecha)]
        if len(matches) != 1:
            continue
        m = matches.iloc[0]
        if m.escala_registro not in ('Nacional', 'Provincial'):
            continue
        oferta.at[ix, 'escala_juridica'] = m.escala_registro + ' (verificado)'
        oferta.at[ix, 'id_registro_juridico'] = str(m['ID registro'])
        oferta.at[ix, 'criterio_juridico'] = 'Denominación exacta e intervalo registral único'
        oferta.at[ix, 'provincia_registro'] = m.provincia_registro if pd.notna(m.provincia_registro) else ''

    # Una inscripción provincial debe corresponder a una provincia.
    provincial = oferta.escala_juridica.eq('Provincial (verificado)')
    irregular = oferta[provincial & oferta.provincias_legislativas.ne(1)]
    if not irregular.empty:
        raise ValueError('Registros provinciales con oferta en varias provincias; revisar uniones:\n'
                         + irregular[['anio','partido','provincias_legislativas']].to_string(index=False))

    keys = ['anio', 'partido']
    ref = oferta[keys + ['arena', 'cobertura','escala_juridica',
                          'provincias_legislativas','id_registro_juridico']]
    cand = cand.merge(ref, on=keys, how='left', validate='many_to_one', indicator='cotejo')
    esc = esc.merge(ref, on=keys, how='left', validate='many_to_one', indicator='cotejo')
    assert cand.cotejo.eq('both').all(), 'Candidaturas sin correspondencia en oferta'
    assert esc.cotejo.eq('both').all(), 'Diputaciones sin correspondencia en oferta'
    assert cand.escala_juridica.notna().all() and esc.escala_juridica.notna().all()

    # Las propietarias constituyen el denominador elegible para la tasa.
    cand['propietaria'] = cand.tipo.eq('Propietaria')
    cand['electa_bool'] = cand.electa.astype(str).str.lower().eq('true')
    un = cand[cand.propietaria].groupby(keys).agg(
        propietarias=('id','size'),electas_candidatura=('electa_bool','sum')).reset_index()
    sup = cand[~cand.propietaria].groupby(keys).size().rename('suplencias').reset_index()
    un = un.merge(sup, on=keys, how='left',validate='one_to_one')
    un['suplencias'] = un.suplencias.fillna(0).astype(int)
    winners = esc.groupby(keys).size().rename('diputaciones_declaratoria').reset_index()
    un = un.merge(winners, on=keys, how='outer',validate='one_to_one').fillna(
        {'propietarias':0,'electas_candidatura':0,'suplencias':0,'diputaciones_declaratoria':0})
    # Una diferencia entre candidaturas marcadas y declaratoria se audita:
    # no se reemplaza una fuente con otra por conveniencia.
    un['diferencia_electas'] = un.electas_candidatura - un.diputaciones_declaratoria
    oferta = oferta.merge(un, on=keys,how='left',validate='one_to_one')
    for c in ['propietarias','electas_candidatura','suplencias','diputaciones_declaratoria','diferencia_electas']:
        oferta[c] = oferta[c].fillna(0).astype(int)
    oferta['tasa_electoral_pct'] = 100 * oferta.electas_candidatura.div(oferta.propietarias.replace(0, np.nan))
    oferta['epoca'] = oferta.anio.map(epoca)
    cand['epoca'] = cand.anio.map(epoca)
    esc['epoca'] = esc.anio.map(epoca)
    return {'oferta':oferta,'candidaturas':cand,'electas':esc,
            'auditoria':{'personas_electas':len(esc),'candidaturas':len(cand),
                       'organizaciones_eleccion':len(oferta),
                       'juridicas_verificadas':int(oferta.escala_juridica.ne('Sin verificación registral').sum()),
                       'discrepancias_electas':int(oferta.diferencia_electas.abs().sum())}}


def resumir(df, grupo):
    """Agrega numeradores antes de porcentajes: nunca promedia tasas."""
    g = df.groupby(grupo,dropna=False,observed=True).agg(
        partidos=('partido','size'),propietarias=('propietarias','sum'),
        suplencias=('suplencias','sum'),electas=('electas_candidatura','sum'),
        declaratorias=('diputaciones_declaratoria','sum')).reset_index()
    g['tasa_pct'] = 100 * g.electas.div(g.propietarias.replace(0,np.nan))
    return g
