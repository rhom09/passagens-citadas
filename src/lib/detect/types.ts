export type Passage = {
  bookId: number;        // 1..66
  bookName: string;      // "1 Coríntios"
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
  source: 'spoken-ref' | 'quote' | 'manual';
  confidence: number;    // 0..1
};

export type BookInfo = {
  id: number;                  // 1..66
  name: string;                // "Gênesis" ou "João" (nomes base, sem prefixo ordinal para numerados)
  normalizedRootKey: string;   // ex: "genesis", "joao", "samuel"
  maxVolumes: number;          // 0=não numerado (Evangelho João), 2=1-2 Samuel, 3=1-3 João-epístolas
  singleChapter: boolean;      // true para Obadias, Filemom, 2Jo, 3Jo, Judas
  isNumbered: boolean;         // true para Samuel, Coríntios, Timóteo, etc.
};

export type RawMatch = {
  bookId: number;
  bookName: string;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
};
