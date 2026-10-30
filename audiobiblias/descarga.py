import yt_dlp

from .config import VIDEOS

ErrorDescarga = yt_dlp.utils.DownloadError


class Bloqueado(Exception):
    """YouTube pide "confirmar que no eres un bot": hay que esperar unas horas (o usar cookies)."""


def descargar(video, nombre, cfg_descargas=None):
    """Descarga el video en mp4 (máx. 1080p). Devuelve (ruta, descripción original)."""
    cfg_descargas = cfg_descargas or {}
    VIDEOS.mkdir(exist_ok=True)
    opciones = {
        # H.264 primero: Facebook no siempre acepta AV1/VP9
        "format": "bv*[height<=1080][vcodec^=avc1]+ba[ext=m4a]/b[ext=mp4][vcodec^=avc1]/bv*[height<=1080]+ba/b",
        "merge_output_format": "mp4",
        "outtmpl": str(VIDEOS / f"{nombre}.%(ext)s"),
        "quiet": True,
        "no_warnings": True,
        "noprogress": True,
        # Pausa al azar antes de cada descarga para que YouTube no lo tome como bot
        "sleep_interval": cfg_descargas.get("pausa_min", 8),
        "max_sleep_interval": cfg_descargas.get("pausa_max", 25),
    }
    if cfg_descargas.get("cookies_navegador"):
        opciones["cookiesfrombrowser"] = (cfg_descargas["cookies_navegador"],)
    try:
        with yt_dlp.YoutubeDL(opciones) as ydl:
            info = ydl.extract_info(video.url, download=True)
    except ErrorDescarga as e:
        if "not a bot" in str(e) or "Sign in to confirm" in str(e):
            raise Bloqueado("pide confirmar que no eres un bot") from e
        raise
    ruta = info["requested_downloads"][0]["filepath"]
    return ruta, info.get("description") or ""
