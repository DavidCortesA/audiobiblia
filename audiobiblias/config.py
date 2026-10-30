import json
import os
import tempfile
from pathlib import Path

import yaml

RAIZ = Path(__file__).resolve().parent.parent
DATA = RAIZ / "data"
VIDEOS = RAIZ / "videos"
CREDENCIALES = RAIZ / "credenciales"

SERIES = ("biblia", "proverbios", "ninos")


def cargar_config():
    ruta = RAIZ / "config.yaml"
    if not ruta.exists():
        ruta = RAIZ / "config.example.yaml"
    with open(ruta, encoding="utf-8") as f:
        return yaml.safe_load(f)


def leer_json(ruta, por_defecto):
    ruta = Path(ruta)
    if not ruta.exists():
        return por_defecto
    with open(ruta, encoding="utf-8") as f:
        return json.load(f)


def guardar_json(ruta, datos):
    """Escritura atómica para no corromper el estado si algo se interrumpe."""
    ruta = Path(ruta)
    ruta.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=ruta.parent, suffix=".tmp")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(datos, f, ensure_ascii=False, indent=2)
    os.replace(tmp, ruta)
