# YouTube AI 译智平台

自动化获取 YouTube AI 前沿视频，智能翻译为中文，提供完整的翻译审核与管理平台。

## 功能特点

- **自动抓取**：通过 YouTube Data API v3 获取 AI 技术热门视频
- **智能转录**：优先使用 YouTube 字幕，无字幕时自动调用 Whisper 语音转文字
- **AI 翻译**：基于 GPT-4 模型，将英文视频内容高质量翻译为中文
- **审核管理**：完整的审核流程（待翻译 → 待审核 → 通过/驳回 → 待发布 → 已发布）
- **Markdown 导出**：一键生成格式化的 Markdown 文档，便于发布
- **响应式界面**：基于 Next.js 15 + Tailwind CSS 的现代化管理界面

## 技术栈

### 前端
- **框架**：Next.js 15 (App Router) + React 19
- **语言**：TypeScript
- **样式**：Tailwind CSS + Radix UI 组件
- **状态管理**：TanStack Query (React Query)
- **主题**：next-themes 支持深色/浅色模式

### 后端
- **数据库**：Supabase (PostgreSQL)
- **认证**：Supabase Auth with RBAC
- **API**：Next.js API Routes
- **部署**：Vercel (自动部署)

### AI 服务
- **翻译**：OpenRouter API (GPT-4.1-mini)
- **转录**：YouTube Captions API + OpenAI Whisper
- **视频源**：YouTube Data API v3

## 快速开始

### 环境要求

- Node.js 18+
- Supabase 项目
- YouTube Data API v3 密钥
- OpenRouter 或 OpenAI API 密钥

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/your-username/youtube-ai-translator.git
   cd youtube-ai-translator
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   
   复制 `.env.example` 到 `.env.local` 并填写：
   ```env
   # Supabase 配置
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # YouTube API
   YOUTUBE_API_KEY=your-youtube-api-key
   YOUTUBE_REGION=US  # 可选，默认 US

   # AI 翻译服务
   OPENROUTER_API_KEY=your-openrouter-api-key
   OPENAI_API_KEY=your-openai-api-key  # 备用
   OPENROUTER_MODEL=openai/gpt-4.1-mini  # 可选，默认此模型

   # 其他配置
   SITE_URL=http://localhost:3000  # 生产环境改为实际域名
   CRON_SECRET=your-cron-secret  # 定时任务密钥
   ```

4. **设置数据库**
   
   在 Supabase SQL 编辑器中运行 `db/schema.sql`：
   ```sql
   -- 视频表
   CREATE TABLE videos (
     id SERIAL PRIMARY KEY,
     youtube_id TEXT UNIQUE NOT NULL,
     title TEXT NOT NULL,
     thumbnail_url TEXT,
     original_transcript TEXT,
     translated_text TEXT,
     status TEXT DEFAULT 'Pending Translation',
     ingest_time TIMESTAMPTZ DEFAULT NOW(),
     review_time TIMESTAMPTZ,
     publish_time TIMESTAMPTZ,
     rejection_note TEXT
   );

   -- 创建索引
   CREATE INDEX idx_videos_status ON videos(status);
   CREATE INDEX idx_videos_ingest_time ON videos(ingest_time DESC);
   ```

5. **启动开发服务器**
   ```bash
   npm run dev
   ```
   
   访问 [http://localhost:3000](http://localhost:3000)

## 项目结构

```
├── app/
│   ├── api/              # API 路由
│   │   ├── videos/       # 视频 CRUD API
│   │   └── scheduler/   # 定时抓取任务
│   ├── auth/            # 认证页面（登录、注册、密码重置）
│   ├── dashboard/       # 仪表盘页面
│   └── videos/[id]/    # 视频详情页
├── components/
│   ├── ui/             # 基础 UI 组件 (shadcn/ui)
│   ├── video-list-table.tsx    # 视频列表组件
│   ├── video-status-badge.tsx  # 状态标签组件
│   ├── dashboard-sidebar.tsx   # 侧边栏导航
│   ├── fetch-videos-button.tsx # 视频抓取按钮
│   └── ...
├── lib/
│   ├── supabase/        # Supabase 客户端配置
│   ├── hooks/           # React Query 钩子
│   ├── services/        # 外部 API 服务
│   │   ├── youtube.ts         # YouTube API 服务
│   │   ├── transcription.ts   # 转录服务
│   │   └── translation.ts    # 翻译服务
│   └── db-types.ts      # 数据库类型定义
├── doc/                 # 项目文档
└── public/              # 静态资源
```

## 使用说明

### 1. 注册/登录
访问首页，点击注册创建账户，或使用现有账户登录。

### 2. 抓取视频
在仪表盘点击"获取视频"按钮：
- 选择视频源：AI 前沿视频 / 热门视频 / 博主视频
- 选择博主（博主视频模式下）：TEDx Talks、Lex Fridman 等
- 选择抓取数量：1-20 条
- 点击"获取视频"开始抓取

### 3. 审核翻译
- 查看视频列表，点击任意视频进入详情
- 左侧显示原文，右侧可编辑翻译
- 审核通过后点击"通过审核"
- 如需修改可点击"保存草稿"
- 驳回的视频可以重新翻译

### 4. 导出内容
审核通过后，可一键生成 Markdown 文档，包含：
- 视频标题和缩略图
- 带时间戳的翻译内容
- YouTube 原文链接

## 视频状态流程

```
待翻译 (Pending Translation)
    ↓
待审核 (Pending Review)
    ↓
通过 (Approved)  /  驳回 (Rejected)
    ↓                      ↓
待发布 (Ready to Publish)  重新翻译
    ↓
已发布 (Published)
```

## 部署到 Vercel

1. **连接 GitHub 仓库**
   - 访问 [vercel.com](https://vercel.com)
   - 点击 "New Project"
   - 导入你的 GitHub 仓库

2. **配置环境变量**
   
   在 Vercel 项目设置中添加所有环境变量（参考上面的 `.env.local` 配置）

3. **部署**
   - Vercel 会自动检测 Next.js 项目
   - 每次推送到 `main` 分支会自动部署

4. **配置 Supabase**
   - 在 Supabase Dashboard 中设置 Authentication → URL Configuration
   - 添加站点 URL 和重定向地址

## 定时任务（可选）

使用 Vercel Cron 或 Supabase Scheduled Functions 设置每日自动抓取：

```json
{
  "crons": [{
    "path": "/api/scheduler/run",
    "schedule": "0 2 * * *"
  }]
}
```

## 环境变量说明

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase 公开密钥 | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务角色密钥 | ✅ |
| `YOUTUBE_API_KEY` | YouTube Data API v3 密钥 | ✅ |
| `YOUTUBE_REGION` | 视频搜索地区代码（默认：US） | ❌ |
| `OPENROUTER_API_KEY` | OpenRouter API 密钥 | ✅ |
| `OPENAI_API_KEY` | OpenAI API 密钥（备用） | ❌ |
| `OPENROUTER_MODEL` | 翻译模型（默认：openai/gpt-4.1-mini） | ❌ |
| `CRON_SECRET` | 定时任务认证密钥 | ❌ |
| `SITE_URL` | 站点 URL（用于 API 请求头） | ❌ |

## 文档

完整文档位于 `doc/` 目录：
- `项目需求文档.md` - 项目需求和功能说明
- `技术栈文档.md` - 技术选型和架构说明
- `应用流程文档.md` - 业务流程详解
- `后端开发规范文档.md` - 后端开发规范
- `安全指南.md` - 安全设计和实现规范

## License

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

---

**注意**：本项目仅用于学习和研究目的。请遵守 YouTube API 服务条款和 OpenAI 使用政策。
