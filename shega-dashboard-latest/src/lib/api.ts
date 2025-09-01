import axios from 'axios';
const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/api' });
export default api;
export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, { ...init, cache: 'no-store', credentials: 'include' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
export async function apiPost<T>(url: string, body: any): Promise<T> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
    credentials: 'include',
  });
  if (!res.ok) 
    throw new Error(await res.json().then((data) => data.message || 'Failed to post data'));
  return res.json();
}
export async function getEmergencySummary(homeId: string, q: { since?: string; until?: string } = {}) {
  const qs = new URLSearchParams(q as any).toString();
  const res = await fetch(`/api/homes/${homeId}/emergencies/summary` + (qs ? `?${qs}` : ''), { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load summary');
  return res.json();
}

export async function ackEmergency(id: string) {
  const res = await fetch(`/api/emergencies/${id}/ack`, { method: 'PATCH', credentials: 'include' });
  if (!res.ok) throw new Error('Failed to ack');
  return res.json();
}
export async function unackEmergency(id: string) {
  const res = await fetch(`/api/emergencies/${id}/unack`, { method: 'PATCH', credentials: 'include' });
  if (!res.ok) throw new Error('Failed to unack');
  return res.json();
}