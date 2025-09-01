import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend';

export async function GET() {
  try {
   
    // Clear cookies (example: remove session token)
    const cookieStore = await cookies();
    await cookieStore.delete('shega_token');
    // Add more cookies to delete if needed
    return NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
function awaitcookies() {
    throw new Error('Function not implemented.');
}

