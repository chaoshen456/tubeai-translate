import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { fetchPopularAIVideos } from '@/lib/services/youtube';
import { translateTranscript } from '@/lib/services/translation';
import { transcribeAudio } from '@/lib/services/transcription';
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

        // Create video record
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

        // Get transcript from YouTube captions, with Whisper fallback
        const transcript = await getYouTubeTranscriptSimple(video.id);

        let finalTranscript = transcript;

        if (!transcript) {
          // Try Whisper as fallback if enabled
          try {
            const whisperResult = await transcribeAudio(video.id, 'videoId', 'mp3');
            finalTranscript = whisperResult.fullText;
          } catch (whisperError) {
            // Whisper fallback failed - mark for manual review
            await supabase
              .from('videos')
              .update({
                status: 'Pending Review' as VideoStatus,
                rejection_note: `No captions available. Whisper failed: ${whisperError instanceof Error ? whisperError.message : String(whisperError)}`,
              })
              .eq('id', newVideo.id);
            processed++;
            continue;
          }
        }

        // Translate
        const translated = await translateTranscript(finalTranscript!);

        // Update with transcript and translation
        await supabase
          .from('videos')
          .update({
            original_text: finalTranscript,
            translated_text: translated,
            status: 'Pending Review' as VideoStatus,
          })
          .eq('id', newVideo.id);

        processed++;
      } catch (error) {
        errors.push(`Error processing video ${video.id}: ${error instanceof Error ? error.message : String(error)}`);
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

// Get transcript from YouTube captions, with fallback to Whisper via transcription service
async function getYouTubeTranscriptSimple(videoId: string): Promise<string | null> {
  try {
    const { fetchVideoCaptions, downloadCaption } = await import('@/lib/services/youtube');

    const captions = await fetchVideoCaptions(videoId);
    const englishCaption = captions.find((c) => c.language === 'en') || captions[0];

    if (!englishCaption) {
      return null;
    }

    let content: string;
    try {
      content = await downloadCaption(englishCaption.id, 'vtt');
    } catch {
      content = await downloadCaption(englishCaption.id, 'srt');
    }

    // Extract text only
    const lines = content.split('\n');
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