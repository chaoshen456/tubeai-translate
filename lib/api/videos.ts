import { createClient } from '@/lib/supabase/server';
import type { Video, VideoStatus } from '@/lib/db-types';

// Get all videos with optional status filter
export async function getVideos(status?: VideoStatus): Promise<Video[]> {
  const supabase = await createClient();

  let query = supabase.from('videos').select('*').order('ingest_time', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch videos: ${error.message}`);
  }

  return data || [];
}

// Get a single video by ID
export async function getVideoById(id: number): Promise<Video | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch video: ${error.message}`);
  }

  return data;
}

// Get a video by YouTube ID
export async function getVideoByYoutubeId(youtubeId: string): Promise<Video | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('youtube_id', youtubeId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch video: ${error.message}`);
  }

  return data;
}

// Create a new video record
export async function createVideo(video: {
  youtube_id: string;
  title: string;
  thumbnail_url?: string;
  original_text?: string | null;
  translated_text?: string | null;
  status?: VideoStatus;
}): Promise<Video> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('videos')
    .insert({
      youtube_id: video.youtube_id,
      title: video.title,
      thumbnail_url: video.thumbnail_url || null,
      original_text: video.original_text || null,
      translated_text: video.translated_text || null,
      status: video.status || 'Pending Translation',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create video: ${error.message}`);
  }

  return data;
}

// Update video translated text (draft save)
export async function updateVideoTranslation(
  id: number,
  translated_text: string
): Promise<Video> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('videos')
    .update({ translated_text })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update video translation: ${error.message}`);
  }

  return data;
}

// Approve a video (mark as Ready to Publish)
export async function approveVideo(id: number): Promise<Video> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('videos')
    .update({
      status: 'Ready to Publish',
      review_time: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to approve video: ${error.message}`);
  }

  return data;
}

// Reject a video
export async function rejectVideo(id: number, rejection_note?: string): Promise<Video> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('videos')
    .update({
      status: 'Rejected',
      review_time: new Date().toISOString(),
      rejection_note: rejection_note || null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to reject video: ${error.message}`);
  }

  return data;
}

// Update video status
export async function updateVideoStatus(
  id: number,
  status: VideoStatus,
  publish_time?: boolean
): Promise<Video> {
  const supabase = await createClient();

  const updateData: Partial<Video> = { status };
  if (publish_time) {
    updateData.publish_time = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('videos')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update video status: ${error.message}`);
  }

  return data;
}