'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { AppState, AppAction, HistoryEntry } from './types';
import type { Passage } from '../detect/types';

const initialState: AppState = {
  history: [],
  highlighted: null,
  currentTranscript: '',
  currentSegmentId: null,
  isCurrentFinal: true,
  micStatus: 'idle',
  micError: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'TRANSCRIPT': {
      const { segmentId, text, passages, isFinal, completedByContext, ambiguous, textSuggestions } = action;

      // Atualiza ou cria entrada no histórico para esse segmento
      const existingIdx = state.history.findIndex((e) => e.segmentId === segmentId);
      const entry: HistoryEntry = {
        segmentId,
        passages,
        transcript: text,
        isFinal,
        timestamp: Date.now(),
        completedByContext,
        ambiguous,
        textSuggestions,
      };

      let newHistory: HistoryEntry[];
      if (existingIdx >= 0) {
        // Preservar textSuggestions anteriores caso este update não tenha recalculado
        if (!textSuggestions && state.history[existingIdx]?.textSuggestions) {
          entry.textSuggestions = state.history[existingIdx]!.textSuggestions;
        }
        // Substitui o segmento existente (resultado parcial atualizado)
        newHistory = [...state.history];
        newHistory[existingIdx] = entry;
      } else {
        // Novo segmento — adicionar no início
        newHistory = [entry, ...state.history].slice(0, 20); // Limita a 20 entradas
      }

      // Auto-highlight: se há passagens e o highlight atual não foi explicitamente fixado,
      // atualiza com a primeira passagem do segmento mais recente
      // (Sugestões de texto NUNCA vão para o auto-highlight sozinhos)
      let newHighlighted = state.highlighted;
      if (passages.length > 0) {
        newHighlighted = { segmentId, passage: passages[0]! };
      }

      return {
        ...state,
        history: newHistory,
        highlighted: newHighlighted,
        currentTranscript: isFinal ? '' : text,
        currentSegmentId: isFinal ? null : segmentId,
        isCurrentFinal: isFinal,
      };
    }

    case 'HIGHLIGHT': {
      return {
        ...state,
        highlighted: { segmentId: action.segmentId, passage: action.passage },
      };
    }

    case 'MIC_STATUS': {
      return {
        ...state,
        micStatus: action.status,
        micError: action.error ?? null,
      };
    }

    case 'MANUAL_RESULT': {
      const manualEntry: HistoryEntry = {
        segmentId: `manual-${Date.now()}`,
        passages: [action.passage],
        transcript: action.snippet
          ? `${action.passage.bookName} ${action.passage.chapter}:${action.passage.verseStart || 1} ("${action.snippet}")`
          : `${action.passage.bookName} ${action.passage.chapter}`,
        isFinal: true,
        timestamp: Date.now(),
      };
      return {
        ...state,
        history: [manualEntry, ...state.history].slice(0, 20),
        highlighted: { segmentId: manualEntry.segmentId, passage: action.passage },
      };
    }

    case 'CLEAR_HIGHLIGHT': {
      return { ...state, highlighted: null };
    }

    default:
      return state;
  }
}

type AppContextValue = {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  /** Helpers */
  highlightPassage: (segmentId: string, passage: Passage) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const highlightPassage = useCallback(
    (segmentId: string, passage: Passage) => {
      dispatch({ type: 'HIGHLIGHT', segmentId, passage });
    },
    []
  );

  const value = useMemo(
    () => ({ state, dispatch, highlightPassage }),
    [state, highlightPassage]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore deve ser usado dentro de AppProvider');
  return ctx;
}
