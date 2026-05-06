import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { fetchPopularAIVideos } from '@/lib/services/youtube';
import { translateTranscript } from '@/lib/services/translation';
import type { VideoStatus } from '@/lib/db-types';

export async function GET(request: NextRequest) {
  return runIngestion(request);
}

export async function POST(request: NextRequest) {
  return runIngestion(request);
}

async function runIngestion(request: NextRequest) {
  // Verify authorization - supports both CRON_SECRET and manual trigger
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || (authHeader !== expectedAuth && authHeader !== 'Bearer manual-trigger-allowed')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
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
          .eq('youtube_id', video.id)
          .single();

        if (existing) {
          skipped++;
          continue;
        }

        // Create video record first
        const { data: newVideo, error: insertError } = await supabase
          .from('videos')
          .insert({
            youtube_id: video.id,
            title: video.title,
            thumbnail_url: video.thumbnails?.high?.url || null,
            status: 'Pending Translation' as VideoStatus,
          })
          .select()
          .single();

        if (insertError) {
          errors.push(`Failed to create video ${video.id}: ${insertError.message}`);
          continue;
        }

        // Check transcript
        const transcript = await getYouTubeTranscriptSimple(video.id);

        if (!transcript) {
          // No captions available - mark as rejected with reason
          await supabase
            .from('videos')
            .update({
              status: 'Rejected' as VideoStatus,
              rejection_note: '此视频无弹幕，由于合规问题，无法处理',
            })
            .eq('id', newVideo.id);
          processed++;
          continue;
        }

        // Translate
        const translated = await translateTranscript(transcript);

        // Update with transcript and translation
        await supabase
          .from('videos')
          .update({
            original_text: transcript,
            translated_text: translated,
            status: 'Pending Review' as VideoStatus,
          })
          .eq('id', newVideo.id);

        processed++;
      } catch (error) {
        errors.push(
          `Error processing video ${video.id}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return Response.json({
      success: true,
      processed,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Scheduler error:', error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Internal error',
      },
      { status: 500 }
    );
  }
}

// Get transcript from YouTube captions
async function getYouTubeTranscriptSimple(videoId: string): Promise<string | null> {
  try {
    const { fetchVideoCaptions, downloadCaptionForVideo } = await import('@/lib/services/youtube');

    const captions = await fetchVideoCaptions(videoId);
    const englishCaption = captions.find((c) => c.language === 'en') || captions[0];

    if (!englishCaption) {
      return null;
    }

    // Use TimedText API to download caption
    const content = await downloadCaptionForVideo(
      videoId,
      englishCaption.language,
      englishCaption.name
    );

    // Parse XML format to extract text
    const textRegex = /<text start="[^"]*" dur="[^"]*"[^>]*>([^<]*)<\/text>/g;
    const textLines: string[] = [];
    let match;

    while ((match = textRegex.exec(content)) !== null) {
      const text = match[1]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      if (text.trim()) {
        textLines.push(text.trim());
      }
    }

    return textLines.length > 0 ? textLines.join(' ') : null;
  } catch {
    return null;
  }
}