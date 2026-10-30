"use client";

import { Check, Heart, Share2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { alternarFavorito, esFavorito, escucharFavoritos, type Favorito } from "@/lib/favoritos";
import { SERIES, SITIO } from "@/lib/sitio";

type DatosVideo = Omit<Favorito, "guardado">;

/** Guardar en favoritos y compartir. `tema` según el fondo: claro u oscuro. */
export function AccionesVideo({ video, tema = "claro" }: { video: DatosVideo; tema?: "claro" | "oscuro" }) {
  const [guardado, setGuardado] = useState(false);
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    const revisar = () => setGuardado(esFavorito(video.slug));
    revisar();
    return escucharFavoritos(revisar);
  }, [video.slug]);

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
