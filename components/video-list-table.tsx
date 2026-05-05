'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useVideos } from '@/lib/hooks/use-videos';
import { VideoStatusBadge } from './video-status-badge';
import type { VideoStatus } from '@/lib/db-types';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Skeleton } from './ui/skeleton';

const VIDEO_STATUSES: VideoStatus[] = [
  'Pending Translation',
  'Pending Review',
  'Approved',
  'Rejected',
  'Ready to Publish',
  'Published',
];

export function VideoListTable() {
  const [statusFilter, setStatusFilter] = useState<VideoStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: videos, isLoading, error } = useVideos(
    statusFilter === 'all' ? undefined : statusFilter
  );

  // Filter by search query
  const filteredVideos = videos?.filter(
    (video) =>
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.youtube_id.includes(searchQuery)
  );

  if (isLoading) {
    return <VideoListSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Failed to load videos: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          placeholder="Search videos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as VideoStatus | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {VIDEO_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Video</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Title</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Ingest Time</th>
            </tr>
          </thead>
          <tbody>
            {filteredVideos?.map((video) => (
              <tr key={video.id} className="border-t hover:bg-muted/50">
                <td className="px-4 py-3">
                  <Link
                    href={`/videos/${video.id}`}
                    className="flex items-center gap-3 hover:underline"
                  >
                    {video.thumbnail_url && (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-20 h-11 object-cover rounded"
                      />
                    )}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/videos/${video.id}`} className="hover:underline">
                    <span className="font-medium line-clamp-2">{video.title}</span>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <VideoStatusBadge status={video.status} />
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {new Date(video.ingest_time).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredVideos?.length === 0 && (
        <p className="text-center py-8 text-muted-foreground">
          No videos found{statusFilter !== 'all' ? ` with status "${statusFilter}"` : ''}
        </p>
      )}
    </div>
  );
}

function VideoListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-44" />
      </div>
      <div className="border rounded-lg">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-t">
            <Skeleton className="w-20 h-11 rounded" />
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}