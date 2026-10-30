import { guardarPreferencias, HORAS_AVISO, type HoraAviso } from "@/lib/almacen";
import { esSerie, type Serie } from "@/lib/sitio";

/** Guarda qué series y a qué hora quiere el aviso este dispositivo. */
export async function POST(request: Request) {
  const cuerpo = (await request.json().catch(() => null)) as { endpoint?: string; series?: string[]; hora?: number } | null;
  const series = (cuerpo?.series ?? []).filter(esSerie) as Serie[];
  const hora = Number(cuerpo?.hora) as HoraAviso;
  if (!cuerpo?.endpoint || !series.length || !HORAS_AVISO.includes(hora)) {
    return Response.json({ error: "preferencias no válidas" }, { status: 400 });
  }
  const ok = await guardarPreferencias(cuerpo.endpoint, { series, hora });
  return ok ? Response.json({ ok: true }) : Response.json({ error: "suscripción no encontrada" }, { status: 404 });
}
