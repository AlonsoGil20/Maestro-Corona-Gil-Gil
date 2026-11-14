"""Genera js/referencia.js a partir de SenorMaestro-Referencia/datos/senor_maestro_datos.json.

Toma solo el tono G-C-F (los demás son transposiciones exactas con los mismos botones) y deja
fuera las variantes que la teoría marca como erróneas (notas fuera de la escala).
Uso: python3 herramientas/generar_referencia.py
"""
import json, os

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d = json.load(open(os.path.join(RAIZ, 'SenorMaestro-Referencia/datos/senor_maestro_datos.json')))
PC = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6,
      'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}
DIR = {'abriendo': 'pull', 'cerrando': 'push'}
TONO = 'G-C-F'

gcf = next(a for a in d['afinaciones'] if a['nombre'] == TONO)
treble = [{'push': [], 'pull': []} for _ in range(3)]
for b in sorted(gcf['botones'], key=lambda b: b['boton']):
    treble[b['fila'] - 1][DIR[b['fuelle']]].append(b['midi'])

boton = lambda n: [n['fila'], n['boton'], DIR[n['fuelle']]]

prog = {}
for p, key in zip(d['progresiones'], ['triadas', 'armonico', 'melodico']):
    tabla = {}
    for it in p['items']:
        t = it['tonalidad_por_tono'][TONO]
        assert t['ok_teoria'], (key, t['tonica_real'])
        tabla[PC[t['tonica_real']]] = [[s['grado'], [boton(n) for n in s['notas']]] for s in t['pasos']]
    prog[key] = tabla

FORMATO = {'notas sencillas': 'simple', 'terceras': 'terceras', 'sextas': 'sextas'}
def direccion(s):
    return 'ambos' if 'y' in s.split() else 'pull' if s.startswith('abriendo') else 'push'

escalas = {'mayor': {}, 'menor': {}}
omitidas = []
for x in d['escalas']['diatonicas']:
    modo = 'mayor' if x['modo'].startswith('may') else 'menor'
    nombre = x['nombre_por_tono'][TONO]
    pc = PC[nombre.split()[0]]
    for v in x['variantes']:
        if v.get('vacia'):
            continue
        t = v['por_tono'][TONO]
        if t.get('notas_fuera_de_escala'):
            omitidas.append(f"{nombre} · {v['formato']} · {v['direccion']}")
            continue
        pasos = []
        for i, n in enumerate(t['voz1']):
            notas = [n] + ([t['voz2'][i]] if t.get('voz2') else [])
            pasos.append([[m['midi']] + boton(m) for m in notas])
        escalas[modo].setdefault(pc, {}).setdefault(direccion(v['direccion']), {})[FORMATO[v['formato']]] = pasos

# Acordes: 11 tipos × 12 fundamentales. Se guarda por cifrado y clase de nota de la fundamental.
# Los que la teoría marca como malos (el Sol maj7) se omiten: la app calcula su posición.
acordes = {}
for ac in d['acordes']:
    ivs = set(ac['intervalos_semitonos'])
    tabla = {}
    for ps in ac['pasos']:
        t = ps['por_tono'][TONO]
        raiz = PC[t['fundamental_primera_nota']]
        pcs = {(n['midi'] - raiz) % 12 for n in t['notas']}
        if not t['ok_teoria'] or pcs != ivs:
            omitidas.append(f"Acorde {t['fundamental_primera_nota']}{ac['cifrado']}")
            continue
        tabla[raiz] = [boton(n) for n in t['notas']]
    acordes[ac['cifrado']] = tabla

# Escalas simétricas: se quitan las notas que el Sr. Maestro trae en otra octava (el salto no es el esperado)
def pasos_simetricos(notas, salto, nombre):
    out = []
    for i, n in enumerate(notas):
        if n['midi'] != notas[0]['midi'] + i * salto:  # la nota i debe estar a i saltos de la primera
            omitidas.append(f"{nombre}: {n['nota']} en otra octava")
            continue
        out.append([[n['midi']] + boton(n)])
    return out

escalas['cromatica'] = pasos_simetricos(d['escalas']['cromatica'][TONO], 1, 'Cromática')
escalas['tonosEnteros'] = {k: pasos_simetricos(v['notas'], 2, 'Tonos enteros ' + k)
                           for k, v in d['escalas']['tonos_enteros'][TONO].items()}

datos = {'treble': treble, 'progresiones': prog, 'escalas': escalas, 'acordes': acordes}
js = ('/* Datos del Sr. Maestro 2.0.1 (tono Sol-Do-Fa), generados por herramientas/generar_referencia.py.\n'
      '   No editar a mano. Botones: [fila 1-3, botón 1-11, push = cerrando | pull = abriendo].\n'
      '   Escalas: cada paso es una lista de [midi, fila, botón, fuelle]. */\n'
      'const REFERENCIA = ' + json.dumps(datos, separators=(',', ':')) + ';\n')
open(os.path.join(RAIZ, 'js/referencia.js'), 'w').write(js)
print('js/referencia.js:', len(js), 'bytes')
print('omitidas por errores del Sr. Maestro:', omitidas)
print('escalas mayores:', sorted(escalas['mayor']), 'menores:', sorted(escalas['menor']))
print('acordes:', {k: len(v) for k, v in acordes.items()})
print('cromática:', [p[0][0] for p in escalas['cromatica']])
print('tonos enteros:', {k: [p[0][0] for p in v] for k, v in escalas['tonosEnteros'].items()})
print('fila 1:', treble[0])
