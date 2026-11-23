'use client';

import { useAppStore } from '@/lib/store/app-context';
import { useStabilizedPassages } from '@/hooks/useStabilizedPassages';
import { useSpokenSearch } from '@/hooks/useSpokenSearch';
import { detectVerseOnly } from '@/lib/detect';
import { validatePassage, detectWithAmbiguous } from '@/lib/detect/validate';
import type { Passage } from '@/lib/detect/types';
import { useEffect, useRef } from 'react';

/** Janela de tempo (ms) para completar passagem capítulo → versículo entre segmentos */
const CONTEXT_WINDOW_MS = 15_000;

/**
 * Tenta completar uma passagem capítulo-only com um versículo de um segmento posterior.
 * Retorna a passagem completa se válida, ou null.
 */
function tryCompleteWithVerse(chapterPassage: Passage, verseNum: number): Passage | null {
  const rawMatch = {
    bookId: chapterPassage.bookId,
    bookName: chapterPassage.bookName,
    chapter: chapterPassage.chapter,
    verseStart: verseNum,
  };
  return validatePassage(rawMatch);
}

export function TranscriptStabilizer() {
  const { state, dispatch } = useAppStore();
  const stabilizedPassages = useStabilizedPassages(
    state.currentTranscript,
    state.currentSegmentId || '',
    state.isCurrentFinal
  );
  const { search: searchSpoken } = useSpokenSearch();

  // Rastreia o timestamp do último segmento com passagem só-capítulo
  const pendingChapterRef = useRef<{ passage: Passage; timestamp: number } | null>(null);

  // Rastreia última busca feita por segmento para evitar loop
  const lastSearchedRef = useRef<{ segmentId: string; text: string }>({ segmentId: '', text: '' });

  useEffect(() => {
    if (!state.currentSegmentId) return;

    // ── RF-09: completar por contexto cruzado ────────────────────────
    const verseOnly = detectVerseOnly(state.currentTranscript);

    if (verseOnly !== null && pendingChapterRef.current) {
      const { passage: pendingPassage, timestamp } = pendingChapterRef.current;
      const age = Date.now() - timestamp;

      if (age <= CONTEXT_WINDOW_MS) {
        const completed = tryCompleteWithVerse(pendingPassage, verseOnly);
        if (completed) {
          dispatch({
            type: 'TRANSCRIPT',
            segmentId: state.currentSegmentId,
            text: state.currentTranscript,
            passages: [completed],
            isFinal: state.isCurrentFinal,
            completedByContext: true,
          });

          pendingChapterRef.current = null;
          return;
        }
      } else {
        pendingChapterRef.current = null;
      }
    }

    // ── Resultado estabilizado normal (com referência explícita) ─────
    if (stabilizedPassages.length > 0) {
      const allChapterOnly = stabilizedPassages.every((p) => p.verseStart === undefined);
      if (allChapterOnly) {
        pendingChapterRef.current = {
          passage: stabilizedPassages[0]!,
          timestamp: Date.now(),
        };
      } else {
        pendingChapterRef.current = null;
      }

      const existingEntry = state.history.find(e => e.segmentId === state.currentSegmentId);
      const isNew = !existingEntry || JSON.stringify(existingEntry.passages) !== JSON.stringify(stabilizedPassages);

      if (isNew) {
        // Obter sugestões ambíguas do texto completo
        const { ambiguous } = detectWithAmbiguous(state.currentTranscript);

        dispatch({
          type: 'TRANSCRIPT',
          segmentId: state.currentSegmentId,
          text: state.currentTranscript,
          passages: stabilizedPassages,
          isFinal: state.isCurrentFinal,
          ambiguous: ambiguous.length > 0 ? ambiguous : undefined,
        });
      }
      return;
    }

    // ── RF-08: Trecho falado (busca léxica quando NÃO há referência detectada) ──
    // Só pesquisa se não houver passagens estabilizadas e o segmento for estável ou final
    if (stabilizedPassages.length === 0 && state.currentTranscript.trim().length > 15) {
      const segId = state.currentSegmentId;
      const text = state.currentTranscript;

      if (lastSearchedRef.current.segmentId === segId && lastSearchedRef.current.text === text) {
        return;
      }

      lastSearchedRef.current = { segmentId: segId, text };

      searchSpoken(segId, text).then((suggestions) => {
        if (suggestions.length > 0) {
          dispatch({
            type: 'TRANSCRIPT',
            segmentId: segId,
            text,
            passages: [],
            isFinal: state.isCurrentFinal,
            textSuggestions: suggestions,
          });
        }
      });
    }
  }, [stabilizedPassages, state.currentSegmentId, state.isCurrentFinal, state.currentTranscript, dispatch, state.history, searchSpoken]);

  return null;
}
