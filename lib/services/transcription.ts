// Transcription service using yt-transcript-kit

import { fetchYouTubeTranscript as ytFetchTranscript, YouTubeTranscriptResult } from 'yt-transcript-kit';
import { YouTubeApiLogEntry } from './youtube';

// Setup proxy using undici's setGlobalDispatcher (same as yt-transcript-kit CLI does)
const proxyUrl = process.env.YOUTUBE_PROXY
  || process.env.HTTPS_PROXY
  || process.env.HTTP_PROXY
  || process.env.https_proxy
  || process.env.http_proxy;

console.log('[transcription] Module loaded, Proxy URL:', proxyUrl || 'not set');

// Setup proxy immediately when module loads
if (proxyUrl) {
  try {
    // Use require for synchronous import (works in CommonJS/ESM interop)
    const undici = require('undici');
    const { ProxyAgent, setGlobalDispatcher } = undici;
    const proxyAgent = new ProxyAgent({ uri: proxyUrl });
    setGlobalDispatcher(proxyAgent);
    console.log('[transcription] ✓ Global proxy dispatcher set for:', proxyUrl);
  } catch (e) {
    console.error('[transcription] ✖ Failed to setup proxy with undici:', e);
    console.error('[transcription] Please install undici: npm install undici');
  }
} else {
  console.log('[transcription] No proxy configured, using direct connection');
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface Transcript {
  fullText: string;
  segments: TranscriptSegment[];
  language: string;
}

// Format seconds to timestamp
export function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export async function getYouTubeTranscript(
  videoId: string,
  logs?: YouTubeApiLogEntry[]
): Promise<Transcript | null> {
  try {
    console.log('[transcription] Fetching transcript for video:', videoId);
    // Try without language restriction first, then try English if needed
    let result: YouTubeTranscriptResult;
    try {
      // First try: get any available transcript
      result = await ytFetchTranscript(videoId, {});
      console.log('[transcription] Got transcript for', videoId, '- language:', result.languageCode, 'segments:', result.segments.length);
    } catch (firstError) {
      console.log('[transcription] First attempt failed for', videoId, ':', firstError instanceof Error ? firstError.message : String(firstError));
      // Second try: specify English
      result = await ytFetchTranscript(videoId, { languages: ['en'] });
      console.log('[transcription] Second attempt succeeded for', videoId, '- language:', result.languageCode);
    }

    // Map yt-transcript-kit result to our Transcript type
    const segments = result.segments.map((seg) => ({
      start: seg.offset,
      end: seg.offset + seg.duration,
      text: seg.text,
    }));

    const transcript: Transcript = {
      fullText: result.fullText,
      segments,
      language: result.languageCode,
    };

    if (logs) {
      logs.push({
        api_call: 'getYouTubeTranscript',
        request: { videoId },
        response: {
          segmentCount: segments.length,
          language: result.languageCode,
          languageLabel: result.languageLabel,
          isGenerated: result.isGenerated,
          availableLanguages: result.availableLanguageCodes,
        },
        timestamp: new Date().toISOString(),
      });
    }

    return transcript;
  } catch (error) {
    console.error('[transcription] Error fetching transcript for', videoId, ':', error);
    if (logs) {
      logs.push({
        api_call: 'getYouTubeTranscript',
        request: { videoId },
        response: null,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
    }
    return null;
  }
}
