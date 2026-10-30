/** El celular reporta aquí si no pudo activar los avisos (queda en los registros de Vercel). */
export async function POST(request: Request) {
  const datos = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  console.error("[avisos] no se pudo activar", {
    paso: String(datos.paso ?? "").slice(0, 60),
    error: String(datos.error ?? "").slice(0, 300),
    permiso: String(datos.permiso ?? ""),
    instalada: Boolean(datos.instalada),
    agente: (request.headers.get("user-agent") ?? "").slice(0, 200),
  });
  return Response.json({ ok: true });
}
