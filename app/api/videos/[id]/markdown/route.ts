import { createClient } from '@/lib/supabase/server';
import { type NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const videoId = parseInt(id);

  if (isNaN(videoId)) {
    return Response.json({ error: 'Invalid video ID' }, { status: 400 });
  }

  const { data: video, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', videoId)
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  if (video.status !== 'Ready to Publish') {
    return Response.json({ error: 'Video must be approved to generate markdown' }, { status: 400 });
  }

  // Generate markdown content
  const markdown = generateMarkdown(video);

  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${sanitizeFilename(video.title)}.md"`,
    },
  });
}

function generateMarkdown(video: {
  title: string;
  youtube_id: string;
  translated_text: string;
  ingest_time: string;
}): string {
  const publishDate = new Date().toISOString().split('T')[0];
  const tags = ['AI', 'YouTube', 'Technology', 'Translation'];

  return `---
title: ${video.title}
date: ${publishDate}
tags: [${tags.join(', ')}]
source: https://www.youtube.com/watch?v=${video.youtube_id}
---

# ${video.title}

> 来源视频：[YouTube 链接](https://www.youtube.com/watch?v=${video.youtube_id})

${video.translated_text?.split('\n').map(line => {
  // Format timestamp lines
  if (line.startsWith('[')) {
    return `\n${line}`;
  }
  return line;
}).join('\n')}

---

*本文由 AI 自动翻译生成，已人工审核确认*`;
}

function sanitizeFilename(title: string): string {
  return title
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
}