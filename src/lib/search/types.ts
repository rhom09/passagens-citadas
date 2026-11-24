export interface SearchSuggestion {
  passage: {
    bookId: number;
    bookName: string;
    chapter: number;
    verseStart: number;
    verseEnd?: number;
  };
  score: number;
  confidence: number;
  snippet: string;
  matchedWordsCount: number;
  matchedTokens: string[];
  winningWindow?: string;
  hasCitationClue?: boolean;
  sourceType?: 'lexical' | 'ai';
  reasoning?: string;
}

export interface CandidateVerse {
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface SearchResultWithCandidates {
  suggestions: SearchSuggestion[];
  candidates: CandidateVerse[];
}

export interface VerseIndexDoc {
  bookId: number;
  chapter: number;
  verse: number;
  text: string;
  len: number;
}

export interface SearchIndexData {
  version: string;
  docCount: number;
  avgDocLen: number;
  verses: VerseIndexDoc[];
  /** Inverted index: term -> array of [docIndex, termFrequency] */
  invertedIndex: Record<string, [number, number][]>;
  /** Pre-calculated IDF per term */
  idf: Record<string, number>;
}
