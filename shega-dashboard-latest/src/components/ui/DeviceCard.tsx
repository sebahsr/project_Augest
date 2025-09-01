'use client';

import * as React from 'react';
import { JSX, useMemo, useState } from 'react';
import { Fan, Bell, PlugZap, ShieldAlert } from 'lucide-react';
import type { Device } from '@/types/iot';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import { sendDeviceControlClient } from '@/lib/api/dashboard.client';
import { useI18n } from '@/components/i18n/I18nProvider';
import ClientTime from '@/components/ClientTime';

type Sev = 'ok' | 'warn' | 'danger';

export default function DeviceCard({ device, homeId }: { device: Device; homeId: string }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const md = (device.metadata || {}) as any;

  const num = (v: any) => (v === 0 || v ? Number(v) : undefined);

  // Read states according to sim payloads
  const [fan,setFan] = useState(!!md.fanOn);                         // STOVENODE fan
  const [valveClosed,setValveClosed] = useState(!!md.valveClosed);           // STOVENODE valve
  const [alarmOn,setAlarmOn] = useState(!!md.alarmOn);     
  React.useEffect(()=>{
setValveClosed(!!md.valveClosed);
  },[md.valveClosed])
    React.useEffect(()=>{
      
setAlarmOn(!!md.alarmOn);
  },[md.alarmOn])
  // AIRNODE alarm
  console.log("sebah valveclosed:",md.valveClosed,"dffdf",valveClosed)
  const metrics = useMemo(() => {
    return {
      co2: num(md.co2),
      co: num(md.co),
      pm25: num(md.pm25),
      pm10: num(md.pm10),
      temp: num(md.temp),
      humidity: num(md.humidity),
      pressure: num(md.pressure),
      stove: num(md.stoveTemp),
    };
  }, [md]);

  const issues = useMemo(() => {
    const list: { k: string; sev: Sev; msg: string }[] = [];
    if (metrics.co2 !== undefined) {
      if (metrics.co2 >= 2000) list.push({ k: 'co2', sev: 'danger', msg: t('issue.co2High') });
      else if (metrics.co2 >= 1200) list.push({ k: 'co2', sev: 'warn', msg: t('issue.co2Elevated') });
    }
    if (metrics.co !== undefined) {
      if (metrics.co >= 35) list.push({ k: 'co', sev: 'danger', msg: t('issue.coHigh') });
      else if (metrics.co >= 9) list.push({ k: 'co', sev: 'warn', msg: t('issue.coElevated') });
    }
    if (metrics.pm25 !== undefined) {
      if (metrics.pm25 >= 150) list.push({ k: 'pm25', sev: 'danger', msg: t('issue.pm25High') });
      else if (metrics.pm25 >= 55) list.push({ k: 'pm25', sev: 'warn', msg: t('issue.pm25Elevated') });
    }
    if (device.type === 'STOVENODE') {
      const s = metrics.stove;
      if (s !== undefined) {
        if (s >= 250) list.push({ k: 'stove', sev: 'danger', msg: t('issue.stoveTooHot') });
        else if (s >= 200) list.push({ k: 'stove', sev: 'warn', msg: t('issue.stoveHigh') });
      }
    }
    const sev: Sev = list.some((i) => i.sev === 'danger') ? 'danger' : list.some((i) => i.sev === 'warn') ? 'warn' : 'ok';
    return { list, sev };
  }, [metrics, device.type, t]);

  const borderTone =
    issues.sev === 'danger'
      ? 'border-red-300 ring-1 ring-red-200'
      : issues.sev === 'warn'
      ? 'border-amber-300 ring-1 ring-amber-200'
      : 'border-gray-200';

  // Helper: send control in server-expected shape
  async function publishControl(deviceid: string, actions: Record<string, any>) {
    setBusy(true);
    try {
      const target = device.type === 'STOVENODE' ? 'STOVENODE' : 'AIRNODE';
      // Expect  API route to pipe this to mqttService.publishControl(homeId, actions, target)
      await sendDeviceControlClient(deviceid, homeId, { target, actions });
    } finally { setBusy(false); }
  }

  // Switch handlers
  const onToggleFan = async (deviceId: string, next: boolean) => {
    setFan(next) 
    await publishControl(deviceId, { fan: next ? 'on' : 'off' });
  };
  const onToggleAlarm = async (deviceId: string, next: boolean) => {
    // Map to alarm on/off (you can add an "auto" dropdown elsewhere)
    await publishControl(deviceId, { alarm: next ? 'on' : 'off' });
  };
  const onValveClose = async (deviceId: string) => {
    await publishControl(deviceId, { valve: 'close' });
  };
  const onValveOpen = async (deviceId: string) => {
    await publishControl(deviceId, { valve: 'open' }); // device will accept/reject with COMMAND_APPLIED/CONTROL_DENIED
  };
  const onSafetyCutoff = async (deviceId: string) => {
    await publishControl(deviceId, { valve: 'close', fan: 'on' });
  };

  // Compact metrics line
  const seg = (label: string, v?: number, unit = '') =>
    v === undefined ? null : (
      <span key={label} className="whitespace-nowrap">
        <b>{label}</b>: {v.toFixed(label.startsWith('CO') ? 2 : 0)}{unit}
      </span>
    );
  const compact = useMemo(() => {
    const parts: (React.JSX.Element | null)[] = [];
    parts.push(seg(t('metric.CO2'), metrics.co2, t('unit.ppm')));
    parts.push(seg(t('metric.CO'), metrics.co, t('unit.ppm')));
    parts.push(seg(t('metric.PM25'), metrics.pm25, t('unit.ugm3')));
    parts.push(seg(t('metric.PM10'), metrics.pm10, t('unit.ugm3')));
    if (device.type === 'STOVENODE') {
      parts.push(seg(t('metric.Stove'), metrics.stove, t('unit.celsius')));
      parts.push(<span key="fan"><b>{t('label.fan')}</b>: {fan ? t('label.on') : t('label.off')}</span>);
      parts.push(<span key="valve"><b>{t('label.valve')}</b>: {valveClosed ? t('label.closed') : t('label.open')}</span>);
    } else {
      parts.push(seg(t('metric.Temp'), metrics.temp, t('unit.celsius')));
      parts.push(seg(t('metric.Humidity'), metrics.humidity, t('unit.percent')));
      if (metrics.pressure !== undefined) parts.push(seg(t('metric.Pressure'), metrics.pressure, t('unit.hpa')));
      parts.push(<span key="alarm"><b>{t('label.alarm')}</b>: {alarmOn ? t('label.on') : t('label.off')}</span>);
    }
    const withDots: React.JSX.Element[] = [];
    parts.filter(Boolean).forEach((el, i, arr) => {
      withDots.push(el as JSX.Element);
      if (i < arr.length - 1) withDots.push(<span key={`dot-${i}`}> · </span>);
    });
    return withDots;
  }, [metrics, device.type, fan, valveClosed, alarmOn, t]);
 console.log("device",device)
  return (
    <div className={`rounded-2xl border bg-white shadow-sm p-4 flex flex-col gap-3 ${borderTone}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-gray-500">{homeId}/{device.deviceId}</div>
          <div className="text-lg font-semibold">{device.name || device.deviceId}</div>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill status={device.status} />
        </div>
      </div>

      {/* Issues banner */}
      {issues.list.length > 0 && (
        <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-xl border ${
          issues.sev === 'danger' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          <ShieldAlert className="w-4 h-4" />
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {issues.list.map((i) => (<span key={i.k}>{i.msg}</span>))}
          </div>
        </div>
      )}

      {/* Compact metrics */}
      <div className="px-3 py-2 rounded-xl bg-gray-50 text-sm text-gray-800 border">{compact}</div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center">
        {device.type === 'STOVENODE' ? (
          <>
            <div className="flex items-center gap-2">
              <Fan className="w-4 h-4 text-gray-600" />
              <ToggleSwitch disabled={busy||!valveClosed} checked={fan} onChange={(next) => onToggleFan(device.deviceId, next)} label={t('control.fan')} />
            </div>
            <div className="flex items-center gap-2">
              <ToggleSwitch
                disabled={busy}
                // {||valveClosed}
                checked={!valveClosed}
                onChange={(next) => {
                  console.log("sebah l",md.valveClosed, valveClosed, next)
                  setValveClosed(!next)
                  next ?onValveOpen(device.deviceId): onValveClose(device.deviceId) 
                }}
                label={t('control.valve')}
              />
            </div>
            <button
              disabled={busy}
              onClick={() => onSafetyCutoff(device.deviceId)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border ${!valveClosed?" bg-red-600 ": " bg-red-200 "} text-white hover:bg-red-700 disabled:opacity-60`}
            >
              <PlugZap className="w-4 h-4" />
              {t('control.cutoff')}
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-600" />
              <ToggleSwitch disabled={busy} checked={alarmOn} onChange={(next) => 
                { setAlarmOn(next);
                  onToggleAlarm(device.deviceId, next)}
                } label={t('control.alarm')} />
            </div>
          </>
        )}
      </div>

      <div className="text-xs text-gray-400">
        {t('label.lastSeen')}: {device.lastTs ? <ClientTime iso={device.lastTs} locale="en-GB" timeZone="Europe/Rome" /> : '—'}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: 'online' | 'offline' | 'unknown' }) {
  const cls =
    status === 'online' ? 'bg-green-100 text-green-800 border-green-200'
    : status === 'offline' ? 'bg-red-100 text-red-800 border-red-200'
    : 'bg-gray-100 text-gray-700 border-gray-200';
  return <span className={`px-2 py-1 text-xs rounded-full border ${cls}`}>{status}</span>;
}
