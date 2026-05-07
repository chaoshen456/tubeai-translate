// YouTube Data API service for fetching AI technology videos

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// AI technology category ID
const AI_CATEGORY_ID = '28';

// Region code for fetching popular videos (default: US)
const DEFAULT_REGION = process.env.YOUTUBE_REGION || 'US';

// API log entry type
export interface YouTubeApiLogEntry {
  api_call: string;
  request: Record<string, unknown>;
  response: unknown;
  error?: string;
  timestamp: string;
}

// Helper to log API call
function logApiCall(
  logs: YouTubeApiLogEntry[],
  apiCall: string,
  request: Record<string, unknown>,
  response: unknown,
  error?: string
) {
  logs.push({
    api_call: apiCall,
    request,
    response,
    ...(error && { error }),
    timestamp: new Date().toISOString(),
  });
}

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

// Fetch popular AI technology videos (with optional logging)
export async function fetchPopularAIVideos(
  maxResults: number = 20,
  logs?: YouTubeApiLogEntry[]
): Promise<YouTubeVideo[]> {
  const url = new URL(`${YOUTUBE_API_BASE}/videos`);

  url.searchParams.set('part', 'snippet');
  url.searchParams.set('chart', 'mostPopular');
  url.searchParams.set('videoCategoryId', AI_CATEGORY_ID);
  url.searchParams.set('regionCode', DEFAULT_REGION);
  url.searchParams.set('maxResults', maxResults.toString());
  url.searchParams.set('key', YOUTUBE_API_KEY!);

  const requestParams = {
    url: url.toString(),
    part: 'snippet',
    chart: 'mostPopular',
    videoCategoryId: AI_CATEGORY_ID,
    regionCode: DEFAULT_REGION,
    maxResults,
  };

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      const error = await response.text();
      const errorMsg = `YouTube API error: ${response.status} - ${error}`;
      if (logs) {
        logApiCall(logs, 'fetchPopularAIVideos', requestParams, null, errorMsg);
      }
      throw new Error(errorMsg);
    }

    const data: YouTubeVideoResponse = await response.json();

    if (logs) {
      logApiCall(logs, 'fetchPopularAIVideos', requestParams, {
        itemCount: data.items?.length || 0,
        items: (data.items || []).map((v) => ({ id: v.id, title: v.snippet?.title })),
      });
    }

    // Transform nested structure to flat structure
    return (data.items || []).map((v) => ({
      id: v.id,
      title: v.snippet.title,
      description: v.snippet.description,
      thumbnails: v.snippet.thumbnails,
      channelTitle: v.snippet.channelTitle,
      publishedAt: v.snippet.publishedAt,
    }));
  } catch (error) {
    if (logs && logs.length === 0) {
      logApiCall(logs, 'fetchPopularAIVideos', requestParams, null, error instanceof Error ? error.message : String(error));
    }
    throw error;
  }
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
export async function fetchVideoCaptions(
  videoId: string,
  logs?: YouTubeApiLogEntry[]
): Promise<YouTubeCaption[]> {
  const url = `https://www.youtube.com/api/timedtext?type=list&v=${videoId}`;
  const requestParams = { url, videoId, api: 'TimedText list' };

  try {
    // Build fetch options with proxy support
    const fetchOptions: RequestInit = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    };

    // Add proxy agent if available
    const httpsProxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
    if (httpsProxy) {
      try {
        // Dynamic import for optional dependency
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { HttpsProxyAgent } = require('https-proxy-agent');
        (fetchOptions as Record<string, unknown>).agent = new HttpsProxyAgent(httpsProxy);
      } catch {
        // https-proxy-agent not installed, continue without proxy
      }
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const errorMsg = `TimedText API error: ${response.status}`;
      if (logs) {
        logApiCall(logs, 'fetchVideoCaptions', requestParams, null, errorMsg);
      }
      return [];
    }

    const xmlText = await response.text();

    // Log raw XML for debugging - store complete response
    if (logs) {
      logApiCall(logs, 'fetchVideoCaptions_raw', requestParams, {
        xmlLength: xmlText.length,
        xmlContent: xmlText, // Store complete raw XML response
      });
    }

    // Parse XML to extract caption tracks - try multiple patterns
    const captions: YouTubeCaption[] = [];

    // Pattern 1: id + name + lang_code
    const trackRegex1 = /<track[^>]*?id="([^"]*)"[^>]*?name="([^"]*)"[^>]*?lang_code="([^"]*)"[^>]*?>/g;
    // Pattern 2: lang_code + name (no id)
    const trackRegex2 = /<track[^>]*?lang_code="([^"]*)"[^>]*?name="([^"]*)"[^>]*?>/g;
    // Pattern 3: simpler format
    const trackRegex3 = /<track[^>]*?lang="([^"]*)"[^>]*?label="([^"]*)"[^>]*?>/g;

    let match;
    // Try pattern 1
    while ((match = trackRegex1.exec(xmlText)) !== null) {
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

    // If pattern 1 found nothing, try pattern 2
    if (captions.length === 0) {
      while ((match = trackRegex2.exec(xmlText)) !== null) {
        captions.push({
          id: `${match[1]}-${match[2]}`,
          videoId: videoId,
          language: match[1],
          name: match[2],
          isDraft: false,
          isDraftStore: false,
          trackKind: 'standard',
        });
      }
    }

    // If still nothing, try pattern 3
    if (captions.length === 0) {
      while ((match = trackRegex3.exec(xmlText)) !== null) {
        captions.push({
          id: `${match[1]}-${match[2]}`,
          videoId: videoId,
          language: match[1],
          name: match[2],
          isDraft: false,
          isDraftStore: false,
          trackKind: 'standard',
        });
      }
    }

    if (logs) {
      logApiCall(logs, 'fetchVideoCaptions', requestParams, {
        captionCount: captions.length,
        captions: captions.map((c) => ({ language: c.language, name: c.name })),
        xmlLength: xmlText.length,
      });
    }

    return captions;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (logs) {
      logApiCall(logs, 'fetchVideoCaptions', requestParams, null, errorMsg);
    }
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
  name?: string,
  logs?: YouTubeApiLogEntry[]
): Promise<string> {
  const url = new URL('https://www.youtube.com/api/timedtext');
  url.searchParams.set('v', videoId);
  url.searchParams.set('lang', lang);
  if (name) {
    url.searchParams.set('name', name);
  }

  const requestParams = { url: url.toString(), videoId, lang, name: name || null };

  try {
    // Build fetch options with proxy support
    const fetchOptions: RequestInit = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    };

    // Add proxy agent if available
    const httpsProxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
    if (httpsProxy) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { HttpsProxyAgent } = require('https-proxy-agent');
        (fetchOptions as Record<string, unknown>).agent = new HttpsProxyAgent(httpsProxy);
      } catch {
        // https-proxy-agent not installed, continue without proxy
      }
    }

    const response = await fetch(url.toString(), fetchOptions);

    if (!response.ok) {
      const errorMsg = `TimedText API error: ${response.status}`;
      if (logs) {
        logApiCall(logs, 'downloadCaptionForVideo', requestParams, null, errorMsg);
      }
      throw new Error(errorMsg);
    }

    const text = await response.text();

    // Log complete response for debugging
    if (logs) {
      logApiCall(logs, 'downloadCaptionForVideo', requestParams, {
        contentLength: text.length,
        content: text, // Store complete raw response
      });
    }

    return text;
  } catch (error) {
    if (logs && error instanceof Error && !logs.some((l) => l.api_call === 'downloadCaptionForVideo')) {
      logApiCall(logs, 'downloadCaptionForVideo', requestParams, null, error instanceof Error ? error.message : String(error));
    }
    throw error;
  }
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

// AI-related search queries for finding cutting-edge AI videos
const AI_SEARCH_QUERIES = [
  'AI artificial intelligence',
  'machine learning',
  'GPT LLM',
  'transformer neural network',
  'AI tutorial',
  'deep learning',
  'OpenAI Anthropic',
  'AI agent',
  'prompt engineering',
  'AI coding assistant',
];

// Search YouTube videos for AI-related content (cutting-edge, trending)
export async function searchAIVideos(
  maxResults: number = 10,
  order: 'relevance' | 'viewCount' | 'date' = 'viewCount',
  logs?: YouTubeApiLogEntry[]
): Promise<YouTubeVideo[]> {
  // Build search query from AI keywords
  const query = AI_SEARCH_QUERIES.slice(0, 3).join(' | '); // Combine top queries

  const url = new URL(`${YOUTUBE_API_BASE}/search`);
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('q', query);
  url.searchParams.set('type', 'video');
  url.searchParams.set('maxResults', Math.min(maxResults * 2, 50).toString()); // Fetch more to filter
  url.searchParams.set('order', order);
  url.searchParams.set('key', YOUTUBE_API_KEY!);

  const requestParams = {
    url: url.toString(),
    part: 'snippet',
    q: query,
    type: 'video',
    maxResults: maxResults * 2,
    order,
  };

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      const error = await response.text();
      const errorMsg = `YouTube Search API error: ${response.status} - ${error}`;
      if (logs) {
        logApiCall(logs, 'searchAIVideos', requestParams, null, errorMsg);
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();

    if (logs) {
      logApiCall(logs, 'searchAIVideos', requestParams, {
        itemCount: data.items?.length || 0,
        items: (data.items || []).slice(0, 5).map((v: { snippet?: { title?: string }; id?: { videoId?: string } }) => ({
          id: v.id?.videoId,
          title: v.snippet?.title,
        })),
      });
    }

    // Get video IDs
    const videoIds = (data.items || [])
      .map((item: { id?: { videoId?: string } }) => item.id?.videoId)
      .filter((id: string | undefined): id is string => Boolean(id))
      .slice(0, maxResults)
      .join(',');

    if (!videoIds) {
      return [];
    }

    // Fetch video details (thumbnails, etc.)
    const detailsUrl = new URL(`${YOUTUBE_API_BASE}/videos`);
    detailsUrl.searchParams.set('part', 'snippet');
    detailsUrl.searchParams.set('id', videoIds);
    detailsUrl.searchParams.set('key', YOUTUBE_API_KEY!);

    const detailsResponse = await fetch(detailsUrl.toString());
    const detailsData = await detailsResponse.json();

    return (detailsData.items || []).map((v: {
      id: string;
      snippet: {
        title: string;
        description: string;
        thumbnails: { default: { url: string }; medium: { url: string }; high: { url: string } };
        channelTitle: string;
        publishedAt: string;
      };
    }) => ({
      id: v.id,
      title: v.snippet.title,
      description: v.snippet.description,
      thumbnails: v.snippet.thumbnails,
      channelTitle: v.snippet.channelTitle,
      publishedAt: v.snippet.publishedAt,
    }));

  } catch (error) {
    if (logs) {
      logApiCall(logs, 'searchAIVideos', requestParams, null, error instanceof Error ? error.message : String(error));
    }
    throw error;
  }
}
// Search for a YouTube channel by name or handle
export async function searchChannel(
  channelQuery: string,
  logs?: YouTubeApiLogEntry[]
): Promise<{ id: string; title: string; description: string } | null> {
  const url = new URL(`${YOUTUBE_API_BASE}/search`);
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('type', 'channel');
  url.searchParams.set('q', channelQuery);
  url.searchParams.set('maxResults', '5');
  url.searchParams.set('key', YOUTUBE_API_KEY!);

  const requestParams = {
    url: url.toString(),
    part: 'snippet',
    type: 'channel',
    q: channelQuery,
    maxResults: 5,
  };

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      const error = await response.text();
      const errorMsg = `YouTube Channel Search API error: ${response.status} - ${error}`;
      if (logs) {
        logApiCall(logs, 'searchChannel', requestParams, null, errorMsg);
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();

    if (logs) {
      logApiCall(logs, 'searchChannel', requestParams, {
        itemCount: data.items?.length || 0,
        items: (data.items || []).slice(0, 3).map((c: { id?: { channelId?: string }; snippet?: { title?: string } }) => ({
          id: c.id?.channelId,
          title: c.snippet?.title,
        })),
      });
    }

    if (!data.items || data.items.length === 0) {
      return null;
    }

    // Return the first matching channel
    const channel = data.items[0];
    return {
      id: channel.id?.channelId || channel.id,
      title: channel.snippet?.title || '',
      description: channel.snippet?.description || '',
    };
  } catch (error) {
    if (logs) {
      logApiCall(logs, 'searchChannel', requestParams, null, error instanceof Error ? error.message : String(error));
    }
    throw error;
  }
}

// Fetch videos from a specific YouTube channel
export async function fetchVideosByChannel(
  channelId: string,
  maxResults: number = 10,
  logs?: YouTubeApiLogEntry[]
): Promise<YouTubeVideo[]> {
  const url = new URL(`${YOUTUBE_API_BASE}/search`);
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('type', 'video');
  url.searchParams.set('channelId', channelId);
  url.searchParams.set('maxResults', Math.min(maxResults, 50).toString());
  url.searchParams.set('order', 'date');
  url.searchParams.set('key', YOUTUBE_API_KEY!);

  const requestParams = {
    url: url.toString(),
    part: 'snippet',
    type: 'video',
    channelId,
    maxResults,
    order: 'date',
  };

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      const error = await response.text();
      const errorMsg = `YouTube Channel Videos API error: ${response.status} - ${error}`;
      if (logs) {
        logApiCall(logs, 'fetchVideosByChannel', requestParams, null, errorMsg);
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();

    if (logs) {
      logApiCall(logs, 'fetchVideosByChannel', requestParams, {
        itemCount: data.items?.length || 0,
        items: (data.items || []).slice(0, 3).map((v: { id?: { videoId?: string }; snippet?: { title?: string } }) => ({
          id: v.id?.videoId,
          title: v.snippet?.title,
        })),
      });
    }

    // Get video IDs
    const videoIds = (data.items || [])
      .map((item: { id?: { videoId?: string } }) => item.id?.videoId)
      .filter((id: string | undefined): id is string => Boolean(id))
      .join(',');

    if (!videoIds) {
      return [];
    }

    // Fetch video details (thumbnails, etc.)
    const detailsUrl = new URL(`${YOUTUBE_API_BASE}/videos`);
    detailsUrl.searchParams.set('part', 'snippet');
    detailsUrl.searchParams.set('id', videoIds);
    detailsUrl.searchParams.set('key', YOUTUBE_API_KEY!);

    const detailsResponse = await fetch(detailsUrl.toString());
    const detailsData = await detailsResponse.json();

    return (detailsData.items || []).map((v: {
      id: string;
      snippet: {
        title: string;
        description: string;
        thumbnails: { default: { url: string }; medium: { url: string }; high: { url: string } };
        channelTitle: string;
        publishedAt: string;
      };
    }) => ({
      id: v.id,
      title: v.snippet.title,
      description: v.snippet.description,
      thumbnails: v.snippet.thumbnails,
      channelTitle: v.snippet.channelTitle,
      publishedAt: v.snippet.publishedAt,
    }));
  } catch (error) {
    if (logs) {
      logApiCall(logs, 'fetchVideosByChannel', requestParams, null, error instanceof Error ? error.message : String(error));
    }
    throw error;
  }
}
