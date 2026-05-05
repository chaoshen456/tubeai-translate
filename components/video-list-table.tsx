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

const VIDEO_STATUSES_ZH: Record<VideoStatus, string> = {
  'Pending Translation': '待翻译',
  'Pending Review': '待审核',
  Approved: '已通过',
  Rejected: '已驳回',
  'Ready to Publish': '待发布',
  Published: '已发布',
};

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
        <p className="text-red-500">加载视频失败: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          placeholder="搜索视频..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as VideoStatus | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="筛选状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            {Object.entries(VIDEO_STATUSES_ZH).map(([status, label]) => (
              <SelectItem key={status} value={status}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">视频</th>
              <th className="px-4 py-3 text-left text-sm font-medium">标题</th>
              <th className="px-4 py-3 text-left text-sm font-medium">状态</th>
              <th className="px-4 py-3 text-left text-sm font-medium">抓取时间</th>
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
          {statusFilter !== 'all' ? `没有状态为"${VIDEO_STATUSES_ZH[statusFilter]}"的视频` : '暂无视频'}
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