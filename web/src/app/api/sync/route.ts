import { revalidateTag } from "next/cache";
import { guardarArchivo, guardarFeed } from "@/lib/almacen";
import { esSerie } from "@/lib/sitio";
import type { VideoFeed } from "@/lib/tipos";

/** La Mac envía aquí el calendario y el archivo del canal (`./ab web-sync`). Protegido con SYNC_TOKEN. */
export async function POST(request: Request) {
  const token = process.env.SYNC_TOKEN;
  if (!token || request.headers.get("authorization") !== `Bearer ${token}`) {
    return Response.json({ error: "no autorizado" }, { status: 401 });
  }
  const cuerpo = (await request.json().catch(() => null)) as { videos?: VideoFeed[]; archivo?: VideoFeed[] } | null;
  const valido = (v: VideoFeed) =>
    v && typeof v.slug === "string" && esSerie(v.serie) && !Number.isNaN(Date.parse(v.publicar));
  const videos = (cuerpo?.videos ?? []).filter(valido);
  const archivo = (cuerpo?.archivo ?? []).filter(valido);
  if (!videos.length && !archivo.length) return Response.json({ error: "sin videos válidos" }, { status: 400 });

  if (videos.length) await guardarFeed(videos);
  if (archivo.length) await guardarArchivo(archivo);
  revalidateTag("videos", { expire: 0 });
  return Response.json({ ok: true, videos: videos.length, archivo: archivo.length });
}
