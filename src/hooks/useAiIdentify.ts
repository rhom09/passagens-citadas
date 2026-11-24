'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { SearchSuggestion } from '@/lib/search/types';

interface AiIdentifyOptions {
  enabled: boolean;
  maxCallsPerService: number;
}

const SETTINGS_KEY = 'pc_ai_identify_config';
const CALLS_COUNT_KEY = 'pc_ai_calls_count';

export function getStoredAiConfig(): AiIdentifyOptions {
  if (typeof window === 'undefined') return { enabled: false, maxCallsPerService: 40 };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { enabled: false, maxCallsPerService: 40 };
}

export function saveStoredAiConfig(cfg: AiIdentifyOptions) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(cfg));
  } catch {}
}

export function getStoredCallsCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    return parseInt(localStorage.getItem(CALLS_COUNT_KEY) || '0', 10);
  } catch {
    return 0;
  }
}

export function incrementCallsCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const next = getStoredCallsCount() + 1;
    localStorage.setItem(CALLS_COUNT_KEY, next.toString());
    return next;
  } catch {
    return 0;
  }
}

export function resetCallsCount() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CALLS_COUNT_KEY, '0');
  } catch {}
}

export function useAiIdentify() {
  const [config, setConfig] = useState<AiIdentifyOptions>({ enabled: false, maxCallsPerService: 40 });
  const [callsCount, setCallsCount] = useState<number>(0);
  const [isPausedUntil, setIsPausedUntil] = useState<number>(0);

  const lastCallTimeRef = useRef<number>(0);

  useEffect(() => {
    setConfig(getStoredAiConfig());
    setCallsCount(getStoredCallsCount());
  }, []);

  const updateConfig = useCallback((newCfg: Partial<AiIdentifyOptions>) => {
    setConfig((prev) => {
      const merged = { ...prev, ...newCfg };
      saveStoredAiConfig(merged);
      return merged;
    });
  }, []);

  const resetCalls = useCallback(() => {
    resetCallsCount();
    setCallsCount(0);
  }, []);

  /**
   * Dispara a identificação por IA caso cumpra todos os requisitos de segurança e taxa:
   * - Ativado nas configurações
   * - Menor que o teto de chamadas do culto
   * - Não pausado por 429
   * - Pelo menos 8 segundos desde a última chamada
   * - Descarta a resposta caso o buffer atual tenha divergido significativamente do inicial
   */
  const requestIdentify = useCallback(
    async (
      text: string,
      candidates: { bookName: string; chapter: number; verse: number; text: string }[],
      getCurrentBuffer?: () => string
    ): Promise<SearchSuggestion | null> => {
      const now = Date.now();

      if (!config.enabled) return null;
      if (now < isPausedUntil) return null; // Pausa silenciosa após 429
      if (callsCount >= config.maxCallsPerService) return null; // Atingiu o teto
      if (now - lastCallTimeRef.current < 8000) return null; // Máximo 1 chamada a cada 8 s

      lastCallTimeRef.current = now;

      // Guarda os últimos termos para verificar se o buffer mudou drasticamente enquanto esperava
      const initialWords = text.trim().split(/\s+/).filter(Boolean);

      try {
        const res = await fetch('/api/identify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, candidates }),
        });

        if (res.status === 429) {
          // Pausa silenciosa de 60s
          setIsPausedUntil(Date.now() + 60_000);
          return null;
        }

        if (!res.ok) {
          return null;
        }

        const data = await res.json();
        if (!data.identified || !data.passage) {
          return null;
        }

        // Se fornecido um getter do buffer atual, verifica se o conteúdo mudou muito enquanto aguardava
        if (getCurrentBuffer) {
          const currentWords = getCurrentBuffer().trim().split(/\s+/).filter(Boolean);
          const initialSet = new Set(initialWords.slice(-15));
          const currentTrailing = currentWords.slice(-15);
          const commonCount = currentTrailing.filter((w) => initialSet.has(w)).length;
          // Se menos de 50% das palavras do fim ainda coincidirem, o pastor já mudou de assunto
          if (initialWords.length >= 8 && commonCount / Math.max(1, currentTrailing.length) < 0.4) {
            return null;
          }
        }

        // Incrementa o contador de chamadas do culto
        const nextCalls = incrementCallsCount();
        setCallsCount(nextCalls);

        const suggestion: SearchSuggestion = {
          passage: {
            bookId: data.passage.bookId,
            bookName: data.passage.bookName,
            chapter: data.passage.chapter,
            verseStart: data.passage.verseStart,
            verseEnd: data.passage.verseEnd,
          },
          score: 99.0, // Indicação de match semântico
          confidence: 0.95,
          snippet: data.text || '',
          matchedWordsCount: 0,
          matchedTokens: [],
          sourceType: 'ai',
          reasoning: data.reasoning,
        };

        return suggestion;
      } catch {
        return null;
      }
    },
    [config.enabled, config.maxCallsPerService, callsCount, isPausedUntil]
  );

  return {
    config,
    callsCount,
    updateConfig,
    resetCalls,
    requestIdentify,
  };
}
