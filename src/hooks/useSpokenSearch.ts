'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { SearchSuggestion, CandidateVerse } from '@/lib/search/types';

export function useSpokenSearch() {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const pendingRequests = useRef<
    Map<string, (result: { suggestions: SearchSuggestion[]; candidates: CandidateVerse[] }) => void>
  >(new Map());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Instancia Web Worker
    const worker = new Worker(
      new URL('../lib/search/search.worker.ts', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (
      e: MessageEvent<{ id: string; suggestions: SearchSuggestion[]; candidates?: CandidateVerse[] }>
    ) => {
      const { id, suggestions, candidates } = e.data;
      const callback = pendingRequests.current.get(id);
      if (callback) {
        callback({ suggestions, candidates: candidates || [] });
        pendingRequests.current.delete(id);
      }
    };

    workerRef.current = worker;
    setIsReady(true);

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const search = useCallback(
    (id: string, text: string): Promise<{ suggestions: SearchSuggestion[]; candidates: CandidateVerse[] }> => {
      return new Promise((resolve) => {
        if (!workerRef.current) {
          resolve({ suggestions: [], candidates: [] });
          return;
        }
        pendingRequests.current.set(id, resolve);
        workerRef.current.postMessage({ id, text });
      });
    },
    []
  );

  return { search, isReady };
}
