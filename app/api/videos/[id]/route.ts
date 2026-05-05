import { createClient } from '@/lib/supabase/server';
import { type NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const videoId = parseInt(id);

  if (isNaN(videoId)) {
    return Response.json({ error: 'Invalid video ID' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', videoId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return Response.json({ error: 'Video not found' }, { status: 404 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const videoId = parseInt(id);

  const { action, translated_text, rejection_note } = await request.json();

  if (isNaN(videoId)) {
    return Response.json({ error: 'Invalid video ID' }, { status: 400 });
  }

  let updateData: Record<string, unknown> = {};

  switch (action) {
    case 'save':
      updateData = { translated_text };
      break;
    case 'approve':
      updateData = {
        status: 'Ready to Publish',
        review_time: new Date().toISOString(),
      };
      break;
    case 'reject':
      updateData = {
        status: 'Rejected',
        review_time: new Date().toISOString(),
        rejection_note,
      };
      break;
    default:
      return Response.json({ error: 'Invalid action' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('videos')
    .update(updateData)
    .eq('id', videoId)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}