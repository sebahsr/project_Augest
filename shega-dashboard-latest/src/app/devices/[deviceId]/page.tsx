type Props = { params: { deviceId: string } };
export default function DeviceDetail({ params }: Props) {
  return (
    <div className='space-y-4'>
      <h1 className='text-2xl font-semibold'>Device: {params.deviceId}</h1>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <div className='rounded-2xl border bg-white p-4 shadow-sm'>Metrics + gauges</div>
        <div className='rounded-2xl border bg-white p-4 shadow-sm'>Controls (fan/buzzer)</div>
      </div>
    </div>
  );
}