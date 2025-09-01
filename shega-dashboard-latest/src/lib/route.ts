// src/app/api/auth/login/route.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { backendFetch, BACKEND_URL } from '@/lib/backend';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.message || 'Login failed' },
        { status: res.status }
      );
    }

    const token: string | undefined = data?.token;
    if (!token) {
      return NextResponse.json(
        { error: 'Token missing from backend response' },
        { status: 500 }
      );
    }

    (await cookies()).set(process.env.JWT_COOKIE_NAME || 'shega_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ user: data?.user || null });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Unexpected error' },
      { status: 500 }
    );
  }
}
