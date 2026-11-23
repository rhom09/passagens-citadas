'use client';

import { useAppStore } from '@/lib/store/app-context';
import { useStabilizedPassages } from '@/hooks/useStabilizedPassages';
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

  // Rastreia o timestamp do último segmento com passagem só-capítulo
  const pendingChapterRef = useRef<{ passage: Passage; timestamp: number } | null>(null);

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

    // ── Resultado estabilizado normal ────────────────────────────────
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
    }
  }, [stabilizedPassages, state.currentSegmentId, state.isCurrentFinal, state.currentTranscript, dispatch, state.history]);

  return null;
}
