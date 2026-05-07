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
import { ExternalLink, Play } from 'lucide-react';
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

  // Helper: get first 1-2 sentences
  function getPreviewText(text: string | null): string {
    if (!text) return '-';
    const sentences = text.split(/(?<=。)|(?<=\. )\s*/);
    const firstSentences = sentences.filter(s => s.trim()).slice(0, 2);
    const preview = firstSentences.join('').trim();
    return preview.length > 80 ? preview.slice(0, 80) + '...' : preview;
  }

  function getTooltipText(text: string | null): string {
    if (!text) return '暂无内容';
    const sentences = text.split(/(?<=。)|(?<=\. )\s*/);
    const firstSentences = sentences.filter(s => s.trim()).slice(0, 4);
    return firstSentences.join('').trim();
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="搜索视频..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 rounded-xl border-input bg-transparent px-3 text-[13px] pl-9 focus-visible:ring-1 focus-visible:ring-ring"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" strokeWidth="2" />
            <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as VideoStatus | 'all')}
        >
          <SelectTrigger className="h-10 rounded-xl w-[160px] text-[13px]">
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

      {/* Table */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-border">
          <h2 className="text-[15px] font-semibold text-primary">视频列表</h2>
          <p className="text-[13px] text-muted-foreground mt-0.5">管理和监控你的视频翻译</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-[#fafafa]/80">
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">视频</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">标题</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">内容预览</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">状态</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">抓取时间</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">原视频</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredVideos?.map((video) => (
                <tr key={video.id} className="hover:bg-[#fafafa]/60 transition-colors group">
                  {/* Thumbnail */}
                  <td className="px-6 py-4">
                    <Link href={`/videos/${video.id}`} className="block">
                      <div className="w-[88px] h-[50px] rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 relative">
                        {video.thumbnail_url && (
                          <img
                            src={video.thumbnail_url}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                          <Play className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </Link>
                  </td>

                  {/* Title */}
                  <td className="px-6 py-4">
                    <Link href={`/videos/${video.id}`} className="hover:underline">
                      <span className="text-[13px] font-semibold text-primary block truncate max-w-[280px]">
                        {video.title}
                      </span>
                    </Link>
                  </td>

                  {/* Content Preview */}
                  <td className="px-6 py-4 hidden md:table-cell max-w-[300px]">
                    <span
                      className="text-[13px] text-muted-foreground cursor-help block truncate"
                      title={getTooltipText(video.translated_text)}
                    >
                      {getPreviewText(video.translated_text)}
                    </span>
                    {video.translated_text && (
                      <button
                        onClick={() => setSelectedVideoId(video.id)}
                        className="ml-1 text-[12px] text-blue-600 hover:underline align-top"
                      >
                        查看全文
                      </button>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <VideoStatusBadge status={video.status} />
                  </td>

                  {/* Ingest Time */}
                  <td className="px-6 py-4 text-[13px] text-muted-foreground hidden sm:table-cell">
                    {new Date(video.ingest_time).toLocaleDateString('zh-CN')}
                  </td>

                  {/* 原视频 */}
                  <td className="px-6 py-4">
                    <a
                      href={`https://www.youtube.com/watch?v=${video.youtube_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[13px] text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      原视频
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredVideos?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[13px] text-muted-foreground">
              {statusFilter !== 'all' ? `没有状态为"${VIDEO_STATUSES_ZH[statusFilter]}"的视频` : '暂无视频'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {videos.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3">
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
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">每页</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(parseInt(value, 10));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[80px] h-9 rounded-lg">
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
      <div className="flex gap-3">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-10 w-44 rounded-xl" />
      </div>
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-t border-border">
            <Skeleton className="w-[88px] h-[50px] rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-5 w-3/4" />
            </div>
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
