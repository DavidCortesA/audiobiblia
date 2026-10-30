import { leerFeed, marcarAvisados, yaAvisados } from "@/lib/almacen";
import { fechaLocal, sumarDias } from "@/lib/fechas";
import { avisarATodos, pushConfigurado } from "@/lib/push";
import { SERIES } from "@/lib/sitio";

/**
 * Vercel Cron lo llama cada mañana (vercel.json). Manda un solo aviso con los audios
 * que ya se publicaron y que aún no se habían avisado.
 */
export async function GET(request: Request) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || request.headers.get("authorization") !== `Bearer ${secreto}`) {
    return Response.json({ error: "no autorizado" }, { status: 401 });
  }
  if (!pushConfigurado) return Response.json({ error: "faltan las llaves VAPID" }, { status: 500 });

  const ahora = Date.now();
  const desde = sumarDias(fechaLocal(ahora), -1);
  const avisados = await yaAvisados();
  const nuevos = (await leerFeed()).filter(
    (v) => Date.parse(v.publicar) <= ahora && v.fecha >= desde && !avisados.has(v.slug),
  );
  if (!nuevos.length) return Response.json({ ok: true, nuevos: 0 });

  const biblia = nuevos.find((v) => v.serie === "biblia");
  const lineas = nuevos.map((v) => `${SERIES[v.serie].corto}: ${v.lectura}`);
  const resultado = await avisarATodos({
    title: biblia ? `Audio Biblia · Día ${biblia.dia}` : "Nuevo audio de la Biblia",
    body: `Ya están los audios de hoy 🙏\n${lineas.join("\n")}`,
    url: "/",
    tag: `audio-biblia-${nuevos[0].fecha}`,
  });
  await marcarAvisados(nuevos.map((v) => v.slug));
  return Response.json({ ok: true, nuevos: nuevos.length, ...resultado });
}
