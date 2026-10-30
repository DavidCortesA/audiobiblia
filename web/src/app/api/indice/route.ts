import { getCatalogo } from "@/lib/datos";

/** Índice ligero de todo lo publicado, para el buscador (se filtra en el celular). */
export async function GET() {
  const { publicados } = await getCatalogo();
  const indice = publicados.map((v) => ({ s: v.slug, e: v.serie, l: v.lectura, f: v.fecha, d: v.dia, m: v.miniatura }));
  return Response.json(indice, { headers: { "Cache-Control": "public, max-age=300, s-maxage=300" } });
}
