export default function AdminHome() {
  return (
    <div className='container-base py-8'>
      <h1 className='section-title'>Admin Overview</h1>
      <p className='text-sm text-slate-600'>KPIs across all homes & devices.</p>
      <div className='mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <div className='card p-5'><div className='text-slate-500 text-sm'>Total Devices</div><div className='kpi'>24</div></div>
        <div className='card p-5'><div className='text-slate-500 text-sm'>Homes</div><div className='kpi'>12</div></div>
        <div className='card p-5'><div className='text-slate-500 text-sm'>Online</div><div className='kpi'>21</div></div>
        <div className='card p-5'><div className='text-slate-500 text-sm'>Alerts (24h)</div><div className='kpi'>3</div></div>
      </div>
    </div>
  );
}
