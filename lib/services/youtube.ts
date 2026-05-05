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

export interface YouTubeVideoResponse {
  items: YouTubeVideo[];
  nextPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

// Fetch popular AI technology videos
export async function fetchPopularAIVideos(maxResults: number = 20): Promise<YouTubeVideo[]> {
  const url = new URL(`${YOUTUBE_API_BASE}/videos`);

  url.searchParams.set('part', 'snippet,contentDetails');
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
  return data.items;
}

// Fetch video captions/subtitles
export async function fetchVideoCaptions(videoId: string): Promise<YouTubeCaption[]> {
  const url = new URL(`${YOUTUBE_API_BASE}/captions`);

  url.searchParams.set('part', 'snippet');
  url.searchParams.set('videoId', videoId);
  url.searchParams.set('key', YOUTUBE_API_KEY!);

  const response = await fetch(url.toString());

  if (!response.ok) {
    // Captions might not exist for the video
    if (response.status === 403 || response.status === 404) {
      return [];
    }
    const error = await response.text();
    throw new Error(`YouTube Captions API error: ${response.status} - ${error}`);
  }

  const data: YouTubeCaptionListResponse = await response.json();
  return data.items || [];
}

// Download caption content
export async function downloadCaption(captionId: string, tfmt: 'vtt' | 'srt' | 'ttml' = 'vtt'): Promise<string> {
  const url = new URL(`${YOUTUBE_API_BASE}/captions`);

  url.searchParams.set('id', captionId);
  url.searchParams.set('tfmt', tfmt);
  url.searchParams.set('key', YOUTUBE_API_KEY!);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`YouTube Caption Download error: ${response.status}`);
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