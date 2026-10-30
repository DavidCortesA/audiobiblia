"""Publicación programada de videos en páginas de Facebook (Graph API)."""
import os

import requests

from .config import CREDENCIALES, guardar_json, leer_json

APP = CREDENCIALES / "facebook_app.json"         # {"app_id": "...", "app_secret": "..."}
PAGINAS = CREDENCIALES / "facebook_paginas.json"  # [{"id", "nombre", "token"}]


class ErrorFacebook(Exception):
    pass


def _revisar(r):
    datos = r.json() if r.content else {}
    if r.status_code >= 400 or "error" in datos:
        error = datos.get("error", {})
        raise ErrorFacebook(error.get("error_user_msg") or error.get("message") or r.text)
    return datos


def paginas():
    return leer_json(PAGINAS, [])


def autorizar(token_corto, version):
    """Cambia un token de usuario de corta duración por tokens de página que no caducan."""
    app = leer_json(APP, None)
    if not app:
        raise RuntimeError(f"Falta {APP.name} en credenciales/ con app_id y app_secret (ver README)")
    base = f"https://graph.facebook.com/{version}"
    largo = _revisar(requests.get(f"{base}/oauth/access_token", params={
        "grant_type": "fb_exchange_token",
        "client_id": app["app_id"],
        "client_secret": app["app_secret"],
        "fb_exchange_token": token_corto,
    }, timeout=30))["access_token"]
    cuentas = _revisar(requests.get(f"{base}/me/accounts", params={
        "fields": "id,name,access_token", "limit": 100, "access_token": largo,
    }, timeout=30))
    permisos = _revisar(requests.get(f"{base}/me/permissions", params={"access_token": largo}, timeout=30))
    otorgados = {p["permission"] for p in permisos.get("data", []) if p.get("status") == "granted"}
    faltan = {"pages_show_list", "pages_read_engagement", "pages_manage_posts"} - otorgados
    if faltan:
        raise RuntimeError(f"Al token le faltan permisos: {', '.join(sorted(faltan))}. "
                           "Agrégalos al caso de uso de la app y genera otro token (ver README).")
    return [{"id": p["id"], "nombre": p["name"], "token": p["access_token"]} for p in cuentas.get("data", [])]


def guardar_paginas(lista):
    guardar_json(PAGINAS, lista)


def subir(pagina, archivo, titulo, descripcion, publicar_en, version):
    """Sube el video a la página en trozos y lo deja programado (o lo publica de inmediato si
    publicar_en es None). Devuelve el ID del video."""
    url = f"https://graph-video.facebook.com/{version}/{pagina['id']}/videos"
    token = pagina["token"]
    tamano = os.path.getsize(archivo)
    sesion = _revisar(requests.post(url, data={
        "access_token": token, "upload_phase": "start", "file_size": tamano,
    }, timeout=60))
    inicio, fin = int(sesion["start_offset"]), int(sesion["end_offset"])
    with open(archivo, "rb") as f:
        while inicio < fin:
            f.seek(inicio)
            trozo = f.read(fin - inicio)
            r = _revisar(requests.post(url, data={
                "access_token": token,
                "upload_phase": "transfer",
                "upload_session_id": sesion["upload_session_id"],
                "start_offset": inicio,
            }, files={"video_file_chunk": ("trozo", trozo, "application/octet-stream")}, timeout=600))
            inicio, fin = int(r["start_offset"]), int(r["end_offset"])
    datos = {
        "access_token": token,
        "upload_phase": "finish",
        "upload_session_id": sesion["upload_session_id"],
        "title": titulo,
        "description": descripcion,
    }
    if publicar_en:
        datos.update(published="false", scheduled_publish_time=int(publicar_en.timestamp()))
    _revisar(requests.post(url, data=datos, timeout=120))
    return sesion["video_id"]
