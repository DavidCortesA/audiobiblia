"""Audios para el reproductor de la página (se escuchan con la pantalla apagada).

Por cada video del calendario (de hace 60 días a 15 días adelante) se baja solo el audio,
se comprime a voz clara (AAC mono 48 kbps, ~0.36 MB por minuto) y se sube a Vercel Blob.
Los de más de 60 días se borran para no pasar de 1 GB (~11 MB por día con las 3 series)."""
import json
import os
import subprocess
import tempfile
from datetime import date, timedelta
from pathlib import Path

import yt_dlp

from . import descarga
from .config import CREDENCIALES, RAIZ, guardar_json

TOKEN = CREDENCIALES / "blob_token.txt"
SCRIPT = RAIZ / "web" / "scripts" / "blob.mjs"
DIAS_ATRAS = 60
DIAS_ADELANTE = 15
MAX_POR_CORRIDA = 24


def _node():
    """Node 18 o más nuevo (el subidor de Vercel Blob no funciona con versiones viejas). Busca en nvm y en el PATH."""
    candidatos = sorted(Path.home().glob(".nvm/versions/node/v*/bin/node"),
                        key=lambda p: [int(x) for x in p.parent.parent.name[1:].split(".")], reverse=True)
    candidatos += [Path(p) / "node" for p in os.environ.get("PATH", "").split(os.pathsep)] + [Path("/opt/homebrew/bin/node")]
    for c in candidatos:
        if c.is_file():
            try:
                version = subprocess.run([str(c), "-v"], capture_output=True, text=True, timeout=10).stdout.strip()
            except OSError:
                continue
            if version.startswith("v") and int(version[1:].split(".")[0]) >= 18:
                return str(c)
    raise RuntimeError("Se necesita Node 18 o más nuevo para subir los audios")


def _blob(*args):
    if not TOKEN.exists():
        raise RuntimeError("Falta credenciales/blob_token.txt (token de Vercel Blob)")
    entorno = {**os.environ, "BLOB_READ_WRITE_TOKEN": TOKEN.read_text().strip()}
    r = subprocess.run([_node(), str(SCRIPT), *args], cwd=RAIZ / "web", env=entorno,
                       capture_output=True, text=True, timeout=600)
    if r.returncode != 0:
        raise RuntimeError(f"Vercel Blob: {r.stderr.strip()[-300:]}")
    return r.stdout.strip()


def _bajar_audio(video_id, destino, cfg_descargas):
    """Baja la mejor pista de audio y la deja en AAC mono 48 kbps (con inicio rápido para streaming)."""
    carpeta = Path(tempfile.mkdtemp(prefix="ab-audio-"))
    opciones = {
        "format": "bestaudio[ext=m4a]/bestaudio",
        "outtmpl": str(carpeta / "original.%(ext)s"),
        "quiet": True,
        "no_warnings": True,
        "noprogress": True,
        "sleep_interval": cfg_descargas.get("pausa_min", 8),
        "max_sleep_interval": cfg_descargas.get("pausa_max", 25),
    }
    if cfg_descargas.get("cookies_navegador"):
        opciones["cookiesfrombrowser"] = (cfg_descargas["cookies_navegador"],)
    try:
        with yt_dlp.YoutubeDL(opciones) as ydl:
            info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=True)
    except descarga.ErrorDescarga as e:
        if "not a bot" in str(e) or "Sign in to confirm" in str(e):
            raise descarga.Bloqueado("pide confirmar que no eres un bot") from e
        raise
    original = info["requested_downloads"][0]["filepath"]
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", original, "-vn", "-ac", "1", "-c:a", "aac",
                    "-b:a", "48k", "-movflags", "+faststart", str(destino)], check=True)
    for f in carpeta.iterdir():
        f.unlink()
    carpeta.rmdir()


def sincronizar(cfg, estado, ruta_estado):
    """Sube los audios que faltan y borra los viejos. Devuelve (subidos, borrados)."""
    hoy = date.today()
    desde, hasta = hoy - timedelta(days=DIAS_ATRAS), hoy + timedelta(days=DIAS_ADELANTE)
    cfg_descargas = cfg.get("descargas", {})
    subidos = borrados = 0

    # 1. Borrar los de más de DIAS_ATRAS días (en Blob y en el estado)
    existentes = json.loads(_blob("list", "audios/") or "[]")
    viejos = [b["url"] for b in existentes if b["pathname"][7:17] < desde.isoformat()]
    if viejos:
        _blob("del", *viejos)
        borrados = len(viejos)
        for dia in estado["dias"].values():
            for e in dia.values():
                if e.get("audio") in viejos:
                    e.pop("audio")
        guardar_json(ruta_estado, estado)

    # 2. Subir los que faltan
    with tempfile.TemporaryDirectory(prefix="ab-audios-") as tmp:
        for fecha_txt in sorted(estado["dias"]):
            if not (desde.isoformat() <= fecha_txt <= hasta.isoformat()):
                continue
            for serie, e in estado["dias"][fecha_txt].items():
                if e.get("audio") or not e.get("origen_id"):
                    continue
                if subidos >= MAX_POR_CORRIDA:
                    return subidos, borrados
                etiqueta = f"{fecha_txt} {serie}"
                archivo = Path(tmp) / f"{fecha_txt}-{serie}.m4a"
                try:
                    print(f"{etiqueta}: preparando audio…")
                    _bajar_audio(e["origen_id"], archivo, cfg_descargas)
                    e["audio"] = _blob("put", str(archivo), f"audios/{fecha_txt}-{serie}-{e['origen_id']}.m4a")
                    subidos += 1
                    print(f"{etiqueta}: ✓ audio ({archivo.stat().st_size / 1e6:.1f} MB)")
                    guardar_json(ruta_estado, estado)
                except descarga.Bloqueado:
                    print("⚠ YouTube bloqueó las descargas por ahora; los audios que faltan se suben en la siguiente corrida.")
                    return subidos, borrados
                except (descarga.ErrorDescarga, subprocess.CalledProcessError, RuntimeError) as err:
                    print(f"{etiqueta}: ✗ audio: {err}")
                finally:
                    archivo.unlink(missing_ok=True)
    return subidos, borrados
