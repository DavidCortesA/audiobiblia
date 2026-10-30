import { quitarSuscripcion } from "@/lib/almacen";

export async function POST(request: Request) {
  const cuerpo = (await request.json().catch(() => null)) as { endpoint?: string } | null;
  if (!cuerpo?.endpoint) return Response.json({ error: "falta endpoint" }, { status: 400 });
  await quitarSuscripcion(cuerpo.endpoint);
  return Response.json({ ok: true });
}
