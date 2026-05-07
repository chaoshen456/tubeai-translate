'use client';

import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import type { Video } from '@/lib/db-types';
import { X, Copy, Loader2 } from 'lucide-react';
import { useVideo } from '@/lib/hooks/use-videos';

interface VideoDetailDrawerProps {
  videoId: number | null;
  onClose: () => void;
}

export function VideoDetailDrawer({ videoId, onClose }: VideoDetailDrawerProps) {
  const { data: video, isLoading, error } = useVideo(videoId!);
  const [copied, setCopied] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (videoId) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [videoId]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!videoId) return null;

  const isOpen = videoId !== null;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-background shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">视频内容</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            )}

            {error && (
              <div className="text-red-500 text-center py-8">
                加载失败: {error.message}
              </div>
            )}

            {video && (
              <div className="space-y-4">
                {/* Video Title */}
                <div>
                  <h3 className="font-medium text-base mb-2">{video.title}</h3>
                  <div className="text-sm text-muted-foreground">
                    状态: <span className="font-medium">{video.status}</span>
                  </div>
                </div>

                {/* Translated Content */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">翻译内容</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(video.translated_text || '')}
                      disabled={!video.translated_text}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      {copied ? '已复制' : '一键复制'}
                    </Button>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    {video.translated_text ? (
                      <pre className="text-sm whitespace-pre-wrap font-sans">
                        {video.translated_text}
                      </pre>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {video.status === 'Pending Translation' ? '待翻译' :
                         video.status === 'Rejected' ? '已驳回' : '暂无译文'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Meta Info */}
                <div className="space-y-2 text-sm text-muted-foreground pt-4 border-t">
                  <div className="flex justify-between">
                    <span>抓取时间:</span>
                    <span>{new Date(video.ingest_time).toLocaleString()}</span>
                  </div>
                  {video.review_time && (
                    <div className="flex justify-between">
                      <span>审核时间:</span>
                      <span>{new Date(video.review_time).toLocaleString()}</span>
                    </div>
                  )}
                  {video.rejection_note && (
                    <div className="mt-2 p-3 bg-destructive/10 rounded-lg">
                      <p className="text-destructive font-medium">驳回原因:</p>
                      <p className="mt-1">{video.rejection_note}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
