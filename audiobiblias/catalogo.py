"""Lista de videos del canal de origen y su clasificación por serie."""
import re
import unicodedata
from dataclasses import dataclass

import yaml
import yt_dlp

from .config import DATA, guardar_json, leer_json

ARCHIVO = DATA / "catalogo.json"
CORRECCIONES = DATA / "correcciones.yaml"

RE_NINOS = re.compile(r"Ni[ñn]os\s+(?:D[iíì]a\s*)?(\d+)\s*[-–.:]?\s*(.*)", re.I)
RE_PROVERBIOS = re.compile(r"^Audio\s*Biblias?\s*[-–:]?\s*Proverbios\s+(\d+)\s*$", re.I)
RE_BIBLIA = re.compile(r"^Audio\s*Biblias?\s+(?:Biblia\s+)?(?:D[iíì]a\s*)?(\d+)\s*[-–.:]?\s*(.+)$", re.I)


@dataclass
class Video:
    id: str
    titulo: str
    duracion: int | None
    serie: str | None = None
    numero: int | None = None    # día del año (biblia/niños) o capítulo (proverbios)
    lectura: str = ""             # texto de la lectura (biblia) o nombre del episodio (niños)
    clave: str = ""               # lectura normalizada, para comparar entre años

    @property
    def url(self):
        return f"https://www.youtube.com/watch?v={self.id}"


def normalizar_lectura(texto):
    t = unicodedata.normalize("NFKD", texto.lower())
    t = "".join(c for c in t if not unicodedata.combining(c))
    t = re.sub(r"\(.*?\)", " ", t)
    t = re.sub(r"\bsalmo\b", "salmos", t)
    t = re.sub(r"\s*([:\-])\s*", r"\1", t)
    t = re.sub(r"\by\b|[,.;]", " ", t)
    return " ".join(t.split())


def clasificar(id, titulo, duracion=None):
    # Algunos títulos vienen con acentos "descompuestos" (n + ~), se unifican primero.
    v = Video(id=id, titulo=unicodedata.normalize("NFC", titulo).replace("\u00ad", "").strip(), duracion=duracion)
    t = " ".join(v.titulo.replace("Auido", "Audio").split())
    if m := RE_NINOS.search(t):
        v.serie, v.numero, v.lectura = "ninos", int(m.group(1)), m.group(2).strip()
    elif m := RE_PROVERBIOS.match(t):
        v.serie, v.numero = "proverbios", int(m.group(1))
    elif (m := RE_BIBLIA.match(t)) and re.search(r"\d", m.group(2)):
        v.serie, v.numero, v.lectura = "biblia", int(m.group(1)), m.group(2).strip()
        v.clave = normalizar_lectura(v.lectura)
    return v


def _listar_canal(url, limite=None):
    opciones = {"extract_flat": "in_playlist", "quiet": True, "no_warnings": True}
    if limite:
        opciones["playlistend"] = limite
    with yt_dlp.YoutubeDL(opciones) as ydl:
        info = ydl.extract_info(url, download=False)
    return [
        {"id": e["id"], "titulo": e.get("title") or "", "duracion": e.get("duration")}
        for e in info.get("entries") or []
        if e and e.get("id")
    ]


def actualizar(url, completo=False):
    """Trae los videos nuevos del canal (o todo el canal con completo=True).

    Devuelve cuántos videos nuevos se agregaron."""
    existentes = leer_json(ARCHIVO, [])
    if completo or not existentes:
        nuevos = _listar_canal(url)
        guardar_json(ARCHIVO, nuevos)
        return len(nuevos)
    ids = {v["id"] for v in existentes}
    recientes = [v for v in _listar_canal(url, limite=150) if v["id"] not in ids]
    guardar_json(ARCHIVO, recientes + existentes)
    return len(recientes)


def cargar():
    """Videos del canal, del más nuevo al más viejo, con los títulos de correcciones.yaml aplicados."""
    correcciones = {}
    if CORRECCIONES.exists():
        correcciones = yaml.safe_load(CORRECCIONES.read_text(encoding="utf-8")) or {}
    return [clasificar(v["id"], correcciones.get(v["id"], v["titulo"]), v.get("duracion"))
            for v in leer_json(ARCHIVO, [])]
