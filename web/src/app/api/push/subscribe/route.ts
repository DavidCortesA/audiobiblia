import type { PushSubscription } from "web-push";
import { guardarSuscripcion } from "@/lib/almacen";
import { avisarA } from "@/lib/push";

export async function POST(request: Request) {
  const sub = (await request.json().catch(() => null)) as PushSubscription | null;
  if (!sub?.endpoint?.startsWith("https://") || typeof sub.keys?.p256dh !== "string" || typeof sub.keys?.auth !== "string") {
    return Response.json({ error: "suscripción inválida" }, { status: 400 });
  }
  const limpia = { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } };
  await guardarSuscripcion(limpia);
  // Aviso de bienvenida: confirma en el momento que las notificaciones llegan a este dispositivo.
  const bienvenida = await avisarA(limpia, {
    title: "¡Avisos activados! 🙏",
    body: "Cada mañana a las 6:00 te avisaremos cuando salgan los audios del día.",
    url: "/",
    tag: "bienvenida",
  });
  return Response.json({ ok: true, bienvenida });
}
