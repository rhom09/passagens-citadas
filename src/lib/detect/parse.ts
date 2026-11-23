import { normalize } from './normalize';
import { numWords } from './numbers';
import { BOOKS } from './books';
import type { RawMatch, AmbiguousMatch } from './types';

/** Mapa de prefixo ordinal spoken → volume number */
const ORDINAL_PREFIXES: Record<string, number> = {
  primeiro: 1, primeira: 1,
  segundo: 2, segunda: 2,
  terceiro: 3, terceira: 3,
  '1': 1, '2': 2, '3': 3,
};

interface ParsedBook {
  bookId: number;
  bookName: string;
  isNumbered: boolean;
  singleChapter: boolean;
}

// ── Aliases de transcrição ────────────────────────────────────────────────────
// Para adicionar novas variantes encontradas no DebugInspector:
//   1. Normalize a variante (minúsculas, sem acentos): ex. "habacuc"
//   2. Adicione: TRANSCRIPTION_ALIASES['habacuc'] = 'habacuque';
//   3. O buildLookup() abaixo inclui automaticamente.
const TRANSCRIPTION_ALIASES: Record<string, string> = {
  habacuc:                'habacuque',  // Habacuque / Habacuc
  oseas:                  'oseias',     // Oséias / Oseas
  filemon:                'filemom',    // Filemom / Filemon
  canticos:               'cantares',   // Cânticos / Cantares
  'atos dos apostolos':   'atos',       // Atos dos Apóstolos
};

/** Constrói lookup: normalized token → ParsedBook */
function buildLookup(): Map<string, ParsedBook> {
  const lookup = new Map<string, ParsedBook>();

  for (const book of BOOKS) {
    if (!book.normalizedRootKey) continue;

    const entry: ParsedBook = {
      bookId: book.id,
      bookName: book.name,
      isNumbered: book.isNumbered,
      singleChapter: book.singleChapter,
    };

    if (!lookup.has(book.normalizedRootKey)) {
      lookup.set(book.normalizedRootKey, entry);
    }

    // Para livros com chave "1_samuel", também mapear "samuel" como numerado
    if (book.normalizedRootKey.includes('_')) {
      const parts = book.normalizedRootKey.split('_');
      const plainKey = parts.slice(1).join('_'); // "samuel" de "1_samuel"
      if (!lookup.has(plainKey)) {
        lookup.set(plainKey, { ...entry, isNumbered: true });
      }
    }
  }

  // Garantir que "joao" (sem prefixo) → Evangelho (id 43, não as epístolas)
  const gospel = BOOKS.find((b) => b.id === 43);
  if (gospel) {
    lookup.set('joao', {
      bookId: 43,
      bookName: gospel.name,
      isNumbered: false,
      singleChapter: false,
    });
  }

  // Alias: "salmo" → Salmos
  const salmos = BOOKS.find((b) => b.normalizedRootKey === 'salmos');
  if (salmos) {
    lookup.set('salmo', {
      bookId: salmos.id,
      bookName: salmos.name,
      isNumbered: false,
      singleChapter: false,
    });
  }

  // Aliases de transcrição
  for (const [alias, canonical] of Object.entries(TRANSCRIPTION_ALIASES)) {
    if (!lookup.has(alias)) {
      const entry = lookup.get(canonical);
      if (entry) lookup.set(alias, { ...entry });
    }
  }

  return lookup;
}

// Singleton — rebuild once per module load
const LOOKUP = buildLookup();

/** Palavras reconhecidas como marcador de versículo */
const VERSE_WORDS = new Set(['versiculo', 'versiculos', 'verso', 'versos', 'vers', 'v']);

/** Conectores entre ordinal e livro (ou dentro da expressão do livro) */
const CONNECTORS = ['carta', 'cartas', 'epistola', 'epistolas', 'a', 'as', 'ao', 'aos', 'de', 'do', 'da', 'dos', 'das'];

/**
 * Extrai { chapter, verseStart?, verseEnd? } a partir da posição i nos tokens.
 * Retorna null se não houver número de capítulo.
 * Avança i e devolve o novo índice.
 */
function extractChapterVerse(
  tokens: string[],
  startI: number,
  singleChapter: boolean,
): { chapter: number; verseStart?: number; verseEnd?: number; nextI: number } | null {
  let i = startI;

  // Pular "capitulo" opcional
  if (i < tokens.length && tokens[i] === 'capitulo') i++;

  if (i >= tokens.length) return null;
  const chapNum = Number(tokens[i]);
  if (isNaN(chapNum) || chapNum <= 0) return null;

  let chapter = chapNum;
  i++;

  let verseStart: number | undefined;
  let verseEnd: number | undefined;

  // Para livro de capítulo único: o número é o versículo, não capítulo
  if (singleChapter) {
    verseStart = chapter;
    chapter = 1;
    return { chapter, verseStart, nextI: i };
  }

  // Versículo opcional
  if (i < tokens.length) {
    // Pular "e versiculo" como conector
    if (tokens[i] === 'e' && i + 1 < tokens.length && VERSE_WORDS.has(tokens[i + 1]!)) {
      i++;
    }
    if (i < tokens.length && VERSE_WORDS.has(tokens[i]!)) {
      i++;
    }

    if (i < tokens.length) {
      const verseNum = Number(tokens[i]);
      if (!isNaN(verseNum) && verseNum > 0) {
        verseStart = verseNum;
        i++;

        // Intervalo: "ao N"
        if (i < tokens.length && (tokens[i] === 'ao' || tokens[i] === 'ate' || tokens[i] === 'a')) {
          i++;
          if (i < tokens.length) {
            const endNum = Number(tokens[i]);
            if (!isNaN(endNum) && endNum > 0) {
              verseEnd = endNum;
              i++;
            }
          }
        }
      }
    }
  }

  return { chapter, verseStart, verseEnd, nextI: i };
}

/**
 * Dado a base key de um livro (ex: "joao", "samuel", "corintios")
 * e um volume ordinal (1, 2, 3), retorna o bookId correto.
 * Retorna null se o volume não existe para esse livro.
 */
function resolveVolumeId(baseKey: string, volume: number): number | null {
  const targetKey = `${volume}_${baseKey}`;
  const book = BOOKS.find((b) => b.normalizedRootKey === targetKey);
  if (book) return book.id;

  if (baseKey === 'joao') {
    const joaoMap: Record<number, number> = { 1: 62, 2: 63, 3: 64 };
    return joaoMap[volume] ?? null;
  }

  return null;
}

/** Constrói bookName correto para epístolas de João com volume */
function resolveBookName(resolvedId: number, fallbackName: string): string {
  if (resolvedId >= 62 && resolvedId <= 64) {
    const names: Record<number, string> = { 62: '1 João', 63: '2 João', 64: '3 João' };
    return names[resolvedId]!;
  }
  return fallbackName;
}

/** Resultado do parser: referências confirmadas + ambíguas (livro numerado sem ordinal) */
export interface ParseResult {
  matches: RawMatch[];
  ambiguous: AmbiguousMatch[];
}

/**
 * Parseia texto em referências bíblicas.
 * Retorna { matches, ambiguous }.
 *
 * Padrões reconhecidos (após normalize + numWords):
 *   joao 3 versiculo 16
 *   joao 3 16
 *   1 samuel 3
 *   primeira de joao 4 versiculo 8
 *   1 corintios 13 versiculo 4 ao 7
 *   judas 5          → Judas 1:5 (capítulo único)
 *   2 timoteo 3 16
 *   capitulo 3 versiculo 16 de joao    ← ordem invertida
 *   capitulo 8 de romanos              ← ordem invertida
 *   tessalonicenses 1 1                ← ambíguo (sem ordinal)
 */
export function parseReferences(text: string): RawMatch[] {
  return _parse(text).matches;
}

/**
 * Versão completa que também retorna sugestões ambíguas.
 * Usada pelo pipeline de detecção e pelo DebugInspector.
 */
export function parseReferencesWithAmbiguous(text: string): ParseResult {
  return _parse(text);
}

function _parse(text: string): ParseResult {
  const normalized = normalize(text);
  const withNums = numWords(normalized);
  const tokens = withNums.split(/\s+/).filter(Boolean);
  const matches: RawMatch[] = [];
  const ambiguous: AmbiguousMatch[] = [];

  let i = 0;
  while (i < tokens.length) {
    // ── Padrão de ORDEM INVERTIDA ────────────────────────────────────────
    // "capitulo N [versiculo M] [de|do|da] LIVRO"
    if (tokens[i] === 'capitulo') {
      const invertedResult = tryInvertedOrder(tokens, i);
      if (invertedResult !== null) {
        matches.push(invertedResult.match);
        i = invertedResult.nextI;
        continue;
      }
      // Não casou: deixar o token "capitulo" ser consumido normalmente abaixo
    }

    // ── Tentar casar um prefixo ordinal + livro ──────────────────────────
    let ordinalVolume: number | null = null;
    let bookEntry: ParsedBook | undefined;
    let consumed = 0;

    const tok0 = tokens[i]!;
    if (ORDINAL_PREFIXES[tok0] !== undefined) {
      ordinalVolume = ORDINAL_PREFIXES[tok0]!;
      let j = i + 1;

      // Pular conectores opcionais (até 3 palavras)
      let skipped = 0;
      while (j < tokens.length && CONNECTORS.includes(tokens[j]!) && skipped < 3) {
        j++;
        skipped++;
      }

      if (j < tokens.length) {
        const candidate = tokens[j]!;
        const entry = LOOKUP.get(candidate);
        if (entry) {
          const resolvedId = resolveVolumeId(candidate, ordinalVolume);
          if (resolvedId !== null) {
            const book = BOOKS.find((b) => b.id === resolvedId);
            if (book) {
              const bookName = resolveBookName(resolvedId, book.name);
              bookEntry = {
                bookId: resolvedId,
                bookName,
                isNumbered: book.isNumbered,
                singleChapter: book.singleChapter,
              };
              consumed = j + 1;
            }
          }
        }
      }
    }

    // Sem ordinal: tentar o token atual como chave de livro diretamente
    if (!bookEntry) {
      const entry = LOOKUP.get(tok0);
      if (entry) {
        if (entry.isNumbered) {
          // Livro numerado sem ordinal → sugestão ambígua
          const ambigResult = tryAmbiguousNumbered(tokens, i, tok0, entry);
          if (ambigResult !== null) {
            ambiguous.push(ambigResult.ambig);
            i = ambigResult.nextI;
            continue;
          }
          i++;
          continue;
        }
        bookEntry = entry;
        consumed = i + 1;
      }
    }

    if (!bookEntry) {
      i++;
      continue;
    }

    i = consumed;

    // ── Capítulo + versículo ──────────────────────────────────────────────
    const cv = extractChapterVerse(tokens, i, bookEntry.singleChapter);
    if (cv === null) {
      continue;
    }

    matches.push({
      bookId: bookEntry.bookId,
      bookName: bookEntry.bookName,
      chapter: cv.chapter,
      verseStart: cv.verseStart,
      verseEnd: cv.verseEnd,
    });
    i = cv.nextI;
  }

  return { matches, ambiguous };
}

/**
 * Tenta casar o padrão invertido: "capitulo N [versiculo M] [de|do|da] LIVRO"
 * Retorna null se não casar.
 */
function tryInvertedOrder(
  tokens: string[],
  startI: number,
): { match: RawMatch; nextI: number } | null {
  let i = startI; // tokens[i] === 'capitulo'
  i++; // pular "capitulo"

  if (i >= tokens.length) return null;
  const chapNum = Number(tokens[i]);
  if (isNaN(chapNum) || chapNum <= 0) return null;
  const chapter = chapNum;
  i++;

  // Versículo opcional
  let verseStart: number | undefined;
  let verseEnd: number | undefined;

  if (i < tokens.length) {
    if (tokens[i] === 'e' && i + 1 < tokens.length && VERSE_WORDS.has(tokens[i + 1]!)) i++;
    if (i < tokens.length && VERSE_WORDS.has(tokens[i]!)) {
      i++;
      if (i < tokens.length) {
        const vNum = Number(tokens[i]);
        if (!isNaN(vNum) && vNum > 0) {
          verseStart = vNum;
          i++;
          // Intervalo
          if (i < tokens.length && (tokens[i] === 'ao' || tokens[i] === 'ate' || tokens[i] === 'a')) {
            i++;
            if (i < tokens.length) {
              const eNum = Number(tokens[i]);
              if (!isNaN(eNum) && eNum > 0) { verseEnd = eNum; i++; }
            }
          }
        }
      }
    }
  }

  // Pular conector: "de", "do", "da", "dos"
  if (i < tokens.length && ['de', 'do', 'da', 'dos', 'das'].includes(tokens[i]!)) i++;

  if (i >= tokens.length) return null;

  // Verificar se há prefixo ordinal antes do nome do livro
  let ordinalVolume: number | null = null;
  if (ORDINAL_PREFIXES[tokens[i]!] !== undefined) {
    ordinalVolume = ORDINAL_PREFIXES[tokens[i]!]!;
    i++;
    // Pular conectores
    let skipped = 0;
    while (i < tokens.length && CONNECTORS.includes(tokens[i]!) && skipped < 3) {
      i++; skipped++;
    }
  }

  if (i >= tokens.length) return null;

  const bookToken = tokens[i]!;
  const entry = LOOKUP.get(bookToken);
  if (!entry) return null;

  // Se livro é numerado e não teve ordinal: não casar (evitar falso positivo)
  if (entry.isNumbered && ordinalVolume === null) return null;

  let bookId = entry.bookId;
  let bookName = entry.bookName;

  if (ordinalVolume !== null) {
    const resolvedId = resolveVolumeId(bookToken, ordinalVolume);
    if (resolvedId === null) return null;
    const book = BOOKS.find((b) => b.id === resolvedId);
    if (!book) return null;
    bookId = resolvedId;
    bookName = resolveBookName(resolvedId, book.name);
  }

  return {
    match: { bookId, bookName, chapter, verseStart, verseEnd },
    nextI: i + 1,
  };
}

/**
 * Tenta produzir sugestões ambíguas quando um livro numerado é citado sem ordinal.
 * Ex: "tessalonicenses 1 1" → sugestões [1 Tess 1:1, 2 Tess 1:1]
 */
function tryAmbiguousNumbered(
  tokens: string[],
  startI: number,
  bookToken: string,
  baseEntry: ParsedBook,
): { ambig: AmbiguousMatch; nextI: number } | null {
  // Avançar além do nome do livro
  let i = startI + 1;

  // Colher capítulo + versículo (mesmo que para um match normal)
  const cv = extractChapterVerse(tokens, i, baseEntry.singleChapter);
  if (cv === null) return null;

  i = cv.nextI;

  // Descobrir quantos volumes existem para esse baseKey
  const candidates: RawMatch[] = [];
  for (let vol = 1; vol <= 3; vol++) {
    const resolvedId = resolveVolumeId(bookToken, vol);
    if (resolvedId === null) break;
    const book = BOOKS.find((b) => b.id === resolvedId);
    if (!book) break;
    // resolveBookName trata especialmente 1/2/3 João (id 62-64 que têm name="João")
    const bookName = resolveBookName(resolvedId, book.name);
    candidates.push({
      bookId: resolvedId,
      bookName,
      chapter: cv.chapter,
      verseStart: cv.verseStart,
      verseEnd: cv.verseEnd,
    });
  }

  if (candidates.length === 0) return null;

  return {
    ambig: {
      candidates,
      baseBookName: baseEntry.bookName,
      chapter: cv.chapter,
      verseStart: cv.verseStart,
      verseEnd: cv.verseEnd,
    },
    nextI: i,
  };
}

/**
 * Detecta se o texto contém APENAS um versículo sem livro nem capítulo.
 * Ex: "versículo 105", "verso 3", "v 16".
 * Retorna o número do versículo, ou null se o texto não for só um versículo.
 * Ignora palavras de preenchimento (artigos, prep.) antes do marcador de versículo.
 */
export function detectVerseOnly(text: string): number | null {
  const normalized = normalize(text);
  const withNums = numWords(normalized);
  const tokens = withNums.split(/\s+/).filter(Boolean);

  // Palavras permitidas antes do marcador de versículo (preenchimento)
  const FILLER = new Set(['o', 'a', 'os', 'as', 'e', 'de', 'do', 'da', 'agora', 'e', 'no', 'na']);

  let i = 0;
  // Pular palavras de preenchimento no início
  while (i < tokens.length && FILLER.has(tokens[i]!)) {
    i++;
  }

  // Deve encontrar uma palavra de versículo seguida de número
  if (i < tokens.length && VERSE_WORDS.has(tokens[i]!)) {
    i++;
    if (i < tokens.length) {
      const num = Number(tokens[i]);
      if (!isNaN(num) && num > 0) {
        // Verificar que o resto do texto (após o número) não contém um nome de livro
        // (caso contrário não é "só versículo")
        const remaining = tokens.slice(i + 1);
        const hasBookToken = remaining.some((t) => LOOKUP.has(t) || ORDINAL_PREFIXES[t] !== undefined);
        if (!hasBookToken) {
          return num;
        }
      }
    }
  }

  return null;
}
