# YouTube 接口文档

本文档整理项目中使用的 YouTube 相关接口，包括入参、出参及调用示例。

---

## 1. YouTube Data API v3 - 获取热门视频

### 接口用途
获取 YouTube 热门视频列表，用于自动采集 AI 相关视频。

### 请求信息
- **URL**: `https://www.googleapis.com/youtube/v3/videos`
- **方法**: `GET`
- **认证**: API Key（无需 OAuth）

### 入参说明

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|---------|
| part | string | 是 | 返回资源属性，多个用逗号分隔 | `snippet` |
| chart | string | 是 | 排行榜类型 | `mostPopular` |
| videoCategoryId | string | 是 | 视频分类 ID（28=科技） | `28` |
| regionCode | string | 否 | 地区代码 | `US` |
| maxResults | number | 否 | 返回结果数量（0-50） | `20` |
| key | string | 是 | YouTube API Key | `AIzaSy...` |

### 出参说明

```json
{
  "kind": "youtube#videoListResponse",
  "etag": "etag",
  "items": [
    {
      "kind": "youtube#video",
      "etag": "etag",
      "id": "dQw4w9WgXcQ",
      "snippet": {
        "publishedAt": "2024-01-01T00:00:00Z",
        "channelId": "UC...",
        "title": "Video Title",
        "description": "Video Description",
        "thumbnails": {
          "default": { "url": "https://..." },
          "medium": { "url": "https://..." },
          "high": { "url": "https://..." }
        },
        "channelTitle": "Channel Name",
        "categoryId": "28"
      }
    }
  ],
  "nextPageToken": "CAUQ",
  "pageInfo": {
    "totalResults": 100,
    "resultsPerPage": 20
  }
}
```

### 调用示例（代码）

```typescript
// lib/services/youtube.ts - fetchPopularAIVideos
const url = new URL('https://www.googleapis.com/youtube/v3/videos');
url.searchParams.set('part', 'snippet');
url.searchParams.set('chart', 'mostPopular');
url.searchParams.set('videoCategoryId', '28');
url.searchParams.set('regionCode', 'US');
url.searchParams.set('maxResults', '20');
url.searchParams.set('key', YOUTUBE_API_KEY!);

const response = await fetch(url.toString());
const data = await response.json();

// 转换后的返回结构
const videos = data.items.map(v => ({
  id: v.id,
  title: v.snippet.title,
  description: v.snippet.description,
  thumbnails: v.snippet.thumbnails,
  channelTitle: v.snippet.channelTitle,
  publishedAt: v.snippet.publishedAt,
}));
```

### 日志记录格式

```json
{
  "api_call": "fetchPopularAIVideos",
  "request": {
    "url": "https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&videoCategoryId=28&regionCode=US&maxResults=20&key=...",
    "part": "snippet",
    "chart": "mostPopular",
    "videoCategoryId": "28",
    "regionCode": "US",
    "maxResults": 20
  },
  "response": {
    "itemCount": 20,
    "items": [
      { "id": "xxx", "title": "Video Title" }
    ]
  },
  "timestamp": "2026-05-06T12:00:00.000Z"
}
```

### 注意事项
- 每日配额限制：10,000 单位/天（一次请求消耗 1 单位）
- `videoCategoryId=28` 是科技类别，可根据需要调整
- `regionCode` 影响返回的热门视频地区偏好
- API Key 需要有 YouTube Data API v3 的访问权限

---

## 2. YouTube TimedText API - 获取字幕列表

### 接口用途
获取指定视频可用的字幕轨道列表（无需 OAuth 授权）。

### 请求信息
- **URL**: `https://www.youtube.com/api/timedtext`
- **方法**: `GET`
- **认证**: 无需认证

### 入参说明

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|---------|
| type | string | 是 | 操作类型 | `list` |
| v | string | 是 | YouTube 视频 ID | `dQw4w9WgXcQ` |

### 出参说明

返回 XML 格式的字幕轨道列表：

```xml
<transcript_list>
  <track id="en" name="English" lang_code="en" lang_original="English" lang_translated="English" lang_default="true"/>
  <track id="zh-Hans" name="Chinese (Simplified)" lang_code="zh-Hans" lang_original="Chinese (Simplified)" lang_translated="Chinese (Simplified)"/>
  <track id="ja" name="Japanese" lang_code="ja" lang_original="Japanese" lang_translated="Japanese"/>
</transcript_list>
```

### 调用示例（代码）

```typescript
// lib/services/youtube.ts - fetchVideoCaptions
const url = `https://www.youtube.com/api/timedtext?type=list&v=${videoId}`;

const response = await fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
});

const xmlText = await response.text();

// 解析 XML 提取字幕轨道
const captions: YouTubeCaption[] = [];
const trackRegex = /<track[^>]*?id="([^"]*)"[^>]*?name="([^"]*)"[^>]*?lang_code="([^"]*)"[^>]*?>/g;

let match;
while ((match = trackRegex.exec(xmlText)) !== null) {
  captions.push({
    id: match[1] || `${match[3]}-${match[2]}`,
    videoId: videoId,
    language: match[3],
    name: match[2],
    isDraft: false,
    isDraftStore: false,
    trackKind: 'standard',
  });
}
```

### 日志记录格式

```json
{
  "api_call": "fetchVideoCaptions",
  "request": {
    "url": "https://www.youtube.com/api/timedtext?type=list&v=dQw4w9WgXcQ",
    "videoId": "dQw4w9WgXcQ",
    "api": "TimedText list"
  },
  "response": {
    "captionCount": 3,
    "captions": [
      { "language": "en", "name": "English" },
      { "language": "zh-Hans", "name": "Chinese (Simplified)" }
    ]
  },
  "timestamp": "2026-05-06T12:00:01.000Z"
}
```

### 注意事项
- 该接口是 YouTube 内部 API，非官方公开接口，可能随时变更
- 返回的是 XML 格式，需要解析提取信息
- 即使视频有字幕，也可能返回空列表（某些视频限制）
- 无需 API Key 或 OAuth 授权

---

## 3. YouTube TimedText API - 下载字幕内容

### 接口用途
下载指定视频的指定语言字幕内容。

### 请求信息
- **URL**: `https://www.youtube.com/api/timedtext`
- **方法**: `GET`
- **认证**: 无需认证

### 入参说明

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|---------|
| v | string | 是 | YouTube 视频 ID | `dQw4w9WgXcQ` |
| lang | string | 是 | 字幕语言代码 | `en` |
| name | string | 否 | 字幕名称（多字幕时指定） | `English` |

### 出参说明

返回 XML 格式的字幕内容：

```xml
<transcript>
  <text start="0.0" dur="2.5">Hello, welcome to this video.</text>
  <text start="2.5" dur="3.0">Today we're going to talk about AI.</text>
  <text start="5.5" dur="2.0">Let's get started.</text>
</transcript>
```

### 调用示例（代码）

```typescript
// lib/services/youtube.ts - downloadCaptionForVideo
const url = new URL('https://www.youtube.com/api/timedtext');
url.searchParams.set('v', videoId);
url.searchParams.set('lang', lang);
if (name) {
  url.searchParams.set('name', name);
}

const response = await fetch(url.toString(), {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
});

const text = await response.text();

// 解析 XML 提取文本
const textRegex = /<text start="[^"]*" dur="[^"]*"[^>]*>([^<]*)<\/text>/g;
const textLines: string[] = [];
let match;

while ((match = textRegex.exec(content)) !== null) {
  const text = match[1]
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  if (text.trim()) {
    textLines.push(text.trim());
  }
}
```

### 日志记录格式

```json
{
  "api_call": "downloadCaptionForVideo",
  "request": {
    "url": "https://www.youtube.com/api/timedtext?v=dQw4w9WgXcQ&lang=en&name=English",
    "videoId": "dQw4w9WgXcQ",
    "lang": "en",
    "name": "English"
  },
  "response": {
    "contentLength": 1234,
    "preview": "<transcript>\n  <text start=\"0.0\" dur=\"2.5\">Hello..."
  },
  "timestamp": "2026-05-06T12:00:02.000Z"
}
```

### 注意事项
- 该接口是 YouTube 内部 API，非官方公开接口
- 返回 XML 格式，需要解析 `<text>` 标签
- XML 实体需要解码（`&amp;` → `&` 等）
- 某些视频可能禁用字幕下载，会返回空内容
- `lang` 参数使用语言代码，如 `en`、`zh-Hans`、`ja` 等

---

## 4. 接口调用流程

```
1. 获取热门视频 (fetchPopularAIVideos)
   ↓
2. 对每个视频获取字幕列表 (fetchVideoCaptions)
   ↓
3. 选择英文字幕（或第一个可用字幕）
   ↓
4. 下载字幕内容 (downloadCaptionForVideo)
   ↓
5. 解析字幕 XML，提取文本
   ↓
6. 调用翻译服务翻译文本
```

---

## 5. 数据库日志

所有接口调用都会记录到 `videos` 表的 `youtube_api_log` 字段（JSONB 类型）：

```sql
ALTER TABLE videos ADD COLUMN IF NOT EXISTS youtube_api_log JSONB DEFAULT NULL;
```

日志结构为数组，包含所有接口调用的入参和出参：

```json
[
  {
    "api_call": "fetchPopularAIVideos",
    "request": { ... },
    "response": { ... },
    "timestamp": "2026-05-06T12:00:00.000Z"
  },
  {
    "api_call": "fetchVideoCaptions",
    "request": { ... },
    "response": { ... },
    "timestamp": "2026-05-06T12:00:01.000Z"
  }
]
```

---

## 6. 环境变量配置

| 变量名 | 说明 | 示例值 |
|--------|------|---------|
| YOUTUBE_API_KEY | YouTube Data API v3 密钥 | `AIzaSy...` |
| YOUTUBE_REGION | 视频搜索地区 | `US` |

---

## 7. 常见问题

### Q: 为什么不使用 YouTube Data API 的 captions.list 接口？
A: 该接口需要 OAuth 2.0 授权，无法访问第三方视频的字幕。我们使用 TimedText API 作为替代方案，无需授权。

### Q: TimedText API 返回空列表怎么办？
A: 可能原因：
1. 视频没有字幕
2. 视频禁用了字幕下载
3. 网络问题（需要代理）

### Q: 字幕解析失败怎么办？
A: 检查 XML 格式是否正确，确保解码了 XML 实体（`&amp;` 等）。

---

## 8. 相关文件

| 文件路径 | 说明 |
|----------|------|
| `lib/services/youtube.ts` | YouTube API 调用服务 |
| `lib/services/transcription.ts` | 字幕解析和转录服务 |
| `app/api/scheduler/run/route.ts` | 调度器，调用 YouTube API |
| `lib/db-types.ts` | 数据库类型定义（含 YouTubeApiLogEntry） |
| `supabase/migrations/add_youtube_api_log.sql` | 数据库迁移文件 |
