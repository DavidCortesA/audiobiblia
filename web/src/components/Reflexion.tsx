"use client";

import { Check, Download, ImageDown, Play, Share2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { SITIO } from "@/lib/sitio";

/** Video de Facebook con portada; el iframe solo se carga al dar play. */
export function VideoFacebook({ url, titulo, miniatura }: { url: string; titulo: string; miniatura: string }) {
  const [activo, setActivo] = useState(false);
  if (activo) {
    return (
      <iframe
        src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&autoplay=true&width=1280`}
        title={titulo}
        allow="autoplay; encrypted-media; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  }
  return (
    <button type="button" className="lite" onClick={() => setActivo(true)} aria-label={`Reproducir: ${titulo}`}>
      <Image src={miniatura} alt="" fill sizes="(max-width: 900px) 100vw, 760px" priority />
      <span className="lite-play" aria-hidden="true">
        <Play size={32} fill="currentColor" strokeWidth={1.5} style={{ marginLeft: 4 }} />
      </span>
    </button>
  );
}

/** Compartir la reflexión (menú del celular) o copiar el enlace. */
export function CompartirReflexion({ slug, cita, texto }: { slug: string; cita: string; texto: string }) {
  const [copiado, setCopiado] = useState(false);
  async function compartir() {
    const url = `${SITIO.url}/reflexiones/${slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Reflexión · ${cita}`, text: `“${texto}” — ${cita}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2200);
    } catch {}
  }
  return (
    <button type="button" className="accion" onClick={compartir}>
      {copiado ? <Check size={18} aria-hidden="true" /> : <Share2 size={18} aria-hidden="true" />}
      {copiado ? "Enlace copiado" : "Compartir"}
    </button>
  );
}

const FORMATOS = [
  ["vertical", "Vertical", "1080×1350", "4 / 5", 280],
  ["cuadrada", "Cuadrada", "1080×1080", "1 / 1", 320],
  ["horizontal", "Horizontal", "1920×1080", "16 / 9", 560],
] as const;
const FONDOS = [
  ["amanecer", "Amanecer"],
  ["nubes", "Nubes"],
] as const;
type Formato = (typeof FORMATOS)[number][0];
type Fondo = (typeof FONDOS)[number][0];
type Resultado = { clave: string; archivo: File; vista: string } | { clave: string; error: true };

/** Imagen del versículo en 3 tamaños y 2 fondos, con vista previa, para compartir o descargar. */
export function ImagenReflexion({ slug, cita }: { slug: string; cita: string }) {
  const [abierto, setAbierto] = useState(false);
  const [formato, setFormato] = useState<Formato>("vertical");
  const [fondo, setFondo] = useState<Fondo>("amanecer");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const clave = `${formato}-${fondo}`;
  const listo = resultado && resultado.clave === clave && "archivo" in resultado ? resultado : null;
  const fallo = resultado?.clave === clave && "error" in resultado;

  // La imagen se prepara en cuanto cambia la elección: así compartir ocurre dentro del toque (iPhone).
  useEffect(() => {
    if (!abierto) return;
    const control = new AbortController();
    fetch(`/reflexiones/${slug}/imagen?formato=${formato}&fondo=${fondo}`, { signal: control.signal })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.blob();
      })
      .then((b) => {
        const archivo = new File([b], `reflexion-${slug}-${formato}.png`, { type: "image/png" });
        setResultado((antes) => {
          if (antes && "vista" in antes) URL.revokeObjectURL(antes.vista);
          return { clave: `${formato}-${fondo}`, archivo, vista: URL.createObjectURL(b) };
        });
      })
      .catch((e) => {
        if ((e as Error).name !== "AbortError") setResultado({ clave: `${formato}-${fondo}`, error: true });
      });
    return () => control.abort();
  }, [abierto, formato, fondo, slug]);

  function descargar() {
    if (!listo) return;
    const enlace = document.createElement("a");
    enlace.href = listo.vista;
    enlace.download = listo.archivo.name;
    enlace.click();
  }

  async function compartir() {
    if (!listo) return;
    if (navigator.canShare?.({ files: [listo.archivo] })) {
      try {
        await navigator.share({ files: [listo.archivo], title: `Reflexión · ${cita}` });
      } catch {}
      return;
    }
    descargar();
  }

  const [, , medida, proporcion, anchoVista] = FORMATOS.find(([f]) => f === formato)!;

  return (
    <>
      <button type="button" className={`accion${abierto ? " accion-activa" : ""}`} aria-expanded={abierto} onClick={() => setAbierto((a) => !a)}>
        <ImageDown size={18} aria-hidden="true" /> Imagen
      </button>
      {abierto && (
        <div className="panel-imagen">
          <fieldset>
            <legend>Tamaño</legend>
            <div className="opciones">
              {FORMATOS.map(([valor, texto, px]) => (
                <label key={valor} className={`opcion${formato === valor ? " opcion-activa" : ""}`}>
                  <input type="radio" name="formato-imagen" checked={formato === valor} onChange={() => setFormato(valor)} />
                  {texto} <small>{px}</small>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Fondo</legend>
            <div className="opciones">
              {FONDOS.map(([valor, texto]) => (
                <label key={valor} className={`opcion${fondo === valor ? " opcion-activa" : ""}`}>
                  <input type="radio" name="fondo-imagen" checked={fondo === valor} onChange={() => setFondo(valor)} />
                  {texto}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="panel-imagen-vista" style={{ aspectRatio: proporcion, maxWidth: anchoVista }} aria-busy={!listo && !fallo}>
            {listo ? (
              // eslint-disable-next-line @next/next/no-img-element -- vista previa de un archivo local (blob:)
              <img src={listo.vista} alt={`Imagen de ${cita}, ${medida}`} />
            ) : fallo ? (
              <p>No se pudo crear la imagen. Intenta de nuevo.</p>
            ) : (
              <span className="girando" aria-label="Preparando la imagen" />
            )}
          </div>
          <div className="acciones acciones-claro" style={{ justifyContent: "center" }}>
            <button type="button" className="accion accion-principal" onClick={compartir} disabled={!listo}>
              <Share2 size={18} aria-hidden="true" /> Compartir imagen
            </button>
            <button type="button" className="accion" onClick={descargar} disabled={!listo}>
              <Download size={18} aria-hidden="true" /> Descargar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
