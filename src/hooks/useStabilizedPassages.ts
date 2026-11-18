'use client';
import { useState, useEffect, useRef } from 'react';
import { detect } from '@/lib/detect';
import type { Passage } from '@/lib/detect/types';

export const VERSE_DELAY = 700;
export const CHAPTER_DELAY = 1500;

/**
 * Heurística: tem versículo explícito?
 * Considera tanto "N:M" quanto palavras de versículo seguidas de número.
 */
function hasVerseInText(text: string): boolean {
  if (/\d+[:.,;]\d+/.test(text)) return true;
  return /\b(vers[ao]s?|vers(iculo|iculos)?|v)\s+\d/i.test(text);
}

/**
 * Verifica se todas as passagens detectadas são apenas com capítulo (sem versículo).
 * Se sim, ainda devemos aguardar 1500ms mesmo sendo final,
 * pois o Chrome pode fechar o trecho na pausa e o versículo chega no próximo segmento.
 */
function isChapterOnly(passages: Passage[]): boolean {
  return passages.length > 0 && passages.every((p) => p.verseStart === undefined);
}

export function useStabilizedPassages(text: string, segmentId: string, isFinal: boolean) {
  const [passages, setPassages] = useState<Passage[]>([]);
  const timers = useRef<Map<string, { timeoutId: ReturnType<typeof setTimeout> }>>(new Map());

  useEffect(() => {
    if (isFinal) {
      const detected = detect(text);

      // Task 3: passagem só com capítulo espera CHAPTER_DELAY mesmo se final.
      // O Chrome fecha trechos em pausas — o versículo pode chegar no próximo segmento.
      if (isChapterOnly(detected)) {
        // Limpa timer anterior para este segmento
        if (timers.current.has(segmentId)) {
          clearTimeout(timers.current.get(segmentId)!.timeoutId);
        }

        const timeoutId = setTimeout(() => {
          // Após a espera, re-detecta com o texto atual (caso o segmento tenha sido
          // completado pelo contexto cruzado — mas não temos acesso ao novo texto aqui,
          // então simplesmente emite o que foi detectado no momento do final).
          setPassages(detected);
          timers.current.delete(segmentId);
        }, CHAPTER_DELAY);

        timers.current.set(segmentId, { timeoutId });
        return;
      }

      // Resultado final com versículo: exibe imediatamente
      setPassages(detected);

      // Limpa qualquer timer pendente para este segmento
      if (timers.current.has(segmentId)) {
        clearTimeout(timers.current.get(segmentId)!.timeoutId);
        timers.current.delete(segmentId);
      }
      return;
    }

    // Se parcial, debounce
    const hasVerse = hasVerseInText(text);
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
