import type { Bible } from './types';

let cachedBible: Bible | null = null;
let loadingPromise: Promise<Bible> | null = null;

interface RawArcBook {
  id?: number;
  abbrev?: string;
  name: string;
  chapters: string[][];
}

function normalizeBibleData(raw: unknown): Bible {
  const rawBooks: RawArcBook[] = Array.isArray(raw)
    ? (raw as RawArcBook[])
    : ((raw as { books?: RawArcBook[] })?.books ?? []);

  return {
    version: 'ARC',
    books: rawBooks.map((book, idx) => ({
      id: book.id ?? idx + 1,
      name: book.name,
      chapters: book.chapters,
    })),
  };
}

export async function loadBible(): Promise<Bible> {
  if (cachedBible) return cachedBible;
  if (!loadingPromise) {
    loadingPromise = fetch('/data/arc.v1.json')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Falha ao carregar /data/arc.v1.json (${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        cachedBible = normalizeBibleData(data);
        return cachedBible;
      })
      .catch((err) => {
        loadingPromise = null;
        throw err;
      });
  }
  return loadingPromise;
}

export function getVerse(bible: Bible, bookId: number, ch: number, v: number): string | undefined {
  const book = bible.books[bookId - 1];
  if (!book) return undefined;

  const chapter = book.chapters[ch - 1];
  if (!chapter) return undefined;

  if (v < 1 || v > chapter.length) return undefined;

  return chapter[v - 1];
}

export function getPassageText(
  bible: Bible,
  passage: { bookId: number; chapter: number; verseStart?: number; verseEnd?: number }
): string | undefined {
  const { bookId, chapter, verseStart, verseEnd } = passage;

  if (verseStart === undefined) {
    const book = bible.books[bookId - 1];
    const ch = book?.chapters[chapter - 1];
    if (!ch || ch.length === 0) return undefined;
    return ch.map((text, idx) => `${idx + 1} ${text}`).join(' ');
  }

  const end = verseEnd !== undefined && verseEnd > verseStart ? verseEnd : verseStart;
  const parts: string[] = [];

  for (let v = verseStart; v <= end; v++) {
    const text = getVerse(bible, bookId, chapter, v);
    if (text) {
      parts.push(end > verseStart ? `${v} ${text}` : text);
    }
  }

  return parts.length > 0 ? parts.join(' ') : undefined;
}
