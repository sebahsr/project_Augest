'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { HomeRow, DeviceStatus, DeviceType } from '@/types/iot';
import { Search, Filter, ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { useI18n } from '@/components/i18n/I18nProvider';
import ClientTime from '@/components/ClientTime';

type Props = {
  data: { homes: HomeRow[]; page: number; totalPages: number; total: number; limit: number };
};

const statusOptions: (DeviceStatus | '')[] = ['', 'online', 'offline', 'unknown'];
const typeOptions: (DeviceType | '')[] = ['', 'AIRNODE', 'STOVENODE'];

export default function HomesTableClient({ data }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const page = Number(sp.get('page') || data.page || 1);
  const limit = Number(sp.get('limit') || data.limit || 10);
  const search = sp.get('search') || '';
  const status = (sp.get('status') || '') as DeviceStatus | '';
  const type = (sp.get('type') || '') as DeviceType | '';

  function updateQuery(next: Record<string, string | number | null | undefined>) {
    const params = new URLSearchParams(sp.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (v === null || v === undefined || v === '') params.delete(k);
      else params.set(k, String(v));
    });
    router.push(`${pathname}?${params.toString()}`);
  }

  const canPrev = page > 1;
  const canNext = page < data.totalPages;

  const prettyStatus = (s: DeviceStatus) => {
    const base =
      s === 'online'
        ? 'bg-green-100 text-green-800 border-green-200'
        : s === 'offline'
        ? 'bg-red-100 text-red-800 border-red-200'
        : 'bg-gray-100 text-gray-700 border-gray-200';
    return <span className={`px-2 py-1 text-xs rounded-full border ${base}`}>{t(`status.${s}`)}</span>;
  };

  const byTypeSummary = (home: HomeRow) => {
    const air = home.devices.filter((d) => d.type === 'AIRNODE').length;
    const stove = home.devices.filter((d) => d.type === 'STOVENODE').length;
    return (
      <div className="text-xs text-gray-600">
        <span className="mr-3">{t('device.airnode')}: <b>{air}</b></span>
        <span>{t('device.stovenode')}: <b>{stove}</b></span>
      </div>
    );
  };

  const owners = (home: HomeRow) =>
    home.owners.length ? (
      <div className="flex flex-col">
        {home.owners.map((o) => (
          <span key={o._id} className="text-sm">
            {o.name ? o.name : o.email} <span className="text-gray-500">({o.role})</span>
          </span>
        ))}
      </div>
    ) : (
      <span className="text-gray-400 text-sm">{t('homes.noOwnersShort')}</span>
    );

  const rows = useMemo(() => data.homes, [data.homes]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Home className="w-6 h-6" />
          <h2 className="text-xl font-semibold">{t('homes.title')}</h2>
          <span className="text-sm text-gray-500 ml-2">({data.total} {t('homes.total')})</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <label className="relative">
            <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              defaultValue={search}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const v = (e.target as HTMLInputElement).value.trim();
                  updateQuery({ search: v || null, page: 1 });
                }
              }}
              placeholder={t('homes.searchPlaceholder')}
              className="pl-8 pr-3 py-2 rounded-xl border w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={status}
              onChange={(e) => updateQuery({ status: e.target.value || null, page: 1 })}
              className="px-3 py-2 rounded-xl border"
            >
              {statusOptions.map((s) => (
                <option key={s || 'any'} value={s}>
                  {s ? `${t('filter.status')}: ${t(`status.${s}`)}` : t('filter.anyStatus')}
                </option>
              ))}
            </select>
            <select
              value={type}
              onChange={(e) => updateQuery({ type: e.target.value || null, page: 1 })}
              className="px-3 py-2 rounded-xl border"
            >
              {typeOptions.map((tKey) => (
                <option key={tKey || 'any'} value={tKey}>
                  {tKey ? `${t('filter.type')}: ${tKey === 'AIRNODE' ? t('device.airnode') : t('device.stovenode')}` : t('filter.anyType')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Card container */}
      <div className="rounded-2xl border shadow-sm overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">{t('homes.th.homeId')}</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">{t('homes.th.owners')}</th>
                {/* <th className="text-left px-5 py-3 font-medium text-gray-600">{t('homes.th.devices')}</th> */}
                <th className="text-left px-5 py-3 font-medium text-gray-600">{t('homes.th.statusMix')}</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">{t('homes.th.lastSeen')}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-500">
                    {t('homes.empty')}
                  </td>
                </tr>
              )}
              {rows.map((h) => (
                <tr key={h.homeId} className="border-t hover:bg-gray-50/60">
                  <td className="px-5 py-3">
                    <div className="font-medium">{h.homeId}</div>
                    <div className="text-xs text-gray-500">{byTypeSummary(h)}</div>
                  </td>
                  <td className="px-5 py-3">{owners(h)}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2 flex-wrap">
                      {h.devices.slice(0, 4).map((d) => (
                        <span
                          key={d.deviceId}
                          className="px-2 py-1 rounded-full border text-xs bg-indigo-50 border-indigo-200 text-indigo-700"
                          title={`${d.type} – ${d.name || d.deviceId}`}
                        >
                          {d.type === 'AIRNODE' ? t('device.airnode') : t('device.stovenode')}:{' '}
                          <span className="font-medium">{d.name || d.deviceId}</span>
                        </span>
                      ))}
                      {h.devices.length > 4 && (
                        <span className="text-xs text-gray-600">
                          +{h.devices.length - 4} {t('homes.more')}
                        </span>
                      )}
                    </div>
                  </td>
                  {/* <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {h.statusCounts.online ? (
                        <div className="flex items-center gap-1">{prettyStatus('online')}<span className="text-xs">{h.statusCounts.online}</span></div>
                      ) : null}
                      {h.statusCounts.offline ? (
                        <div className="flex items-center gap-1">{prettyStatus('offline')}<span className="text-xs">{h.statusCounts.offline}</span></div>
                      ) : null}
                      {h.statusCounts.unknown ? (
                        <div className="flex items-center gap-1">{prettyStatus('unknown')}<span className="text-xs">{h.statusCounts.unknown}</span></div>
                      ) : null}
                      {!h.statusCounts.online && !h.statusCounts.offline && !h.statusCounts.unknown ? (
                        <span className="text-xs text-gray-400">—</span>
                      ) : null}
                    </div>
                  </td> */}
                  <td className="px-5 py-3">
                    <div className="text-sm">
                      {h.lastSeenAt ? <ClientTime iso={h.lastSeenAt} locale="en-GB" timeZone="Europe/Rome" /> : '—'}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/admin/homes/${encodeURIComponent(h.homeId)}`}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      {t('action.view')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {t('pagination.page')} <b>{page}</b> {t('pagination.of')} <b>{data.totalPages}</b>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={!canPrev}
              onClick={() => canPrev && updateQuery({ page: page - 1 })}
              className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl border ${
                canPrev ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-4 h-4" /> {t('pagination.prev')}
            </button>
            <button
              disabled={!canNext}
              onClick={() => canNext && updateQuery({ page: page + 1 })}
              className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl border ${
                canNext ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {t('pagination.next')} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
