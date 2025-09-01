'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { apiPost } from '@/lib/api';
import { House, Telemetry } from '@/types/iot';

// Define Telemetry type here if not available from import

import Link from 'next/link';
import { ArrowLeft, Fan, Bell, Download } from 'lucide-react';

export default function HouseDetail({ initialHouse }: { initialHouse: House }) {
  const [house, setHouse] = useState(initialHouse);
  const [latest, setLatest] = useState<Record<string, Telemetry>>({});

  useEffect(() => {
    const url = (process.env.NEXT_PUBLIC_WS_URL || window.location.origin) as string;
    const s = io(url, { transports: ['websocket'] });
    s.emit('join', { houseId: house.houseId });
    s.on('telemetry', (evt: { houseId: string; deviceId: string; data: Telemetry }) => {
      if (evt.houseId !== house.houseId) return;
      setLatest(prev => ({ ...prev, [evt.deviceId]: evt.data }));
    });
    s.on('houseUpdated', (h: House) => setHouse(h));
    console.log('WS connected', s);
    return () => { s.disconnect(); };
  }, [house.houseId]);

  async function send(deviceId: string, cmd: string, payload: any) {
    await apiPost('/api/control', { houseId: house.houseId, deviceId, cmd, payload });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/dashboard" className="btn btn-ghost rounded-xl"><ArrowLeft size={16}/> Back</Link>
        <div>
          <h1 className="text-2xl font-semibold">House {house.houseId}</h1>
          <p className="text-slate-600">{house.address}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {house.devices.map(d => {
          const t = latest[d.deviceId];
          const isAir = d.kind === 'airnode';
          return (
            <div key={d.deviceId} className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{d.kind.toUpperCase()} — {d.deviceId}</div>
                <a className="btn btn-ghost btn-sm rounded-xl"
                   href={`/api/telemetry.csv?houseId=${encodeURIComponent(house.houseId)}&deviceId=${encodeURIComponent(d.deviceId)}`}>
                  <Download size={14}/> CSV
                </a>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {isAir ? (
                  <>
                    <KV k="Temp" v={num(t?.temp)} unit="°C"/>
                    <KV k="Humid" v={num(t?.humid)} unit="%"/>
                    <KV k="CO₂" v={num(t?.co2)} unit="ppm"/>
                    <KV k="CO" v={num(t?.co)} unit="ppm"/>
                    <KV k="PM2.5" v={num(t?.pm25)} unit="µg/m³"/>
                    <KV k="PM10" v={num(t?.pm10)} unit="µg/m³"/>
                  </>
                ) : (
                  <>
                    <KV k="Stove Temp" v={num(t?.stoveTemp)} unit="°C"/>
                    <KV k="Status" v={t?.status ?? '—'} unit=""/>
                  </>
                )}
              </div>
              {!isAir && (
                <div className="flex gap-2">
                  <button className="btn btn-sm rounded-xl" onClick={() => send(d.deviceId, 'fan', { on: true })}><Fan size={14}/> Fan On</button>
                  <button className="btn btn-sm rounded-xl" onClick={() => send(d.deviceId, 'fan', { on: false })}>Fan Off</button>
                  <button className="btn btn-sm rounded-xl" onClick={() => send(d.deviceId, 'buzzer', { on: true })}><Bell size={14}/> Beep</button>
                  <button className="btn btn-sm rounded-xl" onClick={() => send(d.deviceId, 'buzzer', { on: false })}>Silence</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KV({k,v,unit}:{k:string; v:string; unit:string}) {
  return (
    <div className="p-3 rounded-lg border bg-slate-50">
      <div className="text-xs text-slate-600">{k}</div>
      <div className="text-lg font-semibold">{v} <span className="text-sm text-slate-500">{unit}</span></div>
    </div>
  );
}
function num(n?: number) { return typeof n === 'number' ? String(n) : '—'; }
