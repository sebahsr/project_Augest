'use client';

import StatusDonut from '@/components/ui/StatusDonut';
import RadialGauge from '@/components/ui/RadialGauge';
import DeviceCard from '@/components/ui/DeviceCard';
import type { HomeDetail, Device } from '@/types/iot';
import { ArrowLeft, Users, Thermometer, Droplets, Gauge, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { useI18n } from '@/components/i18n/I18nProvider';
import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { get } from 'http';
import {getUserHouseId} from '@/lib/api/dashboard.client'
/* ---------------- tiny toast center ---------------- */
type UiEvent = {
  ts: string;
  homeId: string;
  deviceId?: string;
  from?: string;
  type: string;
  detail?: any;
};
function Toast({ e }: { e: UiEvent }) {
  const label =
    e.type === 'COMMAND_SENT' ? 'Command sent' :
    e.type === 'COMMAND_APPLIED' ? 'Command applied' :
    e.type === 'CONTROL_DENIED' ? 'Control denied' :
    e.type === 'STOVE_EMERGENCY' ? 'Stove emergency' :
    e.type === 'AIR_INTERVENTION' ? 'Air intervention' :
    e.type;
  const tone =
    e.type === 'CONTROL_DENIED' || e.type === 'STOVE_EMERGENCY' ? 'bg-rose-50 border-rose-200 text-rose-800'
    : e.type === 'COMMAND_APPLIED' ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
    : 'bg-amber-50 border-amber-200 text-amber-800';
  return (
    <div className={`px-3 py-2 rounded-xl border shadow-sm ${tone}`}>
      <div className="text-xs">{new Date(e.ts).toLocaleTimeString()}</div>
      <div className="font-medium text-sm">{label}</div>
      {e.detail && <div className="text-xs opacity-80 break-all">{JSON.stringify(e.detail)}</div>}
    </div>
  );
}

type Hist = Record<string, number[]>;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/* --- Stove visuals --- */
function stoveStatus(temp?: number) {
  if (!Number.isFinite(temp)) return 'muted' as const;
  if (temp! <= 120) return 'ok' as const;
  if (temp! <= 200) return 'warn' as const;
  if (temp! <= 250) return 'high' as const;
  return 'danger' as const;
}
function stovePill(stat: ReturnType<typeof stoveStatus>) {
  switch (stat) {
    case 'ok': return 'text-emerald-700 bg-emerald-50 ring-emerald-200';
    case 'warn': return 'text-amber-700 bg-amber-50 ring-amber-200';
    case 'high': return 'text-orange-700 bg-orange-50 ring-orange-200';
    case 'danger': return 'text-rose-700 bg-rose-50 ring-rose-200';
    default: return 'text-gray-600 bg-gray-50 ring-gray-200';
  }
}

/** Horizontal thermometer with threshold ticks. */
function ThermoBar({ value = 0, max = 400, ticks = [120, 200, 250] }: { value?: number; max?: number; ticks?: number[] }) {
  const pct = Math.max(0, Math.min(100, (Number(value) / max) * 100));
  const pos = (v: number) => ({ left: `${Math.max(0, Math.min(100, (v / max) * 100))}%` });
  return (
    <div className="relative h-3 w-full rounded-full bg-slate-200 overflow-hidden ring-1 ring-black/5">
      <div className="absolute inset-y-0 left-0 rounded-r-full transition-all duration-500 bg-gradient-to-r from-sky-400 via-amber-400 to-rose-500" style={{ width: `${pct}%` }} />
      {ticks.map((t, i) => (
        <div key={i} className="absolute top-0 bottom-0 w-[2px] bg-white/70 shadow-[0_0_0_1px_rgba(0,0,0,.05)]" style={pos(t)} title={`${t}°C`} />
      ))}
    </div>
  );
}

/** Pretty stove card with big number + pills. */
function StoveHeatCard({
  temp, fanOn, valveClosed, history, title = 'Stove Safety',
}: { temp?: number; fanOn?: boolean; valveClosed?: boolean; history?: number[]; title?: string; }) {
  const { t } = useI18n();
  const tr = (k: string, fb: string) => withFallback(t, k, fb);
  const stat = stoveStatus(temp);
  return (
    <div className="rounded-3xl border border-gray-100 bg-white/70 shadow-[0_1px_0_0_rgba(16,24,40,.06),0_6px_16px_-6px_rgba(16,24,40,.15)] p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-rose-100 text-rose-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 2.4c.8 1.8.7 3.6-.3 5.2-.6 1-.6 2.2 0 3.3.9 1.5 1 3.3.2 4.9-1.3 2.6-4.3 4.1-7.1 3.6 1.1.8 2.5 1.2 4 1.2 4.1 0 7.5-3.2 7.5-7.2 0-2-.8-3.8-2.1-5.1.2 1.1-.1 2.3-.9 3.2-.4-1.3-.4-2.7.2-3.9.5-1.1.8-2.4.6-3.7Z"/></svg>
          </span>
          <h3 className="font-semibold tracking-tight">{title}</h3>
        </div>
      </div>

      {temp === undefined ? (
        <div className="py-10 text-center text-amber-600 bg-amber-50 rounded-xl">
          ⚠️ {tr('home.noData', 'No data is currently being sent from this device.')}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-3">
            {typeof fanOn === 'boolean' && (
              <span className={`px-2 py-0.5 text-xs rounded-full ring-1 ${fanOn ? 'text-emerald-700 bg-emerald-50 ring-emerald-200' : 'text-gray-600 bg-gray-50 ring-gray-200'}`}>
                Fan {fanOn ? 'On' : 'Off'}
              </span>
            )}
            {typeof valveClosed === 'boolean' && (
              <span className={`px-2 py-0.5 text-xs rounded-full ring-1 ${valveClosed ? 'text-rose-700 bg-rose-50 ring-rose-200' : 'text-emerald-700 bg-emerald-50 ring-emerald-200'}`}>
                Valve {valveClosed ? 'Closed' : 'Open'}
              </span>
            )}
            <span className={`px-2 py-0.5 text-[11px] rounded-full ring-1 ${stovePill(stat)}`}>
              {stat === 'ok' ? 'Normal' : stat === 'warn' ? 'Hot' : stat === 'high' ? 'Very Hot' : stat === 'danger' ? 'Danger' : '—'}
            </span>
          </div>

          <div className="flex items-end justify-between mb-3">
            <div className="text-4xl font-semibold">
              {Number.isFinite(temp) ? Math.round(temp!) : '—'} <span className="text-lg text-gray-500">°C</span>
            </div>
            <div className="text-xs text-gray-500">120 / 200 / 250 °C</div>
          </div>

          <ThermoBar value={temp} max={400} ticks={[120, 200, 250]} />
          {history && history.length > 1 && <div className="mt-3 text-gray-400"><Sparkline data={history} /></div>}
        </>
      )}
    </div>
  );
}

/* ---------------- i18n fallback ---------------- */
function withFallback(t: (k: string) => string, key: string, fallback: string) {
  const v = t(key);
  return v && v !== key ? v : fallback;
}

/* ---------------- mapping + merge ---------------- */
function mdFromPayload(stream: 'AIR' | 'STOVE', p: any = {}) {
  const md: any = {};
  if (stream === 'AIR') {
    if (isNum(p.co2)) md.co2 = p.co2;
    if (isNum(p.co)) md.co = p.co;
    if (isNum(p.pm25)) md.pm25 = p.pm25;
    if (isNum(p.pm10)) md.pm10 = p.pm10;
    if (isNum(p.temperature_c)) md.temp = p.temperature_c;
    if (isNum(p.humidity_pct)) md.humidity = p.humidity_pct;
    if (isNum(p.pressure_hpa)) md.pressure = p.pressure_hpa;
    if (typeof p.alarmOn === 'boolean') md.alarmOn = p.alarmOn;
  } else {
    if (isNum(p.stove_temp_c)) md.stoveTemp = p.stove_temp_c;
    if (typeof p.fanOn === 'boolean') md.fanOn = p.fanOn;
    if (typeof p.valveClosed === 'boolean') md.valveClosed = p.valveClosed;
  }
  return md;
}

function applyTelemetryToDetail(detail: HomeDetail, incoming: any): HomeDetail {
  const { doc, device, statusCounts } = incoming;
  if (!doc || doc.homeId !== detail.homeId) return detail;

  const devices = [...detail.devices];
  const idx = devices.findIndex((d) => d.deviceId === doc.deviceId);

  const payloadPatch = mdFromPayload(doc.stream, doc.payload);
  const serverMd = (device?.metadata as any) || {};

  if (idx === -1) {
    devices.push({ ...(device as Device), metadata: { ...serverMd, ...payloadPatch } });
  } else {
    const cur = devices[idx];
    devices[idx] = { ...cur, type: device?.type || cur.type, metadata: { ...(cur.metadata || {}), ...serverMd, ...payloadPatch } };
  }

  const byTypeCounts = {
    AIRNODE: devices.filter((d) => d.type === 'AIRNODE').length,
    STOVENODE: devices.filter((d) => d.type === 'STOVENODE').length,
  };

  return { ...detail, devices, statusCounts: statusCounts || detail.statusCounts, byTypeCounts, totalDevices: devices.length };
}

function pickAirMetrics(devices: Device[]) {
  const air = devices?.find((d) => d.type === 'AIRNODE' && d.metadata);
  const md = (air?.metadata as any) || {};
  return {
    co2: isNum(md.co2) ? md.co2 : undefined,
    co: isNum(md.co) ? md.co : undefined,
    pm25: isNum(md.pm25) ? md.pm25 : undefined,
    pm10: isNum(md.pm10) ? md.pm10 : undefined,
    roomTemp: isNum(md.temp) ? md.temp : undefined,
    humidity: isNum(md.humidity) ? md.humidity : undefined,
    pressure: isNum(md.pressure) ? md.pressure : undefined,
    alarmOn: typeof md.alarmOn === 'boolean' ? md.alarmOn : undefined,
  };
}
function pickStoveMetrics(devices: Device[]) {
  const stove = devices?.find((d) => d.type === 'STOVENODE' && d.metadata);
  const md = (stove?.metadata as any) || {};
  return {
    stoveTemp: isNum(md.stoveTemp) ? md.stoveTemp : undefined,
    fanOn: typeof md.fanOn === 'boolean' ? md.fanOn : undefined,
    valveClosed: typeof md.valveClosed === 'boolean' ? md.valveClosed : undefined,
  };
}

/* ---------------- visuals: status, sparkline, tiles ---------------- */
function statusFor(value: number | undefined, goodMax: number, warnMax: number) {
  if (!isNum(value)) return 'muted';
  if (value <= goodMax) return 'ok';
  if (value <= warnMax) return 'warn';
  return 'danger';
}
function pillClasses(stat: 'ok' | 'warn' | 'danger' | 'muted') {
  switch (stat) {
    case 'ok': return 'text-emerald-700 bg-emerald-50 ring-emerald-200';
    case 'warn': return 'text-amber-700 bg-amber-50 ring-amber-200';
    case 'danger': return 'text-rose-700 bg-rose-50 ring-rose-200';
    default: return 'text-gray-600 bg-gray-50 ring-gray-200';
  }
}
function SectionCard({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white/70 shadow-[0_1px_0_0_rgba(16,24,40,.06),0_6px_16px_-6px_rgba(16,24,40,.15)] supports-[backdrop-filter]:bg-white/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold tracking-tight">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-rose-100 text-rose-600 mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 2.4c.8 1.8.7 3.6-.3 5.2-.6 1-.6 2.2 0 3.3.9 1.5 1 3.3.2 4.9-1.3 2.6-4.3 4.1-7.1 3.6 1.1.8 2.5 1.2 4 1.2 4.1 0 7.5-3.2 7.5-7.2 0-2-.8-3.8-2.1-5.1.2 1.1-.1 2.3-.9 3.2-.4-1.3-.4-2.7.2-3.9.5-1.1.8-2.4.6-3.7Z"/></svg>
          </span>
          {title}
        </h3>
        {right}
      </div>
      {children}
    </div>
  );
}
function Sparkline({ data }: { data?: number[] }) {
  const w = 100, h = 24, pad = 2;
  if (!data || data.length < 2) return <div className="h-6" />;
  const min = Math.min(...data), max = Math.max(...data);
  const y = (v: number) => (max === min ? h / 2 : h - pad - ((v - min) / (max - min)) * (h - pad * 2));
  const step = (w - pad * 2) / (data.length - 1);
  const d = data.map((v, i) => `${i ? 'L' : 'M'} ${pad + i * step} ${y(v)}`).join(' ');
  return <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-6"><path d={d} fill="none" stroke="currentColor" strokeWidth="2" className="opacity-60" /></svg>;
}
function GaugeTile({
  label, unit, value, goodMax, warnMax, max, history, icon,
}: { label: string; unit: string; value?: number; goodMax: number; warnMax: number; max: number; history?: number[]; icon?: React.ReactNode; }) {
  const stat = statusFor(value, goodMax, warnMax);
  return (
    <div className="rounded-2xl border bg-white p-3 shadow-sm ring-1 ring-gray-100">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 text-sm text-gray-600">{icon}<span className="font-medium">{label}</span></div>
        <span className={`text-[11px] px-2 py-0.5 rounded-full ring-1 ${pillClasses(stat)}`}>
          {stat === 'ok' ? 'Good' : stat === 'warn' ? 'Elevated' : stat === 'danger' ? 'High' : '—'}
        </span>
      </div>
      <div className="scale-[.92] origin-top">
        <RadialGauge value={value ?? 0} max={max} goodMax={goodMax} warnMax={warnMax} label="" unit="" />
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <div className="text-2xl font-semibold">{isNum(value) ? value : '—'} <span className="text-sm text-gray-500">{unit}</span></div>
        <div className="text-xs text-gray-400">max {max}{unit}</div>
      </div>
      {history && history.length > 1 && (<div className="mt-2 text-gray-400"><Sparkline data={history} /></div>)}
    </div>
  );
}
function StatTile({
  label, unit, value, goodMax, warnMax, history, icon, decimals = 0,
}: { label: string; unit: string; value?: number; goodMax: number; warnMax: number; history?: number[]; icon?: React.ReactNode; decimals?: number; }) {
  const stat = statusFor(value, goodMax, warnMax);
  const last = history?.[history.length - 1];
  const prev = history?.[history.length - 2];
  const delta = isNum(last) && isNum(prev) ? last - prev : undefined;
  const trendIcon = isNum(delta) ? (delta >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />) : null;

  return (
    <div className="rounded-2xl border bg-white p-3 shadow-sm ring-1 ring-gray-100">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 text-sm text-gray-600">{icon}<span className="font-medium">{label}</span></div>
        <span className={`text-[11px] px-2 py-0.5 rounded-full ring-1 ${pillClasses(stat)}`}>
          {stat === 'ok' ? 'Good' : stat === 'warn' ? 'Elevated' : stat === 'danger' ? 'High' : '—'}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-3xl font-semibold">
          {isNum(value) ? value.toFixed(decimals) : '—'} <span className="text-sm text-gray-500">{unit}</span>
        </div>
        <div className="text-xs text-gray-500 inline-flex items-center gap-1">
          {trendIcon}{isNum(delta) ? `${delta >= 0 ? '+' : ''}${delta.toFixed(decimals)}` : ''}
        </div>
      </div>
      {history && history.length > 1 && (<div className="mt-2 text-gray-400"><Sparkline data={history} /></div>)}
    </div>
  );
}

/* ---------------- component ---------------- */
export default function HomeDetailClient() {
  const { t } = useI18n();
  const tr = (k: string, fb: string) => withFallback(t, k, fb);

  const [live, setLive] = useState<HomeDetail>({} as HomeDetail);
  const [hist, setHist] = useState<Hist>({});
  const [toasts, setToasts] = useState<UiEvent[]>([]);
  const [houseId, setHouseId] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      const id = await getUserHouseId();
      setHouseId(id);
    })();
  }, []);

  useEffect(() => {
    if (!houseId) return;
    const base = process.env.NEXT_PUBLIC_WS_URL ?? 'http://127.0.0.1:3000';
    const socket = io(`${base}`, {
      withCredentials: true,
      transports: ['websocket'],
      auth: { role: 'user', homeId: houseId },
    });

    const push = (key: string, v?: number) => {
      if (!isNum(v)) return;
      setHist((prev) => {
        const arr = prev[key] ? [...prev[key], v].slice(-50) : [v];
        return { ...prev, [key]: arr };
      });
    };
  
    socket.on('connect', () => socket.emit('join:home', houseId));
    console.log('WS connecting', base, houseId);
    socket.on('connect_error', (err) => console.error('WS connect_error', err));
    socket.on('disconnect', () => console.log('WS disconnected'));
    socket.on('home:snapshot', (snap) =>
      setLive((prev) => ({ ...prev, ...snap, devices: snap.devices ?? prev.devices, statusCounts: snap.statusCounts ?? prev.statusCounts }))
    );
    socket.on('telemetry', (payload) => {
      setLive((cur) => applyTelemetryToDetail(cur, payload));
      const { doc } = payload || {};
      if (doc?.stream === 'AIR') {
        const p = doc.payload || {};
        push('co2', p.co2); push('co', p.co); push('pm25', p.pm25); push('pm10', p.pm10);
        push('roomTemp', p.temperature_c); push('humidity', p.humidity_pct); push('pressure', p.pressure_hpa);
      } else if (doc?.stream === 'STOVE') {
        push('stoveTemp', doc.payload?.stove_temp_c);
      }
    });

    // NEW: event stream (COMMAND_SENT/APPLIED/DENIED, emergencies)
    socket.on('event', (evt: UiEvent) => {
      if (!evt || evt.homeId !== houseId) return;
      setToasts((prev) => {
        const next = [...prev, evt].slice(-6);
        return next;
      });
      // auto-dismiss after 7s
      setTimeout(() => setToasts((prev) => prev.filter((e) => e !== evt)), 7000);
    });

    return () => { socket.disconnect(); socket.close(); };
  }, [houseId]);

  const air = useMemo(() => pickAirMetrics(live.devices), [live.devices]);
  const stove = useMemo(() => pickStoveMetrics(live.devices), [live.devices]);
  return (
    <div className="space-y-6 relative">
      {/* Toasts */}
      {toasts.length > 0 && (
        <div className="fixed right-4 top-20 z-50 space-y-2 w-[320px]">
          {toasts.map((e, i) => <Toast key={e.ts + i} e={e} />)}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          
          <h1 className="text-2xl font-bold mt-1">{tr('home.label', 'Home')}: {live.homeId}</h1>
          <div className="text-gray-600 mt-1 text-sm">
            {tr('home.devices', 'Devices')}: <b>{live.totalDevices}</b> · {tr('device.airnode', 'AirNode')}: <b>{live.byTypeCounts?.AIRNODE || 0}</b> · {tr('device.stovenode', 'StoveNode')}: <b>{live.byTypeCounts?.STOVENODE || 0}</b>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-gray-500" />
          {live.owners?.length ? (
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {live.owners.map((o: any) => (
                <span key={o._id} className="text-gray-700">
                  {o.name || o.email} <span className="text-gray-400">({o.role})</span>
                </span>
              ))}
            </div>
          ) : (
            <span className="text-gray-400">{tr('home.noOwners', 'No owners')}</span>
          )}
        </div>
      </div>

      {/* Overview row: devices */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <SectionCard title={tr('home.devices', 'Devices')}>
            {live.devices?.length === 0 ? (
              <div className="py-10 w-[84vw] text-center text-amber-600 bg-amber-50 rounded-xl">
                ⚠️ {tr('home.noData', 'No devices connected.')}
              </div>
            ) : (
              <div className="flex gap-2 ">
                {live.devices?.map((d) => (
                  <DeviceCard key={d.deviceId} device={d}  homeId={live.homeId} />
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Air quality */}
        <SectionCard title={tr('device.airnode', 'Air Quality')} right={<span className="text-xs text-gray-500">AIRNODE</span>}>
          {air.co2 === undefined &&
           air.co === undefined &&
           air.pm25 === undefined &&
           air.pm10 === undefined &&
           air.roomTemp === undefined &&
           air.humidity === undefined ? (
            <div className="py-10 text-center text-amber-600 bg-amber-50 rounded-xl">
              ⚠️ {tr('home.noData', 'No data is currently being sent from this device.')}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 grid-cols-1 gap-3">
              <GaugeTile label="CO₂" unit="ppm" value={air.co2} max={2000} goodMax={800} warnMax={1500} history={hist.co2} />
              <GaugeTile label="PM2.5" unit="µg/m³" value={air.pm25} max={200} goodMax={15} warnMax={100} history={hist.pm25} />
              <GaugeTile label="CO" unit="ppm" value={air.co} max={100} goodMax={25} warnMax={50} history={hist.co} />
              <StatTile label="PM10" unit="µg/m³" value={air.pm10}  goodMax={25} warnMax={150} history={hist.pm10} />
              <StatTile label={tr('metric.RoomTemp', 'Room Temp')} unit="°C" value={air.roomTemp} goodMax={26} warnMax={32} history={hist.roomTemp} icon={<Thermometer className="w-4 h-4 text-gray-400" />} decimals={1} />
              <StatTile label={tr('metric.Humidity', 'Humidity')} unit="%" value={air.humidity} goodMax={60} warnMax={75} history={hist.humidity} icon={<Droplets className="w-4 h-4 text-gray-400" />} />
              {air.pressure !== undefined && (
                <StatTile label="Pressure" unit="hPa" value={air.pressure} goodMax={1015} warnMax={1030} history={hist.pressure} icon={<Gauge className="w-4 h-4 text-gray-400" />} />
              )}
            </div>
          )}
        </SectionCard>

        {/* Stove safety */}
        <StoveHeatCard
          temp={stove.stoveTemp}
          fanOn={stove.fanOn}
          valveClosed={stove.valveClosed}
          history={hist.stoveTemp}
          title={tr('device.stovenode', 'Stove Safety')}
        />
      </div>
    </div>
  );
}
