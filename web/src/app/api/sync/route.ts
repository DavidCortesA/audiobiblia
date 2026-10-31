import { revalidateTag } from "next/cache";
import { guardarArchivo, guardarFeed, guardarReflexiones, guardarTranscripciones } from "@/lib/almacen";
import { esSerie } from "@/lib/sitio";
import type { Reflexion, VideoFeed } from "@/lib/tipos";

/**
 * La Mac envía aquí el calendario, el archivo del canal y las reflexiones (`./ab web-sync`).
 * Protegido con SYNC_TOKEN. Las reflexiones solo se reemplazan si vienen en el envío; las transcripciones
 * de Niños ({id de YouTube: texto}) se agregan a las que ya hay.
 */
export async function POST(request: Request) {
  const token = process.env.SYNC_TOKEN;
  if (!token || request.headers.get("authorization") !== `Bearer ${token}`) {
    return Response.json({ error: "no autorizado" }, { status: 401 });
  }
  const cuerpo = (await request.json().catch(() => null)) as {
    videos?: VideoFeed[];
    archivo?: VideoFeed[];
    reflexiones?: Reflexion[];
    transcripciones?: Record<string, string>;
  } | null;
  const valido = (v: VideoFeed) =>
    v && typeof v.slug === "string" && esSerie(v.serie) && !Number.isNaN(Date.parse(v.publicar));
  const videos = (cuerpo?.videos ?? []).filter(valido);
  const archivo = (cuerpo?.archivo ?? []).filter(valido);
  const reflexiones = Array.isArray(cuerpo?.reflexiones)
    ? cuerpo.reflexiones.filter((r) => r && typeof r.slug === "string" && typeof r.id === "string" && typeof r.url === "string")
    : null;
  const transcripciones = Object.fromEntries(
    Object.entries(cuerpo?.transcripciones ?? {}).filter(([id, texto]) => /^[\w-]{6,20}$/.test(id) && typeof texto === "string" && texto.length < 60000),
  );
  const hayTranscripciones = Object.keys(transcripciones).length > 0;
  if (!videos.length && !archivo.length && !reflexiones && !hayTranscripciones) return Response.json({ error: "sin videos válidos" }, { status: 400 });

  if (videos.length) await guardarFeed(videos);
  if (archivo.length) await guardarArchivo(archivo);
  if (reflexiones) await guardarReflexiones(reflexiones);
  if (hayTranscripciones) {
    await guardarTranscripciones(transcripciones);
    revalidateTag("transcripciones", { expire: 0 });
  }
  if (videos.length || archivo.length || reflexiones) revalidateTag("videos", { expire: 0 });
  return Response.json({
    ok: true,
    videos: videos.length,
    archivo: archivo.length,
    ...(reflexiones ? { reflexiones: reflexiones.length } : {}),
    ...(hayTranscripciones ? { transcripciones: Object.keys(transcripciones).length } : {}),
  });
}
