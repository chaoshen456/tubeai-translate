import { createClient } from '@/lib/supabase/server';
import { type NextRequest } from 'next/server';
import type { VideoStatus } from '@/lib/db-types';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get status filter from query params
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status') as VideoStatus | null;

  let query = supabase.from('videos').select('*').order('ingest_time', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}