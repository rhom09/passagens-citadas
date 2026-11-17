import { describe, it, expect } from 'vitest';
import { BOOKS, buildBookLookup } from '../books';

describe('BOOKS', () => {
  it('contém 66 livros', () => { expect(BOOKS).toHaveLength(66); });
  it('ids são 1..66 sequenciais', () => {
    BOOKS.forEach((b, i) => expect(b.id).toBe(i + 1));
  });
  it('João sem prefixo é Evangelho (id 43, maxVolumes 0)', () => {
    const jo = BOOKS.find(b => b.id === 43)!;
    expect(jo.name).toBe('João');
    expect(jo.maxVolumes).toBe(0);
  });
  it('João epístolas é numerado (maxVolumes 3)', () => {
    const jo = BOOKS.find(b => b.id === 62)!;
    expect(jo.name).toBe('João');
    expect(jo.maxVolumes).toBe(3);
  });
  it('Obadias é capítulo único', () => {
    expect(BOOKS.find(b => b.id === 31)!.singleChapter).toBe(true);
  });
  it('Judas é capítulo único', () => {
    expect(BOOKS.find(b => b.id === 65)!.singleChapter).toBe(true);
  });
});

describe('buildBookLookup', () => {
  it('mapeia "joao" para Evangelho quando sem prefixo', () => {
    const lookup = buildBookLookup();
    const entry = lookup.get('joao')!;
    expect(entry.bookInfo.id).toBe(43); // Evangelho
    expect(entry.isNumbered).toBe(false);
  });
  it('mapeia "corintios" como numerado', () => {
    const lookup = buildBookLookup();
    const entry = lookup.get('corintios')!;
    expect(entry.isNumbered).toBe(true);
  });
});