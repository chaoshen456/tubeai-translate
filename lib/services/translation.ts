// Translation service using OpenRouter/OpenAI GPT-4

import OpenAI from 'openai';
import type { TranscriptSegment } from './transcription';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
    'X-OpenRouter-Title': 'YouTube AI Translator',
  },
});

const GPT_MODEL = process.env.OPENROUTER_MODEL;
const MAX_TOKENS_PER_CHUNK = 2000;

// Translation prompt template
const TRANSLATION_PROMPT = `You are a professional translator specializing in AI and technology content. Translate the following English text to Chinese (Simplified), maintaining the technical accuracy and natural flow.

Key translation guidelines:
1. Preserve technical terms accurately (e.g., neural networks, transformer, etc.)
2. Keep proper nouns and brand names in their original form when appropriate
3. Maintain the casual/conversational tone of the original speaker
4. Context: This is from a YouTube tech video, so keep it engaging and easy to understand

Text to translate:
"{text}"

Chinese translation:`;

// Translate a single text segment
async function translateText(text: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: GPT_MODEL,
    messages: [
      {
        role: 'user',
        content: TRANSLATION_PROMPT.replace('{text}', text),
      },
    ],
    max_tokens: MAX_TOKENS_PER_CHUNK,
    temperature: 0.3,
  });

  return response.choices[0]?.message?.content?.trim() || text;
}

// Split text into chunks for translation
function splitTextIntoChunks(text: string, maxChunkSize: number = 1500): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());

  let currentChunk = '';

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// Translate full transcript
export async function translateTranscript(
  transcript: string | TranscriptSegment[],
  useSegments: boolean = true
): Promise<string> {
  let segments: TranscriptSegment[];

  if (typeof transcript === 'string') {
    // Split by lines or paragraphs for translation
    const chunks = splitTextIntoChunks(transcript, 1500);
    const translations = await Promise.all(chunks.map(translateText));
    return translations.join('\n\n');
  } else {
    // Translate each segment
    const translations: string[] = [];

    for (const segment of transcript) {
      const translation = await translateText(segment.text);
      translations.push(translation);
    }

    return translations.join('\n');
  }
}

// Translate with timestamps preserved
export async function translateTranscriptWithTimestamps(
  segments: TranscriptSegment[]
): Promise<TranscriptSegment[]> {
  const translations: TranscriptSegment[] = [];

  for (const segment of segments) {
    const translatedText = await translateText(segment.text);
    translations.push({
      ...segment,
      text: translatedText,
    });
  }

  return translations;
}

// Format translated transcript for display/storage
export function formatTranslatedTranscript(
  segments: TranscriptSegment[],
  withTimestamps: boolean = true
): string {
  return segments
    .map(segment =>
      withTimestamps
        ? `[${formatTimestamp(segment.start)}] ${segment.text}`
        : segment.text
    )
    .join('\n');
}

// Helper to format timestamp
function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}