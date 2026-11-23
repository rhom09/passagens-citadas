import { verseCount, chapterCount } from '../bible/counts';
import { normalize } from './normalize';
import { parseReferences, parseReferencesWithAmbiguous } from './parse';
import type { RawMatch, Passage, AmbiguousMatch } from './types';

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
  /** Sugestões de livro numerado sem ordinal — operador escolhe qual promover */
  ambiguousMatches: AmbiguousMatch[];
  /** Candidatos validados de cada sugestão ambígua */
  validatedAmbiguous: { baseBookName: string; validCandidates: Passage[] }[];
}

/**
 * Pipeline de explicação para debug.
 */
export function explainDetection(text: string): DetectionExplanation {
  const norm = normalize(text);
  const { matches, ambiguous } = parseReferencesWithAmbiguous(text);
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

  // Validar candidatos de sugestões ambíguas
  const validatedAmbiguous = ambiguous.map((amb) => ({
    baseBookName: amb.baseBookName,
    validCandidates: amb.candidates
      .map((c) => validatePassage(c))
      .filter((p): p is Passage => p !== null),
  }));

  return {
    rawText: text,
    normalized: norm,
    rawMatches: matches,
    acceptedPassages,
    rejectedPassages,
    ambiguousMatches: ambiguous,
    validatedAmbiguous,
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

export interface DetectWithAmbiguousResult {
  passages: Passage[];
  /** Sugestões de livro numerado sem ordinal, já filtradas pelas que existem na bíblia */
  ambiguous: { baseBookName: string; validCandidates: Passage[] }[];
}

/**
 * Versão estendida de detect que também retorna sugestões ambíguas (livro numerado sem ordinal).
 * Usado pela UI para exibir sugestões secundárias que o operador pode promover.
 */
export function detectWithAmbiguous(text: string): DetectWithAmbiguousResult {
  const { matches, ambiguous } = parseReferencesWithAmbiguous(text);
  const passages: Passage[] = [];

  for (const match of matches) {
    const passage = validatePassage(match);
    if (passage !== null) passages.push(passage);
  }

  const validatedAmbiguous = ambiguous
    .map((amb) => ({
      baseBookName: amb.baseBookName,
      validCandidates: amb.candidates
        .map((c) => validatePassage(c))
        .filter((p): p is Passage => p !== null),
    }))
    .filter((a) => a.validCandidates.length > 0);

  return { passages, ambiguous: validatedAmbiguous };
}
