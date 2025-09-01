'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { apiGet, apiPost } from '@/lib/api';
import { House, Telemetry } from '@/types/iot';
import { Fan, Bell, Download } from 'lucide-react';

function Stat({ label, value, unit }:{label:string; value:number|undefined; unit:string}) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="text-sm text-slate-600">{label}</div>
      <div className="text-2xl font-semibold">{value ?? '—'} <span className="text-base font-normal text-slate-500">{unit}</span></div>
    </div>
  );
}

export default function UserDashboard({ initialHouse }: { initialHouse: House | null }) {
  const [house, setHouse] = useState<House | null>(initialHouse);
  const [latest, setLatest] = useState<Record<string, Telemetry>>({}); // by deviceId
  const houseId = house?.houseId;

  useEffect(() => {
    if (!houseId) return;
    const url = (process.env.NEXT_PUBLIC_WS_URL || window.location.origin) as string;
    const s: Socket = io(url, { transports: ['websocket'] });
    s.emit('join', { houseId }); // if  server rooms support it
    s.on('telemetry', (evt: { houseId: string; deviceId: string; data: Telemetry }) => {
      if (evt.houseId !== houseId) return;
      setLatest(prev => ({ ...prev, [evt.deviceId]: evt.data }));
    });
    s.on('houseUpdated', async () => {
      try { setHouse(await apiGet<House>(`/api/houses/${encodeURIComponent(houseId)}`)); } catch {}
    });
    return () => { s.disconnect(); };
  }, [houseId]);

  if (!house) {
    return <div className="alert">Could not load  house.</div>;
  }

  const air = house.devices.find(d => d.kind === 'airnode');
  const stove = house.devices.find(d => d.kind === 'stovenode');
  const airT = air ? latest[air.deviceId] : undefined;
  const stoveT = stove ? latest[stove.deviceId] : undefined;

  async function controlFan(on: boolean) {
    if (!stove) return;
    await apiPost('/api/control', { houseId: house?.houseId, deviceId: stove.deviceId, cmd: 'fan', payload: { on } });
  }
  async function buzzer(on: boolean) {
    if (!stove) return;
    await apiPost('/api/control', { houseId: house?.houseId, deviceId: stove.deviceId, cmd: 'buzzer', payload: { on } });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Home</h1>
        <p className="text-slate-600">{house.address}</p>
      </div>

      {/* AirNode */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">AirNode ({air?.deviceId || '—'})</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Stat label="Temp" value={airT?.temp} unit="°C"/>
          <Stat label="Humidity" value={airT?.humid} unit="%"/>
          <Stat label="CO₂" value={airT?.co2} unit="ppm"/>
          <Stat label="CO" value={airT?.co} unit="ppm"/>
          <Stat label="PM2.5" value={airT?.pm25} unit="µg/m³"/>
          <Stat label="PM10" value={airT?.pm10} unit="µg/m³"/>
        </div>
        <div>
          <a
            className="btn btn-ghost rounded-xl inline-flex items-center gap-2"
            href={`/api/telemetry.csv?houseId=${encodeURIComponent(house.houseId)}&deviceId=${encodeURIComponent(air?.deviceId||'')}`}
          >
            <Download size={16}/> Export CSV
          </a>
        </div>
      </section>

      {/* StoveNode */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">StoveNode ({stove?.deviceId || '—'})</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Stat label="Stove Temp" value={stoveT?.stoveTemp} unit="°C"/>
          <Stat label="Status" value={undefined} unit={stoveT?.status || '—'}/>
        </div>
        <div className="flex gap-2">
          <button className="btn rounded-xl" onClick={() => controlFan(true)}><Fan size={16}/> Fan On</button>
          <button className="btn rounded-xl" onClick={() => controlFan(false)}>Fan Off</button>
          <button className="btn rounded-xl" onClick={() => buzzer(true)}><Bell size={16}/> Beep</button>
          <button className="btn rounded-xl" onClick={() => buzzer(false)}>Silence</button>
        </div>
        <div>
          <a
            className="btn btn-ghost rounded-xl inline-flex items-center gap-2"
            href={`/api/telemetry.csv?houseId=${encodeURIComponent(house.houseId)}&deviceId=${encodeURIComponent(stove?.deviceId||'')}`}
          >
            <Download size={16}/> Export CSV
          </a>
        </div>
      </section>
    </div>
  );
}
