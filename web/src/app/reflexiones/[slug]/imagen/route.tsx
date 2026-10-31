import { getReflexion } from "@/lib/datos";
import { FONDOS_REFLEXION, FORMATOS_REFLEXION, imagenReflexion, type FondoReflexion, type FormatoReflexion } from "@/lib/imagen";

/** Imagen del versículo: ?formato=vertical (1080×1350) | cuadrada (1080×1080) | horizontal (1920×1080) y ?fondo=amanecer | nubes. */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const datos = await getReflexion(slug);
  if (!datos) return new Response("no encontrado", { status: 404 });
  const pedido = new URL(request.url).searchParams;
  const formato = (pedido.get("formato") ?? "vertical") as FormatoReflexion;
  const fondo = (pedido.get("fondo") ?? "amanecer") as FondoReflexion;
  if (!(formato in FORMATOS_REFLEXION) || !(fondo in FONDOS_REFLEXION)) return new Response("formato o fondo no válido", { status: 400 });

  const imagen = await imagenReflexion(datos.reflexion, formato, fondo);
  const cabeceras = new Headers(imagen.headers);
  cabeceras.set("Content-Disposition", `inline; filename="reflexion-${slug}-${formato}.png"`);
  cabeceras.set("Cache-Control", "public, max-age=86400, s-maxage=604800");
  return new Response(imagen.body, { headers: cabeceras });
}
