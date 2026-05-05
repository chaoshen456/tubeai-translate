# YouTube AI Video Translator

A daily automated pipeline that fetches trending AI technology videos from YouTube, extracts transcripts, translates them to Chinese, and provides a dashboard for review and publishing.

## Features

- **Daily Automation**: Fetches trending AI videos via YouTube Data API v3
- **Smart Transcription**: Uses YouTube captions or falls back to Whisper speech-to-text
- **AI Translation**: Translates content to Chinese using GPT models via OpenRouter
- **Review Dashboard**: Next.js admin interface for reviewing and editing translations
- **Markdown Export**: Generate publish-ready Markdown files
- **Future Publishing**: Integration with Zhihu for direct publishing

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase PostgreSQL
- **AI Services**: YouTube Data API, OpenRouter (GPT models)
- **Authentication**: Supabase Auth

## Getting Started

### Prerequisites

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get an OpenRouter API key at [openrouter.ai](https://openrouter.ai)
3. Get a YouTube Data API key from [Google Cloud Console](https://console.cloud.google.com)

### Installation

1. Clone the repository

2. Install dependencies
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env.local` and fill in your values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   OPENROUTER_API_KEY=your-openrouter-api-key
   YOUTUBE_API_KEY=your-youtube-api-key
   ```

4. Set up the database schema in Supabase:
   ```sql
   -- Run the SQL from db/schema.sql in your Supabase SQL editor
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/
│   ├── api/           # API routes
│   ├── dashboard/     # Video dashboard page
│   ├── videos/[id]/   # Video detail page
│   └── ...
├── components/
│   ├── ui/            # shadcn/ui components
│   └── ...
├── lib/
│   ├── api/           # Database operations
│   ├── hooks/         # React Query hooks
│   ├── services/      # External API services
│   └── ...
└── db/
    └── schema.sql     # Database schema
```

## Usage

1. Sign up / Login to the dashboard
2. Browse the list of fetched AI videos
3. Click any video to review the original transcript and translated text
4. Edit the translation if needed
5. Click "Approve" to mark for publishing
6. Export as Markdown for manual publishing

## License

MIT