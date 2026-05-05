import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Video, VideoStatus } from '@/lib/db-types';

// Fetch videos with optional status filter
async function fetchVideos(status?: VideoStatus): Promise<Video[]> {
  const params = new URLSearchParams();
  if (status) {
    params.set('status', status);
  }

  const response = await fetch(`/api/videos?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch videos');
  }
  return response.json();
}

// Fetch single video
async function fetchVideo(id: number): Promise<Video> {
  const response = await fetch(`/api/videos/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch video');
  }
  return response.json();
}

// Update video translation
async function updateVideoTranslation(id: number, translated_text: string): Promise<Video> {
  const response = await fetch(`/api/videos/${id}/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ translated_text }),
  });
  if (!response.ok) {
    throw new Error('Failed to save translation');
  }
  return response.json();
}

// Approve video
async function approveVideo(id: number): Promise<Video> {
  const response = await fetch(`/api/videos/${id}/approve`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to approve video');
  }
  return response.json();
}

// Reject video
async function rejectVideo(id: number, rejection_note?: string): Promise<Video> {
  const response = await fetch(`/api/videos/${id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rejection_note }),
  });
  if (!response.ok) {
    throw new Error('Failed to reject video');
  }
  return response.json();
}

// React Query hooks
export function useVideos(status?: VideoStatus) {
  return useQuery({
    queryKey: ['videos', status],
    queryFn: () => fetchVideos(status),
  });
}

export function useVideo(id: number) {
  return useQuery({
    queryKey: ['video', id],
    queryFn: () => fetchVideo(id),
    enabled: !!id,
  });
}

export function useUpdateVideoTranslation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, translated_text }: { id: number; translated_text: string }) =>
      updateVideoTranslation(id, translated_text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
}

export function useApproveVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveVideo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
}

export function useRejectVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, rejection_note }: { id: number; rejection_note?: string }) =>
      rejectVideo(id, rejection_note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
}