export async function onRequestGet() {
  return new Response(
    JSON.stringify({ status: 'ok', timestamp: Date.now() }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      },
    }
  );
}
