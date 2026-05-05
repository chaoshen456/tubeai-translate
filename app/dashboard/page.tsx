import { VideoListTable } from '@/components/video-list-table';
import { AuthButton } from '@/components/auth-button';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { FetchVideosButton } from '@/components/fetch-videos-button';
import Link from 'next/link';
import { Suspense } from 'react';

export default function Dashboard() {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
        <div className="w-full max-w-6xl flex justify-between items-center p-3 px-5 text-sm">
          <div className="flex gap-5 items-center font-semibold">
            <Link href="/dashboard">YouTube AI 视频翻译</Link>
          </div>
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <Suspense>
              <AuthButton />
            </Suspense>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-6xl mx-auto p-4 py-8">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Video Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Review and manage translated YouTube AI videos
            </p>
          </div>
          <FetchVideosButton />
        </div>

        <VideoListTable />
      </main>
    </div>
  );
}