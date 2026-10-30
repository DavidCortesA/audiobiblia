import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getCatalogo } from "@/lib/datos";
import { LISTA_SERIES, SITIO } from "@/lib/sitio";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Se arma en cada visita (los datos ya vienen cacheados): así incluye lo que la Mac acaba de enviar.
  await connection();
  const { publicados, generado } = await getCatalogo();
  return [
    { url: SITIO.url, lastModified: generado, changeFrequency: "daily", priority: 1 },
    ...LISTA_SERIES.map((serie) => ({
      url: `${SITIO.url}/${serie}`,
      lastModified: publicados.find((v) => v.serie === serie)?.publicar ?? generado,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...publicados.map((v) => ({
      url: `${SITIO.url}/${v.serie}/${v.slug}`,
      lastModified: v.publicar,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    { url: `${SITIO.url}/buscar`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${SITIO.url}/privacidad`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITIO.url}/terminos`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
