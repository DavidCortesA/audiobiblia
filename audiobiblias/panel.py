"""Panel de solo lectura: genera data/panel.html con lo pendiente, lo ya programado y las conexiones."""
import re
from datetime import datetime, timedelta
from html import escape
from zoneinfo import ZoneInfo

from . import catalogo, facebook
from .config import CREDENCIALES, DATA

ARCHIVO = DATA / "panel.html"
NOMBRES = {"biblia": "Biblia", "proverbios": "Proverbios", "ninos": "Niños"}
MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

CSS = """
:root {
  --fondo: #f6f4ef; --tarjeta: #ffffff; --texto: #1f1d1a; --suave: #6b665e; --borde: #e4dfd5;
  --ok: #1f7a4d; --ok-fondo: #e3f3ea; --pend: #8a6a12; --pend-fondo: #fbf1d6;
  --mal: #a3302a; --mal-fondo: #fbe4e2; --gris-fondo: #efece6; --acento: #6b4e16; --hoy: #c79a3b;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --fondo: #171614; --tarjeta: #211f1c; --texto: #ece8e1; --suave: #a39d92; --borde: #36322c;
    --ok: #7fd1a4; --ok-fondo: #1d3328; --pend: #e7c46a; --pend-fondo: #3a3020;
    --mal: #f19a92; --mal-fondo: #3d2422; --gris-fondo: #2a2724; --acento: #e2c27d; --hoy: #e2c27d;
  }
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--fondo); color: var(--texto);
  font: 15px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
main { max-width: 1100px; margin: 0 auto; padding: 24px 16px 48px; }
header h1 { font-size: 26px; margin: 0; letter-spacing: -0.01em; }
header p { margin: 4px 0 0; color: var(--suave); font-size: 13px; }

.arriba { display: grid; grid-template-columns: repeat(3, 1fr) 1.4fr; gap: 12px; margin: 20px 0; }
.dato, .conexiones { background: var(--tarjeta); border: 1px solid var(--borde); border-radius: 12px; padding: 14px 16px; }
.dato b, .conexiones b.tit { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: .06em;
  color: var(--suave); font-weight: 600; margin-bottom: 6px; }
.dato .grande { font-size: 22px; font-weight: 650; line-height: 1.2; }
.dato .chico { font-size: 13px; color: var(--suave); margin-top: 4px; }
.conexiones ul { list-style: none; margin: 0; padding: 0; }
.conexiones li { display: grid; grid-template-columns: 10px 1fr auto; gap: 8px; align-items: center;
  padding: 5px 0; font-size: 14px; }
.conexiones li + li { border-top: 1px dashed var(--borde); }
.punto { width: 10px; height: 10px; border-radius: 50%; background: var(--mal); }
.punto.ok { background: var(--ok); }
.punto.medio { background: var(--pend); }
.conexiones .nombre { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.conexiones .nombre small { color: var(--suave); }
.conexiones .hasta { font-size: 12px; color: var(--suave); white-space: nowrap; }

.avisos { background: var(--mal-fondo); color: var(--mal); border-radius: 12px; padding: 12px 16px; margin-bottom: 20px; }
.avisos h2 { font-size: 14px; margin: 0 0 6px; }
.avisos ul { margin: 0; padding-left: 18px; font-size: 14px; }

.pestanas { display: flex; gap: 4px; border-bottom: 1px solid var(--borde); margin: 8px 0 16px; }
.pestanas button { appearance: none; border: 0; background: none; color: var(--suave); font: inherit;
  font-weight: 600; padding: 10px 14px; border-bottom: 2px solid transparent; cursor: pointer; margin-bottom: -1px; }
.pestanas button[aria-selected="true"] { color: var(--texto); border-bottom-color: var(--hoy); }
.pestanas .num { display: inline-block; min-width: 22px; padding: 0 6px; margin-left: 6px; border-radius: 999px;
  font-size: 12px; background: var(--gris-fondo); color: var(--suave); text-align: center; }
.panel-pestana[hidden] { display: none; }

.dia { background: var(--tarjeta); border: 1px solid var(--borde); border-radius: 12px; margin-bottom: 12px; overflow: hidden; }
.dia.hoy { border-color: var(--hoy); box-shadow: 0 0 0 1px var(--hoy); }
.dia > .cab { display: flex; align-items: baseline; gap: 10px; padding: 10px 16px; border-bottom: 1px solid var(--borde); }
.dia > .cab strong { font-size: 16px; }
.dia > .cab small { color: var(--suave); }
.dia > .cab .etq { margin-left: auto; font-size: 12px; color: var(--acento); font-weight: 600; }
.fila { display: grid; grid-template-columns: 96px 1fr; gap: 12px; padding: 10px 16px; align-items: start; }
.fila + .fila { border-top: 1px dashed var(--borde); }
.serie { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--acento); padding-top: 2px; }
.titulo { font-weight: 500; overflow-wrap: anywhere; }
.origen { font-size: 12px; color: var(--suave); overflow-wrap: anywhere; }
.origen a { color: inherit; }
.aviso { font-size: 12px; color: var(--mal); margin-top: 2px; }
.estados { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.chip { font-size: 12px; padding: 2px 8px; border-radius: 999px; white-space: nowrap; text-decoration: none; border: 1px solid transparent; }
.chip.ok { background: var(--ok-fondo); color: var(--ok); }
.chip.pend { background: var(--pend-fondo); color: var(--pend); }
.chip.mal { background: var(--mal-fondo); color: var(--mal); }
.chip.gris { background: var(--gris-fondo); color: var(--suave); }
a.chip:hover { border-color: currentColor; }

.lista { background: var(--tarjeta); border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; }
.lista .item { display: grid; grid-template-columns: 92px 96px 1fr auto; gap: 12px; align-items: center;
  padding: 8px 16px; font-size: 14px; }
.lista .item + .item { border-top: 1px solid var(--borde); }
.lista .item.nuevo-dia { border-top-width: 2px; }
.lista .fecha { color: var(--suave); font-size: 13px; }
.lista .fecha small { display: block; font-size: 11px; color: var(--ok); }
.leyenda { font-size: 12px; color: var(--suave); margin: 0 0 10px; }
.leyenda b { color: var(--ok); font-weight: 600; }
.lista .titulo { overflow-wrap: anywhere; }
.lista .enlaces { display: flex; gap: 4px; }
.vacio { color: var(--suave); background: var(--tarjeta); border: 1px dashed var(--borde); border-radius: 12px;
  padding: 24px; text-align: center; }

@media (max-width: 960px) {
  .arriba { grid-template-columns: repeat(3, 1fr); }
  .conexiones { grid-column: 1 / -1; }
}
@media (max-width: 640px) {
  .arriba { grid-template-columns: 1fr; }
  .fila { grid-template-columns: 1fr; gap: 4px; }
  .lista .item { grid-template-columns: 1fr auto; }
  .lista .fecha, .lista .serie { grid-column: 1; }
}
"""

JS = """
(function () {
  var botones = document.querySelectorAll('.pestanas button');
  function mostrar(id) {
    botones.forEach(function (b) {
      var sel = b.dataset.p === id;
      b.setAttribute('aria-selected', sel);
      document.getElementById(b.dataset.p).hidden = !sel;
    });
    try { localStorage.setItem('pestana', id); } catch (e) {}
  }
  botones.forEach(function (b) { b.addEventListener('click', function () { mostrar(b.dataset.p); }); });
  var guardada = null;
  try { guardada = localStorage.getItem('pestana'); } catch (e) {}
  if (guardada && document.getElementById(guardada)) mostrar(guardada);
})();
"""


def _chip(clase, texto, url=None, titulo=""):
    t = f' title="{escape(titulo)}"' if titulo else ""
    if url:
        return f'<a class="chip {clase}" href="{escape(url)}" target="_blank" rel="noopener"{t}>{escape(texto)}</a>'
    return f'<span class="chip {clase}"{t}>{escape(texto)}</span>'


def _corto(nombre, n=22):
    return nombre if len(nombre) <= n else nombre[:n - 2] + "…"


def _fecha(f):
    return f"{f.day} {MESES[f.month - 1]}"


def resumen_lectura(lectura):
    """'1 Reyes 7, Salmo 62:1-4, Proverbios 27:13-14, Juan 11:1-37' → '1 Reyes 7 · Juan 11:1-37'."""
    partes = [p.strip() for p in re.split(r",\s*|\s+y\s+", re.sub(r"\(.*?\)|\[.*?\]", "", lectura)) if p.strip()]
    if len(partes) < 2:
        return lectura
    # El NT empieza en la última parte que trae nombre de libro ("Juan 6:60-71, 7:1-24")
    inicio_nt = max(i for i, p in enumerate(partes) if re.match(r"(?:[123]\s*)?[^\d\W]", p))
    return f"{partes[0]} · {', '.join(partes[inicio_nt:])}"


def _destinos(cfg, paginas):
    """Lista de (clave, nombre) de cada plataforma activa."""
    d = [("youtube", "YouTube")] if cfg["youtube"]["activo"] else []
    if cfg["facebook"]["activo"]:
        d += [(p["id"], p["nombre"]) for p in paginas]
    return d


def _hecho(entrada, clave):
    if not entrada:
        return False
    return bool(entrada.get("youtube")) if clave == "youtube" else clave in entrada.get("facebook", {})


def _estados(fila, paginas, pasado, fb_limite, cfg):
    e = fila["entrada"]
    if not fila["asignada"]:
        return _chip("gris", "por programar")
    chips = []
    if cfg["youtube"]["activo"]:
        yt = e.get("youtube")
        if yt == "manual":
            chips.append(_chip("pend", "YouTube: manual"))
        elif yt:
            chips.append(_chip("ok", "YouTube ✓", f"https://studio.youtube.com/video/{yt}/edit", "Abrir en YouTube Studio"))
        else:
            chips.append(_chip("mal" if pasado else "pend", "YouTube " + ("✗" if pasado else "pendiente")))
    if cfg["facebook"]["activo"]:
        for p in paginas:
            vid = e.get("facebook", {}).get(p["id"])
            nombre = _corto(p["nombre"])
            if vid:
                chips.append(_chip("ok", f"{nombre} ✓", f"https://www.facebook.com/{p['id']}/videos/{vid}/", p["nombre"]))
            elif pasado:
                chips.append(_chip("mal", f"{nombre} ✗", titulo=p["nombre"]))
            elif fila["fecha"] > fb_limite:
                chips.append(_chip("gris", f"{nombre}: después", titulo="Facebook solo deja programar con unas semanas de anticipación"))
            else:
                chips.append(_chip("pend", f"{nombre}: pendiente", titulo=p["nombre"]))
    return "".join(chips)


def _tarjetas_dia(filas, cfg, paginas, hoy, fb_limite):
    """Tarjetas por día (vista de pendientes)."""
    partes, por_fecha = [], {}
    for f in filas:
        por_fecha.setdefault(f["fecha"], []).append(f)
    for fecha in sorted(por_fecha):
        numero = fecha.timetuple().tm_yday + cfg.get("ajuste_dia", 0)
        etq = "HOY" if fecha == hoy else ("MAÑANA" if fecha == hoy + timedelta(days=1) else ("PASADO" if fecha < hoy else ""))
        partes.append(f'<article class="dia{" hoy" if fecha == hoy else ""}"><div class="cab">'
                      f'<strong>{DIAS[fecha.weekday()]} {_fecha(fecha)}</strong>'
                      f'<small>Día {numero}</small><span class="etq">{etq}</span></div>')
        for f in por_fecha[fecha]:
            partes.append(f'<div class="fila"><div class="serie">{NOMBRES[f["serie"]]}</div><div>')
            if f["error"]:
                partes.append(f'<div class="aviso">⚠ {escape(f["error"])}</div></div></div>')
                continue
            e = f["entrada"]
            partes.append(f'<div class="titulo">{escape(e["titulo"])}</div>')
            partes.append(f'<div class="origen">origen: <a href="https://youtu.be/{escape(e["origen_id"])}" '
                          f'target="_blank" rel="noopener">{escape(e["origen_titulo"])}</a></div>')
            if f["aviso"]:
                partes.append(f'<div class="aviso">⚠ {escape(f["aviso"])} (¿video mal titulado o faltante?)</div>')
            partes.append(f'<div class="estados">{_estados(f, paginas, fecha < hoy, fb_limite, cfg)}</div></div></div>')
        partes.append("</article>")
    return "".join(partes)


def _texto_corto(f):
    v = f["entrada"].get("variables", {})
    if f["serie"] == "biblia":
        return f"Día {v.get('dia_anio', '')} · {resumen_lectura(v.get('lectura', ''))}"
    if f["serie"] == "ninos":
        return f"Día {v.get('dia_anio', '')} · {v.get('lectura', '')}"
    return f"Proverbios {v.get('dia_mes', '')}"


def _lista_hechos(filas, paginas, hoy):
    """Lista compacta de lo ya programado/publicado, en orden de fecha."""
    leyenda = " · ".join(f"<b>FB {i}</b> = {escape(p['nombre'])}" for i, p in enumerate(paginas, 1))
    partes, anterior = [f'<p class="leyenda">{leyenda}</p>' if leyenda else "", '<div class="lista">'], None
    for f in sorted(filas, key=lambda f: f["fecha"]):
        e = f["entrada"]
        enlaces = []
        if e.get("youtube") and e["youtube"] != "manual":
            enlaces.append(_chip("ok", "YouTube", f"https://studio.youtube.com/video/{e['youtube']}/edit"))
        for i, p in enumerate(paginas, 1):
            if p["id"] in e.get("facebook", {}):
                enlaces.append(_chip("ok", f"FB {i}", f"https://www.facebook.com/{p['id']}/videos/{e['facebook'][p['id']]}/",
                                     p["nombre"]))
        nuevo = " nuevo-dia" if anterior and anterior != f["fecha"] else ""
        fecha = f'{DIAS[f["fecha"].weekday()]} {_fecha(f["fecha"])}' if anterior != f["fecha"] else ""
        if fecha and f["fecha"] < hoy:
            fecha += " <small>publicado</small>"
        partes.append(f'<div class="item{nuevo}"><span class="fecha">{fecha}</span>'
                      f'<span class="serie">{NOMBRES[f["serie"]]}</span>'
                      f'<span class="titulo" title="{escape(e["titulo"])}">{escape(_texto_corto(f))}</span>'
                      f'<span class="enlaces">{"".join(enlaces)}</span></div>')
        anterior = f["fecha"]
    partes.append("</div>")
    return "".join(partes)


def generar(cfg, filas, estado):
    """Escribe el panel y devuelve su ruta. `filas` viene de cli.proyectar()."""
    zona = ZoneInfo(cfg["zona_horaria"])
    ahora = datetime.now(zona)
    hoy = ahora.date()
    paginas = facebook.paginas()
    destinos = _destinos(cfg, paginas)
    fb_limite = hoy + timedelta(days=cfg["facebook"]["max_dias_adelante"])

    completa = lambda f: f["asignada"] and all(_hecho(f["entrada"], k) for k, _ in destinos)
    hechas = [f for f in filas if not f["error"] and completa(f)]
    pendientes = [f for f in filas if f not in hechas]

    # Avisos
    avisos = []
    for f in filas:
        etiqueta = f"{_fecha(f['fecha'])} · {NOMBRES[f['serie']]}"
        if f["error"]:
            avisos.append(f"{etiqueta}: {f['error']}")
        if f["aviso"]:
            avisos.append(f"{etiqueta}: {f['aviso']} (¿video mal titulado o faltante?)")
        if f["asignada"] and f["fecha"] < hoy:
            faltan = [n for k, n in destinos if not _hecho(f["entrada"], k)]
            if faltan:
                avisos.append(f"{etiqueta}: no se subió a {', '.join(faltan)}")

    # Resumen
    biblias = sorted((f for f in hechas if f["serie"] == "biblia"), key=lambda f: f["fecha"])
    ultima_prog = biblias[-1] if biblias else None
    publicada = next((v for v in catalogo.cargar() if v.serie == "biblia"), None)
    futuras = [f["fecha"] for f in filas if f["fecha"] >= hoy]
    hasta = None
    for d in sorted(set(futuras)):
        if all(completa(f) for f in filas if f["fecha"] == d):
            hasta = d
        else:
            break
    por_subir = sum(1 for f in pendientes if f["fecha"] >= hoy or f["asignada"])

    if ultima_prog:
        lectura = resumen_lectura(ultima_prog["entrada"]["variables"].get("lectura", ""))
        tarjeta_biblia = (f'<div class="grande">{escape(lectura)}</div>'
                          f'<div class="chico">programada para el {_fecha(ultima_prog["fecha"])}</div>')
    else:
        tarjeta_biblia = '<div class="grande">—</div>'
    if publicada:
        tarjeta_biblia += f'<div class="chico">publicada en tu canal: {escape(resumen_lectura(publicada.lectura))}</div>'

    # Conexiones: hasta qué fecha tiene todo cada plataforma (días seguidos desde hoy)
    yt_ok = (CREDENCIALES / "youtube_token.json").exists()
    conexiones = []
    for clave, nombre in destinos:
        cubierto = None
        for d in sorted(set(futuras)):
            if all(f["asignada"] and _hecho(f["entrada"], clave) for f in filas if f["fecha"] == d):
                cubierto = d
            else:
                break
        conectado = yt_ok if clave == "youtube" else True
        clase = "ok" if conectado and cubierto and cubierto >= hoy + timedelta(days=3) else ("medio" if conectado else "")
        texto = f"hasta {_fecha(cubierto)}" if cubierto else ("sin conectar" if not conectado else "nada programado")
        etiqueta = "YouTube <small>· AUDIO BIBLIAS</small>" if clave == "youtube" else f'{escape(nombre)} <small>· Facebook</small>'
        conexiones.append(f'<li><span class="punto {clase}"></span><span class="nombre" title="{escape(nombre)}">'
                          f'{etiqueta}</span><span class="hasta">{texto}</span></li>')

    partes = [f"""<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Audio Biblias</title><style>{CSS}</style></head><body><main>
<header><h1>Audio Biblias</h1>
<p>Actualizado {ahora:%d/%m/%Y %H:%M} · publicación diaria a las {escape(cfg['hora_publicacion'])} · para actualizar: <code>./ab panel</code></p></header>
<section class="arriba">
<div class="dato"><b>Última Biblia programada</b>{tarjeta_biblia}</div>
<div class="dato"><b>Programado hasta</b><div class="grande">{_fecha(hasta) if hasta else "—"}</div>
<div class="chico">{"todo listo en todas las plataformas" if hasta else "falta programar hoy o mañana"}</div></div>
<div class="dato"><b>Pendientes por subir</b><div class="grande">{por_subir}</div>
<div class="chico">en los próximos {len(set(futuras))} días</div></div>
<div class="conexiones"><b class="tit">Conexiones</b><ul>{"".join(conexiones)}</ul></div>
</section>"""]
    if avisos:
        partes.append('<section class="avisos"><h2>⚠ Revisar</h2><ul>')
        partes += [f"<li>{escape(a)}</li>" for a in avisos]
        partes.append("</ul></section>")

    partes.append(f'''<nav class="pestanas" role="tablist">
<button role="tab" data-p="p-pendientes" aria-selected="true">Pendientes<span class="num">{len(pendientes)}</span></button>
<button role="tab" data-p="p-hechos" aria-selected="false">Ya programados<span class="num">{len(hechas)}</span></button>
</nav>''')
    partes.append('<section id="p-pendientes" class="panel-pestana">')
    partes.append(_tarjetas_dia(pendientes, cfg, paginas, hoy, fb_limite) if pendientes
                  else '<p class="vacio">Nada pendiente: todo está programado. 🙌</p>')
    partes.append('</section><section id="p-hechos" class="panel-pestana" hidden>')
    partes.append(_lista_hechos(hechas, paginas, hoy) if hechas else '<p class="vacio">Todavía no hay nada programado.</p>')
    partes.append(f"</section></main><script>{JS}</script></body></html>")

    DATA.mkdir(exist_ok=True)
    ARCHIVO.write_text("".join(partes), encoding="utf-8")
    return ARCHIVO
