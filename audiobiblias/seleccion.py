"""Reglas para elegir qué video de origen se publica cada día."""
import difflib
import re
import unicodedata

from .catalogo import RE_BIBLIA, normalizar_lectura


class SinVideo(Exception):
    pass


def proverbios(catalogo, fecha):
    """Proverbios N donde N es el día del mes; la versión más reciente."""
    for v in catalogo:
        if v.serie == "proverbios" and v.numero == fecha.day:
            return v
    raise SinVideo(f"No encontré 'Proverbios {fecha.day}' en el canal de origen")


def ninos(catalogo, dia):
    """Audio Biblia Niños Día N (N = número de día de la fecha); la versión más reciente
    (las ediciones viejas tenían errores)."""
    for v in catalogo:
        if v.serie == "ninos" and v.numero == dia:
            return v
    raise SinVideo(f"No encontré 'Audio Biblia Niños Día {dia}' en el canal de origen")


def buscar_biblia(catalogo, texto, plan_desde=None):
    """Encuentra el video de la Biblia diaria que corresponde a un ID, un título
    ("Audio Biblia Día 301 - 1 Samuel 2, ...") o solo la lectura ("1 Samuel 2, Salmo 38, ...").

    Si solo se da el capítulo y hay varias lecturas que empiezan igual (el canal ha
    usado más de un plan), se prefiere la que sigue a `plan_desde` en el mismo plan.

    Devuelve (video, exacto)."""
    diarias = [v for v in catalogo if v.serie == "biblia"]
    for v in diarias:
        if v.id == texto.strip():
            return v, True
    m = RE_BIBLIA.match(" ".join(unicodedata.normalize("NFC", texto).split()))
    clave = normalizar_lectura(m.group(2) if m else texto)
    for v in diarias:
        if v.clave == clave:
            return v, True
    # Solo la primera parte, ej. "1 Samuel 2"
    if plan_desde:
        actual = plan_desde
        for _ in range(366):
            try:
                v = biblia_siguiente(catalogo, actual)
            except SinVideo:
                break
            if v.clave.startswith(clave + " "):
                return v, False
            actual = v.clave
    for v in diarias:
        if v.clave.startswith(clave + " "):
            return v, False
    claves = list(dict.fromkeys(v.clave for v in diarias))
    parecidas = difflib.get_close_matches(clave, claves, n=1, cutoff=0.6)
    if not parecidas:
        raise SinVideo(f"No encontré ninguna Audio Biblia parecida a: {texto}")
    return next(v for v in diarias if v.clave == parecidas[0]), False


def biblia_siguiente(catalogo, actual_clave):
    """La lectura que sigue a `actual_clave`.

    El canal de origen ha subido el mismo plan varias veces con números de día
    distintos (y a veces duplicados), así que no se puede confiar en el número.
    Para cada copia de la lectura actual se busca, entre los videos subidos cerca
    de ella, la de día N+1 (o N+2… si hay duplicados). De la lectura resultante
    se usa la versión más reciente.

    Como algunos años el canal mezcló videos de dos planes, entre todos los
    candidatos se prefiere el que sigue el mismo plan: Salmo que avanza poco y
    el mismo libro del Nuevo Testamento."""
    diarias = [v for v in catalogo if v.serie == "biblia"]
    copias = [i for i, v in enumerate(diarias) if v.clave == actual_clave]
    if not copias:
        raise SinVideo("La última Audio Biblia registrada ya no está en el catálogo")
    salmo, nt = _salmo(actual_clave), _libro_nt(actual_clave)
    candidatos = []
    for orden, i in enumerate(copias):
        dia = diarias[i].numero
        for j in range(max(0, i - 80), min(len(diarias), i + 80)):
            v = diarias[j]
            if v.clave == actual_clave:
                continue
            salto = v.numero - dia if v.numero > dia else (v.numero + 365 - dia if dia >= 360 else None)
            if salto and 1 <= salto <= 5:
                otro_salmo = _salmo(v.clave)
                salmo_raro = salmo is not None and otro_salmo is not None and not 0 <= otro_salmo - salmo <= 2
                otro_nt = nt is not None and _libro_nt(v.clave) != nt
                candidatos.append(((salmo_raro, otro_nt, salto, orden, abs(j - i)), v))
    if not candidatos:
        raise SinVideo("No pude determinar la siguiente lectura de la Audio Biblia")
    siguiente = min(candidatos, key=lambda c: c[0])[1]
    return next(v for v in diarias if v.clave == siguiente.clave)


def _salmo(clave):
    m = re.search(r"\bsalmos:? ?(\d+)", clave)
    return int(m.group(1)) if m else None


def _libro_nt(clave):
    """Libro del Nuevo Testamento (el último de la lectura), ej. "juan" o "2 corintios"."""
    m = re.search(r"((?:(?<!\S)[123] )?[a-z]+)[\d:,\- ]*(?:cap )?[\d:,\- ]*$", clave)
    return m.group(1) if m else None


# Libros del Antiguo Testamento en orden, con su número de capítulos.
LIBROS_AT = [
    ("genesis", 50), ("exodo", 40), ("levitico", 27), ("numeros", 36), ("deuteronomio", 34),
    ("josue", 24), ("jueces", 21), ("rut", 4), ("1 samuel", 31), ("2 samuel", 24),
    ("1 reyes", 22), ("2 reyes", 25), ("1 cronicas", 29), ("2 cronicas", 36), ("esdras", 10),
    ("nehemias", 13), ("ester", 10), ("job", 42), ("salmos", 150), ("proverbios", 31),
    ("eclesiastes", 12), ("cantares", 8), ("isaias", 66), ("jeremias", 52), ("lamentaciones", 5),
    ("ezequiel", 48), ("daniel", 12), ("oseas", 14), ("joel", 3), ("amos", 9), ("abdias", 1),
    ("jonas", 4), ("miqueas", 7), ("nahum", 3), ("habacuc", 3), ("sofonias", 3), ("hageo", 2),
    ("zacarias", 14), ("malaquias", 4),
]
CAPITULOS = dict(LIBROS_AT)
ORDEN = [libro for libro, _ in LIBROS_AT]


def capitulos_at(clave):
    """(libro, primer capítulo, último capítulo) de la parte del Antiguo Testamento, o None."""
    at = clave.split(" salmos")[0]
    libro = max((l for l in ORDEN if at.startswith(l + " ")), key=len, default=None)
    if not libro:
        return None
    numeros = [int(n) for n in re.findall(r"\d+", re.sub(r":[\d\-]+", "", at[len(libro):]))]
    return (libro, min(numeros), max(numeros)) if numeros else None


def revisar_salto(clave_anterior, clave_nueva):
    """Texto de advertencia si entre dos lecturas se brinca algún capítulo del AT."""
    a, b = capitulos_at(clave_anterior), capitulos_at(clave_nueva)
    if not a or not b:
        return None
    if a[0] == b[0]:
        if b[1] in (a[2], a[2] + 1):
            return None
        faltan = f"{a[0].title()} {a[2] + 1}" + (f"-{b[1] - 1}" if b[1] - 1 > a[2] + 1 else "")
        return f"se brinca {faltan}"
    siguiente = ORDEN.index(a[0]) + 1
    if a[2] == CAPITULOS[a[0]] and siguiente < len(ORDEN) and ORDEN[siguiente] == b[0] and b[1] == 1:
        return None
    if a[2] < CAPITULOS[a[0]]:
        return f"se brinca {a[0].title()} {a[2] + 1}" + (f"-{CAPITULOS[a[0]]}" if CAPITULOS[a[0]] > a[2] + 1 else "")
    return f"pasa de {a[0].title()} {a[2]} a {b[0].title()} {b[1]}"
