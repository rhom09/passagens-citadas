import { VERSE_COUNTS } from './counts.generated';

export { VERSE_COUNTS };

export function verseCount(bookId: number, chapter: number): number | undefined {
  const chapters = VERSE_COUNTS[bookId - 1];
  if (!chapters || chapter < 1 || chapter > chapters.length) {
    return undefined;
  }
  return chapters[chapter - 1];
}

export function chapterCount(bookId: number): number | undefined {
  const chapters = VERSE_COUNTS[bookId - 1];
  if (!chapters) {
    return undefined;
  }
  return chapters.length;
}
