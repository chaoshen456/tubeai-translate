import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Get all videos without auth check
    const { data, error, count } = await supabase
      .from('videos')
      .select('*', { count: 'exact' })
      .order('ingest_time', { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count,
      videos: data?.map(v => ({
        id: v.id,
        youtube_id: v.youtube_id,
        title: v.title,
        status: v.status,
        hasOriginalText: !!v.original_text,
        hasTranslatedText: !!v.translated_text,
        ingest_time: v.ingest_time,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
