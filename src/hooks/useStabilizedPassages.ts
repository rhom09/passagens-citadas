import { useState, useEffect, useRef } from 'react';
import { detect } from '@/lib/detect';
import type { Passage } from '@/lib/detect/types';

export const VERSE_DELAY = 700;
export const CHAPTER_DELAY = 1500;

export function useStabilizedPassages(text: string, segmentId: string, isFinal: boolean) {
  const [passages, setPassages] = useState<Passage[]>([]);
  const timers = useRef<Map<string, { timeoutId: NodeJS.Timeout }>>(new Map());

  useEffect(() => {
    if (isFinal) {
      // Exibe imediatamente se final
      const detected = detect(text);
      setPassages(detected);

      // Limpa qualquer timer pendente para este segmento
      if (timers.current.has(segmentId)) {
        clearTimeout(timers.current.get(segmentId)!.timeoutId);
        timers.current.delete(segmentId);
      }
      return;
    }

    // Se parcial, debounce
    // Heurística de delay: tem versículo? (ex: 3:16 ou 3.16)
    const hasVerse = /\d+[:.]\d+/.test(text);
    const delay = hasVerse ? VERSE_DELAY : CHAPTER_DELAY;

    // Limpa timer anterior para este segmento
    if (timers.current.has(segmentId)) {
      clearTimeout(timers.current.get(segmentId)!.timeoutId);
    }

    const timeoutId = setTimeout(() => {
      const detected = detect(text);
      setPassages(detected);
      timers.current.delete(segmentId);
    }, delay);

    timers.current.set(segmentId, { timeoutId });

    return () => {
      // Não limpar aqui para não cancelar durante re-render de digitação
      // O timeout é limpo quando o segmentId muda ou quando é final
    };
  }, [text, segmentId, isFinal]);

  // Limpeza ao desmontar
  useEffect(() => {
    return () => {
      timers.current.forEach(t => clearTimeout(t.timeoutId));
      timers.current.clear();
    };
  }, []);

  return passages;
}
