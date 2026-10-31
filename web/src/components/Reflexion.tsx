"use client";

import { Check, Play, Share2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
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
