// src/app/api/devices/[id]/control/route.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/backend';

const COOKIE = process.env.JWT_COOKIE_NAME || 'shega_token';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const res = await fetch(`${BACKEND_URL}/devices/${params.id}/control`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
