import { getCatalogo, getTranscripciones, plano } from "@/lib/datos";

const MAX = 30;

/** Busca palabras dentro de las historias de Niños (?q=judas). Devuelve el slug y un fragmento del texto. */
export async function GET(request: Request) {
  const consulta = plano(new URL(request.url).searchParams.get("q") ?? "")
    .replace(/[^a-z0-9ñ]+/g, " ")
    .trim();
  const tokens = consulta.split(" ").filter((t) => t.length >= 3);
  if (!tokens.length) return Response.json([]);

  const [textos, { publicados }] = await Promise.all([getTranscripciones(), getCatalogo()]);
  // Cada palabra, al inicio de una palabra del texto ("judas" encuentra "Judas"; "sacerdote" encuentra "sacerdotes").
  const patrones = tokens.map((t) => new RegExp(`(^|[^a-z0-9ñ])${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  const resultados = [];
  for (const v of publicados) {
    if (v.serie !== "ninos" || !v.youtube || !textos[v.youtube]) continue;
    const texto = textos[v.youtube];
    const llano = plano(texto);
    if (!patrones.every((p) => p.test(llano))) continue;
    const m = llano.match(patrones[0])!;
    const i = (m.index ?? 0) + m[1].length;
    const desde = Math.max(0, texto.lastIndexOf(" ", Math.max(0, i - 70)));
    const hasta = texto.indexOf(" ", Math.min(texto.length, i + 110));
    const fragmento = `${desde > 0 ? "…" : ""}${texto.slice(desde, hasta === -1 ? undefined : hasta).replace(/\s+/g, " ").trim()}${hasta === -1 ? "" : "…"}`;
    resultados.push({ s: v.slug, fragmento });
    if (resultados.length >= MAX) break;
  }
  return Response.json(resultados, { headers: { "Cache-Control": "public, max-age=300, s-maxage=300" } });
}
