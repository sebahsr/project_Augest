// src/lib/api/dashboard.server.ts
import 'server-only';
import { cookies } from 'next/headers';
import type { HomesResponse, HomeDetail } from '@/types/iot';

const API_BASE = process.env.API_BASE ?? 'http://127.0.0.1:3000'; // 👈 force IPv4

async function cookieHeader(): Promise<string> {

  const token =( await cookies()).get(process.env.JWT_COOKIE_NAME ?? 'shega_token')?.value;
  return token ? `Bearer ${token}` : '';
}

// tiny wrapper that surfaces the root cause
async function fetchJson(url: string, init?: RequestInit) {
  try {
    const res = await fetch(url, { cache: 'no-store', ...init });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} ${res.statusText} — ${text?.slice(0, 300)}`);
    }
    return res.json();
  } catch (err: any) {
    // Node 18+ fetch sets err.cause with the low-level code (ECONNREFUSED, ENOTFOUND, etc)
    const code = err?.cause?.code || err?.code || 'UNKNOWN';
    throw new Error(`fetchJson(${url}) failed: ${code} ${err?.message || ''}`);
  }
}

export async function fetchHomes(params: {
  page?: number | string;
  limit?: number | string;
  search?: string | null;
  status?: 'online' | 'offline' | 'unknown' | '';
  type?: 'AIRNODE' | 'STOVENODE' | '';
}): Promise<HomesResponse> {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  if (params.search) q.set('search', params.search);
  if (params.status) q.set('status', params.status);
  if (params.type) q.set('type', params.type);

  const authorization = await cookieHeader();
  return fetchJson(`${API_BASE}/api/dashboard/homes?${q.toString()}`, {
    headers: { Accept: 'application/json', Authorization: authorization },
  });
}

export async function fetchHomeDetail(homeId: string): Promise<HomeDetail> {
  const authorization = await cookieHeader();
  return fetchJson(`${API_BASE}/api/dashboard/homes/${encodeURIComponent(homeId)}`, {
    headers: { Accept: 'application/json', Authorization: authorization },
  });
  }
  export async function fetchToken(): Promise<any> {
    const token = (await cookies()).get(process.env.JWT_COOKIE_NAME ?? 'shega_token')?.value;
    if (!token) return null;

    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    console.log('Decoded JWT payload:', payload);
    return payload;
  } 
