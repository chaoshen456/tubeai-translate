'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useVideo, useUpdateVideoTranslation, useApproveVideo, useRejectVideo } from '@/lib/hooks/use-videos';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { VideoStatusBadge } from '@/components/video-status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, Save, Check, X } from 'lucide-react';
import { DashboardSidebar } from '@/components/dashboard-sidebar';

function VideoDetailContent() {
  const params = useParams();
  const router = useRouter();
  const videoId = parseInt(params.id as string);

  const { data: video, isLoading } = useVideo(videoId);
  const updateTranslation = useUpdateVideoTranslation();
  const approveVideoMutation = useApproveVideo();
  const rejectVideoMutation = useRejectVideo();

  const [translatedText, setTranslatedText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  useEffect(() => {
    if (video?.translated_text) {
      setTranslatedText(video.translated_text);
    }
  }, [video]);

  const handleSave = async () => {
    if (!video) return;

    setIsSaving(true);
    try {
      await updateTranslation.mutateAsync({ id: video.id, translated_text: translatedText });
      toast.success('翻译已保存');
    } catch {
      toast.error('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!video) return;

    try {
      await approveVideoMutation.mutateAsync(video.id);
      toast.success('视频已通过审核');
    } catch {
      toast.error('审核通过失败');
    }
  };

  const handleReject = async () => {
    if (!video) return;

    try {
      await rejectVideoMutation.mutateAsync({ id: video.id, rejection_note: rejectionNote });
      setShowRejectDialog(false);
      toast.success('视频已驳回');
    } catch {
      toast.error('驳回失败');
    }
  };

  if (isLoading || !video) {
    return <VideoDetailSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#f7f7f8]">
      <DashboardSidebar />

      <div className="ml-64 min-h-screen flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 bg-white/90 backdrop-blur-md border-b border-border">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="返回"
            >
              <ArrowLeft className="w-[18px] h-[18px] text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-primary tracking-tight truncate max-w-[500px]">
                {video.title}
              </h1>
              <div className="flex items-center gap-3 mt-0.5">
                <VideoStatusBadge status={video.status} />
                <span className="text-[12px] text-muted-foreground">
                  抓取时间: {new Date(video.ingest_time).toLocaleDateString('zh-CN')}
                </span>
              </div>
            </div>
          </div>

          {video.thumbnail_url && (
            <img
              src={video.thumbnail_url}
              alt={video.title}
              className="w-32 h-[60px] object-cover rounded-xl"
            />
          )}
        </header>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Editor Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Original Text */}
              <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <h2 className="text-[14px] font-semibold text-primary">原文</h2>
                </div>
                <div className="p-5 h-[500px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-[13px] text-muted-foreground leading-relaxed font-sans">
                    {video.original_text || '暂无原文'}
                  </pre>
                </div>
              </div>

              {/* Translated Text */}
              <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <h2 className="text-[14px] font-semibold text-primary">中文翻译</h2>
                  <span className="text-[11px] text-muted-foreground">可编辑</span>
                </div>
                <div className="p-5">
                  <Textarea
                    value={translatedText}
                    onChange={(e) => setTranslatedText(e.target.value)}
                    className="h-[440px] resize-none text-[13px] leading-relaxed"
                    placeholder="翻译内容将显示在这里..."
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                variant="outline"
                className="rounded-xl h-10 px-5 text-[13px]"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? '保存中...' : '保存草稿'}
              </Button>

              {video.status !== 'Ready to Publish' && video.status !== 'Published' && (
                <>
                  <Button
                    onClick={handleApprove}
                    disabled={approveVideoMutation.isPending}
                    className="rounded-xl h-10 px-5 text-[13px] bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    通过审核
                  </Button>
                  <Button
                    onClick={() => setShowRejectDialog(true)}
                    disabled={rejectVideoMutation.isPending}
                    variant="destructive"
                    className="rounded-xl h-10 px-5 text-[13px]"
                  >
                    <X className="w-4 h-4 mr-2" />
                    驳回
                  </Button>
                </>
              )}

              {video.status === 'Ready to Publish' && (
                <Button
                  onClick={() => toast.info('Markdown 导出功能即将推出')}
                  className="rounded-xl h-10 px-5 text-[13px]"
                >
                  生成 Markdown
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-[15px] font-semibold text-primary mb-2">驳回视频</h3>
            <p className="text-[13px] text-muted-foreground mb-4">
              请填写驳回原因（可选）
            </p>
            <Textarea
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="驳回原因..."
              className="mb-4 text-[13px]"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(false)}
                className="rounded-xl text-[13px]"
              >
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={rejectVideoMutation.isPending}
                className="rounded-xl text-[13px]"
              >
                确认驳回
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VideoDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#f7f7f8]">
      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-3/4 mb-4 rounded-xl" />
          <Skeleton className="h-6 w-1/2 mb-6 rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <Skeleton className="h-6 w-32 mb-3 rounded-lg" />
              <Skeleton className="h-[500px] w-full rounded-2xl" />
            </div>
            <div>
              <Skeleton className="h-6 w-40 mb-3 rounded-lg" />
              <Skeleton className="h-[500px] w-full rounded-2xl" />
            </div>
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-10 w-24 rounded-xl" />
            <Skeleton className="h-10 w-24 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<VideoDetailSkeleton />}>
      <VideoDetailContent />
    </Suspense>
  );
}
