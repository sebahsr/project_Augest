// Client-side helpers (safe to import in 'use client' components)

type HomesResponse = { ok: boolean; homes?: Array<any>} ;

export async function sendDeviceControlClient(deviceId: string,homeId:string, command: Record<string, any>) {
  const res = await fetch(`/api/dashboard/devices/${encodeURIComponent(deviceId)}/control`, {
    method: 'POST',
    credentials: 'include', // send cookies from the browser
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({homeId, ...command}),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    // console.error(`[control] Failed to send control to device ${deviceId}: ${res.status} ${msg}`);
    //  throw new Error(`Control failed: ${res.status} ${msg}`);
  }
  return res.json();
}
export async function getUserHouseId(): Promise<string | null> {
  const res = await fetch('/api/dashboard/userDevice', {
    method: 'POST',
    credentials: 'include', // send cookies from the browser
    headers: { Accept: 'application/json' },
  });
  
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    // console.error(`[getUserHouseId] Failed: ${res.status} ${msg}`);
    return null;
  }


  const payload: HomesResponse = await res.json();
  return payload?.homes?.[0] ?? null;
}