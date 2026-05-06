// Transcription service with YouTube captions and Whisper fallback

import { Innertube } from 'youtubei.js';
import { YouTubeApiLogEntry } from './youtube';

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

let youtubeInstance: Innertube | null = null;

async function getYouTube(): Promise<Innertube> {
  if (!youtubeInstance) {
    youtubeInstance = await Innertube.create();
  }
  return youtubeInstance;
}

function resetYouTube() {
  youtubeInstance = null;
}

interface YTTranscriptSegment {
  start_ms: string;
  end_ms: string;
  snippet: { toString(): string };
}

function isTranscriptSegment(seg: unknown): seg is YTTranscriptSegment {
  return (
    typeof seg === 'object' &&
    seg !== null &&
    'start_ms' in seg &&
    'end_ms' in seg &&
    'snippet' in seg
  );
}

export async function getYouTubeTranscript(
  videoId: string,
  logs?: YouTubeApiLogEntry[]
): Promise<Transcript | null> {
  try {
    const youtube = await getYouTube();
    const info = await youtube.getInfo(videoId);
    let transcriptInfo = await info.getTranscript();

    const availableLanguages = transcriptInfo.languages;
    let selectedLanguage = transcriptInfo.selectedLanguage;

    const enLang = availableLanguages.find((l) => l.startsWith('en'));
    if (enLang && enLang !== selectedLanguage) {
      transcriptInfo = await transcriptInfo.selectLanguage(enLang);
      selectedLanguage = transcriptInfo.selectedLanguage;
    }

    const segments = transcriptInfo.transcript?.content?.body?.initial_segments;

    if (!segments || segments.length === 0) {
      if (logs) {
        logs.push({
          api_call: 'getYouTubeTranscript',
          request: { videoId },
          response: {
            availableLanguages,
            selectedLanguage,
            segmentCount: 0,
          },
          timestamp: new Date().toISOString(),
        });
      }
      return null;
    }

    const transcriptSegments: TranscriptSegment[] = [];
    let skippedSegments = 0;

    for (const segment of segments) {
      if (isTranscriptSegment(segment)) {
        const start = parseInt(segment.start_ms, 10) / 1000;
        const end = parseInt(segment.end_ms, 10) / 1000;

        if (isNaN(start) || isNaN(end)) {
          skippedSegments++;
          continue;
        }

        transcriptSegments.push({
          start,
          end,
          text: segment.snippet.toString().trim(),
        });
      } else {
        skippedSegments++;
      }
    }

    if (transcriptSegments.length === 0) {
      if (logs) {
        logs.push({
          api_call: 'getYouTubeTranscript',
          request: { videoId },
          response: null,
          error: `No valid segments after parsing. Total raw: ${segments.length}, skipped: ${skippedSegments}`,
          timestamp: new Date().toISOString(),
        });
      }
      return null;
    }

    const fullText = transcriptSegments.map((s) => s.text).join('\n');

    if (logs) {
      logs.push({
        api_call: 'getYouTubeTranscript',
        request: { videoId },
        response: {
          segmentCount: transcriptSegments.length,
          skippedSegments,
          selectedLanguage,
          availableLanguages,
        },
        timestamp: new Date().toISOString(),
      });
    }

    return {
      fullText,
      segments: transcriptSegments,
      language: selectedLanguage,
    };
  } catch (error) {
    resetYouTube();
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

// Parse YouTube TimedText XML format
function parseTimedTextXML(xml: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  // Match <text start="..." dur="...">...</text>
  const textRegex = /<text start="([^"]*)" dur="([^"]*)"[^>]*>([^<]*)<\/text>/g;

  let match;
  while ((match = textRegex.exec(xml)) !== null) {
    const start = parseFloat(match[1]);
    const end = start + parseFloat(match[2]);
    const text = decodeXMLText(match[3]);

    if (text.trim()) {
      segments.push({ start, end, text: text.trim() });
    }
  }

  return segments;
}

// Decode XML entities
function decodeXMLText(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Download audio from YouTube video for transcription
// Note: This requires ytdl-core to be installed
// npm install ytdl-core @types/ytdl-core
async function downloadYouTubeAudio(videoId: string): Promise<Buffer> {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // Use dynamic require to handle optional dependency
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ytdl = require('ytdl-core');

  // Build request options with proxy support
  const requestOptions: Record<string, unknown> = {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    },
  };

  // Add proxy support for ytdl-core
  const httpsProxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  if (httpsProxy) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const proxyAgent = require('proxy-agent');
      requestOptions.agent = new proxyAgent(httpsProxy);
    } catch {
      // proxy-agent not installed, continue without proxy
    }
  }

  const stream = ytdl(videoUrl, {
    quality: 'highestaudio',
    requestOptions,
  });

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    // Set timeout for the download (30 seconds)
    const timeout = setTimeout(() => {
      stream.destroy();
      reject(new Error('YouTube audio download timeout (> 30s)'));
    }, 30000);

    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('end', () => {
      clearTimeout(timeout);
      resolve(Buffer.concat(chunks));
    });
    stream.on('error', (err: Error) => {
      clearTimeout(timeout);
      reject(err);
    });
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