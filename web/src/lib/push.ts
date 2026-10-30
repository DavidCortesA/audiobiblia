import webpush, { type PushSubscription } from "web-push";
import { quitarSuscripcion, type Suscriptor } from "./almacen";
import { SITIO } from "./sitio";

const publica = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privada = process.env.VAPID_PRIVATE_KEY;

export const pushConfigurado = Boolean(publica && privada);

if (publica && privada) {
  webpush.setVapidDetails(`mailto:${SITIO.contactoCorreo || "avisos@audiobiblia.vercel.app"}`, publica, privada);
}

export interface Aviso {
  title: string;
  body: string;
  url: string;
  tag?: string;
}

/** Envía un aviso a una sola suscripción. Devuelve si se entregó al servicio de notificaciones. */
export async function avisarA(sub: PushSubscription, aviso: Aviso) {
  if (!pushConfigurado) return false;
  try {
    await webpush.sendNotification(sub, JSON.stringify(aviso), { TTL: 60 * 60, urgency: "high" });
    return true;
  } catch (e) {
    console.error("[avisos] bienvenida falló", (e as { statusCode?: number; body?: string }).statusCode, (e as { body?: string }).body);
    return false;
  }
}

/** Envía a cada suscriptor su propio aviso (o ninguno) y limpia los que ya no existen. */
export async function avisarA_cada(suscriptores: Suscriptor[], armar: (s: Suscriptor) => Aviso | null) {
  let enviados = 0;
  let borrados = 0;
  await Promise.all(
    suscriptores.map(async (s) => {
      const aviso = armar(s);
      if (!aviso) return;
      try {
        await webpush.sendNotification(s.sub, JSON.stringify(aviso), { TTL: 60 * 60 * 12, urgency: "normal" });
        enviados++;
      } catch (e) {
        const estado = (e as { statusCode?: number }).statusCode;
        if (estado === 404 || estado === 410) {
          await quitarSuscripcion(s.sub.endpoint);
          borrados++;
        }
      }
    }),
  );
  return { suscriptores: suscriptores.length, enviados, borrados };
}
