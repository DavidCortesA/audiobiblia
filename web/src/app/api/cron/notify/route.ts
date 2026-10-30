import { HORAS_AVISO, leerFeed, listarSuscriptores, marcarAvisados, yaAvisados, type HoraAviso } from "@/lib/almacen";
import { fechaLocal } from "@/lib/fechas";
import { avisarA_cada, pushConfigurado } from "@/lib/push";
import { SERIES } from "@/lib/sitio";

/**
 * Vercel Cron lo llama a las 6, 7 y 8 (vercel.json, ?hora=). A cada suscriptor de esa hora le
 * manda un solo aviso con los audios de hoy de las series que eligió.
 */
export async function GET(request: Request) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || request.headers.get("authorization") !== `Bearer ${secreto}`) {
    return Response.json({ error: "no autorizado" }, { status: 401 });
  }
  if (!pushConfigurado) return Response.json({ error: "faltan las llaves VAPID" }, { status: 500 });
  const hora = Number(new URL(request.url).searchParams.get("hora") ?? 6) as HoraAviso;
  if (!HORAS_AVISO.includes(hora)) return Response.json({ error: "hora no válida" }, { status: 400 });

  const ahora = Date.now();
  const hoy = fechaLocal(ahora);
  const avisados = await yaAvisados(hora);
  const nuevos = (await leerFeed()).filter((v) => v.fecha === hoy && Date.parse(v.publicar) <= ahora && !avisados.has(v.slug));
  if (!nuevos.length) return Response.json({ ok: true, hora, nuevos: 0 });

  const deEstaHora = (await listarSuscriptores()).filter((s) => s.hora === hora);
  const resultado = await avisarA_cada(deEstaHora, (s) => {
    const suyos = nuevos.filter((v) => s.series.includes(v.serie));
    if (!suyos.length) return null;
    const biblia = suyos.find((v) => v.serie === "biblia");
    return {
      title: biblia ? `Audio Biblia · Día ${biblia.dia}` : suyos.length === 1 ? SERIES[suyos[0].serie].nombre : "Audio Biblia",
      body: `Ya están los audios de hoy 🙏\n${suyos.map((v) => `${SERIES[v.serie].corto}: ${v.lectura}`).join("\n")}`,
      url: "/",
      tag: `audio-biblia-${hoy}`,
    };
  });
  await marcarAvisados(hora, nuevos.map((v) => v.slug));
  return Response.json({ ok: true, hora, nuevos: nuevos.length, ...resultado });
}
