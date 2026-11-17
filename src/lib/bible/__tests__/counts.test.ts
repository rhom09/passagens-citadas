import { describe, it, expect } from 'vitest';
import { VERSE_COUNTS } from '../counts.generated';
import { verseCount, chapterCount } from '../counts';

describe('VERSE_COUNTS', () => {
  it('tem 66 livros', () => {
    expect(VERSE_COUNTS).toHaveLength(66);
  });
  it('total de capítulos é 1189', () => {
    const total = VERSE_COUNTS.reduce((sum, chaps) => sum + chaps.length, 0);
    expect(total).toBe(1189);
  });
  it('Salmos 119 tem 176 versículos', () => {
    expect(VERSE_COUNTS[18]![118]).toBe(176);
  });
  it('Números 2 tem 34 versículos', () => {
    expect(VERSE_COUNTS[3]![1]).toBe(34);
  });
  it('João tem 21 capítulos e cap 3 tem 36 versículos', () => {
    expect(VERSE_COUNTS[42]).toHaveLength(21);
    expect(VERSE_COUNTS[42]![2]).toBe(36);
  });
});

describe('verseCount', () => {
  it('retorna contagem correta', () => {
    expect(verseCount(19, 119)).toBe(176);
  });
  it('retorna undefined para capítulo inexistente', () => {
    expect(verseCount(43, 22)).toBeUndefined();
  });
});

describe('chapterCount', () => {
  it('retorna número de capítulos', () => {
    expect(chapterCount(43)).toBe(21);
  });
  it('retorna undefined para livro inexistente', () => {
    expect(chapterCount(67)).toBeUndefined();
  });
});