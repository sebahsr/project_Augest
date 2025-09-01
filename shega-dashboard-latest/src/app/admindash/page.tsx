import { fetchHomes } from '@/lib/api/dashboard.server';
import HomesTableClient from '@/components/admin/HomesTableClient';


type Props = {
  searchParams: {
    page?: string;
    limit?: string;
    search?: string;
    status?: 'online' | 'offline' | 'unknown';
    type?: 'AIRNODE' | 'STOVENODE';
  };
};

export default async function AdminHomesPage({ searchParams }: Props) {
  const page = searchParams.page ?? '1';
  const limit = searchParams.limit ?? '10';
  const search = searchParams.search ?? '';
  const status = (searchParams.status as Props['searchParams']['status']) ?? undefined;
  const type = (searchParams?.type as Props['searchParams']['type']) ?? undefined;

  const data = await fetchHomes({ page, limit, search, status, type });

  return (
    <main className="p-4 md:p-6 max-w-7xl mx-auto">
      <HomesTableClient
        data={{
          homes: data.homes,
          page: data.page,
          totalPages: data.totalPages,
          total: data.total,
          limit: data.limit,
        }}
      />
    </main>
  );
}
