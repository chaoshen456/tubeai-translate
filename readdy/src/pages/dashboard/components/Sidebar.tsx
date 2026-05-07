import { LayoutDashboard, Video, Settings, LogOut, Zap } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { id: "videos", label: "Videos", icon: Video, href: "/dashboard/videos" },
  { id: "settings", label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

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
            <p className="text-[11px] text-white/40 font-medium">Video Translator</p>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-3 pt-2 space-y-0.5">
        <p className="px-3 mb-2 text-[11px] uppercase tracking-wider text-white/30 font-semibold">Platform</p>
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          return (
            <a
              key={item.id}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                navigate(item.href);
              }}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
                isActive
                  ? "bg-white/[0.07] text-white"
                  : "text-white/50 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <span className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${isActive ? "bg-amber-500/15" : "bg-transparent group-hover:bg-white/[0.04]"}`}>
                <Icon className={`w-[15px] h-[15px] ${isActive ? "text-amber-400" : "text-white/40 group-hover:text-white/60"}`} />
              </span>
              {item.label}
              {isActive && (
                <span className="ml-auto w-1 h-1 rounded-full bg-amber-400" />
              )}
            </a>
          );
        })}
      </nav>

      {/* Usage Indicator */}
      <div className="px-3 pb-2">
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] text-white/50 font-medium">Storage Usage</p>
            <p className="text-[11px] text-white/70 font-semibold">78%</p>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-amber-400 to-orange-500" />
          </div>
          <p className="text-[10px] text-white/30 mt-2">3.9 GB of 5 GB used</p>
        </div>
      </div>

      {/* User + Logout */}
      <div className="px-3 pb-4 pt-2">
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-white/40 hover:text-white hover:bg-white/[0.04] transition-colors w-full cursor-pointer"
        >
          <span className="w-7 h-7 rounded-md bg-white/[0.04] flex items-center justify-center">
            <LogOut className="w-[15px] h-[15px] text-white/40" />
          </span>
          Log out
        </button>
      </div>
    </aside>
  );
}
