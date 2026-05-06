declare module 'youtube-transcript-api' {
  export interface TranscriptItem {
    text: string;
    start: number;
    duration: number;
  }

  export class TranscriptClient {
    constructor(options?: Record<string, unknown>);
    static fetchTranscript(
      videoId: string,
      options?: { lang?: string }
    ): Promise<TranscriptItem[]>;
  }

  export default TranscriptClient;
}
