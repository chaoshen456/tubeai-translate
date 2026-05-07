import type { VideoStatus } from '@/lib/db-types';
import { cn } from '@/lib/utils';

const statusConfig: Record<VideoStatus, { label: string; color: string; dot: string }> = {
  'Pending Translation': {
    label: '待翻译',
    color: 'bg-gray-50 text-gray-600 border-gray-200',
    dot: 'bg-gray-400',
  },
  'Pending Review': {
    label: '待审核',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  Approved: {
    label: '已通过',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  Rejected: {
    label: '已驳回',
    color: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500',
  },
  'Ready to Publish': {
    label: '待发布',
    color: 'bg-sky-50 text-sky-700 border-sky-200',
    dot: 'bg-sky-500',
  },
  Published: {
    label: '已发布',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-500',
  },
};

interface VideoStatusBadgeProps {
  status: VideoStatus;
  className?: string;
}

export function VideoStatusBadge({ status, className }: VideoStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border',
        config.color,
        className
      )}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
