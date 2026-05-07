import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import {
  fetchPopularAIVideos,
  searchAIVideos,
  searchChannel,
  fetchVideosByChannel,
  YouTubeApiLogEntry,
} from '@/lib/services/youtube';
import { translateTranscript } from '@/lib/services/translation';
import { getYouTubeTranscript } from '@/lib/services/transcription';
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

  // Get parameters from query params
  const url = new URL(request.url);
  const source = url.searchParams.get('source') || 'search'; // 'popular', 'search', or 'channel'
  const channel = url.searchParams.get('channel') || '';
  const maxResults = parseInt(url.searchParams.get('maxResults') || '10', 10);
  const validMaxResults = Math.min(Math.max(maxResults || 10, 1), 50); // Clamp between 1 and 50

  try {
    const supabase = createAdminClient();
    let processed = 0;
    let skipped = 0;
    const errors: string[] = [];
    const apiLogs: YouTubeApiLogEntry[] = [];

    // Fetch AI videos based on source
    let videos;
    if (source === 'popular') {
      console.log('[scheduler] Fetching', validMaxResults, 'popular videos');
      videos = await fetchPopularAIVideos(validMaxResults, apiLogs);
    } else if (source === 'channel' && channel) {
      console.log('[scheduler] Searching channel:', channel);
      // First search for the channel to get the channel ID
      const channelInfo = await searchChannel(channel, apiLogs);
      if (!channelInfo) {
        return Response.json({ error: `Channel not found: ${channel}` }, { status: 404 });
      }
      console.log('[scheduler] Found channel:', channelInfo.title, 'ID:', channelInfo.id);
      videos = await fetchVideosByChannel(channelInfo.id, validMaxResults, apiLogs);
    } else {
      console.log('[scheduler] Searching', validMaxResults, 'AI videos');
      videos = await searchAIVideos(validMaxResults, 'viewCount', apiLogs);
    }

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

        // Check transcript (with logging)
        const videoApiLogs: YouTubeApiLogEntry[] = [];
        console.log('[scheduler] Processing video:', video.id, 'title:', video.title);
        const transcript = await getYouTubeTranscript(video.id, videoApiLogs);
        console.log('[scheduler] Transcript result for', video.id, ':', transcript ? `success (${transcript.segments.length} segments)` : 'null');

        if (!transcript) {
          // No captions available - mark as rejected with reason
          await supabase
            .from('videos')
            .update({
              status: 'Rejected' as VideoStatus,
              rejection_note: '此视频无字幕，无法处理',
              youtube_api_log: [...apiLogs, ...videoApiLogs],
            })
            .eq('id', newVideo.id);
          processed++;
          continue;
        }

        // Always save the original transcript first
        const updateData: Record<string, unknown> = {
          original_text: transcript.fullText,
          youtube_api_log: [...apiLogs, ...videoApiLogs],
        };

        // Try to translate (don't block on translation failure)
        let translationError: string | null = null;
        try {
          const translated = await translateTranscript(transcript.fullText);
          updateData.translated_text = translated;
          updateData.status = 'Pending Review' as VideoStatus;
        } catch (translateError) {
          // Translation failed, but transcript is saved
          translationError = translateError instanceof Error ? translateError.message : String(translateError);
          updateData.status = 'Pending Translation' as VideoStatus;
          updateData.rejection_note = `翻译失败: ${translationError}`;
        }

        // Update with transcript (and translation if successful)
        await supabase
          .from('videos')
          .update(updateData)
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

// getYouTubeTranscriptSimple removed - now using getYouTubeTranscript from transcription.ts