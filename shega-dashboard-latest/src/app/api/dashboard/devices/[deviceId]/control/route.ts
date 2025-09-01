import 'server-only';
import { cookies } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000/api';
const JWT_COOKIE = process.env.JWT_COOKIE_NAME || 'shega_token';

export async function POST(req: Request, ctx: { params: Promise<{ deviceId: string }> }) {
  const body = await req.json().catch(() => ({}));
  const token = (await cookies()).get(JWT_COOKIE)?.value; // <- no await
  const { deviceId } = await ctx.params;          // <- await the object

  console.log(`[control] Routing device ${deviceId} to upstream`);
  const upstream = await fetch(
    `${API_BASE}/dashboard/devices/${encodeURIComponent(deviceId)}/control`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }
  );

  const text = await upstream.text().catch(() => '');
  return new Response(text, {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') || 'application/json' },
  });
}
