"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { SERIES, SITIO, type Serie } from "@/lib/sitio";

export interface VideoReproducible {
  slug: string;
  serie: Serie;
  titulo: string;
  lectura: string;
  youtube: string | null;
  facebook: string | null;
  miniatura: string;
}

type Fuente = "youtube" | "facebook";
const EASE = [0.16, 1, 0.3, 1] as const;

function urlFacebook(id: string) {
  return `https://www.facebook.com/${SITIO.facebook.paginaId}/videos/${id}/`;
}

/** Video con portada; el iframe (YouTube o Facebook) solo se carga al dar play. */
export function MarcoVideo({ video, fuente }: { video: VideoReproducible; fuente: Fuente }) {
  const [activo, setActivo] = useState(false);
  const usarFacebook = fuente === "facebook" && video.facebook;

  if (activo) {
    const src = usarFacebook
      ? `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(urlFacebook(video.facebook!))}&show_text=false&autoplay=true&width=1280`
      : `https://www.youtube-nocookie.com/embed/${video.youtube}?autoplay=1&rel=0&modestbranding=1`;
    return (
      <iframe
        src={src}
        title={video.titulo}
        allow="autoplay; encrypted-media; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  }
  return (
    <button type="button" className="lite" onClick={() => setActivo(true)} aria-label={`Reproducir: ${video.titulo}`}>
      <Image src={video.miniatura} alt="" fill sizes="(max-width: 900px) 100vw, 760px" priority />
      <span className="lite-play" aria-hidden="true">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
      </span>
    </button>
  );
}

export function SelectorFuente({
  video,
  fuente,
  onCambio,
}: {
  video: VideoReproducible;
  fuente: Fuente;
  onCambio: (f: Fuente) => void;
}) {
  return (
    <>
      <div className="fuente">
        <span>Ver desde</span>
        <div className="fuente-opciones" role="group" aria-label="Fuente del video">
          <button type="button" aria-pressed={fuente === "youtube"} onClick={() => onCambio("youtube")}>
            YouTube
          </button>
          <button
            type="button"
            aria-pressed={fuente === "facebook"}
            disabled={!video.facebook}
            title={video.facebook ? undefined : "Este audio aún no está en Facebook"}
            onClick={() => onCambio("facebook")}
          >
            Facebook
          </button>
        </div>
      </div>
      <div className="enlaces-externos">
        {video.youtube && (
          <a href={`https://youtu.be/${video.youtube}`} target="_blank" rel="noopener">
            Abrir en YouTube ↗
          </a>
        )}
        {video.facebook && (
          <a href={urlFacebook(video.facebook)} target="_blank" rel="noopener">
            Abrir en Facebook ↗
          </a>
        )}
      </div>
    </>
  );
}

/** Reproductor de "hoy": video grande + pestañas por serie. */
export function Reproductor({ videos, etiqueta }: { videos: VideoReproducible[]; etiqueta: string }) {
  const [serie, setSerie] = useState<Serie>(videos[0].serie);
  const [fuente, setFuente] = useState<Fuente>("youtube");
  const video = videos.find((v) => v.serie === serie) ?? videos[0];

  return (
    <div className="hoy-grid">
      <div className="hoy-video">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${video.slug}-${fuente}`}
            style={{ position: "absolute", inset: 0 }}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            <MarcoVideo video={video} fuente={fuente} />
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="hoy-panel">
        <span className="ceja">{etiqueta}</span>
        <div className="pestanas-serie" role="tablist" aria-label="Audios del día">
          {videos.map((v) => (
            <button
              key={v.slug}
              type="button"
              role="tab"
              aria-selected={v.serie === serie}
              className="pestana-serie"
              onClick={() => setSerie(v.serie)}
            >
              {v.serie === serie && (
                <motion.span layoutId="fondo-activo" className="fondo-activo" transition={{ duration: 0.5, ease: EASE }} />
              )}
              <span className="nombre">{SERIES[v.serie].nombre}</span>
              <span className="lectura">{v.lectura}</span>
            </button>
          ))}
        </div>
        <SelectorFuente video={video} fuente={fuente} onCambio={setFuente} />
      </div>
    </div>
  );
}

/** Para la página de un video: solo el marco y la elección de fuente. */
export function ReproductorUnico({ video }: { video: VideoReproducible }) {
  const [fuente, setFuente] = useState<Fuente>("youtube");
  return (
    <>
      <div className="marco">
        <MarcoVideo key={fuente} video={video} fuente={fuente} />
      </div>
      <div className="fuente-clara" style={{ marginTop: 16, display: "grid", gap: 10 }}>
        <SelectorFuente video={video} fuente={fuente} onCambio={setFuente} />
      </div>
    </>
  );
}
