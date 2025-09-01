// src/lib/backend.ts
export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/api';
export const COOKIE_NAME = process.env.JWT_COOKIE_NAME || 'shega_token';

export const AUTH_LOGIN_PATH =
  process.env.NEXT_PUBLIC_AUTH_LOGIN_PATH || '/auth/login';

// UPDATED defaults to match  backend structure (/api/devices, /api/devices/mine, /api/auth/me)
export const DEVICE_LIST_ME =
  process.env.NEXT_PUBLIC_DEVICE_LIST_ME || '/devices/mine';
export const DEVICE_LIST_ADMIN =
  process.env.NEXT_PUBLIC_DEVICE_LIST_ADMIN || '/devices';

export async function backendFetch<T = any>(
  path: string,
  init: RequestInit = {},
  token?: string
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${BACKEND_URL}${path}`, { ...init, headers, cache: 'no-store' });

  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      msg = data?.message || data?.error || msg;
    } catch {}
    throw new Error(msg);
  }
  try {
    return (await res.json()) as T;
  } catch {
    return undefined as T;
  }
}

export async function tryBackendFetch<T = any>(
  paths: string[],
  init: RequestInit = {},
  token?: string
): Promise<T> {
  let lastStatus = 0;
  let lastText = '';
  for (const path of paths) {
    try {
      const headers = new Headers(init.headers);
      if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
      if (token) headers.set('Authorization', `Bearer ${token}`);

      const res = await fetch(`${BACKEND_URL}${path}`, { ...init, headers, cache: 'no-store' });
      if (res.ok) {
        try {
          return (await res.json()) as T;
        } catch {
          return undefined as T;
        }
      }
      lastStatus = res.status;
      lastText = await res.text().catch(() => res.statusText);
    } catch (e: any) {
      lastText = e?.message || String(e);
    }
  }
  throw new Error(`All endpoints failed (${lastStatus}). Tried: ${paths.join(', ')}. Last: ${lastText}`);
}
