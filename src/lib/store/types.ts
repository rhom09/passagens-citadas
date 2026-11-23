import type { Passage } from '../detect/types';

export type HistoryEntry = {
  segmentId: string;
  passages: Passage[];
  transcript: string;
  isFinal: boolean;
  timestamp: number;
  /** true quando a passagem foi completada por contexto cruzado (RF-09) */
  completedByContext?: boolean;
  /** Sugestões de livros numerados sem ordinal: operador toca para promover */
  ambiguous?: { baseBookName: string; validCandidates: Passage[] }[];
};

export type AppState = {
  /** Histórico: segmentId -> HistoryEntry (resultados parciais sobrescrevem) */
  history: HistoryEntry[];
  /** Passagem em destaque (a que está no ReferenceCard principal) */
  highlighted: { segmentId: string; passage: Passage } | null;
  /** Texto parcial atual sendo transcrito */
  currentTranscript: string;
  currentSegmentId: string | null;
  isCurrentFinal: boolean;
  /** Estado do microfone */
  micStatus: 'idle' | 'listening' | 'error';
  micError: string | null;
};

export type AppAction =
  | {
      type: 'TRANSCRIPT';
      segmentId: string;
      text: string;
      passages: Passage[];
      isFinal: boolean;
      completedByContext?: boolean;
      ambiguous?: { baseBookName: string; validCandidates: Passage[] }[];
    }
  | { type: 'HIGHLIGHT'; segmentId: string; passage: Passage }
  | { type: 'MIC_STATUS'; status: 'idle' | 'listening' | 'error'; error?: string }
  | { type: 'MANUAL_RESULT'; passage: Passage }
  | { type: 'CLEAR_HIGHLIGHT' };
