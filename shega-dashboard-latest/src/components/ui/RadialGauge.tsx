'use client';

import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';

type Props = {
  value: number;
  max: number;
  label: string;
  unit?: string;
  goodMax?: number;    // threshold for "good" region (e.g. 800ppm for CO2)
  warnMax?: number;    // threshold for "warning" (e.g. 1200ppm)
};

export default function RadialGauge({ value, max, label, unit, goodMax, warnMax }: Props) {
  const v = Math.max(0, Math.min(value, max));
  const pct = (v / max) * 100;

  // Simple severity for text indicator
  let tone = 'text-gray-800';
  if (warnMax && v > warnMax) tone = 'text-red-600';
  else if (goodMax && v > goodMax) tone = 'text-amber-600';
  else tone = 'text-emerald-700';

  const data = [{ name: 'value', value: v, fill: '#6366f1' }];

  return (
    <div className="p-4 rounded-2xl border bg-white shadow-sm flex flex-col items-center">
      <div className="w-full h-40">
        <ResponsiveContainer>
          <RadialBarChart
            data={data}
            startAngle={220}
            endAngle={-40}
            innerRadius="70%"
            outerRadius="100%"
          >
            <PolarAngleAxis type="number" domain={[0, max]} angleAxisId={0} tick={false} />
            <RadialBar
              dataKey="value"
              background
              cornerRadius={10}
              direction={'clockwise'}
            />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <div className="text-sm text-gray-500">{label}</div>
      <div className={`text-2xl font-semibold ${tone}`}>
        {Number.isFinite(value) ? value.toFixed(0) : '—'}{unit ? <span className="text-base text-gray-500 ml-1">{unit}</span> : null}
      </div>
      <div className="text-xs text-gray-400 mt-1">max {max}{unit || ''}</div>
    </div>
  );
}
