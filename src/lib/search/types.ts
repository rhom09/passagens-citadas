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
