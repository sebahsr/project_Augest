'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { DeviceStatus } from '@/types/iot';

const COLORS: Record<DeviceStatus, string> = {
  online: '#22c55e',
  offline: '#ef4444',
  unknown: '#9ca3af',
};

export default function StatusDonut(props: Partial<Record<DeviceStatus, number>>) {
  const data = (['online','offline','unknown'] as DeviceStatus[])
    .map((k) => ({ name: k, value: props[k] || 0 }))
    .filter((d) => d.value > 0);
console.log('StatusDonut data:', data);
  const total = data.reduce((a, b) => a + b.value, 0);

  return (
    <div className="">
      <div className="text-sm text-gray-500 mb-2">Status mix</div>
      <div className="flex items-center gap-3">
        <div className="w-24 h-24">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius="70%" outerRadius="100%" stroke="none">
                {data.map((entry, i) => (
                  <Cell key={i} fill={COLORS[entry.name as DeviceStatus]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="text-sm">
          {data.length === 0 ? (
            <div className="text-gray-400">—</div>
          ) : (
            data.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ background: COLORS[d.name as DeviceStatus] }}
                />
                <span className="capitalize">{d.name}</span>
                <b className="ml-1">{d.value}</b>
              </div>
            ))
          )}
          <div className="text-gray-500 mt-1">Total: <b>{total}</b></div>
        </div>
      </div>
    </div>
  );
}
