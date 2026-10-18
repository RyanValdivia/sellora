/** Wallet envía aquí sus errores de actualización. Los dejamos en el log del servidor (sin datos de clientes). */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { logs?: unknown } | null;
  if (Array.isArray(body?.logs)) {
    for (const line of body.logs.slice(0, 20)) console.warn("[wallet-log]", String(line).slice(0, 300));
  }
  return new Response(null, { status: 200 });
}
