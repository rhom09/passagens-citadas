import { normalize } from './normalize';
import { numWords } from './numbers';
import { BOOKS } from './books';
import type { RawMatch } from './types';

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

  return lookup;
}

// Singleton — rebuild once per module load
const LOOKUP = buildLookup();

/** Palavras reconhecidas como marcador de versículo */
const VERSE_WORDS = new Set(['versiculo', 'versiculos', 'verso', 'versos', 'vers', 'v']);

/**
 * Parseia texto em referências bíblicas.
 * Retorna RawMatch[] com bookId, chapter, verseStart?, verseEnd?.
 *
 * Padrões reconhecidos (após normalize + numWords):
 *   joao 3 versiculo 16
 *   joao 3 16
 *   1 samuel 3
 *   primeira de joao 4 versiculo 8
 *   1 corintios 13 versiculo 4 ao 7
 *   judas 5          → Judas 1:5 (capítulo único)
 *   2 timoteo 3 16
 */
export function parseReferences(text: string): RawMatch[] {
  const normalized = normalize(text);
  const withNums = numWords(normalized);
  const tokens = withNums.split(/\s+/).filter(Boolean);
  const results: RawMatch[] = [];

  let i = 0;
  while (i < tokens.length) {
    // ── Tentar casar um prefixo ordinal + livro ──────────────────────
    let ordinalVolume: number | null = null;
    let bookEntry: ParsedBook | undefined;
    let consumed = 0;

    // Padrão: [ordinal] ["de"/"do"/"dos"/"aos"/"carta"] LIVRO
    // Checar se tokens[i] é um ordinal
    const tok0 = tokens[i]!;
    if (ORDINAL_PREFIXES[tok0] !== undefined) {
      ordinalVolume = ORDINAL_PREFIXES[tok0]!;
      let j = i + 1;

      // Pular conectores opcionais: "de", "do", "carta de", etc.
      while (j < tokens.length && ['de', 'do', 'dos', 'carta', 'aos'].includes(tokens[j]!)) {
        j++;
      }

      if (j < tokens.length) {
        const candidate = tokens[j]!;
        const entry = LOOKUP.get(candidate);
        if (entry) {
          // Encontrou livro com prefixo ordinal
          // Resolver o bookId correto com base no volume
          const resolvedId = resolveVolumeId(candidate, ordinalVolume);
          if (resolvedId !== null) {
            const book = BOOKS.find((b) => b.id === resolvedId);
            if (book) {
              // Construir bookName com prefixo de volume quando houver (ex: "1 João", "2 João")
              // Para os livros de João epístolas (1Jo=62, 2Jo=63, 3Jo=64),
              // o normalizedRootKey é '1_joao'/'2_joao'/'3_joao' mas o name é apenas 'João'.
              // Quando temos um prefixo ordinal (1ª, 2ª, 3ª), o bookName deve ser '1 João', '2 João', etc.
              let bookName = book.name;
              if (resolvedId > 60 && resolvedId < 65) {
                // resolvedId 62=1João, 63=2João, 64=3João
                const volumeNumbers: Record<number, string> = { 62: '1 João', 63: '2 João', 64: '3 João' };
                bookName = volumeNumbers[resolvedId];
              }
              bookEntry = {
                bookId: resolvedId,
                bookName,
                isNumbered: book.isNumbered,
                singleChapter: book.singleChapter,
              };
              consumed = j + 1; // consumido até o nome do livro inclusive
            }
          }
        }
      }
    }

    // Sem ordinal: tentar o token atual como chave de livro diretamente
    if (!bookEntry) {
      const entry = LOOKUP.get(tok0);
      if (entry) {
        // Se o livro é numerado (ex: "samuel") e não veio com prefixo → rejeitar
        if (entry.isNumbered) {
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

    // ── Capítulo ───────────────────────────────────────────────────
    let chapter: number | null = null;
    let verseStart: number | undefined;
    let verseEnd: number | undefined;

    // Próximo token: pode ser "capítulo N" ou apenas N
    if (i < tokens.length && tokens[i] === 'capitulo') {
      i++; // pular a palavra "capitulo"
    }

    if (i < tokens.length) {
      const chapTok = tokens[i]!;
      // Aceitar "N" ou "N versiculo M"
      const chapNum = Number(chapTok);
      if (!isNaN(chapNum) && chapNum > 0) {
        chapter = chapNum;
        i++;

        // Para livro de capítulo único: o número é o versículo, não capítulo
        if (bookEntry.singleChapter) {
          verseStart = chapter;
          chapter = 1;
        }
      }
    }

    if (chapter === null) {
      // Não achou capítulo → não é uma referência válida; recuar sem incrementar
      // (i já está no next token após o livro)
      continue;
    }

    // ── Versículo ──────────────────────────────────────────────────
    if (!bookEntry.singleChapter && i < tokens.length) {
      // Pular palavra de versículo e conector "e" antes dessas palavras
      // (ex: "capítulo 3 e versículo 16")
      if (tokens[i] === 'e' && i + 1 < tokens.length && VERSE_WORDS.has(tokens[i + 1]!)) {
        i++; // pular "e"
      }
      if (i < tokens.length && VERSE_WORDS.has(tokens[i]!)) {
        i++;
      }

      if (i < tokens.length) {
        const verseTok = tokens[i]!;
        const verseNum = Number(verseTok);
        if (!isNaN(verseNum) && verseNum > 0) {
          verseStart = verseNum;
          i++;

          // Intervalo: "ao N"
          if (i < tokens.length && (tokens[i] === 'ao' || tokens[i] === 'ate' || tokens[i] === 'a')) {
            i++; // pular "ao"
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

    results.push({
      bookId: bookEntry.bookId,
      bookName: bookEntry.bookName,
      chapter,
      verseStart,
      verseEnd,
    });
  }

  return results;
}

/**
 * Dado a base key de um livro (ex: "joao", "samuel", "corintios")
 * e um volume ordinal (1, 2, 3), retorna o bookId correto.
 * Retorna null se o volume não existe para esse livro.
 */
function resolveVolumeId(baseKey: string, volume: number): number | null {
  // Procurar livro com normalizedRootKey = `${volume}_${baseKey}`
  const targetKey = `${volume}_${baseKey}`;
  const book = BOOKS.find((b) => b.normalizedRootKey === targetKey);
  if (book) return book.id;

  // Para "joao" com prefixo: 1 João (id 62), 2 João (id 63), 3 João (id 64)
  if (baseKey === 'joao') {
    const joaoMap: Record<number, number> = { 1: 62, 2: 63, 3: 64 };
    return joaoMap[volume] ?? null;
  }

  // "corintios" → 1_corintios (id 44) ou 2_corintios (id 45)
  // "samuel" → 1_samuel (9) ou 2_samuel (10)
  // etc. — handled by the targetKey lookup above
  return null;
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
