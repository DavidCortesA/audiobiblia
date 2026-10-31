export const SITIO = {
  nombre: "Audio Biblia",
  nombreLargo: "Audio Biblia · Castillo del Rey",
  iglesia: "Castillo del Rey, A.R.",
  congregacion: "Iglesia Montaña de Dios",
  ciudad: "Monterrey, México",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://audiobiblia.vercel.app").replace(/\/$/, ""),
  descripcion:
    "La Biblia en audio para cada mañana: lectura diaria, Proverbios del día y Audio Biblia para niños. Nuevo audio a las 6:00 AM.",
  zonaHoraria: "America/Monterrey",
  canalYoutube: "https://www.youtube.com/channel/UCJaQSWBy330FBq-bJTjzaPg",
  canalYoutubeId: "UCJaQSWBy330FBq-bJTjzaPg",
  /** Búsqueda dentro del canal, para "ver todos en YouTube". */
  buscarEnYoutube: (texto: string) =>
    `https://www.youtube.com/channel/UCJaQSWBy330FBq-bJTjzaPg/search?query=${encodeURIComponent(texto)}`,
  facebook: {
    nombre: "Montaña De Dios",
    paginaId: process.env.NEXT_PUBLIC_FACEBOOK_PAGE_ID ?? "590229140997160",
  },
  contactoCorreo: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "castillodelreymdd@gmail.com",
};

/** Reflexiones: videos cortos de la página de Facebook "Audio Biblia" (no son una serie diaria). */
export const REFLEXIONES = {
  nombre: "Reflexiones",
  tituloSeo: "Reflexiones de Proverbios — un versículo para tu semana",
  descripcion: "Un versículo de la Biblia y una reflexión corta para llevarlo a tu vida, en video.",
  paginaFacebook: "Audio Biblia",
  paginaFacebookId: "107267775564067",
};

export const SERIES = {
  biblia: {
    nombre: "Audio Biblia",
    corto: "Biblia",
    tituloSeo: "La Biblia en un año en audio — lectura diaria",
    busquedaYoutube: "Audio Biblia Día",
    descripcion:
      "Un plan para leer la Biblia en un año: Antiguo Testamento, Salmos, Proverbios y Nuevo Testamento, cada día.",
  },
  proverbios: {
    nombre: "Proverbios del día",
    corto: "Proverbios",
    tituloSeo: "Proverbios del día en audio — un capítulo cada día",
    busquedaYoutube: "Audio Biblia Proverbios",
    descripcion: "Un capítulo de Proverbios por cada día del mes: sabiduría para las decisiones de hoy.",
  },
  ninos: {
    nombre: "Audio Biblia Niños",
    corto: "Niños",
    tituloSeo: "Audio Biblia para niños — historias bíblicas diarias",
    busquedaYoutube: "Audio Biblia Niños",
    descripcion: "Historias de la Biblia para los más pequeños, para escuchar en familia cada mañana.",
  },
} as const;

export type Serie = keyof typeof SERIES;
export const LISTA_SERIES = Object.keys(SERIES) as Serie[];

export function esSerie(valor: string): valor is Serie {
  return valor in SERIES;
}
