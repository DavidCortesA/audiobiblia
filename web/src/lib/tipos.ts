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
}

export interface Video extends VideoFeed {
  miniatura: string;
}
