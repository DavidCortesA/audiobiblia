"""Reflexiones: videos de la página de Facebook "Audio Biblias" (una persona reflexiona sobre un
versículo). Solo se leen para la página web, nunca se sube nada a esa página."""
import re
import tempfile
from datetime import date, datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import requests

from . import audio
from .config import CREDENCIALES, DATA, guardar_json, leer_json
from .facebook import APP, _revisar
from .web import slug

PAGINA = CREDENCIALES / "facebook_reflexiones.json"  # {"id", "nombre", "token"}
PORTADAS = DATA / "reflexiones_portadas.json"  # {id del video: URL de la portada en Vercel Blob}
DESDE = date(2026, 1, 1)  # empezaron este año

# "Proverbios 13:20 NTV", "Proverbios 9:5-6 RVR1960", "1 Juan 4:7"
RE_CITA = re.compile(r"((?:[123]\s*)?[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+\d+(?::\d+(?:\s*[-–]\s*\d+)?)?)"
                     r"(?:\s+(NTV|NVI|RVR\s?1960|RVR60|RV1960|RVC|LBLA|NBLA|TLA|DHH|PDT|BLP))?")
RE_ADORNOS = re.compile("[\U0001F000-\U0001FAFF\u2600-\u27BF\uFE0F\u200D]")


def pagina():
    return leer_json(PAGINA, None)


def autorizar(token, version):
    """Acepta un token de usuario o de página. Devuelve la lista de páginas posibles con su token
    (de larga duración cuando se puede cambiar con los datos de la app)."""
    base = f"https://graph.facebook.com/{version}"
    app = leer_json(APP, None)
    if app:
        try:
            token = _revisar(requests.get(f"{base}/oauth/access_token", params={
                "grant_type": "fb_exchange_token", "client_id": app["app_id"],
                "client_secret": app["app_secret"], "fb_exchange_token": token,
            }, timeout=30))["access_token"]
        except Exception:
            pass  # p. ej. un token de página ya largo: se usa tal cual
    try:
        cuentas = _revisar(requests.get(f"{base}/me/accounts", params={
            "fields": "id,name,access_token", "limit": 100, "access_token": token}, timeout=30))
        lista = [{"id": p["id"], "nombre": p["name"], "token": p["access_token"]} for p in cuentas.get("data", [])]
        if lista:
            return lista
    except Exception:
        pass  # token de página: /me/accounts no aplica
    yo = _revisar(requests.get(f"{base}/me", params={"fields": "id,name", "access_token": token}, timeout=30))
    return [{"id": yo["id"], "nombre": yo["name"], "token": token}]


def guardar(p):
    guardar_json(PAGINA, p)
    PAGINA.chmod(0o600)


def videos(version, desde=DESDE):
    """Videos de la página publicados desde `desde`, del más nuevo al más viejo."""
    p = pagina()
    if not p:
        raise RuntimeError("Falta la página de reflexiones: ./ab auth-reflexiones")
    url = f"https://graph.facebook.com/{version}/{p['id']}/videos"
    params = {
        "fields": "id,title,description,created_time,permalink_url,length,published,thumbnails{uri,is_preferred}",
        "limit": 100, "access_token": p["token"],
    }
    todos = []
    while url:
        datos = _revisar(requests.get(url, params=params, timeout=60))
        lote = datos.get("data", [])
        todos += [v for v in lote if v["created_time"][:10] >= desde.isoformat()]
        if lote and lote[-1]["created_time"][:10] < desde.isoformat():
            break
        url, params = datos.get("paging", {}).get("next"), None
    return [v for v in todos if v.get("published", True)]


def leer_descripcion(texto):
    """Separa la cita ("Proverbios 13:20"), la versión ("NTV") y el texto del versículo."""
    cita = version = None
    resto = []
    for linea in (texto or "").splitlines():
        limpia = RE_ADORNOS.sub("", linea).strip()
        m = RE_CITA.match(limpia) if cita is None else None
        if m:
            cita, version = m.group(1).replace("–", "-"), m.group(2)
            limpia = limpia[m.end():].strip(" .-–")
        limpia = re.sub(r"#\S+", "", limpia).strip()
        if limpia:
            resto.append(limpia)
    return cita, version, " ".join(resto)


def _portada(v, cache):
    """La portada de Facebook caduca en unas semanas: se guarda una copia en Vercel Blob."""
    if v["id"] in cache:
        return cache[v["id"]]
    miniaturas = v.get("thumbnails", {}).get("data", [])
    elegida = next((t for t in miniaturas if t.get("is_preferred")), miniaturas[0] if miniaturas else None)
    if not elegida:
        return None
    with tempfile.TemporaryDirectory(prefix="ab-refl-") as tmp:
        archivo = Path(tmp) / "portada.jpg"
        archivo.write_bytes(requests.get(elegida["uri"], timeout=60).content)
        url = audio._blob("put", str(archivo), f"reflexiones/{v['id']}.jpg", "image/jpeg")
    cache[v["id"]] = url
    guardar_json(PORTADAS, cache)
    return url


def armar(cfg):
    """Las reflexiones en el formato de la página, de la más nueva a la más vieja."""
    zona = ZoneInfo(cfg["zona_horaria"])
    p = pagina()
    cache = leer_json(PORTADAS, {})
    lista = []
    for v in videos(cfg["facebook"]["graph_version"]):
        publicado = datetime.strptime(v["created_time"], "%Y-%m-%dT%H:%M:%S%z").astimezone(zona)
        cita, version, texto = leer_descripcion(v.get("description") or v.get("title") or "")
        fecha = publicado.date().isoformat()
        try:
            portada = _portada(v, cache)
        except Exception as e:  # sin Blob o sin internet: la página usa una imagen genérica
            print(f"⚠ Portada de la reflexión {fecha}: {e}")
            portada = None
        lista.append({
            "slug": f"{fecha}-{slug(cita or 'reflexion')}",
            "id": v["id"],
            "fecha": fecha,
            "publicado": publicado.isoformat(),
            "cita": cita or "Reflexión",
            "version": version,
            "texto": texto,
            "duracion": round(float(v.get("length") or 0)),
            "url": f"https://www.facebook.com/{p['id']}/videos/{v['id']}/",
            "miniatura": portada,
        })
    return lista
