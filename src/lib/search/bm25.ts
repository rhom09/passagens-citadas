import { normalize } from '../detect/normalize';
import { BOOKS } from '../detect/books';
import {
  PORTUGUESE_STOPWORDS,
  BM25_K1,
  BM25_B,
  SLIDING_WINDOW_MIN,
  SLIDING_WINDOW_MAX,
  MIN_ABSOLUTE_SCORE,
  MIN_ABSOLUTE_SCORE_WITH_CLUE,
  MIN_ACCUMULATED_IDF,
  MIN_ACCUMULATED_IDF_WITH_CLUE,
  TOP_SCORE_MARGIN_RATIO,
  NGRAM_BOOST,
} from './constants';
import { stemWord, isFuzzyMatch } from './stemmer';
import { extractCitationClue } from './citationClues';
import type { SearchIndexData, SearchSuggestion, SearchResultWithCandidates, CandidateVerse } from './types';

/**
 * Tokeniza uma frase removendo stopwords e pontuações
 */
export function tokenizeAndFilter(text: string): string[] {
  const norm = normalize(text);
  const words = norm.split(/\s+/).filter(Boolean);
  return words.filter((w) => w.length > 1 && !PORTUGUESE_STOPWORDS.has(w));
}

/**
 * Gera janelas deslizantes de tamanho minWords até maxWords a partir de uma sequência de palavras
 */
export function generateSlidingWindows(
  words: string[],
  minWords = SLIDING_WINDOW_MIN,
  maxWords = SLIDING_WINDOW_MAX
): { text: string; words: string[] }[] {
  if (words.length < minWords) {
    if (words.length > 0) {
      return [{ text: words.join(' '), words }];
    }
    return [];
  }

  const windows: { text: string; words: string[] }[] = [];

  for (let size = maxWords; size >= minWords; size--) {
    if (words.length < size) continue;
    for (let i = 0; i <= words.length - size; i++) {
      const slice = words.slice(i, i + size);
      windows.push({ text: slice.join(' '), words: slice });
    }
  }

  return windows;
}

interface WindowEvaluationResult {
  docIdx: number;
  score: number;
  accumulatedIdf: number;
  matchedTokens: string[];
}

/**
 * Avalia uma janela de palavras específica contra o índice BM25
 */
function evaluateWindow(
  windowTokens: string[],
  rawWindowWords: string[],
  indexData: SearchIndexData
): WindowEvaluationResult[] {
  if (windowTokens.length === 0) return [];

  const { invertedIndex, idf, avgDocLen, verses } = indexData;

  // Prepara bigramas e trigramas da janela para boost de adjacência
  const queryBigrams: string[] = [];
  const queryTrigrams: string[] = [];
  for (let i = 0; i < rawWindowWords.length - 1; i++) {
    queryBigrams.push(`${rawWindowWords[i]} ${rawWindowWords[i + 1]}`);
    if (i < rawWindowWords.length - 2) {
      queryTrigrams.push(`${rawWindowWords[i]} ${rawWindowWords[i + 1]} ${rawWindowWords[i + 2]}`);
    }
  }

  // Mapeia termos da query para seus postings (exatos, stem ou fuzzy)
  // term -> postings
  const matchedDocsPerTerm: Record<string, { termIdf: number; postings: [number, number][] }> = {};

  // Cache dos termos do índice para busca aproximada/stem
  const indexTerms = Object.keys(invertedIndex);

  for (const token of windowTokens) {
    if (invertedIndex[token]) {
      matchedDocsPerTerm[token] = {
        termIdf: idf[token] || 0,
        postings: invertedIndex[token]!,
      };
      continue;
    }

    // Tentativa por radical (stemming)
    const tokenStem = stemWord(token);
    let foundMatch: string | null = null;

    for (let t = 0; t < indexTerms.length; t++) {
      const indexTerm = indexTerms[t]!;
      if (stemWord(indexTerm) === tokenStem) {
        foundMatch = indexTerm;
        break;
      }
    }

    // Se não achou por stem, tenta tolerância de 1 erro em palavras 6+ letras
    if (!foundMatch && token.length >= 6) {
      for (let t = 0; t < indexTerms.length; t++) {
        const indexTerm = indexTerms[t]!;
        if (isFuzzyMatch(token, indexTerm)) {
          foundMatch = indexTerm;
          break;
        }
      }
    }

    if (foundMatch && invertedIndex[foundMatch]) {
      matchedDocsPerTerm[token] = {
        termIdf: (idf[foundMatch] || 0) * 0.9, // Penalidade leve de 10% para casamentos aproximados
        postings: invertedIndex[foundMatch]!,
      };
    }
  }

  const matchedTerms = Object.keys(matchedDocsPerTerm);
  if (matchedTerms.length === 0) return [];

  // docIdx -> acumulador de BM25 e termos casados
  const docScores: Record<number, number> = {};
  const docIdfs: Record<number, number> = {};
  const docMatchedTokens: Record<number, Set<string>> = {};

  for (const token of matchedTerms) {
    const { termIdf, postings } = matchedDocsPerTerm[token]!;

    for (let p = 0; p < postings.length; p++) {
      const docIdx = postings[p]![0];
      const tf = postings[p]![1];

      const docLen = verses[docIdx]?.len || avgDocLen;
      const num = tf * (BM25_K1 + 1);
      const den = tf + BM25_K1 * (1 - BM25_B + BM25_B * (docLen / avgDocLen));
      const termScore = termIdf * (num / den);

      docScores[docIdx] = (docScores[docIdx] || 0) + termScore;
      docIdfs[docIdx] = (docIdfs[docIdx] || 0) + termIdf;

      if (!docMatchedTokens[docIdx]) {
        docMatchedTokens[docIdx] = new Set();
      }
      docMatchedTokens[docIdx]!.add(token);
    }
  }

  const results: WindowEvaluationResult[] = [];

  for (const docIdxStr of Object.keys(docScores)) {
    const docIdx = Number(docIdxStr);
    const baseScore = docScores[docIdx]!;
    const accumulatedIdf = docIdfs[docIdx]!;
    const tokens = Array.from(docMatchedTokens[docIdx] || []);

    // Aplicar boost de adjacência
    const verseTextNorm = normalize(verses[docIdx]?.text || '');
    let boost = 1.0;

    for (const bg of queryBigrams) {
      if (verseTextNorm.includes(bg)) {
        boost += (NGRAM_BOOST - 1) * 0.4;
      }
    }
    for (const tg of queryTrigrams) {
      if (verseTextNorm.includes(tg)) {
        boost += (NGRAM_BOOST - 1) * 0.8;
      }
    }

    results.push({
      docIdx,
      score: baseScore * boost,
      accumulatedIdf,
      matchedTokens: tokens,
    });
  }

  return results;
}

/**
 * Executa busca BM25 e retorna tanto as sugestões qualificadas quanto os top 15 candidatos brutos
 * para uso opcional pela camada de IA (Fase 5b).
 */
export function searchSpokenPassageWithCandidates(
  text: string,
  indexData: SearchIndexData
): SearchResultWithCandidates {
  const norm = normalize(text);
  if (!norm.trim()) return { suggestions: [], candidates: [] };

  const { hasClue, cleanedText } = extractCitationClue(norm);
  const words = cleanedText.split(/\s+/).filter(Boolean);
  if (words.length === 0) return { suggestions: [], candidates: [] };

  const windows = generateSlidingWindows(words, SLIDING_WINDOW_MIN, SLIDING_WINDOW_MAX);
  if (windows.length === 0) return { suggestions: [], candidates: [] };

  const minScoreThreshold = hasClue ? MIN_ABSOLUTE_SCORE_WITH_CLUE : MIN_ABSOLUTE_SCORE;
  const minIdfThreshold = hasClue ? MIN_ACCUMULATED_IDF_WITH_CLUE : MIN_ACCUMULATED_IDF;

  const bestDocMap: Record<
    number,
    {
      score: number;
      accumulatedIdf: number;
      matchedTokens: string[];
      winningWindow: string;
    }
  > = {};

  for (const win of windows) {
    const queryTokens = win.words.filter((w) => w.length > 1 && !PORTUGUESE_STOPWORDS.has(w));
    if (queryTokens.length === 0) continue;

    const evals = evaluateWindow(queryTokens, win.words, indexData);

    for (const ev of evals) {
      const existing = bestDocMap[ev.docIdx];
      if (!existing || ev.score > existing.score) {
        bestDocMap[ev.docIdx] = {
          score: ev.score,
          accumulatedIdf: ev.accumulatedIdf,
          matchedTokens: ev.matchedTokens,
          winningWindow: win.text,
        };
      }
    }
  }

  // Candidatos ordenados por score (mesmo com score moderado para alimentar a IA)
  const allCandidatesSorted = Object.keys(bestDocMap)
    .map((docIdxStr) => ({ docIdx: Number(docIdxStr), ...bestDocMap[Number(docIdxStr)]! }))
    .sort((a, b) => b.score - a.score);

  const top15Candidates: CandidateVerse[] = allCandidatesSorted.slice(0, 15).map((item) => {
    const doc = indexData.verses[item.docIdx]!;
    const book = BOOKS.find((b) => b.id === doc.bookId);
    return {
      bookName: book ? book.name : `Livro ${doc.bookId}`,
      chapter: doc.chapter,
      verse: doc.verse,
      text: doc.text,
    };
  });

  const qualified = allCandidatesSorted.filter(
    (item) => item.score >= minScoreThreshold && item.accumulatedIdf >= minIdfThreshold
  );

  if (qualified.length === 0) {
    return { suggestions: [], candidates: top15Candidates };
  }

  const top1 = qualified[0]!;
  if (qualified.length > 1) {
    const top2 = qualified[1]!;
    const margin = top1.score / (top2.score || 1);
    if (margin < TOP_SCORE_MARGIN_RATIO && top1.score < 35) {
      return { suggestions: [], candidates: top15Candidates };
    }
  }

  const results: SearchSuggestion[] = [];
  const { verses } = indexData;
  const topN = qualified.slice(0, 3);

  for (const item of topN) {
    const doc = verses[item.docIdx]!;
    const book = BOOKS.find((b) => b.id === doc.bookId);
    const bookName = book ? book.name : `Livro ${doc.bookId}`;

    const rawDocWords = doc.text.split(/\s+/);
    const snippet = rawDocWords.slice(0, 12).join(' ') + (rawDocWords.length > 12 ? '...' : '');
    const confidence = Math.min(1, item.score / 30);

    results.push({
      passage: {
        bookId: doc.bookId,
        bookName,
        chapter: doc.chapter,
        verseStart: doc.verse,
      },
      score: Math.round(item.score * 10) / 10,
      confidence: Math.round(confidence * 100) / 100,
      snippet,
      matchedWordsCount: item.matchedTokens.length,
      matchedTokens: item.matchedTokens,
      winningWindow: item.winningWindow,
      hasCitationClue: hasClue,
      sourceType: 'lexical',
    });
  }

  return { suggestions: results, candidates: top15Candidates };
}

/**
 * Executa busca BM25 otimizada com janelas deslizantes e pistas de citação
 */
export function searchSpokenPassage(
  text: string,
  indexData: SearchIndexData
): SearchSuggestion[] {
  return searchSpokenPassageWithCandidates(text, indexData).suggestions;
}
