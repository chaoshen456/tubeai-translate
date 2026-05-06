declare module 'youtube-transcript' {
  export interface TranscriptResponse {
    text: string;
    start: number;
    duration: number;
  }

  export interface TranscriptConfig {
    lang?: string;
  }

  export function fetchTranscript(
    videoIdOrUrl: string,
    options?: TranscriptConfig
  ): Promise<TranscriptResponse[]>;
}
