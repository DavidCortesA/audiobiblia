import { getVideo } from "@/lib/datos";
import { imagenVideo } from "@/lib/imagen";
import { esSerie } from "@/lib/sitio";

/** Imagen vertical (1080×1350) para mandarla como foto o subirla a estados e historias. */
export async function GET(_request: Request, { params }: { params: Promise<{ serie: string; slug: string }> }) {
  const { serie, slug } = await params;
  if (!esSerie(serie)) return new Response("no encontrado", { status: 404 });
  const datos = await getVideo(serie, slug);
  if (!datos) return new Response("no encontrado", { status: 404 });
  const imagen = await imagenVideo(datos.video, 1080, 1350);
  const cabeceras = new Headers(imagen.headers);
  cabeceras.set("Content-Disposition", `inline; filename="audio-biblia-${slug}.png"`);
  cabeceras.set("Cache-Control", "public, max-age=86400, s-maxage=604800");
  return new Response(imagen.body, { headers: cabeceras });
}
