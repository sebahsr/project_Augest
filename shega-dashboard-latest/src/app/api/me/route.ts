// src/app/api/me/route.ts  (optional helper to get current user from backend)
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend';

export async function GET() {
  try {
    const token = (await cookies()).get(process.env.JWT_COOKIE_NAME || 'shega_token')?.value;
    if (!token) return NextResponse.json({ user: null }, { status: 401 });
    const user = await backendFetch('/users/me', {}, token);
    return NextResponse.json({ user });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
