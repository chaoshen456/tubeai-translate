# Supabase Edge Functions 定时任务配置指南

## 什么是 Supabase Edge Functions？

Supabase Edge Functions 是运行在全球边缘网络的 Serverless 函数，支持 JavaScript/TypeScript。可以通过 Supabase Dashboard 配置定时触发，实现每日视频抓取和翻译任务。

## 准备工作

### 1. 安装 Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Windows (via npm)
npm install -g supabase

# Linux
curl -fsSL https://supabase.com/install.sh | bash
```

### 2. 初始化项目

```bash
# 登录 Supabase
supabase login

# 链接到你的项目
supabase link --project-ref YOUR_PROJECT_REF
```

## 创建定时函数

### 1. 创建函数目录

```bash
mkdir -p supabase/functions/daily-ingest
```

### 2. 创建主函数文件

创建 `supabase/functions/daily-ingest/index.ts`：

```typescript
import { serve } from 'https://deno.land/x/supabase/functions@0.1.0/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  try {
    // 验证调用来源（可以添加密钥验证）
    if (req.headers.get('Authorization') !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    let processed = 0;
    const errors: string[] = [];

    // 获取热门视频（需要实现 fetchPopularAIVideos 函数）
    const videos = await fetchPopularAIVideos(10);

    for (const video of videos) {
      try {
        // 检查是否已存在
        const { data: existing } = await supabase
          .from('videos')
          .select('id')
          .eq('youtube_id', video.id)
          .single();

        if (existing) continue;

        // 创建视频记录
        const { data: newVideo } = await supabase
          .from('videos')
          .insert({
            youtube_id: video.id,
            title: video.title,
            thumbnail_url: video.thumbnails?.high?.url,
            status: 'Pending Translation',
          })
          .select()
          .single();

        if (!newVideo) continue;

        // 获取转录和翻译
        const transcript = await getYouTubeTranscript(video.id);
        if (transcript) {
          const translated = await translateText(transcript);

          await supabase
            .from('videos')
            .update({
              original_text: transcript,
              translated_text: translated,
              status: 'Pending Review',
            })
            .eq('id', newVideo.id);
        }

        processed++;
      } catch (error) {
        errors.push(`Error: ${error.message}`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed,
      errors,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message,
    }), { status: 500 });
  }
});

// 实现视频抓取函数
async function fetchPopularAIVideos(maxResults: number) {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&videoCategoryId=28&regionCode=US&maxResults=${maxResults}&key=${Deno.env.get('YOUTUBE_API_KEY')}`
  );
  const data = await response.json();
  return data.items || [];
}

// 实现转录函数（简化版）
async function getYouTubeTranscript(videoId: string): Promise<string | null> {
  // 实际实现需要 YouTube Captions API
  return 'Transcript placeholder';
}

// 实现翻译函数
async function translateText(text: string): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-4.1-mini',
      messages: [{ role: 'user', content: `Translate to Chinese: ${text}` }],
    }),
  });
  const data = await response.json();
  return data.choices[0]?.message?.content || text;
}
```

### 3. 创建配置文件

创建 `supabase/functions/daily-ingest/config.json`：

```json
{
  "import_map": ["./import_map.json"]
}
```

### 4. 部署函数

```bash
# 本地开发和测试
supabase functions serve daily-ingest

# 部署到生产环境
supabase functions deploy daily-ingest --project-ref YOUR_PROJECT_REF
```

## 配置定时触发

### 方法 1: Supabase Dashboard（推荐）

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 进入你的项目
3. 左侧菜单 → **Edge Functions**
4. 找到 `daily-ingest` 函数
5. 点击 **Add Trigger** → **Cron**
6. 设置 Cron 表达式：
   - 每天 8:00 UTC: `0 8 * * *`
   - 每天 0:00 UTC: `0 0 * * *`
   - 每小时: `0 * * * *`
7. 添加环境变量

### 方法 2: 使用 Supabase CLI

```bash
# 添加 Cron 触发器
supabase functions cron add daily-ingest "0 8 * * *"
```

### 方法 3: 使用数据库触发

创建 `supabase/migrations/add_cron_trigger.sql`：

```sql
-- 创建 pg_cron 扩展（如果需要）
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 添加定时任务（每天 8:00 UTC）
SELECT cron.schedule(
  'daily-ingest',
  '0 8 * * *',
  $$
  SELECT
    http_post(
      'https://YOUR_PROJECT_REF.supabase.co/functions/v1/daily-ingest',
      '{}',
      'application/json',
      ARRAY[
        'Authorization: Bearer YOUR_CRON_SECRET',
        'Content-Type: application/json'
      ]::TEXT[]
    ) AS response;
  $$
);
```

## 环境变量配置

### 本地开发 (.env)

创建 `supabase/.env`：

```makefile
SUPABASE_URL=your-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
YOUTUBE_API_KEY=your-youtube-api-key
OPENROUTER_API_KEY=your-openrouter-api-key
CRON_SECRET=your-random-secret
```

### 生产环境

在 Supabase Dashboard → Project Settings → Environment Variables：

| 变量名 | 说明 |
|-------|------|
| `SUPABASE_URL` | 项目 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key |
| `YOUTUBE_API_KEY` | YouTube API 密钥 |
| `OPENROUTER_API_KEY` | OpenRouter 密钥 |
| `CRON_SECRET` | 用于验证的随机字符串 |

## 监控和日志

### 查看函数日志

```bash
# 实时查看日志
supabase functions logs daily-ingest --follow

# 查看最近的日志
supabase functions logs daily-ingest
```

### 在 Dashboard 查看

1. Dashboard → Edge Functions → daily-ingest
2. 切换到 **Logs** 标签

## 常见问题

**Q: 函数超时？**
A: Edge Functions 默认 60 秒超时，适当减少视频数量或优化代码

**Q: API 配额不足？**
A: 添加重试机制和缓存，降低抓取频率

**Q: 如何调试？**
A: 使用 `supabase functions serve` 本地运行

**Q: Cron 任务没执行？**
A: 检查时间表达式是否正确，查看函数日志