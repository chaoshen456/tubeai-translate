'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const VIDEO_COUNT_OPTIONS = [
  { value: '1', label: '1条' },
  { value: '3', label: '3条' },
  { value: '5', label: '5条' },
  { value: '10', label: '10条' },
  { value: '20', label: '20条' },
];

const SOURCE_OPTIONS = [
  { value: 'search', label: 'AI前沿视频' },
  { value: 'popular', label: '热门视频' },
  { value: 'channel', label: '博主视频' },
];

export function FetchVideosButton() {
  const [isFetching, setIsFetching] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [count, setCount] = useState('');
  const [source, setSource] = useState('search');
  const [channelInput, setChannelInput] = useState('');
  const queryClient = useQueryClient();

  const handleFetch = async () => {
    if (!count) {
      setResult('请先选择视频数量');
      return;
    }

    if (source === 'channel' && !channelInput.trim()) {
      setResult('请输入博主名称或频道ID');
      return;
    }

    setIsFetching(true);
    setResult(null);

    try {
      const params = new URLSearchParams();
      params.set('maxResults', count);
      params.set('source', source);
      if (source === 'channel' && channelInput.trim()) {
        params.set('channel', channelInput.trim());
      }

      const response = await fetch(`/api/scheduler/run?${params.toString()}`, {
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
    <div className="flex items-center gap-4">
      <Select value={source} onValueChange={(value) => {
        setSource(value);
        if (value !== 'channel') setChannelInput('');
      }}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="选择视频源" />
        </SelectTrigger>
        <SelectContent>
          {SOURCE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {source === 'channel' && (
        <input
          type="text"
          placeholder="输入博主名称或频道ID..."
          value={channelInput}
          onChange={(e) => setChannelInput(e.target.value)}
          className="w-[200px] px-3 py-2 border rounded-md text-sm"
        />
      )}

      <Select value={count} onValueChange={setCount}>
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="选择数量" />
        </SelectTrigger>
        <SelectContent>
          {VIDEO_COUNT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex flex-col items-end gap-2">
        <Button onClick={handleFetch} disabled={isFetching || !count}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          {isFetching ? '获取中...' : '获取视频'}
        </Button>
        {result && (
          <p className="text-sm text-muted-foreground">{result}</p>
        )}
      </div>
    </div>
  );
}
