// src/app/api/auth/login/route.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { backendFetch, BACKEND_URL } from '@/lib/backend';
import type { User } from '@/types/users';
// Define the User type according to  backend response structure

export async function POST(req: Request) {
  try {
    console.log('Get Users request received');
    const res = await fetch(`${BACKEND_URL}/auth/getUsers`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
      console.log('Get Users response:', res.status, res.statusText);
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.message || 'Get Users failed' },
        { status: res.status }
      );
    }

    const users: User[] | undefined = data?.users;
    if (!users  || !Array.isArray(users)        || users.length === 0      ) {
      return NextResponse.json(
        { error: 'Users  missing from backend response' },
        { status: 500 }
      );
    }

    const token = data?.token;
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
