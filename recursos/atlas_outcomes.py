"""Outcomes descriptivos, trayectorias nominales y composiciones electas.

Versión 1.9. Las identidades son coincidencias nominales exactas, no verificaciones
civiles. Las comparaciones se limitan al corpus 1953–2026. La lógica temporal usa
AÑOS ELECTORALES: dos candidaturas simultáneas de una misma persona en un mismo
año no se interpretan como "antes" y "después" entre sí.
"""
from collections import Counter
from itertools import groupby
import pandas as pd

ROLE_SLUGS = {
    'Diputación': 'diputacion',
    'Presidencia': 'presidencia',
    'Primera Vicepresidencia': 'vicepresidencia_1',
    'Segunda Vicepresidencia': 'vicepresidencia_2',
}


def _joined(values):
    seen = set(); out = []
    for value in values:
        if value is None or (isinstance(value, float) and pd.isna(value)):
            continue
        value = str(value).strip()
        if value and value not in seen:
            seen.add(value); out.append(value)
    return ' | '.join(out)


def _career_route(rows, wins):
    years = sorted({int(r.anio) for r in rows})
    win_years = sorted({int(r.anio) for r in wins})
    if not win_years:
        return 'Nunca resultó electa en el corpus'
    first_win = win_years[0]
    if first_win == years[0]:
        return 'Resultó electa en su primer año documentado'
    prior_years = [y for y in years if y < first_win]
    if len(prior_years) == 1:
        return 'Resultó electa después de 1 elección previa sin éxito'
    return f'Resultó electa después de {len(prior_years)} elecciones previas sin éxito'


def build_outcomes(events, elected, formulas):
    ordered = events.sort_values(['id_persona', 'anio', 'cargo', 'id_evento']).copy()
    ordered['numero_candidatura'] = ordered.groupby('id_persona').cumcount() + 1
    ordered['persona_alguna_vez_electa'] = ordered.groupby('id_persona').electa.transform('max').astype(bool)
    ordered['resultado'] = ordered.electa.map({True: 'Electa', False: 'No electa'})

    # Temporalidad por año electoral, no por orden arbitrario de filas dentro del mismo año.
    ordered['primer_anio_documentado'] = ordered.groupby('id_persona').anio.transform('min').astype(int)
    ordered['primera_candidatura'] = ordered.anio.eq(ordered.primer_anio_documentado)  # compatibilidad: todas las candidaturas del primer año
    ordered['regresa'] = ordered.anio.gt(ordered.primer_anio_documentado)
    ordered['numero_eleccion_documentada'] = ordered.groupby('id_persona')['anio'].rank(method='dense').astype(int)

    # Una sola fila por persona-año permite calcular antecedentes y éxitos posteriores
    # de forma vectorizada; luego se devuelve la información a cada candidatura del año.
    year_status = (ordered.groupby(['id_persona','anio'], as_index=False)
                   .agg(electa_anio=('electa','max'))
                   .sort_values(['id_persona','anio']))
    year_status['electa_antes'] = (year_status.groupby('id_persona')['electa_anio']
                                   .transform(lambda x: x.shift(fill_value=False).cummax()).astype(bool))
    year_status['electa_despues'] = (year_status.iloc[::-1].groupby('id_persona')['electa_anio']
                                     .transform(lambda x: x.shift(fill_value=False).cummax()).iloc[::-1].astype(bool).to_numpy())
    ordered = ordered.merge(year_status[['id_persona','anio','electa_antes','electa_despues']],
                            on=['id_persona','anio'], how='left', validate='many_to_one')

    ordered = ordered.sort_values(['id_persona','anio','cargo','id_evento']).reset_index(drop=True)
    people, links, bridges, elected_antecedents = [], [], [], []
    all_rows = list(ordered.itertuples(index=False))

    for pid, row_iter in groupby(all_rows, key=lambda r: r.id_persona):
        rows = list(row_iter)
        years = sorted({int(r.anio) for r in rows})
        wins = [r for r in rows if bool(r.electa)]
        first_win_year = min((int(r.anio) for r in wins), default=None)
        role_counts = Counter(r.cargo for r in rows)
        role_wins = Counter(r.cargo for r in wins)
        provinces = {r.provincia for r in rows if r.provincia != 'Nacional'}
        nonwins = [r for r in rows if not bool(r.electa)]
        later_win_after_loss = any((not bool(r.electa)) and any(int(w.anio) > int(r.anio) for w in wins) for r in rows)
        loss_after_win = any((not bool(r.electa)) and any(int(w.anio) < int(r.anio) for w in wins) for r in rows)
        person = {
            'id_persona': pid,
            'nombre': rows[-1].nombre,
            'sexo': rows[-1].sexo,
            'identidad': rows[0].identidad,
            'primera_candidatura': int(rows[0].anio),
            'ultima_candidatura': int(rows[-1].anio),
            'candidaturas': len(rows),
            'candidaturas_no_electas': len(nonwins),
            'elecciones_distintas': len(years),
            'candidaturas_electas': len(wins),
            'alguna_vez_electa': bool(wins),
            'resultado_persona': 'Resultó electa al menos una vez' if wins else 'Nunca resultó electa en el corpus',
            'ruta_primera_eleccion': _career_route(rows, wins),
            'primera_eleccion_anio': first_win_year,
            'electa_en_primer_anio_documentado': bool(first_win_year is not None and first_win_year == years[0]),
            'eventualmente_electa_tras_no_eleccion': later_win_after_loss,
            'no_electa_despues_de_eleccion': loss_after_win,
            'volvio_a_competir': len(years) > 1,
            'volvio_y_luego_electa': bool(first_win_year is not None and first_win_year > years[0]),
            'intentos_antes_primera_eleccion': sum(int(r.anio) < first_win_year for r in rows) if first_win_year else None,
            'elecciones_antes_primera_eleccion': sum(y < first_win_year for y in years) if first_win_year else None,
            'partidos_distintos': len({r.partido for r in rows}),
            'provincias_distintas': len(provinces),
            'cargos_distintos': len(role_counts),
            'cambio_partido_alguna_vez': any(bool(r.cambio_partido) for r in rows),
            'cambio_provincia_alguna_vez': any(bool(r.cambio_provincia) for r in rows),
            'cargos_candidatados': _joined(r.cargo for r in rows),
            'cargos_electos': _joined(r.cargo for r in wins),
        }
        for role, slug in ROLE_SLUGS.items():
            person[f'candidaturas_{slug}'] = role_counts.get(role, 0)
            person[f'electas_{slug}'] = role_wins.get(role, 0)
            person[f'alguna_candidatura_{slug}'] = role_counts.get(role, 0) > 0
            person[f'alguna_eleccion_{slug}'] = role_wins.get(role, 0) > 0
        people.append(person)

        # Transiciones entre años electorales consecutivos en la trayectoria nominal.
        # Cuando hay doble postulación en un año, se conservan todas las combinaciones entre
        # el conjunto del año previo y el conjunto del año siguiente; nunca se crea una transición
        # artificial dentro del mismo año.
        by_year = {y: [r for r in rows if int(r.anio) == y] for y in years}
        for ya, yb in zip(years[:-1], years[1:]):
            for a in by_year[ya]:
                for b in by_year[yb]:
                    links.append({
                        'id_persona': pid, 'nombre': b.nombre, 'identidad': b.identidad,
                        'id_origen': a.id_evento, 'id_destino': b.id_evento,
                        'anio_origen': int(a.anio), 'anio': int(b.anio),
                        'cargo_origen': a.cargo, 'cargo_destino': b.cargo,
                        'tipo_origen': a.tipo, 'tipo_destino': b.tipo,
                        'partido_origen': a.partido, 'partido_destino': b.partido,
                        'provincia_origen': a.provincia, 'provincia_destino': b.provincia,
                        'electa_origen': bool(a.electa), 'electa_destino': bool(b.electa),
                        'resultado_origen': 'Electa' if a.electa else 'No electa',
                        'resultado_destino': 'Electa' if b.electa else 'No electa',
                        'destino_electa_despues': any(int(w.anio) > int(b.anio) for w in wins),
                        'destino_persona_alguna_vez_electa': bool(wins),
                        'intento_origen': int(a.numero_candidatura), 'intento_destino': int(b.numero_candidatura),
                        'eleccion_persona_origen': int(a.numero_eleccion_documentada), 'eleccion_persona_destino': int(b.numero_eleccion_documentada),
                        'cambia_partido': a.partido != b.partido,
                        'cambia_provincia': a.provincia != b.provincia and 'Nacional' not in (a.provincia, b.provincia),
                    })

        # Cualquier candidatura anterior en un cargo -> candidatura posterior en otro cargo.
        for i, a in enumerate(rows[:-1]):
            for b in rows[i+1:]:
                if int(a.anio) >= int(b.anio) or a.cargo == b.cargo:
                    continue
                future_role_wins = [x for x in wins if x.cargo == b.cargo and int(x.anio) > int(a.anio)]
                bridges.append({
                    'id_persona': pid, 'nombre': b.nombre, 'identidad': b.identidad,
                    'id_origen': a.id_evento, 'id_destino': b.id_evento,
                    'anio_origen': int(a.anio), 'anio': int(b.anio),
                    'cargo_origen': a.cargo, 'cargo_destino': b.cargo,
                    'resultado_origen': 'Electa' if a.electa else 'No electa',
                    'resultado_destino': 'Electa' if b.electa else 'No electa',
                    'electa_origen': bool(a.electa), 'electa_destino': bool(b.electa),
                    'destino_electa_despues_del_origen': bool(future_role_wins),
                    'destino_primera_eleccion_anio_despues_origen': min((int(x.anio) for x in future_role_wins), default=None),
                    'partido_origen': a.partido, 'partido_destino': b.partido,
                    'provincia_origen': a.provincia, 'provincia_destino': b.provincia,
                    'cambia_partido': a.partido != b.partido,
                    'cambia_provincia': a.provincia != b.provincia and 'Nacional' not in (a.provincia, b.provincia),
                    'anos_entre': int(b.anio) - int(a.anio),
                    'trayectoria': f"{a.cargo} ({'Electa' if a.electa else 'No electa'}) → {b.cargo} ({'Electa' if b.electa else 'No electa'})",
                })

        # Antecedentes estrictamente anteriores al año del resultado electo.
        prior_rows, prior_wins = [], []
        for year in years:
            current = by_year[year]
            for r in current:
                if not bool(r.electa):
                    continue
                if prior_wins:
                    category = 'Ya había resultado electa antes'
                elif prior_rows:
                    category = 'Había competido antes, pero aún no había sido electa'
                else:
                    category = 'No tenía candidaturas anteriores en estas bases'
                prior_roles = [x.cargo for x in prior_rows]
                prior_win_roles = [x.cargo for x in prior_wins]
                elected_antecedents.append({
                    'id_persona': pid, 'nombre': r.nombre, 'identidad': r.identidad,
                    'anio': int(r.anio), 'cargo': r.cargo, 'partido': r.partido,
                    'provincia': r.provincia, 'id_evento': r.id_evento,
                    'antecedente': category,
                    'candidaturas_previas': len(prior_rows),
                    'elecciones_previas': len(prior_wins),
                    'anios_electorales_previos': len({int(x.anio) for x in prior_rows}),
                    'cargos_previos': _joined(prior_roles),
                    'cargos_electos_previos': _joined(prior_win_roles),
                    'diputacion_candidata_previa': 'Diputación' in prior_roles,
                    'diputacion_electa_previa': 'Diputación' in prior_win_roles,
                    'presidencia_candidata_previa': 'Presidencia' in prior_roles,
                    'presidencia_electa_previa': 'Presidencia' in prior_win_roles,
                    'vicepresidencia_candidata_previa': any(x in prior_roles for x in ('Primera Vicepresidencia', 'Segunda Vicepresidencia')),
                    'vicepresidencia_electa_previa': any(x in prior_win_roles for x in ('Primera Vicepresidencia', 'Segunda Vicepresidencia')),
                })
            prior_rows.extend(current)
            prior_wins.extend([r for r in current if bool(r.electa)])

    # Contexto de cada candidatura no electa respecto de la trayectoria completa.
    ordered['resultado_contextual'] = ordered.apply(
        lambda r: 'Electa' if bool(r.electa) else (
            'No electa en esta candidatura; resultó electa después' if bool(r.electa_despues) else (
                'No electa en esta candidatura; ya había resultado electa antes' if bool(r.electa_antes)
                else 'No electa en esta candidatura; nunca resultó electa en el corpus'
            )
        ), axis=1)

    matched = {(r.anio, r.provincia, r.partido, r.nombre_key): r.id_persona
               for r in events[events.cargo == 'Diputación'].itertuples()}
    chamber = elected.copy()
    chamber['id_persona'] = [matched.get((r.anio, r.provincia, r.partido, r.nombre_key)) for r in chamber.itertuples()]
    chamber['cargo'] = 'Diputación electa'
    chamber['fuente'] = 'Registro de diputaciones electas'

    executive = formulas[formulas.electa].copy()
    matched_exec = {(r.anio, r.nombre_key, r.partido): r.id_persona
                    for r in events[events.cargo != 'Diputación'].itertuples()}
    executive['id_persona'] = [matched_exec.get((r.anio, r.nombre_key, r.partido)) for r in executive.itertuples()]

    return {
        'resultados_candidaturas': ordered.drop(columns='nombre_key'),
        'resultados_personas': pd.DataFrame(people),
        'transiciones_resultados': pd.DataFrame(links),
        'puentes_cargos': pd.DataFrame(bridges),
        'antecedentes_cargos_electos': pd.DataFrame(elected_antecedents),
        'camara_electa': chamber.drop(columns='nombre_key'),
        'ejecutivo_electo': executive.drop(columns='nombre_key'),
    }
