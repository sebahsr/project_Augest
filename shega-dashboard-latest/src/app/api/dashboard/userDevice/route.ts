import 'server-only';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const API_BASE =
  process.env.API_BASE ?? process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3000/api'; // no trailing /api
const JWT_COOKIE = process.env.JWT_COOKIE_NAME ?? 'shega_token';

export async function POST() {
  try {
    // 1) cookies() is sync
    const token = (await cookies()).get(JWT_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ ok: false, message: 'Not authenticated' }, { status: 401 });
    }

    // 2) Use the correct HTTP method and full path
    const upstream = await fetch(`${API_BASE}/devices/getUserHouseByID`, {
      method: 'POST', // <-- match  Express route
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    const ct = upstream.headers.get('content-type') || '';
    const body = ct.includes('application/json') ? await upstream.json() : await upstream.text();

    if (!upstream.ok) {
      // Surface upstream status/message
      const message =
        typeof body === 'string' ? body : body?.message || 'Upstream error';
      return NextResponse.json(
        { ok: false, upstreamStatus: upstream.status, message },
        { status: upstream.status }
      );
    }
   console.log('Upstream response body:', body.ok);
    // Pass JSON through
    return NextResponse.json(body, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err?.message || 'Unexpected error' },
      { status: 500 }
    );
  }
}
