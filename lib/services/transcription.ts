// Transcription service with YouTube captions and Whisper fallback

import { fetchVideoCaptions, downloadCaption } from './youtube';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
const WHISPER_MODEL = 'openai/whisper-large-v3';

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

// Download audio from YouTube video for transcription
// Note: This requires ytdl-core to be installed
// npm install ytdl-core @types/ytdl-core
async function downloadYouTubeAudio(videoId: string): Promise<Buffer> {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // Use dynamic require to handle optional dependency
  // In CommonJS, ytdl-core exports the function directly
  let ytdlFn: (url: string, options?: Record<string, unknown>) => {
    on: (event: string, callback: (chunk: Buffer) => void) => void;
  };

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('ytdl-core');
    // Handle both ESM default export and CommonJS direct export
    ytdlFn = mod.default || mod;
  } catch {
    throw new Error(
      'ytdl-core not installed. Install it with: npm install ytdl-core @types/ytdl-core'
    );
  }

  const stream = ytdlFn(videoUrl, { quality: 'highestaudio' });

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

// Public interface for audio transcription
// Accepts pre-extracted audio buffer or extracts from videoId
export async function transcribeAudio(
  input: Buffer | string,
  type: 'buffer' | 'videoId' = 'videoId',
  format: 'wav' | 'mp3' | 'ogg' | 'm4a' = 'wav'
): Promise<Transcript> {
  let audioBuffer: Buffer;

  if (type === 'videoId') {
    audioBuffer = await downloadYouTubeAudio(input as string);
  } else {
    audioBuffer = input as Buffer;
  }

  return transcribeWithWhisper(audioBuffer, format);
}

// Fallback to Whisper transcription using OpenRouter
export async function transcribeWithWhisper(
  audioBuffer: Buffer,
  format: 'wav' | 'mp3' | 'ogg' | 'm4a' = 'wav'
): Promise<Transcript> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is required for Whisper transcription');
  }

  const base64Audio = audioBuffer.toString('base64');

  const response = await fetch('https://openrouter.ai/api/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
      'X-OpenRouter-Title': 'YouTube AI Translator',
    },
    body: JSON.stringify({
      model: WHISPER_MODEL,
      input_audio: {
        data: base64Audio,
        format: format,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Whisper transcription failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const text = result.text || '';

  // Create simple segment from the full text
  const segments: TranscriptSegment[] = [{
    start: 0,
    end: 0,
    text: text,
  }];

  return {
    fullText: text,
    segments,
    language: 'en',
  };
}

// Main function to get transcript with fallback
export async function getTranscript(
  videoId: string,
  youtubeUrl?: string,
  enableWhisperFallback: boolean = false
): Promise<Transcript> {
  // Try YouTube captions first
  const ytTranscript = await getYouTubeTranscript(videoId);

  if (ytTranscript) {
    return ytTranscript;
  }

  // Fallback to Whisper transcription
  if (enableWhisperFallback) {
    // Use videoId to fetch audio via ytdl-core and transcribe with Whisper
    return await transcribeAudio(videoId, 'videoId', 'mp3');
  }

  throw new Error('No transcript available. Either add captions to the video or enable Whisper fallback.');
}