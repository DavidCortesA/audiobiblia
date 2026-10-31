import argparse
import csv
import getpass
import os
import subprocess
import sys
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from . import audio, catalogo, descarga, facebook, panel, seleccion, web, youtube
from .config import DATA, SERIES, cargar_config, guardar_json, leer_json

ESTADO = DATA / "estado.json"
MANUAL_YT = DATA / "youtube_manual.csv"
NOMBRES = {"biblia": "Biblia", "proverbios": "Proverbios", "ninos": "Niños"}
MARGEN = timedelta(minutes=20)  # YouTube y Facebook piden que la hora programada esté en el futuro


# ---------- estado ----------

def cargar_estado():
    return leer_json(ESTADO, {"biblia_inicio": None, "dias": {}})


def ultima_biblia_publicada(cat):
    """La Audio Biblia más reciente de tu canal (el catálogo va del más nuevo al más viejo)."""
    return next((v for v in cat if v.serie == "biblia"), None)


def biblia_anterior(cat, estado, fecha):
    """La lectura que va justo antes de `fecha`:
    1. la última que este programa ya asignó antes de esa fecha;
    2. si no hay, la registrada con `ultima-biblia`, mientras no hayas publicado otra después;
    3. si no, la más reciente publicada en tu canal."""
    previas = [f for f, d in estado["dias"].items() if f < fecha.isoformat() and "biblia" in d]
    if previas:
        return estado["dias"][max(previas)]["biblia"]["clave"]
    publicada = ultima_biblia_publicada(cat)
    inicio = estado["biblia_inicio"]
    if inicio and (not publicada or publicada.id == inicio.get("tope")):
        return inicio["clave"]
    if publicada:
        return publicada.clave
    raise seleccion.SinVideo('No sé cuál fue la última Audio Biblia. Ejecuta: ./ab ultima-biblia "2 Samuel 20"')


def numero_dia(cfg, fecha):
    """Número de "Día N" que lleva la fecha: día del año más el ajuste del config."""
    return fecha.timetuple().tm_yday + cfg.get("ajuste_dia", 0)


def elegir(cfg, cat, estado, fecha, serie):
    if serie == "proverbios":
        return seleccion.proverbios(cat, fecha)
    if serie == "ninos":
        return seleccion.ninos(cat, numero_dia(cfg, fecha))
    return seleccion.biblia_siguiente(cat, biblia_anterior(cat, estado, fecha))


DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]
MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
         "septiembre", "octubre", "noviembre", "diciembre"]


def fecha_larga(fecha):
    return f"{DIAS[fecha.weekday()]} {fecha.day} de {MESES[fecha.month - 1]}"


def nueva_entrada(cfg, video, fecha, serie):
    variables = {
        "titulo": video.titulo,
        "lectura": video.lectura,
        "dia_anio": numero_dia(cfg, fecha),
        "dia_mes": fecha.day,
        "fecha": fecha.isoformat(),
        "fecha_larga": fecha_larga(fecha),
        "descripcion": "",
    }
    return {
        "origen_id": video.id,
        "origen_titulo": video.titulo,
        "clave": video.clave,
        "titulo": cfg["series"][serie]["titulo"].format_map(variables),
        "variables": variables,
        "archivo": None,
        "youtube": None,
        "facebook": {},
    }


# ---------- fechas ----------

def rango(args):
    desde = date.fromisoformat(args.desde) if args.desde else date.today() + timedelta(days=1)
    if args.hasta:
        hasta = date.fromisoformat(args.hasta)
    else:
        dias = 7 if args.semana else 30 if args.mes else args.dias
        hasta = desde + timedelta(days=dias - 1)
    return [desde + timedelta(days=i) for i in range((hasta - desde).days + 1)]


def hora_publicacion(cfg, fecha):
    h, m = map(int, cfg["hora_publicacion"].split(":"))
    return datetime(fecha.year, fecha.month, fecha.day, h, m, tzinfo=ZoneInfo(cfg["zona_horaria"]))


def series_activas(cfg, args):
    activas = [s for s in SERIES if cfg["series"][s]["activa"]]
    if getattr(args, "series", None):
        activas = [s for s in activas if s in args.series.split(",")]
    return activas


# ---------- comandos ----------

def cmd_catalogo(cfg, args):
    print("Actualizando la lista de videos del canal de origen…")
    n = catalogo.actualizar(cfg["canal_origen"], completo=args.completo)
    print(f"{n} videos nuevos. Total en catálogo: {len(catalogo.cargar())}")


def cmd_ultima_biblia(cfg, args):
    cat = catalogo.cargar()
    texto = args.texto
    if args.desde_youtube:
        titulos = youtube.ultimos_titulos(youtube.servicio())
        texto = next((t for t in titulos if catalogo.clasificar("", t).serie == "biblia"), None)
        if not texto:
            sys.exit("No encontré ninguna Audio Biblia entre tus últimos 50 videos.")
        print(f"Último en tu canal: {texto}")
    if not texto:
        publicada = ultima_biblia_publicada(cat)
        print(f"Se toma automáticamente la última de tu canal: {publicada.titulo if publicada else '(ninguna)'}")
        print('Para indicar otra: ./ab ultima-biblia "2 Samuel 20"')
        return
    publicada = ultima_biblia_publicada(cat)
    video, exacto = seleccion.buscar_biblia(cat, texto, publicada.clave if publicada else None)
    print(f"{'Coincide con' if exacto else 'Lo más parecido'}: {video.titulo}")
    siguiente = seleccion.biblia_siguiente(cat, video.clave)
    print(f"La siguiente será: {siguiente.titulo}")
    if not exacto and input("¿Es correcto? [s/N] ").strip().lower() != "s":
        sys.exit("Sin cambios.")
    estado = cargar_estado()
    # "tope": la última publicada en este momento; si después subes otra, esa manda.
    estado["biblia_inicio"] = {"id": video.id, "titulo": video.titulo, "clave": video.clave,
                               "tope": publicada.id if publicada else None}
    guardar_json(ESTADO, estado)
    print("Guardado.")


def proyectar(cfg, cat, estado, fechas, series):
    """Lo que tocaría cada fecha/serie sin guardar nada: lo ya asignado en el estado y,
    para lo demás, lo que se elegiría. Devuelve una lista de dicts por fecha y serie."""
    simulado = {"biblia_inicio": estado["biblia_inicio"], "dias": {k: dict(v) for k, v in estado["dias"].items()}}
    filas = []
    for fecha in fechas:
        dia = simulado["dias"].setdefault(fecha.isoformat(), {})
        for serie in series:
            fila = {"fecha": fecha, "serie": serie, "entrada": dia.get(serie), "asignada": serie in dia,
                    "aviso": None, "error": None}
            if not fila["asignada"]:
                try:
                    fila["entrada"] = nueva_entrada(cfg, elegir(cfg, cat, simulado, fecha, serie), fecha, serie)
                    if serie == "biblia":
                        fila["aviso"] = seleccion.revisar_salto(biblia_anterior(cat, simulado, fecha),
                                                                fila["entrada"]["clave"])
                    dia[serie] = fila["entrada"]
                except seleccion.SinVideo as e:
                    fila["error"] = str(e)
            filas.append(fila)
    return filas


def cmd_plan(cfg, args):
    filas = proyectar(cfg, catalogo.cargar(), cargar_estado(), rango(args), series_activas(cfg, args))
    sangria = " " * 14
    for f in filas:
        if f["serie"] == filas[0]["serie"]:
            print(f"\n{f['fecha']:%a %d %b %Y}  {cfg['hora_publicacion']}  (Día {numero_dia(cfg, f['fecha'])})")
        if f["error"]:
            print(f"  {NOMBRES[f['serie']]:<11} ⚠ {f['error']}")
            continue
        e = f["entrada"]
        print(f"  {NOMBRES[f['serie']]:<11} {e['titulo']}")
        if e["titulo"] != e["origen_titulo"]:
            print(f"{sangria}↳ origen: {e['origen_titulo']}")
        if f["asignada"]:
            destinos = (["YouTube"] if e["youtube"] else []) + [f"Facebook×{len(e['facebook'])}"]
            print(f"{sangria}[ya asignado: {', '.join(destinos)}]")
        if f["aviso"]:
            print(f"{sangria}⚠ {f['aviso']} (¿video mal titulado o faltante?)")


def cmd_programar(cfg, args):
    try:
        catalogo.actualizar(cfg["canal_origen"])
    except descarga.ErrorDescarga as e:
        print(f"⚠ No se pudo actualizar el catálogo; se usa el que ya hay. ({e})")
    cat = catalogo.cargar()
    estado = cargar_estado()
    zona = ZoneInfo(cfg["zona_horaria"])
    ahora = datetime.now(zona)
    cfg_yt, cfg_fb = cfg["youtube"], cfg["facebook"]
    usar_yt = cfg_yt["activo"] and args.solo in (None, "youtube")
    usar_fb = cfg_fb["activo"] and args.solo in (None, "facebook")
    paginas = facebook.paginas() if usar_fb else []
    if usar_fb and not paginas:
        print("⚠ Facebook no está configurado (./ab auth-facebook); se omite.")
        usar_fb = False
    yt = None
    if usar_yt and cfg_yt["modo"] == "api":
        try:
            yt = youtube.servicio()
        except RuntimeError as e:
            print(f"⚠ {e}; se omite YouTube.")
            usar_yt = False
    subidas_yt, cuota_ok = 0, True
    descargas_ok = True  # se apaga si YouTube bloquea las descargas en esta corrida

    for fecha in rango(args):
        publicar_en = hora_publicacion(cfg, fecha)
        if publicar_en < ahora + MARGEN:
            if not args.ahora:
                print(f"{fecha}: ya es muy tarde para programarlo, se omite (usa --ahora para publicarlo ya).")
                continue
            publicar_en = None
        publicar_texto = publicar_en.isoformat() if publicar_en else "ahora"
        for serie in series_activas(cfg, args):
            dia = estado["dias"].setdefault(fecha.isoformat(), {})
            if serie not in dia:
                try:
                    dia[serie] = nueva_entrada(cfg, elegir(cfg, cat, estado, fecha, serie), fecha, serie)
                except seleccion.SinVideo as e:
                    print(f"{fecha} {NOMBRES[serie]}: ⚠ {e}")
                    continue
                guardar_json(ESTADO, estado)
            e = dia[serie]
            falta_yt = usar_yt and not e["youtube"] and (cfg_yt["modo"] == "manual" or (cuota_ok and subidas_yt < cfg_yt["max_subidas_por_corrida"]))
            fb_alcance = not publicar_en or publicar_en <= ahora + timedelta(days=cfg_fb["max_dias_adelante"])
            falta_fb = [p for p in paginas if p["id"] not in e["facebook"]] if fb_alcance else []
            if not falta_yt and not falta_fb:
                continue

            etiqueta = f"{fecha} {NOMBRES[serie]}"
            if not e["archivo"] or not os.path.exists(e["archivo"]):
                if not descargas_ok:
                    continue
                print(f"{etiqueta}: descargando {e['origen_titulo']}…")
                try:
                    e["archivo"], descripcion = descarga.descargar(
                        catalogo.Video(e["origen_id"], e["origen_titulo"], None), f"{fecha}_{serie}_{e['origen_id']}",
                        cfg.get("descargas", {}))
                except descarga.Bloqueado as err:
                    descargas_ok = False
                    print(f"⚠ YouTube bloqueó las descargas por ahora ({err}). Se sigue subiendo lo que ya está "
                          "descargado; lo demás se intenta en la siguiente corrida.")
                    continue
                except descarga.ErrorDescarga as err:
                    print(f"{etiqueta}: ✗ no se pudo descargar: {err}")
                    continue
                e["variables"].update(descripcion=descripcion, fecha_larga=fecha_larga(fecha))
                e["descripcion"] = cfg["series"][serie]["descripcion"].format_map(e["variables"])
                guardar_json(ESTADO, estado)

            if falta_yt and cfg_yt["modo"] == "manual":
                nuevo = not MANUAL_YT.exists()
                with open(MANUAL_YT, "a", newline="", encoding="utf-8") as f:
                    w = csv.writer(f)
                    if nuevo:
                        w.writerow(["publicar", "titulo", "archivo", "descripcion"])
                    w.writerow([publicar_texto, e["titulo"], e["archivo"], e["descripcion"]])
                e["youtube"] = "manual"
                print(f"{etiqueta}: anotado en {MANUAL_YT.name} para subirlo a mano")
            elif falta_yt:
                print(f"{etiqueta}: subiendo a YouTube…")
                try:
                    e["youtube"] = youtube.subir(yt, e["archivo"], e["titulo"], e["descripcion"], publicar_en,
                                                 cfg_yt, cfg["series"][serie]["para_ninos"],
                                                 cfg_yt.get("listas", {}).get(serie))
                    subidas_yt += 1
                    print(f"{etiqueta}: ✓ YouTube https://youtu.be/{e['youtube']}")
                except youtube.CuotaAgotada:
                    cuota_ok = False
                    print("⚠ Se acabó la cuota diaria de YouTube; lo que falte se sube en la próxima corrida.")
            guardar_json(ESTADO, estado)

            for p in falta_fb:
                print(f"{etiqueta}: subiendo a Facebook · {p['nombre']}…")
                try:
                    e["facebook"][p["id"]] = facebook.subir(p, e["archivo"], e["titulo"], e["descripcion"],
                                                            publicar_en, cfg_fb["graph_version"])
                    print(f"{etiqueta}: ✓ Facebook · {p['nombre']}")
                except (facebook.ErrorFacebook, OSError) as err:
                    print(f"{etiqueta}: ✗ Facebook · {p['nombre']}: {err}")
                guardar_json(ESTADO, estado)

            terminado = (not usar_yt or e["youtube"]) and (not usar_fb or len(e["facebook"]) >= len(paginas))
            if terminado and cfg["borrar_video_al_terminar"] and e["youtube"] != "manual" and os.path.exists(e["archivo"]):
                os.remove(e["archivo"])
    if not args.sin_web and cfg.get("web", {}).get("url"):
        # La página se entera al momento de lo programado (los audios los sube `./ab web-sync`).
        try:
            print(web.enviar(cfg, web.armar_feed(cfg, estado, hora_publicacion), []))
        except Exception as e:
            print(f"⚠ No se pudo avisar a la página ({e}); se enviará en la siguiente corrida o con ./ab web-sync.")
    print("Listo.")


def cmd_estado(cfg, args):
    estado = cargar_estado()
    paginas = {p["id"]: p["nombre"] for p in facebook.paginas()}
    if estado["biblia_inicio"]:
        print(f"Última Biblia registrada a mano: {estado['biblia_inicio']['titulo']}")
    hoy = date.today().isoformat()
    for f in sorted(estado["dias"]):
        if f < hoy and not args.todo:
            continue
        print(f"\n{f}")
        for serie, e in estado["dias"][f].items():
            yt = "✓" if e["youtube"] else "·"
            fb = "".join("✓" if pid in e["facebook"] else "·" for pid in paginas) or "-"
            print(f"  YT {yt}  FB {fb}  {NOMBRES[serie]:<11} {e['titulo']}")


def cmd_web_sync(cfg, args):
    if not (args.url or args.local or cfg.get("web", {}).get("url")):
        print("web.url está vacío en config.yaml; no se envía el calendario a la página.")
        return
    estado = cargar_estado()
    try:
        subidos, borrados = audio.sincronizar(cfg, estado, ESTADO)
        print(f"Audios: {subidos} subidos, {borrados} borrados (más de {audio.DIAS_ATRAS} días).")
    except Exception as e:  # sin token o sin internet: la página usa el video de YouTube
        print(f"⚠ No se pudieron preparar los audios ({e}).")
    videos = web.armar_feed(cfg, estado, hora_publicacion)
    try:
        subidas = web.actualizar_subidas()
    except Exception as e:  # sin YouTube autorizado o sin internet: se usa lo que ya había
        print(f"⚠ No se pudo leer el canal de YouTube ({e}); se usa la última lista guardada.")
        subidas = leer_json(web.SUBIDAS, [])
    archivo = web.armar_archivo(cfg, subidas)
    cuenta = {s: sum(1 for v in archivo if v["serie"] == s) for s in SERIES}
    print(f"{len(videos)} videos en el calendario · archivo: {cuenta['biblia']} Biblia, "
          f"{cuenta['ninos']} Niños (este año) y {cuenta['proverbios']} Proverbios.")
    print(web.enviar(cfg, videos, archivo, url=args.url, local=args.local))


def cmd_panel(cfg, args):
    estado = cargar_estado()
    hoy = date.today()
    pasados = [date.fromisoformat(f) for f in sorted(estado["dias"]) if hoy - timedelta(days=7) <= date.fromisoformat(f) < hoy]
    fechas = pasados + [hoy + timedelta(days=i) for i in range(args.dias)]
    filas = proyectar(cfg, catalogo.cargar(), estado, fechas, series_activas(cfg, args))
    ruta = panel.generar(cfg, filas, estado)
    print(f"Panel: {ruta}")
    if not args.sin_abrir:
        subprocess.run(["open", str(ruta)], check=False)


def cmd_auth_youtube(cfg, args):
    yt = youtube.servicio(interactivo=True)
    print(f"YouTube autorizado. Canal: {youtube.nombre_canal(yt)}")


def cmd_auth_facebook(cfg, args):
    if not facebook.APP.exists():
        print("Datos de tu app (developers.facebook.com → tu app → Configuración → Básica):")
        app_id = input("ID de la app: ").strip()
        app_secret = getpass.getpass("Clave secreta de la app (no se ve al escribir): ").strip()
        guardar_json(facebook.APP, {"app_id": app_id, "app_secret": app_secret})
        facebook.APP.chmod(0o600)
    print("Token de usuario de Graph API Explorer (permisos: pages_show_list,\n"
          "pages_read_engagement, pages_manage_posts):")
    token = getpass.getpass("> (pégalo y Enter; no se ve al pegar) ").strip()
    todas = facebook.autorizar(token, cfg["facebook"]["graph_version"])
    for i, p in enumerate(todas, 1):
        print(f"  {i}. {p['nombre']}")
    eleccion = input("Números de las páginas a usar, separados por coma (Enter = todas): ").strip()
    elegidas = [todas[int(n) - 1] for n in eleccion.split(",")] if eleccion else todas
    facebook.guardar_paginas(elegidas)
    facebook.PAGINAS.chmod(0o600)
    print("Guardadas:", ", ".join(p["nombre"] for p in elegidas))


def main():
    p = argparse.ArgumentParser(prog="ab", description="Programa Audio Biblias en YouTube y Facebook")
    sub = p.add_subparsers(dest="comando", required=True)

    s = sub.add_parser("catalogo", help="actualiza la lista de videos del canal de origen")
    s.add_argument("--completo", action="store_true", help="vuelve a leer todo el canal")
    s.set_defaults(func=cmd_catalogo)

    s = sub.add_parser("ultima-biblia", help="muestra o corrige la última Audio Biblia que ya subiste")
    s.add_argument("texto", nargs="?", help='lectura, título o ID, ej. "1 Samuel 2"')
    s.add_argument("--desde-youtube", action="store_true", help="tomarla de tu canal de YouTube")
    s.set_defaults(func=cmd_ultima_biblia)

    for nombre, func, ayuda in (("plan", cmd_plan, "muestra qué se publicaría (no sube nada)"),
                                ("programar", cmd_programar, "descarga, sube y programa")):
        s = sub.add_parser(nombre, help=ayuda)
        s.add_argument("--desde", help="AAAA-MM-DD (por defecto: mañana)")
        g = s.add_mutually_exclusive_group()
        g.add_argument("--dias", type=int, default=1)
        g.add_argument("--semana", action="store_true", help="7 días")
        g.add_argument("--mes", action="store_true", help="30 días")
        g.add_argument("--hasta", help="AAAA-MM-DD")
        s.add_argument("--series", help="biblia,proverbios,ninos (por defecto: todas las activas)")
        if nombre == "programar":
            s.add_argument("--solo", choices=["youtube", "facebook"])
            s.add_argument("--sin-web", action="store_true", help="no enviar el calendario a la página al terminar")
            s.add_argument("--ahora", action="store_true",
                           help="si la hora de una fecha ya pasó, publicarlo de inmediato en vez de omitirlo")
        s.set_defaults(func=func)

    s = sub.add_parser("estado", help="qué está programado y dónde")
    s.add_argument("--todo", action="store_true", help="incluir fechas pasadas")
    s.set_defaults(func=cmd_estado)

    s = sub.add_parser("web-sync", help="envía el calendario de videos a la página web")
    s.add_argument("--url", help="dirección de la página (por defecto web.url de config.yaml)")
    s.add_argument("--local", action="store_true", help="solo guardarlo para la página en modo desarrollo")
    s.set_defaults(func=cmd_web_sync)

    s = sub.add_parser("panel", help="abre en el navegador el calendario con el estado de cada video")
    s.add_argument("--dias", type=int, default=21, help="cuántos días hacia adelante (por defecto 21)")
    s.add_argument("--sin-abrir", action="store_true", help="solo generar el archivo")
    s.set_defaults(func=cmd_panel)

    sub.add_parser("auth-youtube", help="autoriza tu canal de YouTube").set_defaults(func=cmd_auth_youtube)
    sub.add_parser("auth-facebook", help="autoriza tus páginas de Facebook").set_defaults(func=cmd_auth_facebook)

    args = p.parse_args()
    cfg = cargar_config()
    try:
        args.func(cfg, args)
    except (seleccion.SinVideo, RuntimeError) as e:
        sys.exit(str(e))
