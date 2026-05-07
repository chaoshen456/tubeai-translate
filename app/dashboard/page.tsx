import { VideoListTable } from '@/components/video-list-table';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { FetchVideosButton } from '@/components/fetch-videos-button';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { Suspense } from 'react';
import { Bell, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#f7f7f8]">
      <DashboardSidebar />

      <div className="ml-64 min-h-screen flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 bg-white/90 backdrop-blur-md border-b border-border">
          <div>
            <h1 className="text-lg font-bold text-primary tracking-tight">仪表盘</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              欢迎回来！管理你的 YouTube AI 视频翻译。
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Input
                placeholder="搜索视频..."
                className="w-64 h-10 rounded-xl border-input bg-transparent px-3 text-[13px] focus-visible:ring-1 focus-visible:ring-ring pl-9"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground" />
            </div>

            {/* Notifications */}
            <button
              type="button"
              className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors relative"
              aria-label="通知"
            >
              <Bell className="w-[18px] h-[18px] text-muted-foreground" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>

            <div className="ml-1 pl-3 border-l border-border">
              <ThemeSwitcher />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Action Bar */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[15px] font-semibold text-primary">视频列表</h2>
                <p className="text-[13px] text-muted-foreground mt-0.5">管理和监控你的视频翻译</p>
              </div>
              <Suspense>
                <FetchVideosButton />
              </Suspense>
            </div>

            <VideoListTable />
          </div>
        </main>
      </div>
    </div>
  );
}
