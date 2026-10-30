import { notFound } from "next/navigation";
import { getVideo } from "@/lib/datos";
import { imagenVideo } from "@/lib/imagen";
import { esSerie } from "@/lib/sitio";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Audio Biblia · lectura del día";

/** Vista previa al compartir el enlace (WhatsApp, Facebook, mensajes). */
export default async function Imagen({ params }: { params: Promise<{ serie: string; slug: string }> }) {
  const { serie, slug } = await params;
  if (!esSerie(serie)) notFound();
  const datos = await getVideo(serie, slug);
  if (!datos) notFound();
  return imagenVideo(datos.video, size.width, size.height);
}
