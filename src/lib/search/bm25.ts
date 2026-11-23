import { normalize } from '../detect/normalize';
import { BOOKS } from '../detect/books';
import {
  PORTUGUESE_STOPWORDS,
  BM25_K1,
  BM25_B,
  MIN_MATCHING_WORDS,
  SLIDING_WINDOW_WORDS,
  MIN_ABSOLUTE_SCORE,
  TOP_SCORE_MARGIN_RATIO,
  NGRAM_BOOST,
} from './constants';
import type { SearchIndexData, SearchSuggestion } from './types';

/**
 * Tokeniza uma frase removendo stopwords e pontuações
 */
export function tokenizeAndFilter(text: string): string[] {
  const norm = normalize(text);
  const words = norm.split(/\s+/).filter(Boolean);
  return words.filter((w) => w.length > 1 && !PORTUGUESE_STOPWORDS.has(w));
}

/**
 * Executa busca BM25 no índice para um texto falado.
 * Retorna até 3 sugestões somente se atender aos limiares de segurança.
 */
export function searchSpokenPassage(
  text: string,
  indexData: SearchIndexData
): SearchSuggestion[] {
  const norm = normalize(text);
  const allWords = norm.split(/\s+/).filter(Boolean);
  if (allWords.length === 0) return [];

  // Janela deslizante das últimas ~20 palavras
  const windowWords = allWords.slice(-SLIDING_WINDOW_WORDS);
  const queryTokens = windowWords.filter((w) => w.length > 1 && !PORTUGUESE_STOPWORDS.has(w));

  // Exigência 1: no mínimo MIN_MATCHING_WORDS palavras de conteúdo na query
  if (queryTokens.length < MIN_MATCHING_WORDS) {
    return [];
  }

  // Prepara bigramas e trigramas da query para boost de adjacência
  const queryBigrams: string[] = [];
  const queryTrigrams: string[] = [];
  for (let i = 0; i < windowWords.length - 1; i++) {
    queryBigrams.push(`${windowWords[i]} ${windowWords[i + 1]}`);
    if (i < windowWords.length - 2) {
      queryTrigrams.push(`${windowWords[i]} ${windowWords[i + 1]} ${windowWords[i + 2]}`);
    }
  }

  // Candidatos: mapeia docIndex -> contagem de termos em comum e acumulador de score BM25
  const matchCounts: Record<number, number> = {};
  const docScores: Record<number, number> = {};

  const { invertedIndex, idf, avgDocLen, verses } = indexData;

  for (const token of queryTokens) {
    const postings = invertedIndex[token];
    if (!postings) continue;
    const termIdf = idf[token] || 0;

    for (let p = 0; p < postings.length; p++) {
      const docIdx = postings[p]![0];
      const tf = postings[p]![1];

      matchCounts[docIdx] = (matchCounts[docIdx] || 0) + 1;

      const docLen = verses[docIdx]?.len || avgDocLen;
      // Fórmula BM25
      const num = tf * (BM25_K1 + 1);
      const den = tf + BM25_K1 * (1 - BM25_B + BM25_B * (docLen / avgDocLen));
      const termScore = termIdf * (num / den);

      docScores[docIdx] = (docScores[docIdx] || 0) + termScore;
    }
  }

  // Filtrar candidatos com no mínimo MIN_MATCHING_WORDS em comum
  const qualifiedDocs: { docIdx: number; score: number; matchedWords: number }[] = [];

  for (const docIdxStr of Object.keys(matchCounts)) {
    const docIdx = Number(docIdxStr);
    const matchedWords = matchCounts[docIdx]!;
    if (matchedWords < MIN_MATCHING_WORDS) continue;

    let baseScore = docScores[docIdx]!;

    // Boost para bigramas e trigramas adjacentes presentes no texto do versículo
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

    const finalScore = baseScore * boost;
    if (finalScore >= MIN_ABSOLUTE_SCORE) {
      qualifiedDocs.push({ docIdx, score: finalScore, matchedWords });
    }
  }

  if (qualifiedDocs.length === 0) return [];

  // Ordenar decrescente por score
  qualifiedDocs.sort((a, b) => b.score - a.score);

  const top1 = qualifiedDocs[0]!;

  // Se houver segundo colocado, aplicar limiar de margem (TOP_SCORE_MARGIN_RATIO)
  // Exceto quando o top1 tem uma margem de confiança absoluta massiva (ex: score > 35)
  if (qualifiedDocs.length > 1) {
    const top2 = qualifiedDocs[1]!;
    const margin = top1.score / (top2.score || 1);
    if (margin < TOP_SCORE_MARGIN_RATIO && top1.score < 35) {
      // Dúvida entre os dois primeiros colocados -> na dúvida, não sugerir
      return [];
    }
  }

  // Formatar as até 3 sugestões
  const results: SearchSuggestion[] = [];
  const topN = qualifiedDocs.slice(0, 3);

  for (const item of topN) {
    const doc = verses[item.docIdx]!;
    const book = BOOKS.find((b) => b.id === doc.bookId);
    const bookName = book ? book.name : `Livro ${doc.bookId}`;

    // Snippet com as primeiras palavras
    const words = doc.text.split(/\s+/);
    const snippet = words.slice(0, 10).join(' ') + (words.length > 10 ? '...' : '');

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
      matchedWordsCount: item.matchedWords,
    });
  }

  return results;
}
