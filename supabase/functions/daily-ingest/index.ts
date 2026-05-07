// Daily video ingestion Edge Function
// Runs on a schedule to fetch and translate YouTube AI videos

import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  try {
    // Verify authorization
    const authHeader = req.headers.get('authorization');
    const expectedAuth = `Bearer ${Deno.env.get('CRON_SECRET')}`;

    if (!Deno.env.get('CRON_SECRET') || authHeader !== expectedAuth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    let processed = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Fetch popular AI videos
    const videos = await fetchPopularAIVideos(10);

    for (const video of videos) {
      try {
        // Check if video already exists
        const { data: existing } = await supabase
          .from('videos')
          .select('id')
          .eq('youtube_id', video.id.videoId)
          .single();

        if (existing) {
          skipped++;
          continue;
        }

        // Create video record
        const { data: newVideo, error: insertError } = await supabase
          .from('videos')
          .insert({
            youtube_id: video.id.videoId,
            title: video.snippet.title,
            thumbnail_url: video.snippet?.thumbnails?.high?.url,
            status: 'Pending Translation',
          })
          .select()
          .single();

        if (insertError || !newVideo) {
          errors.push(`Insert error for ${video.id.videoId}: ${insertError?.message}`);
          continue;
        }

        // Skip transcript fetching in Deno environment
        // The main Next.js app handles transcript fetching using yt-transcript-kit
        // Mark as pending review for manual processing
        await supabase
          .from('videos')
          .update({
            status: 'Pending Review',
            rejection_note: 'Transcript to be fetched by main app using yt-transcript-kit',
          })
          .eq('id', newVideo.id);

        processed++;
      } catch (error) {
        errors.push(`Error processing video: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        skipped,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal error',
      }),
      { status: 500 }
    );
  }
});

interface YouTubeVideo {
  id: { videoId: string };
  snippet: {
    title: string;
    thumbnails?: {
      high?: { url: string };
    };
  };
}

async function fetchPopularAIVideos(maxResults: number): Promise<YouTubeVideo[]> {
  const apiKey = Deno.env.get('YOUTUBE_API_KEY');
  if (!apiKey) {
    throw new Error('YOUTUBE_API_KEY not configured');
  }

  const url = new URL('https://www.googleapis.com/youtube/v3/videos');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('chart', 'mostPopular');
  url.searchParams.set('videoCategoryId', '28'); // AI category
  url.searchParams.set('regionCode', 'US');
  url.searchParams.set('maxResults', maxResults.toString());
  url.searchParams.set('key', apiKey);

  const response = await fetch(url.toString());
  const data = await response.json();
  return data.items || [];
}
