'use client';

import { useAppStore } from '@/lib/store/app-context';
import { useStabilizedPassages } from '@/hooks/useStabilizedPassages';
import { useSpokenSearch } from '@/hooks/useSpokenSearch';
import { useAiIdentify } from '@/hooks/useAiIdentify';
import { detectVerseOnly } from '@/lib/detect';
import { validatePassage, detectWithAmbiguous } from '@/lib/detect/validate';
import { RECENT_SEGMENTS_BUFFER_WORDS, BUFFER_EXPIRY_MS, PORTUGUESE_STOPWORDS } from '@/lib/search/constants';
import { extractCitationClue } from '@/lib/search/citationClues';
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
  const { config: aiConfig, requestIdentify } = useAiIdentify();

  // Rastreia o timestamp do último segmento com passagem só-capítulo
  const pendingChapterRef = useRef<{ passage: Passage; timestamp: number } | null>(null);

  // Buffer multi-segmentos: guarda as últimas palavras recentes de segmentos passados
  // Expira após BUFFER_EXPIRY_MS (20s) sem fala
  const recentWordsBufferRef = useRef<{ words: string[]; lastUpdated: number }>({
    words: [],
    lastUpdated: Date.now(),
  });

  // Rastreia última busca feita por segmento para evitar requisições idênticas
  const lastSearchedRef = useRef<{ segmentId: string; text: string }>({ segmentId: '', text: '' });

  // Rastreia o último segmento finalizado para adicionar ao buffer de histórico
  const lastFinalizedSegmentIdRef = useRef<string | null>(null);

  // Quando um segmento se torna final, acumula no buffer multi-segmentos
  useEffect(() => {
    if (state.isCurrentFinal && state.currentSegmentId && state.currentSegmentId !== lastFinalizedSegmentIdRef.current) {
      lastFinalizedSegmentIdRef.current = state.currentSegmentId;
      const now = Date.now();
      const newWords = state.currentTranscript.trim().split(/\s+/).filter(Boolean);

      if (now - recentWordsBufferRef.current.lastUpdated > BUFFER_EXPIRY_MS) {
        recentWordsBufferRef.current.words = [];
      }

      recentWordsBufferRef.current.words = [
        ...recentWordsBufferRef.current.words,
        ...newWords,
      ].slice(-RECENT_SEGMENTS_BUFFER_WORDS);
      recentWordsBufferRef.current.lastUpdated = now;
    }
  }, [state.isCurrentFinal, state.currentSegmentId, state.currentTranscript]);

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
    // Avalia a cada atualização para que a sugestão amadureça enquanto o pastor fala
    if (stabilizedPassages.length === 0 && state.currentTranscript.trim().length > 10) {
      const segId = state.currentSegmentId;
      const currentText = state.currentTranscript.trim();

      // Monta texto com contexto do buffer de segmentos recentes (se não expirado)
      const now = Date.now();
      let combinedText = currentText;

      if (now - recentWordsBufferRef.current.lastUpdated <= BUFFER_EXPIRY_MS && recentWordsBufferRef.current.words.length > 0) {
        const bufferPrefix = recentWordsBufferRef.current.words.join(' ');
        combinedText = `${bufferPrefix} ${currentText}`;
      }

      if (lastSearchedRef.current.segmentId === segId && lastSearchedRef.current.text === combinedText) {
        return;
      }

      lastSearchedRef.current = { segmentId: segId, text: combinedText };

      searchSpoken(segId, combinedText).then(async ({ suggestions, candidates }) => {
        if (suggestions.length > 0) {
          dispatch({
            type: 'TRANSCRIPT',
            segmentId: segId,
            text: currentText,
            passages: [],
            isFinal: state.isCurrentFinal,
            textSuggestions: suggestions,
          });
          return;
        }

        // ── Fase 5b: Camada de IA opcional quando BM25 não sugeriu nada ────
        if (aiConfig.enabled) {
          const { hasClue } = extractCitationClue(combinedText);
          const words = combinedText.split(/\s+/).filter(Boolean);
          const contentWordsCount = words.filter((w) => w.length > 1 && !PORTUGUESE_STOPWORDS.has(w.toLowerCase())).length;

          // Gatilho: pista de citação OU ≥ 8 palavras de conteúdo
          if (hasClue || contentWordsCount >= 8) {
            const aiSnippet = words.slice(-30).join(' '); // últimas ~30 palavras
            const aiSuggestion = await requestIdentify(
              aiSnippet,
              candidates,
              () => recentWordsBufferRef.current.words.join(' ') + ' ' + state.currentTranscript
            );

            // Confere se ainda estamos no mesmo segmento após o retorno da IA
            if (aiSuggestion && state.currentSegmentId === segId) {
              dispatch({
                type: 'TRANSCRIPT',
                segmentId: segId,
                text: currentText,
                passages: [],
                isFinal: state.isCurrentFinal,
                textSuggestions: [aiSuggestion],
              });
            }
          }
        }
      });
    }
  }, [
    stabilizedPassages,
    state.currentSegmentId,
    state.isCurrentFinal,
    state.currentTranscript,
    dispatch,
    state.history,
    searchSpoken,
    aiConfig.enabled,
    requestIdentify,
  ]);

  return null;
}
