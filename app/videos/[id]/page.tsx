'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { useVideo, useUpdateVideoTranslation, useApproveVideo, useRejectVideo } from '@/lib/hooks/use-videos';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { VideoStatusBadge } from '@/components/video-status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, Save, Check, X } from 'lucide-react';
import Link from 'next/link';

function VideoDetailContent() {
  const params = useParams();
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
      toast.success('Translation saved');
    } catch {
      toast.error('Failed to save translation');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!video) return;

    try {
      await approveVideoMutation.mutateAsync(video.id);
      toast.success('Video approved');
    } catch {
      toast.error('Failed to approve video');
    }
  };

  const handleReject = async () => {
    if (!video) return;

    try {
      await rejectVideoMutation.mutateAsync({ id: video.id, rejection_note: rejectionNote });
      setShowRejectDialog(false);
      toast.success('Video rejected');
    } catch {
      toast.error('Failed to reject video');
    }
  };

  if (isLoading || !video) {
    return <VideoDetailSkeleton />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
        <div className="w-full max-w-6xl flex justify-between items-center p-3 px-5 text-sm">
          <Link href="/dashboard" className="flex items-center gap-2 hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-6xl mx-auto p-4 py-8">
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">{video.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Status: <VideoStatusBadge status={video.status} /></span>
                <span>Ingest: {new Date(video.ingest_time).toLocaleString()}</span>
              </div>
            </div>
            {video.thumbnail_url && (
              <img
                src={video.thumbnail_url}
                alt={video.title}
                className="w-48 h-27 object-cover rounded"
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Original Text */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Original Transcript</h2>
            <div className="border rounded-lg p-4 h-96 overflow-y-auto bg-muted/20">
              <pre className="whitespace-pre-wrap text-sm">
                {video.original_text || 'No transcript available'}
              </pre>
            </div>
          </div>

          {/* Translated Text */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Translated Text (Chinese)</h2>
            <Textarea
              value={translatedText}
              onChange={(e) => setTranslatedText(e.target.value)}
              className="h-96 resize-none"
              placeholder="Translation will appear here..."
            />
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            variant="outline"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </Button>

          {video.status !== 'Ready to Publish' && video.status !== 'Published' && (
            <>
              <Button
                onClick={handleApprove}
                disabled={approveVideoMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button
                onClick={() => setShowRejectDialog(true)}
                disabled={rejectVideoMutation.isPending}
                variant="destructive"
              >
                <X className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </>
          )}

          {video.status === 'Ready to Publish' && (
            <Button onClick={() => toast.info('Markdown export coming soon')}>
              Generate Markdown
            </Button>
          )}
        </div>
      </main>

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Reject Video</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please provide a reason for rejection (optional)
            </p>
            <Textarea
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="Rejection reason..."
              className="mb-4"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={rejectVideoMutation.isPending}
              >
                Reject
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
    <div className="min-h-screen flex flex-col">
      <div className="w-full max-w-6xl mx-auto p-4 py-8">
        <Skeleton className="h-10 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <Skeleton className="h-6 w-32 mb-3" />
            <Skeleton className="h-96 w-full" />
          </div>
          <div>
            <Skeleton className="h-6 w-40 mb-3" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
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