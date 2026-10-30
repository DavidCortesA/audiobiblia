"use client";

import { Check, CircleCheck, Heart, ImageDown, Share2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { alternarFavorito, esFavorito, escucharFavoritos, type Favorito } from "@/lib/favoritos";
import { esEscuchado, escucharProgreso, marcarEscuchado, quitarEscuchado } from "@/lib/progreso";
import { SERIES, SITIO } from "@/lib/sitio";

type DatosVideo = Omit<Favorito, "guardado"> & { dia: number };

/** Guardar en favoritos y compartir. `tema` según el fondo: claro u oscuro. */
export function AccionesVideo({ video, tema = "claro" }: { video: DatosVideo; tema?: "claro" | "oscuro" }) {
  const [guardado, setGuardado] = useState(false);
  const [escuchado, setEscuchado] = useState(false);
  const [creandoImagen, setCreandoImagen] = useState(false);
  const [imagenLista, setImagenLista] = useState<File | null>(null);
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    const revisar = () => {
      setGuardado(esFavorito(video.slug));
      setEscuchado(esEscuchado(video.slug));
    };
    revisar();
    const a = escucharFavoritos(revisar);
    const b = escucharProgreso(revisar);
    return () => {
      a();
      b();
      setImagenLista(null); // la imagen preparada era de otro audio
    };
  }, [video.slug]);

  /**
   * Comparte la imagen vertical como foto (WhatsApp, estados); si no se puede, la descarga.
   * En iPhone compartir debe ocurrir dentro del toque: si la espera de la imagen lo impide,
   * la imagen queda lista y un segundo toque la envía al instante.
   */
  async function compartirImagen() {
    const url = `${SITIO.url}/${video.serie}/${video.slug}`;
    const enviar = async (archivo: File) => {
      if (navigator.canShare?.({ files: [archivo] })) {
        await navigator.share({ files: [archivo], title: video.titulo, text: url });
        return;
      }
      const enlace = document.createElement("a");
      enlace.href = URL.createObjectURL(archivo);
      enlace.download = archivo.name;
      enlace.click();
      URL.revokeObjectURL(enlace.href);
      mostrar("Imagen descargada");
    };
    try {
      if (imagenLista) {
        await enviar(imagenLista);
        return;
      }
      setCreandoImagen(true);
      const res = await fetch(`/${video.serie}/${video.slug}/imagen`);
      if (!res.ok) throw new Error(String(res.status));
      const archivo = new File([await res.blob()], `audio-biblia-${video.slug}.png`, { type: "image/png" });
      setImagenLista(archivo);
      setCreandoImagen(false);
      await enviar(archivo);
    } catch (e) {
      const nombre = (e as Error).name;
      if (nombre === "NotAllowedError") mostrar("Imagen lista: toca otra vez para enviarla");
      else if (nombre !== "AbortError") mostrar("No se pudo crear la imagen");
    } finally {
      setCreandoImagen(false);
    }
  }

  function mostrar(texto: string) {
    setAviso(texto);
    window.setTimeout(() => setAviso(""), 2200);
  }

  async function compartir() {
    const url = `${SITIO.url}/${video.serie}/${video.slug}`;
    const texto = `${SERIES[video.serie].nombre}: ${video.lectura} 🙏`;
    try {
      if (navigator.share) {
        await navigator.share({ title: video.titulo, text: texto, url });
        return;
      }
      await navigator.clipboard.writeText(`${texto}\n${url}`);
      mostrar("Enlace copiado");
    } catch (e) {
      // Cancelar el menú de compartir no es un error.
      if ((e as Error).name !== "AbortError") window.open(`https://wa.me/?text=${encodeURIComponent(`${texto}\n${url}`)}`, "_blank");
    }
  }

  return (
    <div className={`acciones acciones-${tema}`}>
      <button
        type="button"
        className={`accion${guardado ? " accion-activa" : ""}`}
        aria-pressed={guardado}
        onClick={() => {
          const ahora = alternarFavorito(video);
          setGuardado(ahora);
          mostrar(ahora ? "Guardado en tus favoritos" : "Quitado de favoritos");
        }}
      >
        <motion.span key={String(guardado)} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}>
          <Heart size={18} fill={guardado ? "currentColor" : "none"} aria-hidden="true" />
        </motion.span>
        {guardado ? "Guardado" : "Guardar"}
      </button>
      <button type="button" className="accion" onClick={compartir}>
        <Share2 size={18} aria-hidden="true" />
        Compartir
      </button>
      <button type="button" className="accion" onClick={compartirImagen} disabled={creandoImagen} aria-busy={creandoImagen}>
        {creandoImagen ? <span className="girando" aria-hidden="true" /> : <ImageDown size={18} aria-hidden="true" />}
        {imagenLista ? "Enviar imagen" : "Imagen"}
      </button>
      <button
        type="button"
        className={`accion${escuchado ? " accion-activa" : ""}`}
        aria-pressed={escuchado}
        onClick={() => {
          if (escuchado) quitarEscuchado(video.slug);
          else {
            marcarEscuchado(video.slug, { serie: video.serie, fecha: video.fecha, dia: video.dia });
            mostrar("¡Bien! Sumado a tu progreso 🔥");
          }
        }}
      >
        <CircleCheck size={18} aria-hidden="true" />
        {escuchado ? "Escuchado" : "Ya lo escuché"}
      </button>
      <AnimatePresence>
        {aviso && (
          <motion.span
            className="accion-aviso"
            role="status"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Check size={14} aria-hidden="true" /> {aviso}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
