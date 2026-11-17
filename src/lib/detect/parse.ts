import { normalize } from './normalize';
import { numWords } from './numbers';
import { BOOKS } from './books';
import type { RawMatch } from './types';

// Tipos internos
interface ParsedBook {
  bookId: number;
  bookName: string;
  isNumbered: boolean;
  singleChapter: boolean;
}

/**
 * Constrói um mapa de lookup a partir das keys normalizadas dos livros.
 * Retorna Map<normalizedRootKey, { bookInfo, isNumbered }>
 */
function buildBookLookup(): Map<string, ParsedBook> {
  const lookup = new Map<string, ParsedBook>();

  for (const book of BOOKS) {
    // Mapear a key normalizada (ex: "genesis", "joao", "1_samuel")
    if (!lookup.has(book.normalizedRootKey)) {
      lookup.set(book.normalizedRootKey, {
        bookId: book.id,
        bookName: book.name,
        isNumbered: book.isNumbered,
        singleChapter: book.singleChapter,
      });
    }

    // Para livros numerados, também mapear a key "plain" (sem prefixo numérico)
    // Ex: "samuel" -> livro numerado, "1_samuel" -> livro com prefixo
    if (book.isNumbered && book.normalizedRootKey.includes('_')) {
      const plainKey = book.normalizedRootKey.split('_')[1]; // "samuel" a partir de "1_samuel"
      if (!lookup.has(plainKey)) {
        lookup.set(plainKey, {
          bookId: book.id,
          bookName: book.name,
          isNumbered: true,
          singleChapter: book.singleChapter,
        });
      }
    }
  }

  // Special: "joao" deve mapear para Evangelho (id 43) quando usado sem prefixo
  lookup.set('joao', {
    bookId: 43,
    bookName: 'João',
    isNumbered: false,
    singleChapter: false,
  });

  return lookup;
}

/**
 * Parse um texto em referências bíblicas.
 * Pipeline: normalize -> numWords -> parse -> validate
 */
export function parseReferences(text: string): RawMatch[] {
  const lookup = buildBookLookup();
  const normalized = normalize(text);
  const hasNumberPrefixBeforeBook = /^\s*\d+\s+\w/.test(text) || /^\s*\d+:/.test(text);

  // Extrair números por extenso primeiro (converter "cento e dezenove" para "119")
  const withNumbers = numWords(normalized);

  const results: RawMatch[] = [];

  // Regex para capturar padrões de referência bíblica
  // Padrões suportados:
  // - "1 Samuel 3"
  // - "João 3:16"
  // - "primeira de João 4:8"
  // - "Salmo 23"
  // - "1 Coríntios 13:4 ao 7"
  // - "dois Timóteo três dezesseis"

  // Dividir em tokens para processamento
  const tokens = withNumbers.split(/\s+/);

  // Tentar identificar livro + capítulo + versículo
  let i = 0;

  while (i < tokens.length) {
    let bookId: number | null = null;
    let bookName: string = '';
    let chapter: number | null = null;
    let verseStart: number | undefined = undefined;
    let verseEnd: number | undefined = undefined;
    let foundBook = false;
    let foundBookChapter = false;

    // Verificar se o token atual é uma key de livro no lookup
    const potentialBookKey = tokens[i];
    const bookInfo = lookup.get(potentialBookKey);

    // Verificar se o token do livro começa com número (prefixo)
    const bookTokenStartsWithNumber = /^\d+/.test(potentialBookKey);

    if (bookInfo) {
      bookId = bookInfo.bookId;
      bookName = bookInfo.bookName;
      foundBook = true;
      i++;

      // Rejeitar livro numerado se digitado sem prefixo numérico APENAS quando o livro
      // for o único conteúdo da referência (ex: "Samuel 3" sem capítulo/versículo seguinte).
      // Isso evita rejeitar referências válidas como "Romanos 8 versiculo 28".
      // Critério: livro no início, número não no token, e referência tem no máximo 2 tokens
      // (apenas livro + capítulo, sem versículo intermediário).
      const isShortReference = bookInfo?.isNumbered && i === 0 && !bookTokenStartsWithNumber
        && tokens.length <= 2;

      if (isShortReference) {
        // Usuario digitou o livro numerado sem prefixo (ex: "Samuel" em vez de "1 Samuel")
        // e a referência consiste apenas de livro + capítulo, sem versículo intermediário.
        // Rejeitar para que detect() retorne vazio, enquanto "1 Samuel 3" seja aceito.
        bookId = null;
        foundBook = false;
      }

      // Se o token que identificou o livro contém ":" (formato "capitulo:versiculo"),
      // extrair capítulo e versículo iniciais a partir desse token
      if (potentialBookKey.includes(':') && !foundBookChapter) {
        const colonMatch = potentialBookKey.match(/^(\d+):(\d+)$/);
        if (colonMatch) {
          chapter = Number(colonMatch[1]);
          verseStart = Number(colonMatch[2]);
          foundBookChapter = true;
        }
      }
    }

    // Se encontrou livro, procurar capítulo e versículo
    if (foundBook && bookInfo) {
      // Procurar capítulo (número) - apenas se não já foi extraído do token do livro
      if (i < tokens.length && !isNaN(Number(tokens[i])) && !foundBookChapter) {
        chapter = Number(tokens[i]);
        i++;

        // Para livros de capítulo único (Obadias, Filemom, 2Jo, 3Jo, Judas),
        // o número após o nome do livro é o versículo, não o capítulo
        if (bookInfo.singleChapter && chapter !== undefined && verseStart === undefined) {
          verseStart = chapter;
          chapter = 1;
        }
      }

      // Procurar versículo (pode ser "3:16" ou "três versículo dezesseis")
      if (i < tokens.length) {
        // Verificar formato "capitulo:versiculo" ou "capitulo versiculo"
        const potentialVerse = tokens[i];

        // Formato "3:16" ou "3 versiculo 16"
        const verseMatch = potentialVerse.match(/^(\d+):(\d+)$/);
        if (verseMatch) {
          const vs = Number(verseMatch[2]);
          if (chapter !== null) {
            verseStart = vs;
            // Verificar se há "ao" ou "a" para versículo final
            i++;
            if (i < tokens.length && (tokens[i] === 'ao' || tokens[i] === 'a')) {
              i++; // skip "ao" or "a"
              if (i < tokens.length && !isNaN(Number(tokens[i]))) {
                verseEnd = Number(tokens[i]);
                i++;
              } else {
                // Se não há número depois de "ao", zerar verseEnd
                verseEnd = undefined;
              }
            }
          }
        } else if (potentialVerse === 'versiculo' || potentialVerse === 'capitulo') {
          // Skip these words, next token is the number
          i++;
          if (i < tokens.length && !isNaN(Number(tokens[i]))) {
            const vs = Number(tokens[i]);
            if (chapter !== null && verseStart === undefined) {
              verseStart = vs;
            } else if (verseEnd === undefined && verseStart !== undefined) {
              verseEnd = vs;
            }
            i++;
          }
        } else if (/^versiculo\s+\d+/.test(potentialVerse)) {
          // "versiculo 16" format
          const vsMatch = potentialVerse.match(/^versiculo\s+(\d+)$/);
          if (vsMatch && chapter !== null && verseStart === undefined) {
            verseStart = Number(vsMatch[1]);
            i++;
          }
        } else if (!isNaN(Number(potentialVerse)) && verseStart === undefined) {
          // Número puro após o capítulo (ex: "13 4" means chapter 13, verse 4)
          // Exceto se for o final da referência e houver "ao" depois
          const nextToken = tokens[i + 1];
          if (!nextToken || nextToken !== 'ao') {
            verseStart = Number(potentialVerse);
            i++;
          }
        }
      }
      if (i < tokens.length) {
        // Verificar formato "capitulo:versiculo" ou "capitulo versiculo"
        const potentialVerse = tokens[i];

        // Formato "3:16" ou "3 versiculo 16"
        const verseMatch = potentialVerse.match(/^(\d+):(\d+)$/);
        if (verseMatch) {
          const vs = Number(verseMatch[2]);
          if (chapter !== null) {
            verseStart = vs;
            // Verificar se há "ao" ou "a" para versículo final
            i++;
            if (i < tokens.length && (tokens[i] === 'ao' || tokens[i] === 'a')) {
              i++; // skip "ao" or "a"
              if (i < tokens.length && !isNaN(Number(tokens[i]))) {
                verseEnd = Number(tokens[i]);
                i++;
              } else {
                // Se não há número depois de "ao", zerar verseEnd
                verseEnd = undefined;
              }
            }
          }
        } else if (potentialVerse === 'versiculo' || potentialVerse === 'capitulo') {
          // Skip these words, next token is the number
          i++;
          if (i < tokens.length && !isNaN(Number(tokens[i]))) {
            const vs = Number(tokens[i]);
            if (chapter !== null && verseStart === undefined) {
              verseStart = vs;
            } else if (verseEnd === undefined && verseStart !== undefined) {
              verseEnd = vs;
            }
            i++;
          }
        } else if (/^versiculo\s+\d+/.test(potentialVerse)) {
          // "versiculo 16" format
          const vsMatch = potentialVerse.match(/^versiculo\s+(\d+)$/);
          if (vsMatch && chapter !== null && verseStart === undefined) {
            verseStart = Number(vsMatch[1]);
            i++;
          }
        }
      }
    }

    // Se temos livro e capítulo, adicionar resultado
    if (bookId !== null && chapter !== null) {
      results.push({
        bookId,
        bookName,
        chapter,
        verseStart: verseStart,
        verseEnd: verseEnd,
      });
    }

    // Se não encontramos livro, avançar 1 token
    if (!foundBook) {
      i++;
    }
  }

  return results;
}