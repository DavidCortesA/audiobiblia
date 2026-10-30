"""Subida programada a YouTube con la API de datos v3."""
from datetime import timezone

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload

from .config import CREDENCIALES

SCOPES = ["https://www.googleapis.com/auth/youtube"]
CLIENTE = CREDENCIALES / "youtube_client_secret.json"
TOKEN = CREDENCIALES / "youtube_token.json"


class CuotaAgotada(Exception):
    pass


def _guardar_token(creds):
    TOKEN.write_text(creds.to_json())
    TOKEN.chmod(0o600)


def servicio(interactivo=False):
    creds = Credentials.from_authorized_user_file(TOKEN, SCOPES) if TOKEN.exists() else None
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
        _guardar_token(creds)
    if not creds or not creds.valid:
        if not interactivo:
            raise RuntimeError("YouTube no está autorizado. Ejecuta: ./ab auth-youtube")
        if not CLIENTE.exists():
            raise RuntimeError(f"Falta {CLIENTE.name} en la carpeta credenciales/ (ver README)")
        flujo = InstalledAppFlow.from_client_secrets_file(str(CLIENTE), SCOPES)
        creds = flujo.run_local_server(port=0, prompt="consent")
        CREDENCIALES.mkdir(exist_ok=True)
        _guardar_token(creds)
    return build("youtube", "v3", credentials=creds, cache_discovery=False)


def nombre_canal(yt):
    canales = yt.channels().list(part="snippet", mine=True).execute().get("items", [])
    return canales[0]["snippet"]["title"] if canales else None


def ultimos_titulos(yt, cuantos=50):
    """Títulos de los videos subidos más recientemente al canal propio (incluye los programados)."""
    canal = yt.channels().list(part="contentDetails", mine=True).execute()["items"][0]
    lista = canal["contentDetails"]["relatedPlaylists"]["uploads"]
    items = yt.playlistItems().list(part="snippet", playlistId=lista, maxResults=cuantos).execute()
    return [i["snippet"]["title"] for i in items.get("items", [])]


def subidas(yt, conocidas=(), paginas_minimas=3):
    """Videos del canal propio (del más nuevo al más viejo) con su fecha real de publicación.

    Cuesta 1 unidad de cuota por cada 50 videos. Se detiene al llegar a videos ya conocidos
    (después de revisar al menos `paginas_minimas` páginas, para refrescar los programados)."""
    canal = yt.channels().list(part="contentDetails", mine=True).execute()["items"][0]
    lista = canal["contentDetails"]["relatedPlaylists"]["uploads"]
    resultado, pagina, siguiente = [], 0, None
    while True:
        r = yt.playlistItems().list(part="snippet,contentDetails,status", playlistId=lista,
                                    maxResults=50, pageToken=siguiente).execute()
        pagina += 1
        nuevos = 0
        for i in r.get("items", []):
            vid = i["contentDetails"]["videoId"]
            nuevos += vid not in conocidas
            resultado.append({
                "id": vid,
                "titulo": i["snippet"]["title"],
                "descripcion": i["snippet"].get("description", "")[:400],
                "publicado": i["contentDetails"].get("videoPublishedAt"),
                "publico": i.get("status", {}).get("privacyStatus") == "public",
            })
        siguiente = r.get("nextPageToken")
        if not siguiente or (pagina >= paginas_minimas and nuevos == 0):
            return resultado


def subir(yt, archivo, titulo, descripcion, publicar_en, cfg_yt, para_ninos, lista=None):
    """Sube el video como privado con publicación programada (o público de inmediato si
    publicar_en es None). Devuelve el ID del video."""
    cuerpo = {
        "snippet": {
            "title": titulo.replace("<", "").replace(">", "")[:100],
            "description": descripcion.replace("<", "").replace(">", "")[:5000],
            "categoryId": str(cfg_yt.get("categoria_id", "29")),
            "tags": cfg_yt.get("etiquetas", []),
            "defaultLanguage": "es",
            "defaultAudioLanguage": "es",
        },
        "status": {"privacyStatus": "public", "selfDeclaredMadeForKids": bool(para_ninos)},
    }
    if publicar_en:
        cuerpo["status"]["privacyStatus"] = "private"
        cuerpo["status"]["publishAt"] = publicar_en.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    media = MediaFileUpload(str(archivo), mimetype="video/mp4", chunksize=16 * 1024 * 1024, resumable=True)
    try:
        peticion = yt.videos().insert(part="snippet,status", body=cuerpo, media_body=media)
        respuesta = None
        while respuesta is None:
            _, respuesta = peticion.next_chunk()
        video_id = respuesta["id"]
        if lista:
            yt.playlistItems().insert(
                part="snippet",
                body={"snippet": {"playlistId": lista, "resourceId": {"kind": "youtube#video", "videoId": video_id}}},
            ).execute()
    except HttpError as e:
        if e.resp.status == 403 and any(r in str(e) for r in ("quotaExceeded", "uploadLimitExceeded")):
            raise CuotaAgotada(str(e)) from e
        raise
    return video_id
