export async function fetchJSON<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',          // send auth cookie to  Express API
    cache: 'no-store',               // always fresh
    ...init,
    headers: { 'Accept': 'application/json', ...(init.headers || {}) },
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return res.json();
}
