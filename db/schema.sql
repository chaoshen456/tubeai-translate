-- 1. 视频表
CREATE TABLE public.videos (
  id               SERIAL PRIMARY KEY,
  youtube_id       TEXT UNIQUE NOT NULL,
  title            TEXT NOT NULL,
  thumbnail_url    TEXT,
  original_text    TEXT,         -- 完整字幕
  translated_text  TEXT,         -- AI 生成中文文本
  status           TEXT NOT NULL DEFAULT 'Pending Translation',
  -- 枚举：Pending Translation, Pending Review, Approved, Rejected, Ready to Publish, Published
  ingest_time      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  review_time      TIMESTAMP WITH TIME ZONE,
  publish_time     TIMESTAMP WITH TIME ZONE,
  rejection_note   TEXT,
  youtube_api_log  JSONB DEFAULT NULL  -- 记录 YouTube API 调用的入参和出参
);

-- 2. 用户表（由 Supabase Auth 管理）
CREATE TABLE public.users (
  id        UUID PRIMARY KEY,
  email     TEXT UNIQUE NOT NULL,
  role      TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 用户偏好表
CREATE TABLE public.user_preferences (
  user_id        UUID REFERENCES public.users(id) ON DELETE CASCADE,
  notify_email   BOOLEAN DEFAULT TRUE,
  notify_slack   BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (user_id)
);

-- 索引，加速查询
CREATE INDEX idx_videos_status ON public.videos(status);
CREATE INDEX idx_videos_ingest_time ON public.videos(ingest_time);