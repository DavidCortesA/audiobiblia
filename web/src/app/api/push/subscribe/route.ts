import type { PushSubscription } from "web-push";
import { guardarSuscripcion } from "@/lib/almacen";

export async function POST(request: Request) {
  const sub = (await request.json().catch(() => null)) as PushSubscription | null;
  if (!sub?.endpoint?.startsWith("https://") || typeof sub.keys?.p256dh !== "string" || typeof sub.keys?.auth !== "string") {
    return Response.json({ error: "suscripción inválida" }, { status: 400 });
  }
  await guardarSuscripcion({ endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } });
  return Response.json({ ok: true });
}
