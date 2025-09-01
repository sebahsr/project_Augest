// Server wrapper
import { cookies } from 'next/headers';
import LandingClient from './LandingClient';
import type { Role } from '@/types/iot';

type JwtPayload = { userId?: string; role?: Role; name?: string; email?: string; houseId?: string };

function decodeJwtPayload(token?: string): JwtPayload | null {
  if (!token) return null;
  const [, b64] = token.split('.');
  if (!b64) return null;
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  try {
    // ✅ runs on server, so Buffer is fine here
    return JSON.parse(Buffer.from(b64.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

export default async function Page() {
  const cookieStore = await cookies(); // server-only
  const token = cookieStore.get(process.env.JWT_COOKIE_NAME || 'shega_token')?.value;
  const user = decodeJwtPayload(token);
  const isLoggedIn = Boolean(user?.email && user?.role);

  return <LandingClient isLoggedIn={isLoggedIn} />;
}
