"""Transcripciones de Audio Biblia Niños: los subtítulos automáticos de YouTube, limpios y en
párrafos, para la sección "Lee la historia" de la página y para el buscador."""
import json
import random
import re
import time
import urllib.request
from datetime import date

import yt_dlp

from . import descarga
from .config import DATA, guardar_json, leer_json

CACHE = DATA / "transcripciones.json"  # {id de YouTube en la página: {"texto", "fuente", "enviada"}}
MAX_POR_CORRIDA = 20  # pocas por corrida para que YouTube no bloquee
FRASES_POR_PARRAFO = 4

RE_MARCAS = re.compile(r"\[[^\]]*\]")  # [música], [aplausos]…
RE_INICIO = re.compile(r"(?:la gran historia de hoy|la historia de hoy)", re.I)
RE_FRASE = re.compile(r"(?<=[.!?…])\s+(?=[¿¡«\"A-ZÁÉÍÓÚÑ])")


def limpiar(texto):
    """Quita marcas como [música] y la bienvenida que se repite en todos los episodios; arma párrafos."""
    texto = " ".join(RE_MARCAS.sub(" ", texto).split())
    inicio = RE_INICIO.search(texto)
    if inicio and inicio.start() < len(texto) * 0.4:
        texto = texto[inicio.start():]
        texto = texto[0].upper() + texto[1:]
    frases = RE_FRASE.split(texto)
    return "\n\n".join(" ".join(frases[i:i + FRASES_POR_PARRAFO]) for i in range(0, len(frases), FRASES_POR_PARRAFO))


def subtitulos(video_id, cfg_descargas):
    """Texto de los subtítulos automáticos en español (None si el video no tiene)."""
    opciones = {"quiet": True, "no_warnings": True, "skip_download": True}
    if cfg_descargas.get("cookies_navegador"):
        opciones["cookiesfrombrowser"] = (cfg_descargas["cookies_navegador"],)
    try:
        with yt_dlp.YoutubeDL(opciones) as ydl:
            info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=False)
    except descarga.ErrorDescarga as e:
        if "not a bot" in str(e) or "Sign in to confirm" in str(e):
            raise descarga.Bloqueado("pide confirmar que no eres un bot") from e
        raise
    pistas = info.get("subtitles", {}) or {}
    automaticas = info.get("automatic_captions", {}) or {}
    for lista in (pistas.get("es"), pistas.get("es-419"), automaticas.get("es-orig"), automaticas.get("es")):
        json3 = [p for p in lista or [] if p.get("ext") == "json3"]
        if json3:
            with urllib.request.urlopen(json3[0]["url"], timeout=60) as r:
                datos = json.load(r)
            return " ".join("".join(s.get("utf8", "") for s in e.get("segs", [])) for e in datos.get("events", []) if "segs" in e)
    return None


def videos_ninos(estado, archivo):
    """[(id de YouTube en la página, id del que se leen los subtítulos)] de Niños: primero lo ya publicado
    (del más nuevo al más viejo) y al final lo programado. Del calendario se usa el video original
    (ya es público aunque el nuestro siga programado)."""
    hoy = date.today().isoformat()
    publicados, programados = {}, {}
    for fecha in sorted(estado["dias"], reverse=True):
        e = estado["dias"][fecha].get("ninos") or {}
        if e.get("youtube") and e["youtube"] != "manual" and e.get("origen_id"):
            (publicados if fecha <= hoy else programados).setdefault(e["youtube"], e["origen_id"])
    for v in sorted(archivo, key=lambda v: v["publicar"], reverse=True):
        if v["serie"] == "ninos" and v.get("youtube"):
            publicados.setdefault(v["youtube"], v["youtube"])
    return list(publicados.items()) + [x for x in reversed(programados.items()) if x[0] not in publicados]


def sincronizar(cfg, estado, archivo, maximo=MAX_POR_CORRIDA):
    """Baja las que faltan (hasta `maximo`). Devuelve (nuevas, sin subtítulos, {id: texto} por enviar)."""
    cache = leer_json(CACHE, {})
    cfg_descargas = cfg.get("descargas", {})
    nuevas = sin = 0
    for clave, fuente in videos_ninos(estado, archivo):
        if clave in cache:
            continue
        if nuevas + sin >= maximo:
            break
        if nuevas + sin:
            time.sleep(random.uniform(cfg_descargas.get("pausa_min", 8), cfg_descargas.get("pausa_max", 25)))
        try:
            crudo = subtitulos(fuente, cfg_descargas)
        except descarga.Bloqueado:
            print("⚠ YouTube bloqueó las consultas por ahora; las transcripciones que faltan se bajan en la siguiente corrida.")
            break
        except Exception as e:
            print(f"Transcripción {clave}: ✗ {str(e)[:120]}")
            continue
        if crudo:
            cache[clave] = {"texto": limpiar(crudo), "fuente": fuente, "enviada": False}
            nuevas += 1
        else:
            cache[clave] = {"texto": None, "fuente": fuente, "enviada": True}  # sin subtítulos: no se vuelve a pedir
            sin += 1
        guardar_json(CACHE, cache)
    por_enviar = {k: v["texto"] for k, v in cache.items() if v["texto"] and not v["enviada"]}
    return nuevas, sin, por_enviar


def marcar_enviadas(claves):
    cache = leer_json(CACHE, {})
    for k in claves:
        if k in cache:
            cache[k]["enviada"] = True
    guardar_json(CACHE, cache)
