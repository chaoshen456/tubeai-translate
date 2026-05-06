// Video status enum
export type VideoStatus =
  | 'Pending Translation'
  | 'Pending Review'
  | 'Approved'
  | 'Rejected'
  | 'Ready to Publish'
  | 'Published';

// YouTube API log entry
export interface YouTubeApiLog {
  api_call: string;
  request: Record<string, unknown>;
  response: unknown;
  error?: string;
  timestamp: string;
}

// Video interface matching the videos table
export interface Video {
  id: number;
  youtube_id: string;
  title: string;
  thumbnail_url: string | null;
  original_text: string | null;
  translated_text: string | null;
  status: VideoStatus;
  ingest_time: string;
  review_time: string | null;
  publish_time: string | null;
  rejection_note: string | null;
  youtube_api_log: YouTubeApiLog[] | null;
}

// User interface matching the users table
export interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

// User preferences interface
export interface UserPreferences {
  user_id: string;
  notify_email: boolean;
  notify_slack: boolean;
}