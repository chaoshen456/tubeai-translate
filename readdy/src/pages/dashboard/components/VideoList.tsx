import { MoreHorizontal, Eye, Globe, AlertCircle, Play, Edit2, Trash2, ExternalLink } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const videos = [
  {
    id: "1",
    title: "How to Build a SaaS in 2025",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg",
    originalLanguage: "English",
    targetLanguages: ["Spanish", "French", "German"],
    status: "published",
    views: 45230,
    createdAt: "2025-04-28",
    updatedAt: "2025-05-01",
  },
  {
    id: "2",
    title: "React Server Components Explained",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg",
    originalLanguage: "English",
    targetLanguages: ["Japanese", "Korean"],
    status: "translating",
    views: 12800,
    createdAt: "2025-05-02",
    updatedAt: "2025-05-05",
  },
  {
    id: "3",
    title: "AI Tools for Content Creators",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg",
    originalLanguage: "English",
    targetLanguages: ["Portuguese", "Italian"],
    status: "review",
    views: 8900,
    createdAt: "2025-05-03",
    updatedAt: "2025-05-06",
  },
  {
    id: "4",
    title: "TypeScript Best Practices 2025",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg",
    originalLanguage: "English",
    targetLanguages: ["Chinese", "Russian"],
    status: "draft",
    views: 0,
    createdAt: "2025-05-06",
    updatedAt: "2025-05-06",
  },
  {
    id: "5",
    title: "Next.js 15 Full Tutorial",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg",
    originalLanguage: "English",
    targetLanguages: ["Spanish", "French", "German", "Japanese"],
    status: "published",
    views: 67200,
    createdAt: "2025-04-15",
    updatedAt: "2025-04-20",
  },
  {
    id: "6",
    title: "Supabase vs Firebase in 2025",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg",
    originalLanguage: "English",
    targetLanguages: ["Korean"],
    status: "failed",
    views: 0,
    createdAt: "2025-05-04",
    updatedAt: "2025-05-04",
  },
];

const statusConfig: Record<string, { label: string; color: string; dot: string; icon: React.ElementType }> = {
  published: { label: "Published", color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", icon: Play },
  translating: { label: "Translating", color: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", icon: Globe },
  review: { label: "In Review", color: "bg-sky-50 text-sky-700 border-sky-200", dot: "bg-sky-500", icon: Eye },
  draft: { label: "Draft", color: "bg-gray-50 text-gray-600 border-gray-200", dot: "bg-gray-400", icon: Edit2 },
  failed: { label: "Failed", color: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500", icon: AlertCircle },
};

export default function VideoList() {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    }
    if (openMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  const formatViews = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-primary">Recent Videos</h2>
          <p className="text-[13px] text-muted-foreground mt-0.5">Manage and monitor your video translations</p>
        </div>
        <a
          href="/dashboard/videos"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer whitespace-nowrap"
        >
          View all
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-[#fafafa]/80">
              <th className="text-left px-6 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Video</th>
              <th className="text-left px-6 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Languages</th>
              <th className="text-left px-6 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="text-right px-6 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Views</th>
              <th className="px-6 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {videos.map((video) => {
              const status = statusConfig[video.status];
              const StatusIcon = status.icon;
              return (
                <tr key={video.id} className="hover:bg-[#fafafa]/60 transition-colors group">
                  {/* Video cell */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-[88px] h-[50px] rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 relative">
                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                          <Play className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-primary truncate">{video.title}</p>
                        <p className="text-[12px] text-muted-foreground mt-0.5">{video.originalLanguage}</p>
                      </div>
                    </div>
                  </td>

                  {/* Languages */}
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1.5">
                        {video.targetLanguages.slice(0, 3).map((lang, i) => (
                          <div
                            key={lang}
                            className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center"
                          >
                            <span className="text-[9px] font-bold text-gray-600">{lang.slice(0, 2).toUpperCase()}</span>
                          </div>
                        ))}
                        {video.targetLanguages.length > 3 && (
                          <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                            <span className="text-[9px] font-bold text-gray-600">+{video.targetLanguages.length - 3}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-[12px] text-muted-foreground">
                        {video.targetLanguages.length} {video.targetLanguages.length === 1 ? "lang" : "langs"}
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border ${status.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </td>

                  {/* Views */}
                  <td className="px-6 py-4 text-right hidden md:table-cell">
                    <div className="flex items-center justify-end gap-1.5 text-[13px] font-medium text-muted-foreground">
                      <Eye className="w-3.5 h-3.5 text-muted-foreground/60" />
                      {video.views > 0 ? formatViews(video.views) : "—"}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 relative" ref={openMenuId === video.id ? menuRef : undefined}>
                    <button
                      onClick={() => setOpenMenuId(openMenuId === video.id ? null : video.id)}
                      className="p-1.5 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </button>
                    {openMenuId === video.id && (
                      <div className="absolute right-4 top-full mt-1 w-44 rounded-xl border border-border bg-white shadow-xl z-50 py-1 overflow-hidden">
                        <button className="w-full text-left px-4 py-2.5 text-[13px] text-primary hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2.5">
                          <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                          Edit Video
                        </button>
                        <button className="w-full text-left px-4 py-2.5 text-[13px] text-primary hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2.5">
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                          Open in YouTube
                        </button>
                        <div className="border-t border-border my-1" />
                        <button className="w-full text-left px-4 py-2.5 text-[13px] text-red-600 hover:bg-red-50 transition-colors cursor-pointer flex items-center gap-2.5">
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
