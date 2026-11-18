export type TranscriptEvent = {
  segmentId: string;
  text: string;
  isFinal: boolean;
};

export type SpeechErrorCode = 'denied' | 'unsupported' | 'network' | 'unknown';

export interface SpeechProvider {
  start(): Promise<void>;
  stop(): void;
  onTranscript(cb: (e: TranscriptEvent) => void): void;
  onError(cb: (e: { code: SpeechErrorCode; message: string }) => void): void;
}
