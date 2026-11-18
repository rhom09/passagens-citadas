import { describe, it, expect } from 'vitest';
import { detect } from '../index';

describe('detect — tabela de docs/03', () => {
  it('"abram em João 3:16" → João 3:16', () => {
    const r = detect('abram em João 3:16');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ bookId: 43, bookName: 'João', chapter: 3, verseStart: 16 });
  });
  it('"João capítulo três versículo dezesseis" → João 3:16', () => {
    const r = detect('João capítulo três versiculo dezesseis');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ bookId: 43, chapter: 3, verseStart: 16 });
  });
  it('"Romanos 8 versículo 28" → Romanos 8:28', () => {
    const r = detect('Romanos 8 versiculo 28');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ bookId: 45, chapter: 8, verseStart: 28 });
  });
  it('"primeira de Coríntios 13:4 ao 7" → 1 Coríntios 13:4-7', () => {
    const r = detect('primeira de Coríntios 13:4 ao 7');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ bookId: 46, bookName: '1 Coríntios', chapter: 13, verseStart: 4, verseEnd: 7 });
  });
  it('"dois Timóteo três dezesseis" → 2 Timóteo 3:16', () => {
    const r = detect('dois Timóteo três dezesseis');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ bookId: 55, bookName: '2 Timóteo', chapter: 3, verseStart: 16 });
  });
  it('"Salmos cento e dezenove versiculo cento e cinco" → Salmos 119:105', () => {
    const r = detect('Salmos cento e dezenove versiculo cento e cinco');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ bookId: 19, chapter: 119, verseStart: 105 });
  });
  it('"Salmo 23" → Salmos 23 (sem versículo)', () => {
    const r = detect('Salmo 23');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ bookId: 19, bookName: 'Salmos', chapter: 23 });
    expect(r[0]!.verseStart).toBeUndefined();
  });
  it('"Judas 5" → Judas 1:5', () => {
    const r = detect('Judas 5');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ bookId: 65, chapter: 1, verseStart: 5 });
  });
  it('"Números 2:88" → vazio (versículo inexistente)', () => {
    expect(detect('Números 2:88')).toHaveLength(0);
  });
  it('"João 22" → vazio (capítulo inexistente)', () => {
    expect(detect('João 22')).toHaveLength(0);
  });
  it('"Samuel 3" → vazio (numerado sem prefixo)', () => {
    expect(detect('Samuel 3')).toHaveLength(0);
  });
  it('"Pedro disse que..." → vazio', () => {
    expect(detect('Pedro disse que...')).toHaveLength(0);
  });
  it('"Salmos 119 versiculo 176" → Salmos 119:176', () => {
    const r = detect('Salmos 119 versiculo 176');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ bookId: 19, chapter: 119, verseStart: 176 });
  });
  it('"segunda Tessalonicenses capítulo 2 verso 1" → 2 Tessalonicenses 2:1', () => {
    const r = detect('segunda Tessalonicenses capítulo 2 verso 1');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ bookName: '2 Tessalonicenses', chapter: 2, verseStart: 1 });
  });
  it('"João capítulo 3 e versículo 16" → João 3:16 (conector e)', () => {
    const r = detect('João capítulo 3 e versículo 16');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ bookId: 43, chapter: 3, verseStart: 16 });
  });
  it('"Tessalonicenses capítulo 1 versículo 1" (sem prefixo) → vazio', () => {
    expect(detect('Tessalonicenses capítulo 1 versículo 1')).toHaveLength(0);
  });
});

describe('detect — Review Focus extras', () => {
  it('intervalo 4-99 em 1 Coríntios 13 retorna 4-13 corretamente', () => {
    const r = detect('primeira de Coríntios 13:4 ao 99');
    expect(r.length).toBe(1);
    expect(r[0]!.bookId).toBe(46);
    expect(r[0]!.bookName).toBe('1 Coríntios');
    expect(r[0]!.chapter).toBe(13);
    expect(r[0]!.verseStart).toBe(4);
    // Deve cortar o intervalo em 13, nunca retornar 99
    expect(r[0]!.verseEnd).toBe(13);
  });
});