import type { Serie } from "./sitio";

/** Un video tal como lo envía la Mac (data/estado.json → ./ab web-sync). */
export interface VideoFeed {
  slug: string;
  serie: Serie;
  fecha: string; // AAAA-MM-DD
  publicar: string; // ISO con zona horaria
  dia: number; // "Día N" del canal
  titulo: string;
  lectura: string; // "2 Samuel 21, Salmo 57:1-6, ..." · "Proverbios 31" · nombre de la historia (niños)
  descripcion: string;
  youtube: string | null;
  facebook: string | null; // ID del video en la página de Facebook elegida
  audio?: string | null; // URL del audio (Vercel Blob), solo de los últimos 60 días
}

export interface Video extends VideoFeed {
  miniatura: string;
}

/** Reflexión: video corto de la página de Facebook "Audio Biblia" sobre un versículo (lo envía la Mac). */
export interface Reflexion {
  slug: string; // "2026-09-12-proverbios-13-20"
  id: string; // ID del video en Facebook
  fecha: string; // AAAA-MM-DD
  publicado: string; // ISO
  cita: string; // "Proverbios 13:20"
  version: string | null; // "NTV", "RVR1960"
  texto: string; // el versículo
  duracion: number; // segundos
  url: string; // video en Facebook
  miniatura: string | null; // portada (copia en Vercel Blob)
}
