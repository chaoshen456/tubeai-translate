import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { fetchPopularAIVideos, YouTubeApiLogEntry } from '@/lib/services/youtube';
import { getYouTubeTranscript } from '@/lib/services/transcription';
import { translateTranscript } from '@/lib/services/translation';

export async function GET(request: NextRequest) {
  const results: any[] = [];
  const allLogs: string[] = [];

  try {
    const supabase = createAdminClient();

    // Fetch popular videos
    const videos = await fetchPopularAIVideos(3);  // Only test 3 videos
    allLogs.push(`Fetched ${videos.length} popular videos`);

    for (const video of videos) {
      const videoId = video.id;
      allLogs.push(`\nProcessing video: ${videoId}, title: ${video.title}`);

      // Check if already exists
      const { data: existing } = await supabase
        .from('videos')
        .select('id, youtube_id, original_text, translated_text, status')
        .eq('youtube_id', videoId)
        .single();

      if (existing) {
        allLogs.push(`Video ${videoId} already exists, checking data...`);
        results.push({
          videoId,
          title: video.title,
          skipped: true,
          existingStatus: existing.status,
          hasOriginalText: !!existing.original_text,
          hasTranslatedText: !!existing.translated_text,
          originalTextLength: existing.original_text?.length || 0,
          translatedTextLength: existing.translated_text?.length || 0,
        });
        continue;
      }

      // Try to get transcript
      const videoApiLogs: YouTubeApiLogEntry[] = [];
      allLogs.push(`Calling getYouTubeTranscript(${videoId})...`);

      try {
        const transcript = await getYouTubeTranscript(videoId, videoApiLogs);

        allLogs.push(`getYouTubeTranscript result: ${transcript ? `success (${transcript.segments.length} segments, language: ${transcript.language})` : 'null'}`);

        if (transcript) {
          // Test translation
          allLogs.push(`Testing translation...`);
          let translatedText = null;
          let translationError = null;

          try {
            translatedText = await translateTranscript(transcript.fullText);
            allLogs.push(`Translation success! Length: ${translatedText.length}`);
          } catch (transError) {
            translationError = transError instanceof Error ? transError.message : String(transError);
            allLogs.push(`Translation failed: ${translationError}`);
          }

          // Save to database
          const { data: newVideo, error } = await supabase
            .from('videos')
            .insert({
              youtube_id: videoId,
              title: video.title,
              thumbnail_url: video.thumbnails?.high?.url || null,
              original_text: transcript.fullText,
              translated_text: translatedText,
              status: translatedText ? 'Pending Review' : 'Pending Translation',
            })
            .select()
            .single();

          results.push({
            videoId,
            title: video.title,
            success: true,
            language: transcript.language,
            segmentCount: transcript.segments.length,
            originalTextLength: transcript.fullText.length,
            translatedTextLength: translatedText?.length || 0,
            translationError,
            savedToDb: !error,
            dbError: error?.message,
          });

          allLogs.push(`Saved to DB: ${!error ? 'success' : error.message}`);
        } else {
          results.push({
            videoId,
            title: video.title,
            success: false,
            reason: 'Transcript is null',
            apiLogs: videoApiLogs,
          });
          allLogs.push(`Transcript is null, apiLogs: ${JSON.stringify(videoApiLogs)}`);
        }
      } catch (error) {
        results.push({
          videoId,
          title: video.title,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
        allLogs.push(`Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      logs: allLogs,
    });
  } catch (error) {
    allLogs.push(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json({
      success: false,
      logs: allLogs,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
