'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useVideos } from '@/lib/hooks/use-videos';
import { VideoStatusBadge } from './video-status-badge';
import type { VideoStatus, Video } from '@/lib/db-types';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Skeleton } from './ui/skeleton';
import { ExternalLink } from 'lucide-react';
import { VideoDetailDrawer } from './video-detail-drawer';
import { Pagination, PaginationInfo } from './ui/pagination';

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
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, error } = useVideos(
    statusFilter === 'all' ? undefined : statusFilter,
    page,
    pageSize
  );

  const videos = data?.data || [];
  const pagination = data?.pagination || {
    currentPage: page,
    pageSize: pageSize,
    totalCount: videos.length,
    totalPages: 1,
  };

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

  // Helper: get first 1-2 sentences (split by Chinese/English period)
  function getPreviewText(text: string | null): string {
    if (!text) return '-';
    // Split by Chinese period "。" or English period ". "
    const sentences = text.split(/(?<=。)|(?<=\. )\s*/);
    const firstSentences = sentences.filter(s => s.trim()).slice(0, 2);
    const preview = firstSentences.join('').trim();
    return preview.length > 80 ? preview.slice(0, 80) + '...' : preview;
  }

  // Helper: get first 3-4 sentences for hover tooltip
  function getTooltipText(text: string | null): string {
    if (!text) return '暂无内容';
    const sentences = text.split(/(?<=。)|(?<=\. )\s*/);
    const firstSentences = sentences.filter(s => s.trim()).slice(0, 4);
    return firstSentences.join('').trim();
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
              <th className="px-4 py-3 text-left text-sm font-medium max-w-[300px]">视频内容</th>
              <th className="px-4 py-3 text-left text-sm font-medium">状态</th>
              <th className="px-4 py-3 text-left text-sm font-medium">抓取时间</th>
              <th className="px-4 py-3 text-left text-sm font-medium">原视频</th>
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
                <td className="px-4 py-3 max-w-[300px]">
                  <span
                    className="text-sm text-muted-foreground cursor-help"
                    title={getTooltipText(video.translated_text)}
                  >
                    {getPreviewText(video.translated_text)}
                    {video.translated_text && (
                      <button
                        onClick={() => setSelectedVideoId(video.id)}
                        className="ml-2 text-xs text-blue-600 hover:underline align-top"
                      >
                        查看全文
                      </button>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <VideoStatusBadge status={video.status} />
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {new Date(video.ingest_time).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <a
                    href={`https://www.youtube.com/watch?v=${video.youtube_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    原视频
                  </a>
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

      {/* Pagination */}
      {videos.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <PaginationInfo
            currentPage={pagination.currentPage}
            pageSize={pagination.pageSize}
            totalCount={pagination.totalCount}
          />
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={(newPage) => {
              setPage(newPage);
              // Scroll to top
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">每页</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(parseInt(value, 10));
                setPage(1); // Reset to first page
              }}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5条</SelectItem>
                <SelectItem value="10">10条</SelectItem>
                <SelectItem value="20">20条</SelectItem>
                <SelectItem value="50">50条</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Video Detail Drawer */}
      <VideoDetailDrawer
        videoId={selectedVideoId}
        onClose={() => setSelectedVideoId(null)}
      />
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
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
