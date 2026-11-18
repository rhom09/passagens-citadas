'use client';

import { useRef, useCallback } from 'react';
import { useAppStore } from '../lib/store/app-context';
import { WebSpeechProvider } from '../lib/speech/web-speech';
import type { SpeechProvider } from '../lib/speech/types';

// Lazy import of detect to avoid loading at module level
async function detectPassages(text: string) {
  // detect is a pure function from lib/detect — no DOM, no fetch
  const { detect } = await import('../lib/detect/index');
  return detect(text);
}

export function useSpeechControl() {
  const { dispatch } = useAppStore();
  const providerRef = useRef<SpeechProvider | null>(null);

  const start = useCallback(async () => {
    if (providerRef.current) return;

    dispatch({ type: 'MIC_STATUS', status: 'listening' });

    const provider = new WebSpeechProvider();

    provider.onError((e) => {
      dispatch({ type: 'MIC_STATUS', status: 'error', error: e.message });
      providerRef.current = null;
    });

    provider.onTranscript(async ({ segmentId, text, isFinal }) => {
      // detect apenas se for final, para não interferir na estabilização
      const passages = isFinal ? await detectPassages(text) : [];
      dispatch({
        type: 'TRANSCRIPT',
        segmentId,
        text,
        passages,
        isFinal,
      });
    });

    providerRef.current = provider;

    try {
      await provider.start();
    } catch {
      dispatch({ type: 'MIC_STATUS', status: 'error', error: 'Falha ao iniciar o microfone.' });
      providerRef.current = null;
    }
  }, [dispatch]);

  const stop = useCallback(() => {
    providerRef.current?.stop();
    providerRef.current = null;
    dispatch({ type: 'MIC_STATUS', status: 'idle' });
  }, [dispatch]);

  const toggle = useCallback(() => {
    if (providerRef.current) {
      stop();
    } else {
      start();
    }
  }, [start, stop]);

  return { start, stop, toggle };
}
