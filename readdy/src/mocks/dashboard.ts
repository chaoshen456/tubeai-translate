export const sidebarNavItems = [
  { id: "dashboard", label: "Dashboard", icon: "ri-dashboard-line", href: "/dashboard", active: true },
  { id: "videos", label: "Videos", icon: "ri-video-line", href: "/dashboard/videos", active: false },
  { id: "settings", label: "Settings", icon: "ri-settings-3-line", href: "/dashboard/settings", active: false },
];

export const userInfo = {
  name: "Alex Chen",
  email: "alex@example.com",
  avatar: "https://ui-avatars.com/api/?name=Alex+Chen&background=09090b&color=fff",
};

export const stats = {
  totalVideos: 128,
  videosThisMonth: 12,
  activeTranslations: 5,
  successRate: 94,
};

export const videos = [
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

export const recentActivity = [
  { id: "1", action: "Published", target: "How to Build a SaaS in 2025", language: "German", time: "2 hours ago" },
  { id: "2", action: "Translation started", target: "React Server Components Explained", language: "Japanese", time: "5 hours ago" },
  { id: "3", action: "Review completed", target: "AI Tools for Content Creators", language: "Portuguese", time: "1 day ago" },
  { id: "4", action: "Published", target: "Next.js 15 Full Tutorial", language: "French", time: "2 days ago" },
  { id: "5", action: "Failed", target: "Supabase vs Firebase in 2025", language: "Korean", time: "3 days ago" },
];