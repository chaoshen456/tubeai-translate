import { createAdminClient } from '@/lib/supabase/server';
import { type NextRequest } from 'next/server';
import type { VideoStatus } from '@/lib/db-types';

export async function GET(request: NextRequest) {
  const supabase = createAdminClient();

  // Get parameters from query params
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status') as VideoStatus | null;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
  const validPage = Math.max(1, page);
  const validPageSize = Math.min(Math.max(1, pageSize), 100); // Clamp between 1 and 100
  const from = (validPage - 1) * validPageSize;
  const to = from + validPageSize - 1;

  // Build query
  let query = supabase
    .from('videos')
    .select('*', { count: 'exact' })
    .order('ingest_time', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  // Add pagination
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / validPageSize);

  return Response.json({
    data,
    pagination: {
      currentPage: validPage,
      pageSize: validPageSize,
      totalCount,
      totalPages,
    },
  });
}
