'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Video, Settings, LogOut, Zap } from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: '仪表盘', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'videos', label: '视频管理', icon: Video, href: '/dashboard/videos' },
  { id: 'settings', label: '设置', icon: Settings, href: '/dashboard/settings' },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#0d0d0f] text-white flex flex-col h-screen fixed left-0 top-0 z-40 border-r border-white/[0.06]">
      {/* Brand */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">YouTube AI</h1>
            <p className="text-[11px] text-white/40 font-medium">译智平台</p>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-3 pt-2 space-y-0.5">
        <p className="px-3 mb-2 text-[11px] uppercase tracking-wider text-white/30 font-semibold">平台</p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                isActive
                  ? 'bg-white/[0.07] text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <span className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${isActive ? 'bg-amber-500/15' : 'bg-transparent group-hover:bg-white/[0.04]'}`}>
                <Icon className={`w-[15px] h-[15px] ${isActive ? 'text-amber-400' : 'text-white/40 group-hover:text-white/60'}`} />
              </span>
              {item.label}
              {isActive && (
                <span className="ml-auto w-1 h-1 rounded-full bg-amber-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 pb-4 pt-2">
        <Link
          href="/auth/login"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-white/40 hover:text-white hover:bg-white/[0.04] transition-colors"
        >
          <span className="w-7 h-7 rounded-md bg-white/[0.04] flex items-center justify-center">
            <LogOut className="w-[15px] h-[15px] text-white/40" />
          </span>
          退出登录
        </Link>
      </div>
    </aside>
  );
}
