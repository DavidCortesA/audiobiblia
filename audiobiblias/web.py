"""Envía el calendario de videos a la página web (Vercel) para que muestre lo publicado y lo próximo."""
import re
import secrets
import unicodedata
from datetime import date, datetime
from zoneinfo import ZoneInfo

import requests

from . import catalogo, facebook, youtube
from .config import CREDENCIALES, DATA, RAIZ, guardar_json, leer_json

TOKEN = CREDENCIALES / "web_token.txt"
LOCAL = RAIZ / "web" / ".local"
SUBIDAS = DATA / "subidas_youtube.json"


def token():
    """Token compartido con la página (variable SYNC_TOKEN en Vercel). Se crea la primera vez."""
    if not TOKEN.exists():
        CREDENCIALES.mkdir(exist_ok=True)
        TOKEN.write_text(secrets.token_urlsafe(32))
        TOKEN.chmod(0o600)
    return TOKEN.read_text().strip()


def slug(texto):
    t = unicodedata.normalize("NFKD", texto.lower())
    t = "".join(c for c in t if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")


def armar_feed(cfg, estado, hora_publicacion):
    """Todos los videos asignados en el estado, en el formato de la página."""
    nombre_pagina = cfg.get("web", {}).get("pagina_facebook", "")
    pagina = next((p for p in facebook.paginas() if p["nombre"] == nombre_pagina), None)
    videos = []
    for fecha_txt, dia in sorted(estado["dias"].items()):
        fecha = date.fromisoformat(fecha_txt)
        for serie, e in dia.items():
            # Sin YouTube todavía también se envía: la página lo muestra en "Próximos" y lo
            # publica solo cuando ya trae su ID de YouTube.
            yt = e.get("youtube") if e.get("youtube") != "manual" else None
            v = e.get("variables", {})
            if serie == "proverbios":
                lectura = f"Proverbios {v.get('dia_mes', fecha.day)}"
            else:
                lectura = v.get("lectura", "")
            corto = lectura.split(",")[0] if serie == "biblia" else lectura
            videos.append({
                "slug": f"{fecha_txt}-{slug(corto)}",
                "serie": serie,
                "fecha": fecha_txt,
                "publicar": hora_publicacion(cfg, fecha).isoformat(),
                "dia": v.get("dia_anio", 0),
                "titulo": e["titulo"],
                "lectura": lectura,
                "descripcion": e.get("descripcion", ""),
                "youtube": yt,
                "facebook": e.get("facebook", {}).get(pagina["id"]) if pagina else None,
                "audio": e.get("audio"),
            })
    return videos


def actualizar_subidas():
    """Trae de la API de YouTube los videos del canal con su fecha real (guardados en data/)."""
    previas = leer_json(SUBIDAS, [])
    recientes = youtube.subidas(youtube.servicio(), conocidas={v["id"] for v in previas})
    ids = {v["id"] for v in recientes}
    todas = recientes + [v for v in previas if v["id"] not in ids]
    guardar_json(SUBIDAS, todas)
    return todas


def armar_archivo(cfg, subidas):
    """Lo publicado que la página muestra además del calendario:
    Biblia y Niños del año en curso (uno por cada "Día N", el más reciente) y los 31 Proverbios
    (de cada capítulo, la versión más reciente)."""
    zona = ZoneInfo(cfg["zona_horaria"])
    anio = datetime.now(zona).year
    elegidos = {}
    for s in subidas:  # del más nuevo al más viejo: el primero que aparece gana
        if not s["publico"] or not s["publicado"]:
            continue
        v = catalogo.clasificar(s["id"], s["titulo"])
        publicado = datetime.fromisoformat(s["publicado"].replace("Z", "+00:00")).astimezone(zona)
        if v.serie in ("biblia", "ninos") and publicado.year != anio:
            continue
        if not v.serie or (v.serie, v.numero) in elegidos:
            continue
        lectura = f"Proverbios {v.numero}" if v.serie == "proverbios" else v.lectura
        corto = lectura.split(",")[0] if v.serie == "biblia" else lectura
        fecha = publicado.date().isoformat()
        elegidos[(v.serie, v.numero)] = {
            "slug": f"{fecha}-{slug(corto)}",
            "serie": v.serie,
            "fecha": fecha,
            "publicar": publicado.isoformat(),
            "dia": v.numero if v.serie != "proverbios" else 0,
            "titulo": v.titulo,
            "lectura": lectura,
            "descripcion": s.get("descripcion", ""),
            "youtube": s["id"],
            "facebook": None,
        }
    return list(elegidos.values())


def enviar(cfg, videos, archivo, url=None, local=False):
    if local:
        guardar_json(LOCAL / "feed.json", videos)
        guardar_json(LOCAL / "archivo.json", archivo)
        return f"guardado en {LOCAL}"
    url = (url or cfg.get("web", {}).get("url", "")).rstrip("/")
    if not url:
        raise RuntimeError("Falta web.url en config.yaml (la dirección de la página en Vercel)")
    r = requests.post(f"{url}/api/sync", json={"videos": videos, "archivo": archivo},
                      headers={"Authorization": f"Bearer {token()}"}, timeout=120)
    if r.status_code != 200:
        raise RuntimeError(f"La página respondió {r.status_code}: {r.text[:200]}")
    datos = r.json()
    return f"{datos.get('videos')} del calendario y {datos.get('archivo')} del archivo enviados a {url}"
