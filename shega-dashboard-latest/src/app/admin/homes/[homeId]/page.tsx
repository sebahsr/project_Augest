import { fetchHomeDetail } from '@/lib/api/dashboard.server';
import HomeDetailClient from '@/components/admin/HomeDetailClient';

type Props = { params: Promise<{ homeId: string }> };

export default async function HomeDetailPage({ params }: Props) {
  const { homeId } = await params;   // ✅ await the object, then use its props
  const detail = await fetchHomeDetail(homeId);
  return (
    <main className="p-4 md:p-6">
      <HomeDetailClient detail={detail} />
    </main>
  );
}