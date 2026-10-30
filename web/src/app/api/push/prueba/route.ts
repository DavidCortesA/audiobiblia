import { listarSuscriptores } from "@/lib/almacen";
import { avisarA_cada, pushConfigurado } from "@/lib/push";

/** Manda un aviso de prueba a todos los suscriptores. Protegido con CRON_SECRET. */
export async function POST(request: Request) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || request.headers.get("authorization") !== `Bearer ${secreto}`) {
    return Response.json({ error: "no autorizado" }, { status: 401 });
  }
  if (!pushConfigurado) return Response.json({ error: "faltan las llaves VAPID" }, { status: 500 });
  const cuerpo = (await request.json().catch(() => ({}))) as { title?: string; body?: string };
  const resultado = await avisarA_cada(await listarSuscriptores(), () => ({
    title: cuerpo.title ?? "Audio Biblia · prueba",
    body: cuerpo.body ?? "Si ves este aviso, las notificaciones funcionan. 🙏",
    url: "/",
    tag: "prueba",
  }));
  return Response.json({ ok: true, ...resultado });
}
