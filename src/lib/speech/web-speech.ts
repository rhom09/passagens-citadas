import type { SpeechProvider, TranscriptEvent, SpeechErrorCode } from './types';

type TranscriptCallback = (e: TranscriptEvent) => void;
type ErrorCallback = (e: { code: SpeechErrorCode; message: string }) => void;

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

// Prefixo de sessão para distinguir segmentos entre reinicializações
function makeSessionPrefix(): string {
  return `s${Date.now().toString(36)}`;
}

/**
 * Implementação MVP usando Web Speech API (webkitSpeechRecognition).
 * Funciona no Chrome desktop. Reinicia automaticamente quando o reconhecimento
 * para (pausa de silêncio, fim de sessão).
 */
export class WebSpeechProvider implements SpeechProvider {
  private recognition: SpeechRecognition | null = null;
  private transcriptCb: TranscriptCallback | null = null;
  private errorCb: ErrorCallback | null = null;
  private sessionPrefix = makeSessionPrefix();
  private segmentCounter = 0;
  private running = false;
  private stopping = false;

  onTranscript(cb: TranscriptCallback) {
    this.transcriptCb = cb;
  }

  onError(cb: ErrorCallback) {
    this.errorCb = cb;
  }

  async start(): Promise<void> {
    if (this.running) return;

    const SpeechRecognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.errorCb?.({ code: 'unsupported', message: 'Web Speech API não suportada neste navegador.' });
      return;
    }

    this.stopping = false;
    this.running = true;
    this.sessionPrefix = makeSessionPrefix();
    this.segmentCounter = 0;

    this._startRecognition(SpeechRecognition);
  }

  stop() {
    this.stopping = true;
    this.running = false;
    this.recognition?.stop();
  }

  private _startRecognition(SpeechRecognitionCtor: SpeechRecognitionConstructor) {
    const r = new SpeechRecognitionCtor();
    r.lang = 'pt-BR';
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 1;

    const segmentId = `${this.sessionPrefix}-${++this.segmentCounter}`;

    r.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]!;
        const text = result[0]!.transcript;
        if (result.isFinal) {
          final += text;
        } else {
          interim += text;
        }
      }

      if (final) {
        this.transcriptCb?.({ segmentId, text: final.trim(), isFinal: true });
      } else if (interim) {
        this.transcriptCb?.({ segmentId, text: interim.trim(), isFinal: false });
      }
    };

    r.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed') {
        this.running = false;
        this.errorCb?.({ code: 'denied', message: 'Acesso ao microfone negado.' });
      } else if (event.error === 'network') {
        this.errorCb?.({ code: 'network', message: 'Erro de rede no reconhecimento de voz.' });
      }
      // 'no-speech', 'audio-capture', etc.: deixar reiniciar normalmente
    };

    r.onend = () => {
      if (!this.stopping && this.running) {
        // Auto-restart: incrementa segmento para nova sessão de reconhecimento
        setTimeout(() => {
          if (!this.stopping && this.running) {
            this._startRecognition(SpeechRecognitionCtor);
          }
        }, 150);
      }
    };

    this.recognition = r;
    r.start();
  }
}
