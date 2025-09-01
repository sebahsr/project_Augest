// // frontend/components/EmergencySummary.tsx
// // import useSWR, { mutate } from 'swr';
// import { getEmergencySummary, ackEmergency, unackEmergency } from '../lib/api';

// export function EmergencySummary({ homeId, since, until }:{homeId:string; since?:string; until?:string}) {
// //   const { data } = useSWR(['emergSummary', homeId, since, until], () => getEmergencySummary(homeId, { since, until }), { refreshInterval: 10_000 });
//   if (!data) return <div>Loading…</div>;
//   return (
//     <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//       <Card title="Total" value={data.total} />
//       {data.bySeverity?.map((s:any)=> <Card key={s.severity} title={s.severity} value={s.count} />)}
//       {data.byType?.slice(0,4).map((t:any)=> <Card key={t.type} title={t.type} value={t.count} />)}
//     </div>
//   );
// }
// function Card({title,value}:{title:string;value:any}) {
//   return <div className="rounded-xl border p-4">
//     <div className="text-xs text-gray-500">{title}</div>
//     <div className="text-2xl font-semibold">{value}</div>
//   </div>;
// }
