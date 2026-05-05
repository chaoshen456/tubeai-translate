# Vercel Cron 定时任务配置指南

## 什么是 Vercel Cron？

Vercel Cron 是 Vercel 提供的 Serverless 定时任务服务，可以在指定时间间隔自动运行函数。这对我们的 YouTube AI 翻译系统来说，实现每日自动抓取视频、翻译、存储至关重要。

## 配置方法

### 1. 创建定时任务 API 路由

首先，创建定时任务的 API 端点 `app/api/scheduler/run/route.ts`：

```typescript
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchPopularAIVideos } from '@/lib/services/youtube';
import { getTranscript } from '@/lib/services/transcription';
import { translateTranscript } from '@/lib/services/translation';
import { createVideo } from '@/lib/api/videos';

export async function GET(request: NextRequest) {
  // 验证密钥（防止未授权访问）
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // 1. 获取热门 AI 视频
    const videos = await fetchPopularAIVideos(10);

    // 2. 处理每个视频
    for (const video of videos) {
      // 检查是否已存在
      const { data: existing } = await supabase
        .from('videos')
        .select('id')
        .eq('youtube_id', video.id)
        .single();

      if (existing) continue;

      // 3. 创建视频记录
      const newVideo = await createVideo({
        youtube_id: video.id,
        title: video.title,
        thumbnail_url: video.thumbnails?.high?.url,
        status: 'Pending Translation',
      });

      // 4. 获取转录
      const transcript = await getTranscript(video.id, '');
      if (!transcript) continue;

      // 5. 翻译
      const translated = await translateTranscript(transcript.fullText);

      // 6. 更新译文
      await supabase
        .from('videos')
        .update({ original_text: transcript.fullText, translated_text: translated, status: 'Pending Review' })
        .eq('id', newVideo.id);
    }

    return Response.json({ success: true, count: videos.length });
  } catch (error) {
    console.error('Cron job error:', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### 2. 在 vercel.json 配置定时规则

在项目根目录创建或修改 `vercel.json`：

```json
{
  "crons": [
    {
      "path": "/api/scheduler/run",
      "schedule": "0 8 * * *"
    }
  ]
}
```

**schedule** 说明：
- `0 8 * * *` - 每天 8:00 UTC 执行（UTC+8 就是每天 16:00）
- `0 0 * * *` - 每天 0:00 UTC（UTC+8 就是每天 8:00）
- `*/30 * * * *` - 每 30 分钟执行一次
- `0 8 * * 1-5` - 周一到周五 8:00 UTC

### 3. 设置环境变量

在 Vercel 项目设置中添加环境变量：

| 变量名 | 说明 |
|-------|------|
| `CRON_SECRET` | 定时任务验证密钥，随机生成 |
| `YOUTUBE_API_KEY` | YouTube API 密钥 |
| `OPENROUTER_API_KEY` | OpenRouter API 密钥 |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Key |

### 4. 部署和验证

1. 推送代码到 GitHub
2. 在 Vercel 中连接项目
3. 设置环境变量
4. 部署后，在 Vercel Dashboard 的 "Cron Jobs" 标签查看任务

## 高级配置

### 指数退避重试

```typescript
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  throw new Error('Max retries exceeded');
}
```

### 速率限制保护

```typescript
// 在 API 路由中添加速率限制
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({
  window: 60 * 1000, // 1 分钟
  max: 10, // 最多 10 次请求
});
```

## Supabase Edge Functions 替代方案

如果 Vercel Cron 不满足需求，也可以使用 Supabase 定时函数：

1. 安装 Supabase CLI
2. 创建 `supabase/functions/daily-ingest/index.ts`
3. 使用 `supabase functions deploy daily-ingest`
4. 在 Supabase Dashboard 设置定时触发

```bash
# 本地开发
supabase functions serve daily-ingest

# 部署
supabase functions deploy daily-ingest --project-ref YOUR_PROJECT_REF
```

## 监控和告警

在任务中添加日志：

```typescript
console.log(`Processed ${count} videos`);
```

在 Vercel Dashboard 的 "Logs" 标签查看运行日志。

## 常见问题

**Q: Cron 任务没执行？**
A: 检查 vercel.json 语法，确保环境变量正确配置

**Q: YouTube API 配额不足？**
A: 添加缓存机制，减少 API 调用频率

**Q: 任务超时？**
A: Vercel Serverless 函数默认 10s 超时，可以拆分为多个任务