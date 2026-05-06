// Daily video ingestion Edge Function
// Runs on a schedule to fetch and translate YouTube AI videos

//import { serve } from 'https://deno.land/x/supabase_functions@0.1.0/mod.ts';
import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  try {
    // Verify authorization
  

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
            thumbnail_url: video.snippet.thumbnails?.high?.url,
            status: 'Pending Translation',
          })
          .select()
          .single();

        if (insertError || !newVideo) {
          errors.push(`Insert error for ${video.id.videoId}: ${insertError?.message}`);
          continue;
        }

        // Get transcript and translate
        const transcript = await getYouTubeTranscript(video.id.videoId);

        if (!transcript) {
          // No transcript available - mark for manual review
          await supabase
            .from('videos')
            .update({
              status: 'Pending Review',
              rejection_note: 'No captions available for this video.',
            })
            .eq('id', newVideo.id);
          processed++;
          continue;
        }

        const translated = await translateText(transcript);

        await supabase
          .from('videos')
          .update({
            original_text: transcript,
            translated_text: translated,
            status: 'Pending Review',
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

async function getYouTubeTranscript(videoId: string): Promise<string | null> {
  try {
    const apiKey = Deno.env.get('YOUTUBE_API_KEY');
    const captionsUrl = new URL('https://www.googleapis.com/youtube/v3/captions');
    captionsUrl.searchParams.set('part', 'snippet');
    captionsUrl.searchParams.set('videoId', videoId);
    captionsUrl.searchParams.set('key', apiKey || '');

    const response = await fetch(captionsUrl.toString());
    const data = await response.json();

    if (!data.items?.length) {
      return null;
    }

    // Get first English caption
    const caption = data.items.find((c: { snippet: { language: string } }) => c.snippet.language === 'en') || data.items[0];

    // Download caption content
    const captionUrl = new URL('https://www.googleapis.com/youtube/v3/captions');
    captionUrl.searchParams.set('id', caption.id);
    captionUrl.searchParams.set('tfmt', 'vtt');
    captionUrl.searchParams.set('key', apiKey || '');

    const captionResponse = await fetch(captionUrl.toString());
    const captionContent = await captionResponse.text();

    // Parse VTT to extract text
    const lines = captionContent.split('\n');
    const textLines: string[] = [];
    let inTimestamp = false;

    for (const line of lines) {
      if (line.includes('-->') || /^\d+$/.test(line.trim())) {
        inTimestamp = !inTimestamp;
        continue;
      }
      if (!inTimestamp && line.trim() && !line.startsWith('<') && !line.startsWith('NOTE')) {
        textLines.push(line.trim());
      }
    }

    return textLines.join(' ');
  } catch {
    return null;
  }
}

async function translateText(text: string): Promise<string> {
  const openrouterKey = Deno.env.get('OPENROUTER_API_KEY');
  const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:3000';

  if (!openrouterKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openrouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': siteUrl,
      'X-OpenRouter-Title': 'YouTube AI Translator',
    },
    body: JSON.stringify({
      model: 'openai/gpt-4.1-mini',
      messages: [{
        role: 'user',
        content: `Translate the following English text to Chinese (Simplified). Keep technical terms accurate and maintain a conversational tone.\n\n${text}`,
      }],
    }),
  });

  const data = await response.json();
  return data.choices[0]?.message?.content || text;
}