/**
 * Almacenamiento: Upstash Redis en producción (Vercel → Storage → Upstash).
 * Sin credenciales de Redis (desarrollo local) usa archivos en web/.local/.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { Redis } from "@upstash/redis";
import type { PushSubscription } from "web-push";
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

// ---------- suscripciones a notificaciones ----------

export async function guardarSuscripcion(sub: PushSubscription) {
  if (redis) {
    await redis.hset("suscripciones", { [sub.endpoint]: JSON.stringify(sub) });
    return;
  }
  const subs = await leerLocal<Record<string, PushSubscription>>("suscripciones.json", {});
  subs[sub.endpoint] = sub;
  await guardarLocal("suscripciones.json", subs);
}

export async function quitarSuscripcion(endpoint: string) {
  if (redis) {
    await redis.hdel("suscripciones", endpoint);
    return;
  }
  const subs = await leerLocal<Record<string, PushSubscription>>("suscripciones.json", {});
  delete subs[endpoint];
  await guardarLocal("suscripciones.json", subs);
}

export async function listarSuscripciones(): Promise<PushSubscription[]> {
  if (redis) {
    const todas = (await redis.hgetall<Record<string, PushSubscription | string>>("suscripciones")) ?? {};
    return Object.values(todas).map((s) => (typeof s === "string" ? (JSON.parse(s) as PushSubscription) : s));
  }
  return Object.values(await leerLocal<Record<string, PushSubscription>>("suscripciones.json", {}));
}

// ---------- videos ya avisados (para no notificar dos veces) ----------

export async function yaAvisados(): Promise<Set<string>> {
  if (redis) return new Set<string>((await redis.smembers<string[]>("avisados")) ?? []);
  return new Set(await leerLocal<string[]>("avisados.json", []));
}

export async function marcarAvisados(ids: string[]) {
  if (!ids.length) return;
  if (redis) {
    await redis.sadd("avisados", ids[0], ...ids.slice(1));
    return;
  }
  const actuales = await yaAvisados();
  ids.forEach((id) => actuales.add(id));
  await guardarLocal("avisados.json", [...actuales]);
}
