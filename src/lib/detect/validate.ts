import { verseCount, chapterCount } from '../bible/counts';
import { parseReferences } from './parse';
import type { RawMatch, Passage } from './types';

/**
 * Valida um RawMatch contra as contagens da bíblia.
 * Retorna { passage, reason }
 */
export function validatePassageWithReason(match: RawMatch): { passage?: Passage; reason?: string } {
  const { bookId, chapter, verseStart } = match;
  let { verseEnd } = match;

  // Verificar se o capítulo existe no livro
  const maxChapter = chapterCount(bookId);
  if (maxChapter === undefined || chapter < 1 || chapter > maxChapter) {
    return { reason: `Capítulo ${chapter} inválido para ${match.bookName}` };
  }

  // Se não há versículo inicial, retornar passagem sem versículo
  if (verseStart === undefined) {
    return {
      passage: {
        bookId,
        bookName: match.bookName,
        chapter,
        verseStart: undefined,
        verseEnd: undefined,
        source: 'spoken-ref',
        confidence: 1,
      },
    };
  }

  // Verificar se o versículo inicial existe no capítulo
  const maxVerse = verseCount(bookId, chapter);
  if (maxVerse === undefined || verseStart < 1 || verseStart > maxVerse) {
    return { reason: `Versículo ${verseStart} inválido para ${match.bookName} ${chapter}` };
  }

  // Se há verseEnd, validá-lo e ajustar se necessário
  if (verseEnd !== undefined) {
    if (verseEnd > maxVerse) {
      verseEnd = maxVerse;
    }
    if (verseEnd < verseStart) {
      return { reason: `Intervalo inválido: ${verseStart} ao ${verseEnd}` };
    }
  }

  return {
    passage: {
      bookId,
      bookName: match.bookName,
      chapter,
      verseStart,
      verseEnd,
      source: 'spoken-ref',
      confidence: 1,
    },
  };
}

/**
 * Valida um RawMatch contra as contagens da bíblia.
 * Retorna Passage se válido, null se inválido.
 */
export function validatePassage(match: RawMatch): Passage | null {
  return validatePassageWithReason(match).passage ?? null;
}

export interface DetectionExplanation {
  rawText: string;
  normalized: string;
  rawMatches: RawMatch[];
  acceptedPassages: Passage[];
  rejectedPassages: { match: RawMatch; reason: string }[];
}

import { normalize } from './normalize';

/**
 * Pipeline de explicação para debug.
 */
export function explainDetection(text: string): DetectionExplanation {
  const normalized = normalize(text);
  const matches = parseReferences(text);
  const acceptedPassages: Passage[] = [];
  const rejectedPassages: { match: RawMatch; reason: string }[] = [];

  for (const match of matches) {
    const result = validatePassageWithReason(match);
    if (result.passage) {
      acceptedPassages.push(result.passage);
    } else if (result.reason) {
      rejectedPassages.push({ match, reason: result.reason });
    }
  }

  return {
    rawText: text,
    normalized,
    rawMatches: matches,
    acceptedPassages,
    rejectedPassages,
  };
}

/**
 * Pipeline detect: normaliza, parseia e valida uma referência bíblica.
 */
export function detect(text: string): Passage[] {
  const matches = parseReferences(text);
  const passages: Passage[] = [];

  for (const match of matches) {
    const passage = validatePassage(match);
    if (passage !== null) {
      passages.push(passage);
    }
  }

  return passages;
}