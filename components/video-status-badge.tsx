import type { VideoStatus } from '@/lib/db-types';
import { cn } from '@/lib/utils';

const statusStyles: Record<VideoStatus, string> = {
  'Pending Translation': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  'Pending Review': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  Approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  Rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  'Ready to Publish': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  Published: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
};

interface VideoStatusBadgeProps {
  status: VideoStatus;
  className?: string;
}

export function VideoStatusBadge({ status, className }: VideoStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        statusStyles[status],
        className
      )}
    >
      {status}
    </span>
  );
}