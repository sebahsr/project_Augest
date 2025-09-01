'use client';

import { useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Link from 'next/link';
import { apiGet, apiPost } from '@/lib/api';
import { AlertLevel, House, UserCreatePayload } from '@/types/iot';
import { Plus, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

function AlertPill({ level, count }: { level: AlertLevel, count: number }) {
  const base = 'px-2 py-0.5 rounded-full text-xs font-medium';
  const styles: Record<AlertLevel,string> = {
    info:  'bg-blue-50 text-blue-700 border border-blue-200',
    warn:  'bg-amber-50 text-amber-800 border border-amber-200',
    crit:  'bg-rose-50 text-rose-700 border border-rose-200',
  };
  return <span className={`${base} ${styles[level]}`}>{level.toUpperCase()} • {count}</span>;
}

export default function AdminDashboard({ initialHouses }: { initialHouses: House[] }) {
  const [houses, setHouses] = useState<House[]>(initialHouses || []);
  const [filter, setFilter] = useState('');
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string|undefined>();

  // live socket
  useEffect(() => {
    const url = (process.env.NEXT_PUBLIC_WS_URL || window.location.origin) as string;
    const s: Socket = io(url, { transports: ['websocket'] });
    s.on('connect', () => {/* noop */});
    s.on('telemetry', (evt: { houseId: string }) => {
      setHouses(prev => prev.map(h => h.houseId === evt.houseId ? { ...h, updatedAt: new Date().toISOString() } : h));
    });
    s.on('alert', (evt: { houseId: string; level: AlertLevel; message: string; at?: string }) => {
      setHouses(prev => prev.map(h => h.houseId === evt.houseId
        ? { ...h, activeAlerts: [{ level: evt.level, message: evt.message, at: evt.at || new Date().toISOString() },
                                 ...(h.activeAlerts || [])].slice(0,5) }
        : h));
    });
    return () => { s.disconnect(); };
  }, []);

  // manual refresh
  async function refresh() {
    try { setHouses(await apiGet<House[]>('/api/houses')); } catch (e) { /* ignore */ }
  }

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return houses;
    return houses.filter(h =>
      h.houseId.toLowerCase().includes(q) ||
      (h.address||'').toLowerCase().includes(q) ||
      (h.ownerName||'').toLowerCase().includes(q)
    );
  }, [houses, filter]);

  // Add user modal submit
  async function onCreateUser(form: FormData) {
    setSaving(true); setErr(undefined);
    const payload: UserCreatePayload = {
      username: String(form.get('username')||'').trim(),
      name: String(form.get('name')||'').trim(),
      password: String(form.get('password')||'').trim(),
      address: String(form.get('address')||'').trim(),
      houseId: String(form.get('houseId')||'').trim(),
      airnodeId: String(form.get('airnodeId')||'').trim(),
      stovenodeId: String(form.get('stovenodeId')||'').trim(),
    };
    try {
      await apiPost('/api/admin/users', payload);
      setAdding(false);
      await refresh();
    } catch (e: any) {
      setErr(typeof e?.message === 'string' ? e.message : 'Failed to create user');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">All Houses</h1>
          <p className="text-slate-600">Live overview of every AirNode & StoveNode.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search by house, address, owner…"
            className="input input-bordered rounded-xl"
          />
          <button className="btn btn-primary rounded-xl" onClick={() => setAdding(true)}>
            <Plus size={16} /> Add user
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-base-100 rounded-xl border border-slate-200 shadow-sm">
        <table className="table">
          <thead>
            <tr>
              <th>House ID</th>
              <th>Address</th>
              <th>Owner</th>
              <th>Devices</th>
              <th>Alerts</th>
              <th>Last Update</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(h => {
              const crit = (h.activeAlerts||[]).filter(a => a.level==='crit').length;
              const warn = (h.activeAlerts||[]).filter(a => a.level==='warn').length;
              const info = (h.activeAlerts||[]).filter(a => a.level==='info').length;
              return (
                <tr key={h.houseId}>
                  <td className="font-mono">{h.houseId}</td>
                  <td>{h.address}</td>
                  <td>{h.ownerName || '—'}</td>
                  <td>{h.devices?.map(d => d.kind).join(', ')}</td>
                  <td className="space-x-2">
                    {crit ? <AlertPill level="crit" count={crit} /> : null}
                    {warn ? <AlertPill level="warn" count={warn} /> : null}
                    {info ? <AlertPill level="info" count={info} /> : null}
                    {!crit && !warn && !info ? (
                      <span className="text-slate-500 inline-flex items-center gap-1 text-sm"><CheckCircle2 size={14}/> Healthy</span>
                    ) : null}
                  </td>
                  <td>{h.updatedAt ? new Date(h.updatedAt).toLocaleString() : '—'}</td>
                  <td>
                    <Link href={`/dashboard/house/${encodeURIComponent(h.houseId)}`} className="btn btn-sm rounded-xl">
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center text-slate-500 py-8">No results</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add User modal */}
      {adding && (
        <dialog className="modal modal-open">
          <div className="modal-box rounded-2xl">
            <h3 className="font-semibold text-lg mb-2">Add user</h3>
            {err && <div className="alert alert-error text-sm mb-3">{err}</div>}
            <form
              onSubmit={(e) => { e.preventDefault(); onCreateUser(new FormData(e.currentTarget)); }}
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              <input name="username" className="input input-bordered rounded-xl" placeholder="Username" required />
              <input name="name" className="input input-bordered rounded-xl" placeholder="Full name" required />
              <input type="password" name="password" className="input input-bordered rounded-xl" placeholder="Password" required />
              <input name="address" className="input input-bordered rounded-xl" placeholder="Address" required />
              <input name="houseId" className="input input-bordered rounded-xl" placeholder="House ID" required />
              <input name="airnodeId" className="input input-bordered rounded-xl" placeholder="AirNode ID" required />
              <input name="stovenodeId" className="input input-bordered rounded-xl" placeholder="StoveNode ID" required />
              <div className="md:col-span-2 flex justify-end gap-2 mt-1">
                <button type="button" className="btn rounded-xl" onClick={() => setAdding(false)}>Cancel</button>
                <button disabled={saving} className="btn btn-primary rounded-xl">
                  {saving ? 'Saving…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
          <form method="dialog" className="modal-backdrop" onSubmit={() => setAdding(false)}><button>close</button></form>
        </dialog>
      )}
    </div>
  );
}
