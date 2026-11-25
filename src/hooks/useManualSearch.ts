'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { SearchSuggestion } from '@/lib/search/types';

export function useManualSearch() {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const pendingRequests = useRef<Map<string, (suggestions: SearchSuggestion[]) => void>>(new Map());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const worker = new Worker(
      new URL('../lib/search/search.worker.ts', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (
      e: MessageEvent<{ id: string; suggestions: SearchSuggestion[] }>
    ) => {
      const { id, suggestions } = e.data;
      const callback = pendingRequests.current.get(id);
      if (callback) {
        callback(suggestions || []);
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

  const searchManual = useCallback(
    (id: string, text: string, limit = 8): Promise<SearchSuggestion[]> => {
      return new Promise((resolve) => {
        if (!workerRef.current) {
          resolve([]);
          return;
        }
        pendingRequests.current.set(id, resolve);
        workerRef.current.postMessage({ id, text, type: 'manual', limit });
      });
    },
    []
  );

  return { searchManual, isReady };
}
