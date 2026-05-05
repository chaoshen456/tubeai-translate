# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture Overview

This is a Next.js application for automating YouTube AI video translation and publishing to Zhihu. The system consists of:

### Frontend (`app/` directory)
- **Dashboard** (`app/dashboard/`) - Admin interface for reviewing translated videos
- **Auth flows** (`app/auth/`) - Login, sign-up, password reset pages
- Uses Supabase Auth for authentication with role-based access (admin only)

### Backend & Data Flow
1. **Data Fetching**: YouTube Data API v3 fetches trending AI videos (category 28)
2. **Transcription**: YouTube Captions API preferred; falls back to OpenAI Whisper
3. **Translation**: OpenAI GPT-4 translates transcript segments to Chinese
4. **Storage**: Supabase PostgreSQL stores `videos` table with fields:
   - `id`, `youtube_id`, `title`, `thumbnail_url`
   - `original_transcript`, `translated_text`
   - `status` (Pending Translation → Pending Review → Approved/Rejected → Ready to Publish → Published)
   - `ingest_time`, `review_time`, `publish_time`

### Key Components
- `components/video-list-table.tsx` - Main dashboard video listing with status filtering
- `components/video-status-badge.tsx` - Status badge with color coding for video states
- `lib/supabase/client.ts`, `server.ts`, `proxy.ts` - Supabase client setup for SSR and RSC
- `components/ui/*` - UI components (Button, Input, Select, Textarea, Skeleton)

### API Routes
- `app/api/videos/route.ts` - GET list of videos (optionally filtered by status)
- `app/api/videos/[id]/route.ts` - GET/POST single video (save, approve, reject actions)
- `app/api/videos/[id]/markdown/route.ts` - Generate Markdown export
- `app/api/scheduler/run/route.ts` - Trigger the ingestion pipeline

## Services Layer

### `lib/services/youtube.ts`
- Fetches trending AI videos (category 28) via YouTube Data API
- Retrieves captions/subtitles as fallback to Whisper
- Uses `YOUTUBE_API_KEY` and optional `YOUTUBE_REGION` env vars

### `lib/services/transcription.ts`
- Gets transcripts from YouTube captions (preferred)
- Falls back to OpenAI Whisper for videos without captions
- Parses VTT/SRT caption formats into timed segments

### `lib/services/translation.ts`
- Translates transcripts to Chinese using OpenAI GPT-4
- Chunk-based translation for long transcripts
- Uses OpenRouter API endpoint (`https://openrouter.ai/api/v1`)
- Configurable via `OPENROUTER_API_KEY`, `OPENAI_API_KEY`, `OPENROUTER_MODEL` env vars

### Technologies
- **Framework**: Next.js 15 with React 19, TypeScript
- **Styling**: Tailwind CSS with Radix UI primitives
- **Database**: Supabase (PostgreSQL + Edge Functions)
- **AI Services**: OpenAI GPT-4, Whisper API
- **Auth**: Supabase Auth with RBAC
- **State Management**: TanStack Query for data fetching

### Video Status Flow
```
Pending Translation → Pending Review → Approved
                                      ↓
                                   Rejected
                                      ↓
                            Ready to Publish → Published
```

### Deployment
- Hosted on Vercel with automatic deployments from `main` branch
- Environment variables stored in Vercel/Supabase dashboards (never in code)
- Cron jobs via Vercel Cron or Supabase Scheduled Functions

## Required Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side key with database access |
| `YOUTUBE_API_KEY` | YouTube Data API v3 key |
| `YOUTUBE_REGION` | Region code for video search (default: US) |
| `OPENROUTER_API_KEY` / `OPENAI_API_KEY` | AI translation service key |
| `OPENROUTER_MODEL` | GPT model to use (default: openai/gpt-4.1-mini) |
| `CRON_SECRET` | Secret for scheduler endpoint authentication |
| `SITE_URL` | Site URL for OpenRouter referer header |

## Project Structure

```
├── app/
│   ├── api/           # API routes (videos, scheduler)
│   ├── auth/          # Auth pages (login, sign-up, etc.)
│   ├── dashboard/     # Main dashboard page
│   └── videos/[id]/   # Video detail page
├── components/
│   ├── ui/            # shadcn/ui components
│   └── ...            # Feature components
├── lib/
│   ├── supabase/      # Supabase client setup
│   ├── hooks/         # React Query hooks (use-videos.ts)
│   ├── services/      # External API services (youtube, transcription, translation)
│   └── db-types.ts    # TypeScript interfaces
└── doc/               # Project documentation in Chinese
```