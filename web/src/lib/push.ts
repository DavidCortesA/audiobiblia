import webpush, { type PushSubscription } from "web-push";
import { listarSuscripciones, quitarSuscripcion } from "./almacen";
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

/** Envía el aviso a todos los suscriptores y limpia los que ya no existen. */
export async function avisarATodos(aviso: Aviso) {
  const subs = await listarSuscripciones();
  let enviados = 0;
  let borrados = 0;
  await Promise.all(
    subs.map(async (sub: PushSubscription) => {
      try {
        await webpush.sendNotification(sub, JSON.stringify(aviso), { TTL: 60 * 60 * 12, urgency: "normal" });
        enviados++;
      } catch (e) {
        const estado = (e as { statusCode?: number }).statusCode;
        if (estado === 404 || estado === 410) {
          await quitarSuscripcion(sub.endpoint);
          borrados++;
        }
      }
    }),
  );
  return { suscriptores: subs.length, enviados, borrados };
}
