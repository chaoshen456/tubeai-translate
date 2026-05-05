'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export function FetchVideosButton() {
  const [isFetching, setIsFetching] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleFetch = async () => {
    setIsFetching(true);
    setResult(null);

    try {
      const response = await fetch('/api/scheduler/run', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer manual-trigger-allowed',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult(`成功处理 ${data.processed} 个视频，跳过 ${data.skipped} 个`);
        // Refresh video list queries
        queryClient.invalidateQueries({ queryKey: ['videos'] });
      } else {
        setResult(`错误: ${data.error || '获取失败'}`);
      }
    } catch (error) {
      setResult(`错误: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <Button onClick={handleFetch} disabled={isFetching}>
        <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
        {isFetching ? '获取中...' : '获取热点视频'}
      </Button>
      {result && (
        <p className="text-sm text-muted-foreground">{result}</p>
      )}
    </div>
  );
}