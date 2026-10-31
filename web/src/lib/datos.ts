import { cacheLife, cacheTag } from "next/cache";
import { XMLParser } from "fast-xml-parser";
import { leerArchivo, leerFeed, leerReflexiones } from "./almacen";
import { fechaLocal, sumarDias } from "./fechas";
import { SITIO, type Serie } from "./sitio";
import type { Reflexion, Video, VideoFeed } from "./tipos";

const DIAS_PROXIMOS = 5;

export interface Catalogo {
  /** Ya públicos, del más reciente al más viejo. */
  publicados: Video[];
  /** Programados para los próximos días (aún no públicos), en orden. */
  proximos: Video[];
  /** Fecha (Monterrey) en que se generó, AAAA-MM-DD. */
  hoy: string;
  generado: string;
}

/**
 * Todo el contenido del sitio. Se cachea un minuto: así un video programado para las 6:00
 * aparece en la página poco después de esa hora, sin volver a publicar el sitio.
 */
export async function getCatalogo(): Promise<Catalogo> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 60, expire: 3600 });
  cacheTag("videos");

  const [feed, archivo, rss] = await Promise.all([leerFeed(), leerArchivo(), leerRss()]);
  // Si un video viene de varias fuentes gana el calendario (trae Facebook y la descripción personalizada).
  const vistos = new Set<string>();
  const unicos = [...feed, ...archivo, ...rss].filter((v) => {
    if (!v.youtube) return true;
    if (vistos.has(v.youtube)) return false;
    vistos.add(v.youtube);
    return true;
  });
  const todos: Video[] = unicos.map((v) => ({
    ...v,
    miniatura: v.youtube ? `https://i.ytimg.com/vi/${v.youtube}/hqdefault.jpg` : "/img/amanecer-1200.jpg",
  }));

  const ahora = Date.now();
  const hoy = fechaLocal(ahora);
  const limite = sumarDias(hoy, DIAS_PROXIMOS);
  const orden = (a: Video, b: Video) => a.publicar.localeCompare(b.publicar) || ordenSerie(a.serie) - ordenSerie(b.serie);

  return {
    publicados: todos.filter((v) => v.youtube && Date.parse(v.publicar) <= ahora).sort((a, b) => orden(b, a)),
    proximos: todos.filter((v) => Date.parse(v.publicar) > ahora && v.fecha <= limite).sort(orden),
    hoy,
    generado: new Date(ahora).toISOString(),
  };
}

export function ordenSerie(serie: Serie) {
  return ["biblia", "proverbios", "ninos"].indexOf(serie);
}

/** Los videos del día más reciente que ya tiene algo publicado. */
export function ultimoDia(publicados: Video[]) {
  const fecha = publicados[0]?.fecha;
  return publicados.filter((v) => v.fecha === fecha).sort((a, b) => ordenSerie(a.serie) - ordenSerie(b.serie));
}

/** Biblia y Niños: un video por cada "Día N" del año en curso (el más reciente), del día mayor al menor. */
export function delAnio(publicados: Video[], serie: Serie, hoy: string) {
  const anio = hoy.slice(0, 4);
  const porDia = new Map<number, Video>();
  for (const v of publicados) {
    if (v.serie === serie && v.fecha.startsWith(anio) && !porDia.has(v.dia)) porDia.set(v.dia, v);
  }
  return [...porDia.values()].sort((a, b) => b.dia - a.dia || b.publicar.localeCompare(a.publicar));
}

export function capituloProverbios(v: Video) {
  return Number(v.lectura.match(/(\d+)\s*$/)?.[1] ?? 0);
}

/** Proverbios 1 al 31: de cada capítulo, la versión más reciente. */
export function proverbiosDelMes(publicados: Video[]) {
  const porCapitulo = new Map<number, Video>();
  for (const v of publicados) {
    const c = capituloProverbios(v);
    if (v.serie === "proverbios" && c >= 1 && c <= 31 && !porCapitulo.has(c)) porCapitulo.set(c, v);
  }
  return [...porCapitulo.entries()].sort((a, b) => a[0] - b[0]).map(([capitulo, video]) => ({ capitulo, video }));
}

export async function getVideo(serie: Serie, slug: string) {
  const { publicados } = await getCatalogo();
  const lista = publicados.filter((v) => v.serie === serie);
  const i = lista.findIndex((v) => v.slug === slug);
  if (i === -1) return null;
  return { video: lista[i], anterior: lista[i + 1] ?? null, siguiente: lista[i - 1] ?? null };
}

// ---------- reflexiones ----------

/** Reflexiones de la página de Facebook, de la más nueva a la más vieja. */
export async function getReflexiones(): Promise<Reflexion[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 60, expire: 3600 });
  cacheTag("videos");
  const lista = await leerReflexiones();
  return [...lista].sort((a, b) => b.publicado.localeCompare(a.publicado));
}

export async function getReflexion(slug: string) {
  const lista = await getReflexiones();
  const i = lista.findIndex((r) => r.slug === slug);
  if (i === -1) return null;
  return { reflexion: lista[i], anterior: lista[i + 1] ?? null, siguiente: lista[i - 1] ?? null };
}

/** "Proverbios 13:20" → 13 (para enlazar el capítulo completo en audio). */
export function capituloDeCita(cita: string) {
  const m = cita.match(/^Proverbios\s+(\d+)/i);
  return m ? Number(m[1]) : null;
}

// ---------- feed público del canal (por si se sube algo a mano) ----------

const RE_NINOS = /Ni[ñn]os\s+(?:D[iíì]a\s*)?(\d+)\s*[-–.:]?\s*(.*)/i;
const RE_PROVERBIOS = /^Audio\s*Biblias?\s*[-–:]?\s*(Proverbios\s+\d+)\s*$/i;
const RE_BIBLIA = /^Audio\s*Biblias?\s+(?:D[iíì]a\s*)?(\d+)\s*[-–.:]?\s*(.+)$/i;

async function leerRss(): Promise<VideoFeed[]> {
  try {
    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${SITIO.canalYoutubeId}`);
    if (!res.ok) return [];
    const xml = new XMLParser({ ignoreAttributes: true }).parse(await res.text());
    const entradas = [xml?.feed?.entry ?? []].flat();
    return entradas.flatMap((e): VideoFeed[] => {
      const titulo = String(e.title ?? "").normalize("NFC").replace(/\s+/g, " ").trim();
      const id = String(e["yt:videoId"] ?? "");
      const publicar = String(e.published ?? "");
      if (!id || !publicar) return [];
      const base = {
        slug: `yt-${id}`,
        fecha: fechaLocal(publicar),
        publicar,
        titulo,
        descripcion: String(e["media:group"]?.["media:description"] ?? ""),
        youtube: id,
        facebook: null,
      };
      let m;
      if ((m = titulo.match(RE_NINOS))) return [{ ...base, serie: "ninos", dia: Number(m[1]), lectura: m[2] }];
      if ((m = titulo.match(RE_PROVERBIOS))) return [{ ...base, serie: "proverbios", dia: 0, lectura: m[1] }];
      if ((m = titulo.match(RE_BIBLIA)) && /\d/.test(m[2]))
        return [{ ...base, serie: "biblia", dia: Number(m[1]), lectura: m[2].trim() }];
      return [];
    });
  } catch {
    return [];
  }
}

/** "1 Reyes 7, Salmo 62:1-4, Proverbios 27:13-14, Juan 11:1-37" → ["1 Reyes 7", "Juan 11:1-37"] */
export function partesLectura(lectura: string): [string, string | null] {
  const partes = lectura
    .replace(/\(.*?\)|\[.*?\]/g, "")
    .split(/,\s*|\s+y\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (partes.length < 2) return [lectura, null];
  // El AT es todo lo que va antes del Salmo: "2 Samuel 8 y 9" o "2 Samuel 2, 3:1"
  const antesDelSalmo = lectura.replace(/\(.*?\)|\[.*?\]/g, "").split(/,\s*Salmos?\b/i)[0].trim();
  let inicioNt = 0;
  partes.forEach((p, i) => {
    if (/^(?:[123]\s*)?\p{L}/u.test(p)) inicioNt = i;
  });
  return [antesDelSalmo || partes[0], partes.slice(inicioNt).join(", ")];
}
