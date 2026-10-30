"use client";

import { ExternalLink, Play } from "lucide-react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { SERIES, SITIO, type Serie } from "@/lib/sitio";
import { AccionesVideo } from "./AccionesVideo";
import { MarcaEscuchado, RachaCorta } from "./Progreso";
import { ReproductorAudio, type PistaAudio } from "./ReproductorAudio";

export interface VideoReproducible {
  slug: string;
  serie: Serie;
  titulo: string;
  lectura: string;
  youtube: string | null;
  facebook: string | null;
  miniatura: string;
  fecha: string;
  dia: number;
  audio: string | null;
}

type FuenteVideo = "youtube" | "facebook";
type Fuente = "audio" | FuenteVideo;
const EASE = [0.16, 1, 0.3, 1] as const;

function urlFacebook(id: string) {
  return `https://www.facebook.com/${SITIO.facebook.paginaId}/videos/${id}/`;
}

/** Video con portada; el iframe (YouTube o Facebook) solo se carga al dar play. */
export function MarcoVideo({ video, fuente }: { video: VideoReproducible; fuente: FuenteVideo }) {
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
        <Play size={32} fill="currentColor" strokeWidth={1.5} style={{ marginLeft: 4 }} />
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
        <span>Escuchar en</span>
        <div className="fuente-opciones" role="group" aria-label="Cómo escuchar">
          <button
            type="button"
            aria-pressed={fuente === "audio"}
            disabled={!video.audio}
            title={video.audio ? "Sigue sonando con la pantalla apagada" : "Este audio solo está en video"}
            onClick={() => onCambio("audio")}
          >
            Audio
          </button>
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
            YouTube <ExternalLink size={14} aria-hidden="true" />
          </a>
        )}
        {video.facebook && (
          <a href={urlFacebook(video.facebook)} target="_blank" rel="noopener">
            Facebook <ExternalLink size={14} aria-hidden="true" />
          </a>
        )}
      </div>
    </>
  );
}

/** Audio si existe; si no, el video de YouTube. */
function fuenteReal(video: VideoReproducible, elegida: Fuente): Fuente {
  return elegida === "audio" && !video.audio ? "youtube" : elegida;
}

function pista(v: VideoReproducible): PistaAudio {
  return { slug: v.slug, serie: v.serie, titulo: v.titulo, lectura: v.lectura, miniatura: v.miniatura, audio: v.audio!, fecha: v.fecha, dia: v.dia };
}

/** Reproductor de "hoy": audio/video grande + pestañas por serie. Al terminar un audio sigue con el siguiente. */
export function Reproductor({ videos, etiqueta }: { videos: VideoReproducible[]; etiqueta: string }) {
  const [serie, setSerie] = useState<Serie>(videos[0].serie);
  const [elegida, setElegida] = useState<Fuente>("audio");
  const [seguir, setSeguir] = useState(false);
  const indice = Math.max(0, videos.findIndex((v) => v.serie === serie));
  const video = videos[indice];
  const fuente = fuenteReal(video, elegida);

  const conAudio = (desde: number, paso: 1 | -1) => {
    for (let i = desde + paso; i >= 0 && i < videos.length; i += paso) if (videos[i].audio) return videos[i];
    return null;
  };
  const siguiente = conAudio(indice, 1);
  const anterior = conAudio(indice, -1);

  return (
    <div className="hoy-grid">
      <div className="hoy-video">
        {fuente === "audio" ? (
          <ReproductorAudio
            pista={pista(video)}
            autoReproducir={seguir}
            alTerminar={() => {
              if (siguiente) {
                setSerie(siguiente.serie);
                setSeguir(true);
              }
            }}
            alSiguiente={siguiente ? () => (setSerie(siguiente.serie), setSeguir(true)) : undefined}
            alAnterior={anterior ? () => (setSerie(anterior.serie), setSeguir(true)) : undefined}
          />
        ) : (
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
        )}
      </div>
      <div className="hoy-panel">
        <span className="ceja">{etiqueta}</span>
        <RachaCorta />
        <div className="pestanas-serie" role="tablist" aria-label="Audios del día">
          {videos.map((v) => (
            <button
              key={v.slug}
              type="button"
              role="tab"
              aria-selected={v.serie === serie}
              className="pestana-serie"
              onClick={() => {
                setSerie(v.serie);
                setSeguir(false);
              }}
            >
              {v.serie === serie && (
                <motion.span layoutId="fondo-activo" className="fondo-activo" transition={{ duration: 0.5, ease: EASE }} />
              )}
              <span className="nombre">
                {SERIES[v.serie].nombre} <MarcaEscuchado slug={v.slug} variante="pestana" />
              </span>
              <span className="lectura">{v.lectura}</span>
            </button>
          ))}
        </div>
        {fuente === "audio" && siguiente && <p className="hoy-siguiente">Al terminar sigue: {SERIES[siguiente.serie].nombre}</p>}
        <AccionesVideo video={datosAccion(video)} tema="oscuro" />
        <SelectorFuente video={video} fuente={fuente} onCambio={setElegida} />
      </div>
    </div>
  );
}

function datosAccion(v: VideoReproducible) {
  return { slug: v.slug, serie: v.serie, titulo: v.titulo, lectura: v.lectura, miniatura: v.miniatura, fecha: v.fecha, dia: v.dia };
}

/** Para la página de un video: el reproductor y la elección de fuente. */
export function ReproductorUnico({ video }: { video: VideoReproducible }) {
  const [elegida, setElegida] = useState<Fuente>("audio");
  const fuente = fuenteReal(video, elegida);
  return (
    <>
      <div className="marco">
        {fuente === "audio" ? <ReproductorAudio pista={pista(video)} /> : <MarcoVideo key={fuente} video={video} fuente={fuente} />}
      </div>
      <div className="fuente-clara" style={{ marginTop: 16, display: "grid", gap: 14 }}>
        <AccionesVideo video={datosAccion(video)} />
        <SelectorFuente video={video} fuente={fuente} onCambio={setElegida} />
      </div>
    </>
  );
}
