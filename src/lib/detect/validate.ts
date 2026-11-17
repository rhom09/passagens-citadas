import { verseCount, chapterCount } from '../bible/counts';
import { parseReferences } from './parse';
import type { RawMatch, Passage } from './types';

/**
 * Valida um RawMatch contra as contagens da bíblia.
 * Retorna Passage se válido, null se inválido.
 */
export function validatePassage(match: RawMatch): Passage | null {
  const { bookId, chapter, verseStart } = match;
  let { verseEnd } = match;

  // Verificar se o capítulo existe no livro
  const maxChapter = chapterCount(bookId);
  if (maxChapter === undefined || chapter < 1 || chapter > maxChapter) {
    return null;
  }

  // Se não há versículo inicial, retornar passagem sem versículo
  if (verseStart === undefined) {
    return {
      bookId,
      bookName: '', // será preenchido pelo caller
      chapter,
      verseStart: undefined,
      verseEnd: undefined,
      source: 'spoken-ref',
      confidence: 1,
    };
  }

  // Verificar se o versículo inicial existe no capítulo
  const maxVerse = verseCount(bookId, chapter);
  if (maxVerse === undefined || verseStart < 1 || verseStart > maxVerse) {
    return null;
  }

  // Se há verseEnd, validá-lo e ajustar se necessário
  if (verseEnd !== undefined) {
    if (verseEnd > maxVerse) {
      // Capter o verseEnd para o máximo do capítulo (ex: "4 ao 99" → 4-13)
      verseEnd = maxVerse;
    }
    if (verseEnd < verseStart) {
      return null;
    }
  }

  return {
    bookId,
    bookName: '',
    chapter,
    verseStart,
    verseEnd,
    source: 'spoken-ref',
    confidence: 1,
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