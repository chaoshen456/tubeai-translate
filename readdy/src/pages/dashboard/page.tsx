import { useState } from "react";
import { Bell, Search, User, Plus, ArrowUpRight, Sparkles, Clock, TrendingUp } from "lucide-react";
import Sidebar from "./components/Sidebar";
import StatsCards from "./components/StatsCards";
import VideoList from "./components/VideoList";

const activities = [
  { id: "1", action: "Translation completed", target: "How to Build a SaaS in 2025", lang: "Spanish", time: "2 hours ago", type: "success" },
  { id: "2", action: "New video queued", target: "React Server Components Explained", lang: "Japanese", time: "4 hours ago", type: "info" },
  { id: "3", action: "Published to YouTube", target: "AI Tools for Content Creators", lang: "Portuguese", time: "6 hours ago", type: "success" },
  { id: "4", action: "Translation failed", target: "Supabase vs Firebase in 2025", lang: "Korean", time: "1 day ago", type: "error" },
];

const quickActions = [
  { label: "Add Video", icon: Plus, color: "bg-primary text-white hover:bg-primary/90" },
  { label: "Bulk Import", icon: ArrowUpRight, color: "bg-white text-primary border border-border hover:bg-gray-50" },
  { label: "Analytics", icon: TrendingUp, color: "bg-white text-primary border border-border hover:bg-gray-50" },
];

export default function DashboardPage() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-[#f7f7f8]">
      <Sidebar />

      <div className="ml-64 min-h-screen flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 bg-white/90 backdrop-blur-md border-b border-border">
          <div>
            <h1 className="text-lg font-bold text-primary tracking-tight">Dashboard</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Welcome back! Here&apos;s what&apos;s happening with your videos.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="Toggle search"
              >
                <Search className="w-[18px] h-[18px] text-muted-foreground" />
              </button>

              {searchOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-border shadow-xl p-2 z-50">
                  <input
                    type="text"
                    placeholder="Search videos, translations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-[13px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Notifications */}
            <button
              type="button"
              className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors relative cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-[18px] h-[18px] text-muted-foreground" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>

            {/* User */}
            <div className="flex items-center gap-2 ml-1 pl-3 border-l border-border">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center cursor-pointer shadow-sm">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden lg:block">
                <p className="text-[13px] font-semibold text-primary leading-none">Alex Chen</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Pro Plan</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Upgrade Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 border border-amber-200/40 p-5 flex items-center justify-between">
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-primary">Unlock more translations</p>
                  <p className="text-[13px] text-muted-foreground">Upgrade to Pro to translate up to 50 videos per month.</p>
                </div>
              </div>
              <button
                type="button"
                className="relative z-10 inline-flex items-center gap-2 rounded-xl text-[13px] font-semibold transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 cursor-pointer whitespace-nowrap"
              >
                Upgrade Now
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    type="button"
                    className={`inline-flex items-center gap-2 rounded-xl text-[13px] font-medium transition-colors h-9 px-4 cursor-pointer whitespace-nowrap ${action.color}`}
                  >
                    <Icon className="w-4 h-4" />
                    {action.label}
                  </button>
                );
              })}
            </div>

            {/* Stats */}
            <StatsCards />

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
              {/* Video List */}
              <VideoList />

              {/* Right Sidebar - Activity + Info */}
              <div className="space-y-6">
                {/* Activity Feed */}
                <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <h3 className="text-[14px] font-semibold text-primary">Recent Activity</h3>
                    </div>
                  </div>
                  <div className="p-4 space-y-0">
                    {activities.map((activity, i) => (
                      <div
                        key={activity.id}
                        className={`flex gap-3 py-3 ${i !== activities.length - 1 ? "border-b border-border" : ""}`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                            activity.type === "success"
                              ? "bg-emerald-500"
                              : activity.type === "error"
                              ? "bg-red-500"
                              : "bg-sky-500"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-primary">{activity.action}</p>
                          <p className="text-[12px] text-muted-foreground truncate">{activity.target}</p>
                          <p className="text-[11px] text-muted-foreground/70 mt-0.5">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Tip */}
                <div className="rounded-2xl border border-border bg-white shadow-sm p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-sky-500" />
                    </div>
                    <div>
                      <h3 className="text-[13px] font-semibold text-primary">Quick Tip</h3>
                      <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
                        Use AI-powered auto-dubbing to create natural-sounding voiceovers in 12+ languages with just one click.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
