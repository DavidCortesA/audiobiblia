/**
 * Almacenamiento: Upstash Redis en producción (Vercel → Storage → Upstash).
 * Sin credenciales de Redis (desarrollo local) usa archivos en web/.local/.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { Redis } from "@upstash/redis";
import type { PushSubscription } from "web-push";
import { LISTA_SERIES, type Serie } from "./sitio";
import type { VideoFeed } from "./tipos";

const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

const LOCAL = path.join(process.cwd(), ".local");

async function leerLocal<T>(nombre: string, porDefecto: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(path.join(LOCAL, nombre), "utf8")) as T;
  } catch {
    return porDefecto;
  }
}

async function guardarLocal(nombre: string, datos: unknown) {
  await fs.mkdir(LOCAL, { recursive: true });
  await fs.writeFile(path.join(LOCAL, nombre), JSON.stringify(datos, null, 2));
}

// ---------- calendario de videos (lo envía la Mac con `./ab web-sync`) ----------

export async function leerFeed(): Promise<VideoFeed[]> {
  if (redis) return (await redis.get<VideoFeed[]>("feed")) ?? [];
  return leerLocal<VideoFeed[]>("feed.json", []);
}

export async function guardarFeed(videos: VideoFeed[]) {
  if (redis) await redis.set("feed", videos);
  else await guardarLocal("feed.json", videos);
}

// ---------- archivo: lo ya publicado del año (Biblia, Niños) y los 31 Proverbios ----------

export async function leerArchivo(): Promise<VideoFeed[]> {
  if (redis) return (await redis.get<VideoFeed[]>("archivo")) ?? [];
  return leerLocal<VideoFeed[]>("archivo.json", []);
}

export async function guardarArchivo(videos: VideoFeed[]) {
  if (redis) await redis.set("archivo", videos);
  else await guardarLocal("archivo.json", videos);
}

// ---------- suscripciones a notificaciones (con sus preferencias) ----------

export const HORAS_AVISO = [6, 7, 8] as const;
export type HoraAviso = (typeof HORAS_AVISO)[number];

export interface Suscriptor {
  sub: PushSubscription;
  series: Serie[];
  hora: HoraAviso;
}

const PREFERENCIAS_INICIALES = { series: [...LISTA_SERIES], hora: 6 as HoraAviso };

/** Los primeros suscriptores se guardaron sin preferencias: se completan con las de siempre. */
function normalizar(valor: unknown): Suscriptor {
  const v = (typeof valor === "string" ? JSON.parse(valor) : valor) as Partial<Suscriptor> & Partial<PushSubscription>;
  if (v.sub) return { ...PREFERENCIAS_INICIALES, ...v } as Suscriptor;
  return { sub: v as PushSubscription, ...PREFERENCIAS_INICIALES };
}

async function leerTodos(): Promise<Record<string, Suscriptor>> {
  const crudo = redis
    ? ((await redis.hgetall<Record<string, unknown>>("suscripciones")) ?? {})
    : await leerLocal<Record<string, unknown>>("suscripciones.json", {});
  return Object.fromEntries(Object.entries(crudo).map(([k, v]) => [k, normalizar(v)]));
}

async function escribir(s: Suscriptor) {
  if (redis) {
    await redis.hset("suscripciones", { [s.sub.endpoint]: JSON.stringify(s) });
    return;
  }
  const todos = await leerLocal<Record<string, Suscriptor>>("suscripciones.json", {});
  todos[s.sub.endpoint] = s;
  await guardarLocal("suscripciones.json", todos);
}

export async function guardarSuscripcion(sub: PushSubscription, prefs?: Partial<Pick<Suscriptor, "series" | "hora">>) {
  const actual = (await leerTodos())[sub.endpoint];
  await escribir({ ...PREFERENCIAS_INICIALES, ...actual, ...prefs, sub });
}

/** Cambia series/hora de una suscripción existente. Devuelve false si no existe. */
export async function guardarPreferencias(endpoint: string, prefs: Pick<Suscriptor, "series" | "hora">) {
  const actual = (await leerTodos())[endpoint];
  if (!actual) return false;
  await escribir({ ...actual, ...prefs });
  return true;
}

export async function quitarSuscripcion(endpoint: string) {
  if (redis) {
    await redis.hdel("suscripciones", endpoint);
    return;
  }
  const todos = await leerLocal<Record<string, unknown>>("suscripciones.json", {});
  delete todos[endpoint];
  await guardarLocal("suscripciones.json", todos);
}

export async function listarSuscriptores(): Promise<Suscriptor[]> {
  return Object.values(await leerTodos());
}

// ---------- videos ya avisados por hora (para no notificar dos veces) ----------

export async function yaAvisados(hora: HoraAviso): Promise<Set<string>> {
  if (redis) return new Set<string>((await redis.smembers<string[]>(`avisados:${hora}`)) ?? []);
  return new Set(await leerLocal<string[]>(`avisados-${hora}.json`, []));
}

export async function marcarAvisados(hora: HoraAviso, ids: string[]) {
  if (!ids.length) return;
  if (redis) {
    await redis.sadd(`avisados:${hora}`, ids[0], ...ids.slice(1));
    return;
  }
  const actuales = await yaAvisados(hora);
  ids.forEach((id) => actuales.add(id));
  await guardarLocal(`avisados-${hora}.json`, [...actuales]);
}
