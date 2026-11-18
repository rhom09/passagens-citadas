'use client';

import { useAppStore } from '@/lib/store/app-context';
import { useStabilizedPassages } from '@/hooks/useStabilizedPassages';
import { detectVerseOnly } from '@/lib/detect';
import { validatePassage } from '@/lib/detect/validate';
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
    // Verificar se o trecho atual é só-versículo (sem livro/capítulo)
    const verseOnly = detectVerseOnly(state.currentTranscript);

    if (verseOnly !== null && pendingChapterRef.current) {
      const { passage: pendingPassage, timestamp } = pendingChapterRef.current;
      const age = Date.now() - timestamp;

      if (age <= CONTEXT_WINDOW_MS) {
        // Tentar completar a passagem pendente com o versículo atual
        const completed = tryCompleteWithVerse(pendingPassage, verseOnly);
        if (completed) {
          // Despachar a passagem completa como parte do segmento atual (com indicação de contexto)
          const completedWithContext: Passage = {
            ...completed,
            // Marcar que foi completado por contexto — útil para DebugInspector
            source: 'spoken-ref',
          };

          dispatch({
            type: 'TRANSCRIPT',
            segmentId: state.currentSegmentId,
            text: state.currentTranscript,
            passages: [completedWithContext],
            isFinal: state.isCurrentFinal,
            completedByContext: true,
          });

          // Limpar pendente após completar
          pendingChapterRef.current = null;
          return;
        }
      } else {
        // Expirou a janela
        pendingChapterRef.current = null;
      }
    }

    // ── Resultado estabilizado normal ────────────────────────────────
    if (stabilizedPassages.length > 0) {
      // Verificar se são passagens só-capítulo → registrar como pendente para contexto
      const allChapterOnly = stabilizedPassages.every((p) => p.verseStart === undefined);
      if (allChapterOnly) {
        pendingChapterRef.current = {
          passage: stabilizedPassages[0]!,
          timestamp: Date.now(),
        };
      } else {
        // Passagem com versículo — limpa pendente
        pendingChapterRef.current = null;
      }

      const existingEntry = state.history.find(e => e.segmentId === state.currentSegmentId);
      const isNew = !existingEntry || JSON.stringify(existingEntry.passages) !== JSON.stringify(stabilizedPassages);

      if (isNew) {
        dispatch({
          type: 'TRANSCRIPT',
          segmentId: state.currentSegmentId,
          text: state.currentTranscript,
          passages: stabilizedPassages,
          isFinal: state.isCurrentFinal,
        });
      }
    }
  }, [stabilizedPassages, state.currentSegmentId, state.isCurrentFinal, state.currentTranscript, dispatch, state.history]);

  return null;
}
