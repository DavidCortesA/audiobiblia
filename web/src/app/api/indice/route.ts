import { getCatalogo, getReflexiones } from "@/lib/datos";

/** Índice ligero de todo lo publicado (audios y reflexiones), para el buscador (se filtra en el celular). */
export async function GET() {
  const [{ publicados }, reflexiones] = await Promise.all([getCatalogo(), getReflexiones()]);
  const indice = [
    ...publicados.map((v) => ({ s: v.slug, e: v.serie, l: v.lectura, f: v.fecha, d: v.dia, m: v.miniatura })),
    ...reflexiones.map((r) => ({ s: r.slug, e: "reflexiones", l: r.cita, t: r.texto, f: r.fecha, d: 0, m: r.miniatura ?? "/img/amanecer-1200.jpg" })),
  ];
  return Response.json(indice, { headers: { "Cache-Control": "public, max-age=300, s-maxage=300" } });
}
