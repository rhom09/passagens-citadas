import { describe, it, expect } from 'vitest';
import { parseManualReference } from '../manual';

describe('parseManualReference', () => {
  it('distingue "jo" (Evangelho de João) de "jó" (Jó)', () => {
    const joao = parseManualReference('jo 3 16');
    expect(joao.passages).toHaveLength(1);
    expect(joao.passages[0]?.bookId).toBe(43); // João
    expect(joao.passages[0]?.bookName).toBe('João');
    expect(joao.passages[0]?.chapter).toBe(3);
    expect(joao.passages[0]?.verseStart).toBe(16);

    const jo = parseManualReference('jó 1 1');
    expect(jo.passages).toHaveLength(1);
    expect(jo.passages[0]?.bookId).toBe(18); // Jó
    expect(jo.passages[0]?.bookName).toBe('Jó');
    expect(jo.passages[0]?.chapter).toBe(1);
    expect(jo.passages[0]?.verseStart).toBe(1);
  });

  it('suporta abreviações clássicas com diferentes pontuações e espaçamentos', () => {
    // "rm 8 28"
    const rm = parseManualReference('rm 8 28');
    expect(rm.passages[0]?.bookName).toBe('Romanos');
    expect(rm.passages[0]?.chapter).toBe(8);
    expect(rm.passages[0]?.verseStart).toBe(28);

    // "1co 13:4-7"
    const cor = parseManualReference('1co 13:4-7');
    expect(cor.passages[0]?.bookName).toBe('1 Coríntios');
    expect(cor.passages[0]?.chapter).toBe(13);
    expect(cor.passages[0]?.verseStart).toBe(4);
    expect(cor.passages[0]?.verseEnd).toBe(7);

    // "sl 23"
    const sl = parseManualReference('sl 23');
    expect(sl.passages[0]?.bookName).toBe('Salmos');
    expect(sl.passages[0]?.chapter).toBe(23);
    expect(sl.passages[0]?.verseStart).toBeUndefined();

    // "jo3:16" (colado)
    const colado = parseManualReference('jo3:16');
    expect(colado.passages[0]?.bookId).toBe(43);
    expect(colado.passages[0]?.chapter).toBe(3);
    expect(colado.passages[0]?.verseStart).toBe(16);
  });

  it('suporta sintaxe falada completa na busca manual', () => {
    const falada = parseManualReference('capítulo 3 versículo 16 de João');
    expect(falada.passages[0]?.bookId).toBe(43);
    expect(falada.passages[0]?.chapter).toBe(3);
    expect(falada.passages[0]?.verseStart).toBe(16);
  });

  it('reconhece texto livre como não-referência para despachar ao BM25', () => {
    const textOnly = parseManualReference('o senhor é meu pastor');
    expect(textOnly.passages).toHaveLength(0);
    expect(textOnly.isReferenceQuery).toBe(false);
  });
});
