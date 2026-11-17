import { describe, it, expect } from 'vitest';
import { parseReferences } from '../parse';

describe('parseReferences', () => {
  it('"abram em João 3:16" → João 3:16', () => {
    const r = parseReferences('abram em João 3:16');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ bookName: 'João', chapter: 3, verseStart: 16 });
  });
  it('"João capítulo três versículo dezesseis" → João 3:16', () => {
    const r = parseReferences('João capítulo três versículo dezesseis');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ bookName: 'João', chapter: 3, verseStart: 16 });
  });
  it('"Romanos 8 versículo 28" → Romanos 8:28', () => {
    const r = parseReferences('Romanos 8 versículo 28');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ bookName: 'Romanos', chapter: 8, verseStart: 28 });
  });
  it('"primeira de Coríntios 13:4 ao 7" → 1 Coríntios 13:4-7', () => {
    const r = parseReferences('primeira de Coríntios 13:4 ao 7');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ bookName: '1 Coríntios', chapter: 13, verseStart: 4, verseEnd: 7 });
  });
  it('"dois Timóteo três dezesseis" → 2 Timóteo 3:16', () => {
    const r = parseReferences('dois Timóteo três dezesseis');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ bookName: '2 Timóteo', chapter: 3, verseStart: 16 });
  });
  it('"Salmos cento e dezenoves versículo cento e cinco" → Salmos 119:105', () => {
    const r = parseReferences('Salmos cento e dezenove versiculo cento e cinco');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ bookName: 'Salmos', chapter: 119, verseStart: 105 });
  });
  it('"Salmo 23" → Salmos 23 (sem versículo)', () => {
    const r = parseReferences('Salmo 23');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ bookName: 'Salmos', chapter: 23 });
    expect(r[0]!.verseStart).toBeUndefined();
  });
  it('"1 Samuel 3" → 1 Samuel 3 (rende id 10)', () => {
    const r = parseReferences('1 Samuel 3');
    expect(r).toHaveLength(1);
    expect(r[0].bookName).toBe('1 Samuel');
    expect(r[0]).toMatchObject({ chapter: 3, verseStart: undefined, verseEnd: undefined });
  });
  it('"primeira de João 4:8" → 1 João 4:8 (id 62, não Evangelho)', () => {
    const r = parseReferences('primeira de João 4:8');
    expect(r).toHaveLength(1);
    expect(r[0].bookName).toBe('1 João');
    expect(r[0]).toMatchObject({ chapter: 4, verseStart: 8, verseEnd: undefined });
  });
  it('"2 João 5" → 2 João 1:5 (capítulo único)', () => {
    const r = parseReferences('2 João 5');
    expect(r.length).toBeGreaterThan(0);
    if (r.length > 0) {
      expect(r[0]).toMatchObject({ chapter: 1, verseStart: 5 });
    }
  });
  it('"Judas 5" → Judas cap 1, vers 5 (capítulo único)', () => {
    const r = parseReferences('Judas 5');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ bookName: 'Judas', chapter: 1, verseStart: 5 });
  });
  it('"Samuel 3" → vazio (numerado sem prefixo)', () => {
    expect(parseReferences('Samuel 3')).toHaveLength(0);
  });
  it('"Pedro disse que..." → vazio (não é referência)', () => {
    expect(parseReferences('Pedro disse que...')).toHaveLength(0);
  });
  it('"Números 2:88" → match cru (validação vem depois)', () => {
    const r = parseReferences('Números 2:88');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ chapter: 2, verseStart: 88 });
  });
});