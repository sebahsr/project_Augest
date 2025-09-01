export default function AdminDevices() {
  return (
    <div className='container-base py-8'>
      <h1 className='section-title'>All Devices</h1>
      <div className='mt-4 card p-5'>
        Filters will go here (Home, Type, Status, Owner).
      </div>
      <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
        <div className='card p-5'>Device card…</div>
        <div className='card p-5'>Device card…</div>
        <div className='card p-5'>Device card…</div>
      </div>
    </div>
  );
}
