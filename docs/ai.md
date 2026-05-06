# AI Capabilities Reference

## OpenRouter Whisper Implementation

Use OpenRouter with `openai/whisper-large-v3` model for audio transcription.

```javascript
// Audio transcription using OpenRouter Whisper
const audioBuffer = await fs.promises.readFile("audio.wav");
const base64Audio = audioBuffer.toString("base64");

const response = await fetch("https://openrouter.ai/api/v1/audio/transcriptions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": SITE_URL,
    "X-OpenRouter-Title": "YouTube AI Translator",
  },
  body: JSON.stringify({
    model: "openai/whisper-large-v3",
    input_audio: {
      data: base64Audio,
      format: "wav"
    }
  })
});

const result = await response.json();
console.log(result.text);
```

### YouTube Audio Extraction

For YouTube videos, use `ytdl-core` to extract audio before transcribing:

```bash
npm install ytdl-core @types/ytdl-core
```

```javascript
import ytdl from 'ytdl-core';
import { transcribeWithWhisper } from '@/lib/services/transcription';

async function transcribeYouTubeVideo(videoId) {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  
  const audioBuffer = await new Promise((resolve, reject) => {
    const chunks = [];
    const stream = ytdl(videoUrl, { quality: 'highestaudio' });
    
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });

  return await transcribeWithWhisper(audioBuffer, 'mp3');
}
```

### Scheduler Integration

The scheduler at `app/api/scheduler/run/route.ts` now:
1. Fetches YouTube captions if available
2. Falls back to Whisper transcription via ytdl-core
3. Updates `original_text` and `translated_text` fields
4. Sets rejection note if both methods fail