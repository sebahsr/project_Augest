// src/app/api/lang/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const { lang } = await request.json().catch(() => ({}));
  const value = lang === 'am' ? 'am' : 'en';
  (await cookies()).set('lang', value, { path: '/', maxAge: 60 * 60 * 24 * 365 });
  return NextResponse.json({ ok: true, lang: value });
}
