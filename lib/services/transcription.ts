// Transcription service with YouTube captions and Whisper fallback

import { fetchVideoCaptions, downloadCaption } from './youtube';
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
    'X-OpenRouter-Title': 'YouTube AI Translator',
  },
});

const WHISPER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4.1-mini';

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

// Parse VTT format to segments
function parseVTT(vtt: string): TranscriptSegment[] {
  const lines = vtt.split('\n');
  const segments: TranscriptSegment[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Match timestamp line (e.g., 00:00:01.000 --> 00:00:04.000)
    const timestampMatch = line.match(/(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/);

    if (timestampMatch) {
      const start = parseTimestamp(timestampMatch[1]);
      const end = parseTimestamp(timestampMatch[2]);

      // Collect text until next timestamp or cue settings
      let text = '';
      for (let j = i + 1; j < lines.length; j++) {
        const nextLine = lines[j].trim();
        if (nextLine.includes('-->') || (nextLine && !nextLine.startsWith('<') && nextLine[0] !== '<')) {
          break;
        }
        if (nextLine && !nextLine.includes('-->') && !nextLine.startsWith('<')) {
          text += nextLine + ' ';
          i = j;
        }
      }

      if (text.trim()) {
        segments.push({
          start,
          end,
          text: text.trim(),
        });
      }
    }
  }

  return segments;
}

// Parse SRT format to segments
function parseSRT(srt: string): TranscriptSegment[] {
  const blocks = srt.split('\n\n');
  const segments: TranscriptSegment[] = [];

  for (const block of blocks) {
    const lines = block.split('\n');
    if (lines.length < 3) continue;

    const timestampLine = lines[1];
    const timestampMatch = timestampLine.match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);

    if (timestampMatch) {
      const start = parseTimestamp(timestampMatch[1].replace(',', '.'));
      const end = parseTimestamp(timestampMatch[2].replace(',', '.'));

      const textLines = lines.slice(2);
      const text = textLines.join(' ').trim();

      if (text) {
        segments.push({ start, end, text });
      }
    }
  }

  return segments;
}

// Convert timestamp to seconds
function parseTimestamp(timestamp: string): number {
  const parts = timestamp.split(':');
  const seconds = parseFloat(parts[2]);
  return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + seconds;
}

// Format seconds to timestamp
export function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Get transcript from YouTube captions
export async function getYouTubeTranscript(videoId: string): Promise<Transcript | null> {
  try {
    const captions = await fetchVideoCaptions(videoId);

    // Prefer English captions
    const englishCaption = captions.find(c => c.language === 'en') || captions[0];

    if (!englishCaption) {
      return null;
    }

    let captionContent: string;
    try {
      captionContent = await downloadCaption(englishCaption.id, 'vtt');
    } catch {
      // Fallback to SRT format
      captionContent = await downloadCaption(englishCaption.id, 'srt');
    }

    const segments = captionContent.includes('-->')
      ? parseVTT(captionContent)
      : parseSRT(captionContent);

    const fullText = segments.map(s => s.text).join('\n');

    return {
      fullText,
      segments,
      language: englishCaption.language,
    };
  } catch {
    return null;
  }
}

// Fallback to Whisper transcription
export async function transcribeWithWhisper(
  videoUrl: string,
  language: string = 'en'
): Promise<Transcript> {
  // Note: In production, you would need to download the audio first
  // This requires additional setup with youtube-dl or similar
  // For now, this is a placeholder that shows the API usage

  const transcription = await openai.audio.transcriptions.create({
    file: await downloadAudio(videoUrl), // This is a placeholder - you need to implement audio download
    model: WHISPER_MODEL,
    language: language,
    response_format: 'verbose_json',
    timestamp_granularities: ['word'],
  });

  // Convert to our format
  const segments = transcription.segments?.map(seg => ({
    start: seg.start,
    end: seg.end,
    text: seg.text,
  })) || [];

  return {
    fullText: transcription.text,
    segments,
    language: transcription.language,
  };
}

// Placeholder for audio download - you would need to implement this
// using youtube-dl, yt-dlp, or similar
async function downloadAudio(videoUrl: string): Promise<Blob> {
  throw new Error('Audio download not implemented. Use youtube-dl or similar to extract audio.');
}

// Main function to get transcript with fallback
export async function getTranscript(
  videoId: string,
  youtubeUrl: string
): Promise<Transcript> {
  // Try YouTube captions first
  const ytTranscript = await getYouTubeTranscript(videoId);

  if (ytTranscript) {
    return ytTranscript;
  }

  // Fallback to Whisper
  // Note: In production, implement proper audio extraction
  // return await transcribeWithWhisper(youtubeUrl);

  throw new Error('No transcript available. Either add captions to the video or implement Whisper fallback.');
}