// YouTube Data API service for fetching AI technology videos

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// AI technology category ID
const AI_CATEGORY_ID = '28';

// Region code for fetching popular videos (default: US)
const DEFAULT_REGION = process.env.YOUTUBE_REGION || 'US';

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnails: {
    default: { url: string };
    medium: { url: string };
    high: { url: string };
  };
  channelTitle: string;
  publishedAt: string;
}

export interface YouTubeCaption {
  id: string;
  videoId: string;
  language: string;
  name: string;
  isDraft: boolean;
  isDraftStore: boolean;
  trackKind: string;
}

export interface YouTubeCaptionListResponse {
  items: YouTubeCaption[];
}

// YouTube API returns nested structure - define for raw response
interface YouTubeAPIVideo {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
    channelTitle: string;
    publishedAt: string;
  };
}

interface YouTubeVideoResponse {
  items: YouTubeAPIVideo[];
  nextPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

// Fetch popular AI technology videos
export async function fetchPopularAIVideos(maxResults: number = 20): Promise<YouTubeVideo[]> {
  const url = new URL(`${YOUTUBE_API_BASE}/videos`);

  url.searchParams.set('part', 'snippet');
  url.searchParams.set('chart', 'mostPopular');
  url.searchParams.set('videoCategoryId', AI_CATEGORY_ID);
  url.searchParams.set('regionCode', DEFAULT_REGION);
  url.searchParams.set('maxResults', maxResults.toString());
  url.searchParams.set('key', YOUTUBE_API_KEY!);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`YouTube API error: ${response.status} - ${error}`);
  }

  const data: YouTubeVideoResponse = await response.json();

  // Transform nested structure to flat structure
  return data.items.map((v) => ({
    id: v.id,
    title: v.snippet.title,
    description: v.snippet.description,
    thumbnails: v.snippet.thumbnails,
    channelTitle: v.snippet.channelTitle,
    publishedAt: v.snippet.publishedAt,
  }));
}

// YouTube API captions response has nested structure
interface YouTubeAPICaption {
  id: string;
  snippet: {
    videoId: string;
    language: string;
    name: string;
    isDraft: boolean;
    isDraftStore: boolean;
    trackKind: string;
  };
}

interface YouTubeAPICaptionListResponse {
  items: YouTubeAPICaption[];
}

// Fetch video captions/subtitles using TimedText API (no OAuth needed)
export async function fetchVideoCaptions(videoId: string): Promise<YouTubeCaption[]> {
  try {
    // Use TimedText API to get available caption tracks
    const url = `https://www.youtube.com/api/timedtext?type=list&v=${videoId}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      return [];
    }

    const xmlText = await response.text();

    // Parse XML to extract caption tracks
    const captions: YouTubeCaption[] = [];
    const trackRegex = /<track[^>]*?id="([^"]*)"[^>]*?name="([^"]*)"[^>]*?lang_code="([^"]*)"[^>]*?>/g;

    let match;
    while ((match = trackRegex.exec(xmlText)) !== null) {
      captions.push({
        id: match[1] || `${match[3]}-${match[2]}`,
        videoId: videoId,
        language: match[3],
        name: match[2],
        isDraft: false,
        isDraftStore: false,
        trackKind: 'standard',
      });
    }

    return captions;
  } catch {
    return [];
  }
}

// Download caption content using TimedText API
export async function downloadCaption(captionId: string, tfmt: 'vtt' | 'srt' | 'ttml' = 'vtt'): Promise<string> {
  // captionId format: "lang-name" or just "lang"
  const parts = captionId.split('-');
  const lang = parts[0];

  // Build TimedText API URL
  const url = new URL('https://www.youtube.com/api/timedtext');
  url.searchParams.set('v', ''); // Will be set by caller
  url.searchParams.set('lang', lang);
  url.searchParams.set('name', parts.slice(1).join('-') || '');

  // Extract videoId from context - need to pass it separately
  // For now, we'll parse it from the captionId context or use a different approach

  throw new Error('Use downloadCaptionForVideo instead');
}

// Download caption for a specific video using TimedText API
export async function downloadCaptionForVideo(
  videoId: string,
  lang: string,
  name?: string
): Promise<string> {
  const url = new URL('https://www.youtube.com/api/timedtext');
  url.searchParams.set('v', videoId);
  url.searchParams.set('lang', lang);
  if (name) {
    url.searchParams.set('name', name);
  }

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  if (!response.ok) {
    throw new Error(`TimedText API error: ${response.status}`);
  }

  return response.text();
}

// Extract video ID from YouTube URL
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}