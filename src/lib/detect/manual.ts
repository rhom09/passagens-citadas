import { BOOKS } from './books';
import { BOOK_ABBREVIATIONS } from './abbreviations';
import { parseReferences } from './parse';
import { validatePassage } from './validate';
import type { Passage } from './types';

export interface ManualParseResult {
  /** Se identificou com clareza uma ou mais passagens válidas */
  passages: Passage[];
  /** Se o padrão digitado claramente tinha sintaxe de referência (ex: "jo 3:16", "rm 8", etc.) */
  isReferenceQuery: boolean;
}

/**
 * Normaliza separadores comuns da digitação rápida ("jo 3:16", "jo 3 16", "jo 3, 16", "jo3:16", "jo 3-16")
 */
function prepareManualQuery(rawText: string): string {
  let text = rawText.trim();
  // Se houver letras seguidas de dígitos colados (ex: "jo3:16" -> "jo 3:16", "1co13" -> "1co 13")
  text = text.replace(/([a-zA-ZáéíóúÁÉÍÓÚãõÃÕ])(\d)/g, '$1 $2');
  // Se houver pontuação de separação clássica capítulo:versículo ("3:16", "3,16", "3.16")
  text = text.replace(/(\d+)[:.,](\d+)/g, '$1 $2');
  // Se houver hífen entre versículos ("16-18" -> "16 ao 18")
  text = text.replace(/(\d+)\s*-\s*(\d+)/g, '$1 ao $2');
  return text;
}

/**
 * Tenta resolver uma referência a partir de abreviações curtas ("jo 3 16", "jó 1 1", "rm 8", "1co 13 4 ao 7").
 */
function parseByAbbreviation(rawQuery: string): Passage[] {
  const prepared = prepareManualQuery(rawQuery);
  const words = prepared.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  let bookId: number | null = null;
  let wordIndex = 0;

  const firstRaw = words[0]!;
  const firstLower = firstRaw.toLowerCase();

  // Regra crucial: "jó" com acento é Jó (id 18)
  if (firstLower === 'jó') {
    bookId = 18;
    wordIndex = 1;
  } else if (firstLower === 'jo' || firstLower === 'joão' || firstLower === 'joao') {
    // "jo" sem acento é João Evangelho (id 43)
    bookId = 43;
    wordIndex = 1;
  } else {
    // Verificar se palavra 0 ou palavras 0 e 1 formam uma abreviação (ex: "1" "co" -> "1co")
    if (words.length >= 2 && /^[123]$/.test(words[0]!)) {
      const combined = `${words[0]}${words[1]!.toLowerCase()}`;
      if (BOOK_ABBREVIATIONS[combined]) {
        bookId = BOOK_ABBREVIATIONS[combined]!;
        wordIndex = 2;
      }
    }

    if (bookId === null) {
      const cleanWord0 = firstLower.normalize('NFD').replace(/[̀-ͯ]/g, '');
      if (BOOK_ABBREVIATIONS[cleanWord0]) {
        bookId = BOOK_ABBREVIATIONS[cleanWord0]!;
        wordIndex = 1;
      }
    }
  }

  if (bookId === null) return [];

  const book = BOOKS.find((b) => b.id === bookId);
  if (!book) return [];

  // Extrair capítulo e versículo dos tokens restantes
  const remainingTokens = words.slice(wordIndex);
  if (remainingTokens.length === 0) {
    // Apenas a abreviação foi digitada, ex: "jo", "rm". Não é uma passagem completa ainda.
    return [];
  }

  const chapNum = parseInt(remainingTokens[0]!, 10);
  if (isNaN(chapNum) || chapNum <= 0) return [];

  let chapter = chapNum;
  let verseStart: number | undefined;
  let verseEnd: number | undefined;

  // Se o livro tiver apenas um capítulo (ex: Judas, Obadias, Filemom, 2 João, 3 João)
  if (book.singleChapter) {
    verseStart = chapter;
    chapter = 1;
  } else if (remainingTokens.length >= 2) {
    let vI = 1;
    // Pular "v", "verso", "versiculo" se houver
    if (/^(v|verso|versiculo|vers)$/i.test(remainingTokens[vI]!)) {
      vI++;
    }
    if (vI < remainingTokens.length) {
      const vNum = parseInt(remainingTokens[vI]!, 10);
      if (!isNaN(vNum) && vNum > 0) {
        verseStart = vNum;
        vI++;
        // Intervalo
        if (vI < remainingTokens.length && /^(ao|a|ate)$/i.test(remainingTokens[vI]!)) {
          vI++;
          if (vI < remainingTokens.length) {
            const endNum = parseInt(remainingTokens[vI]!, 10);
            if (!isNaN(endNum) && endNum > 0) {
              verseEnd = endNum;
            }
          }
        }
      }
    }
  }

  const rawMatch = {
    bookId: book.id,
    bookName: book.name,
    chapter,
    verseStart,
    verseEnd,
  };

  const valid = validatePassage(rawMatch);
  return valid ? [valid] : [];
}

/**
 * Parser unificado para digitação manual do operador:
 * 1. Tenta abreviações rápidas (com distinção de "jo" e "jó").
 * 2. Tenta o parser falado completo (números por extenso, "capítulo X versículo Y de Z", conectores, etc.).
 * 3. Se a consulta for ambígua sem acento ("jo" com números válidos para Jó e João), pode listar opções.
 */
export function parseManualReference(rawQuery: string): ManualParseResult {
  const trimmed = rawQuery.trim();
  if (trimmed.length < 2) {
    return { passages: [], isReferenceQuery: false };
  }

  // 1. Tenta abreviações rápidas
  const abbrevMatches = parseByAbbreviation(trimmed);
  if (abbrevMatches.length > 0) {
    return { passages: abbrevMatches, isReferenceQuery: true };
  }

  // 2. Tenta o parser normal / falado
  const spokenMatches = parseReferences(trimmed)
    .map((m) => validatePassage(m))
    .filter((p): p is Passage => p !== null);

  if (spokenMatches.length > 0) {
    return { passages: spokenMatches, isReferenceQuery: true };
  }

  // 3. Checagem heurística: o texto tem cara de referência?
  // Ex: "jo 3", "rm 8", "1co 13" ou dígitos acompanhados de abreviação conhecida
  const prepared = prepareManualQuery(trimmed);
  const parts = prepared.split(/\s+/);
  const firstWordNorm = parts[0]?.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const isRefPattern =
    Boolean(firstWordNorm && BOOK_ABBREVIATIONS[firstWordNorm]) ||
    /\b(capitulo|versiculo|verso)\b/i.test(trimmed) ||
    /^[123]?\s*[a-zA-ZáéíóúÁÉÍÓÚãõÃÕ]+\s*\d+/i.test(trimmed);

  return { passages: [], isReferenceQuery: isRefPattern };
}
