-- 添加 youtube_api_log 字段到 videos 表
ALTER TABLE videos ADD COLUMN IF NOT EXISTS youtube_api_log JSONB DEFAULT NULL;

-- 添加注释
COMMENT ON COLUMN videos.youtube_api_log IS '记录 YouTube API 调用的入参和出参，用于调试';
