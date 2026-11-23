import { describe, it, expect } from 'vitest';
import { parseReferences, parseReferencesWithAmbiguous } from '../parse';

describe('parseReferences — casos existentes', () => {
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
  it('"segunda Tessalonicenses capítulo 2 verso 1" → 2 Tessalonicenses 2:1', () => {
    const r = parseReferences('segunda Tessalonicenses capítulo 2 verso 1');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ bookName: '2 Tessalonicenses', chapter: 2, verseStart: 1 });
  });
  it('"segunda a Tessalonicenses capítulo 2 versos 3" → 2 Tessalonicenses 2:3', () => {
    const r = parseReferences('segunda a Tessalonicenses capítulo 2 versos 3');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ bookName: '2 Tessalonicenses', chapter: 2, verseStart: 3 });
  });
  it('"segunda carta aos Tessalonicenses capítulo 2 verso 3" → 2 Tessalonicenses 2:3', () => {
    const r = parseReferences('segunda carta aos Tessalonicenses capítulo 2 verso 3');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ bookName: '2 Tessalonicenses', chapter: 2, verseStart: 3 });
  });
  it('"primeira epístola de Pedro 1:3" → 1 Pedro 1:3', () => {
    const r = parseReferences('primeira epístola de Pedro 1:3');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ bookName: '1 Pedro', chapter: 1, verseStart: 3 });
  });
  it('"primeira de João 4:8" → 1 João 4:8', () => {
    const r = parseReferences('primeira de João 4:8');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ bookName: '1 João', chapter: 4, verseStart: 8 });
  });
  it('"Tessalonicenses capítulo 1 versículo 1" (sem prefixo) → nenhuma em matches', () => {
    expect(parseReferences('Tessalonicenses capítulo 1 versículo 1')).toHaveLength(0);
  });
  it('"João capítulo 3 e versículo 16" → João 3:16 (conector e)', () => {
    const r = parseReferences('João capítulo 3 e versículo 16');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ bookName: 'João', chapter: 3, verseStart: 16 });
  });
});

describe('parseReferences — ordem invertida', () => {
  it('"capítulo 3 versículo 16 de João" → João 3:16', () => {
    const r = parseReferences('capítulo 3 versículo 16 de João');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ bookName: 'João', chapter: 3, verseStart: 16 });
  });
  it('"capítulo 8 de Romanos" → Romanos 8', () => {
    const r = parseReferences('capítulo 8 de Romanos');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ bookName: 'Romanos', chapter: 8 });
    expect(r[0]!.verseStart).toBeUndefined();
  });
  it('"capítulo 2 versículo 3 da segunda carta aos Tessalonicenses" → 2 Tessalonicenses 2:3', () => {
    const r = parseReferences('capítulo 2 versículo 3 da segunda carta aos Tessalonicenses');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ bookName: '2 Tessalonicenses', chapter: 2, verseStart: 3 });
  });
  it('"capítulo 3 versículo 16 de Tessalonicenses" (sem ordinal) → nenhuma (evita falso positivo)', () => {
    // Livro numerado sem ordinal em padrão invertido → não casa
    expect(parseReferences('capítulo 3 versículo 16 de Tessalonicenses')).toHaveLength(0);
  });
  it('"versículo 16 do capítulo 3 de João" não casa (formato não suportado — sem falso positivo)', () => {
    // Este formato não é suportado mas também não gera falso positivo
    const r = parseReferences('versículo 16 do capítulo 3 de João');
    // Pode não casar ou pode casar parcialmente — não deve ser João 3:16
    // O importante é não gerar referência errada
    if (r.length > 0) {
      expect(r[0]).not.toMatchObject({ chapter: 3, verseStart: 16 });
    }
  });
});

describe('parseReferences — aliases de transcrição', () => {
  it('"Habacuc 3:17" → Habacuque 3:17', () => {
    const r = parseReferences('Habacuc 3:17');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ chapter: 3, verseStart: 17 });
    expect(r[0]!.bookName).toBe('Habacuque');
  });
  it('"Oseas 2:1" → Oséias 2:1', () => {
    const r = parseReferences('Oseas 2:1');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ chapter: 2, verseStart: 1 });
    expect(r[0]!.bookName).toBe('Oséias');
  });
  it('"Filemon 10" → Filemom 1:10 (livro de capítulo único)', () => {
    const r = parseReferences('Filemon 10');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ chapter: 1, verseStart: 10 });
    expect(r[0]!.bookName).toBe('Filemom');
  });
  it('"Canticos 1:2" → Cantares 1:2', () => {
    const r = parseReferences('Canticos 1:2');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ chapter: 1, verseStart: 2 });
    expect(r[0]!.bookName).toBe('Cantares');
  });
});

describe('parseReferencesWithAmbiguous — livro numerado sem ordinal', () => {
  it('"Tessalonicenses 1:1" → ambiguous com 1 e 2 Tessalonicenses', () => {
    const { matches, ambiguous } = parseReferencesWithAmbiguous('Tessalonicenses 1:1');
    expect(matches).toHaveLength(0); // Não vai direto para matches
    expect(ambiguous).toHaveLength(1);
    expect(ambiguous[0]!.candidates.length).toBeGreaterThanOrEqual(2);
    const names = ambiguous[0]!.candidates.map(c => c.bookName);
    expect(names).toContain('1 Tessalonicenses');
    expect(names).toContain('2 Tessalonicenses');
  });
  it('"Coríntios 13:4" → ambiguous com 1 e 2 Coríntios', () => {
    const { matches, ambiguous } = parseReferencesWithAmbiguous('Coríntios 13:4');
    expect(matches).toHaveLength(0);
    expect(ambiguous).toHaveLength(1);
    const names = ambiguous[0]!.candidates.map(c => c.bookName);
    expect(names).toContain('1 Coríntios');
    expect(names).toContain('2 Coríntios');
  });
  it('"João 3:16" (sem ordinal) → match direto (Evangelho, não ambíguo)', () => {
    const { matches, ambiguous } = parseReferencesWithAmbiguous('João 3:16');
    expect(matches).toHaveLength(1);
    expect(ambiguous).toHaveLength(0);
    expect(matches[0]!.bookName).toBe('João');
  });
});

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
  it('"segunda Tessalonicenses capítulo 2 verso 1" → 2 Tessalonicenses 2:1', () => {
    const r = parseReferences('segunda Tessalonicenses capítulo 2 verso 1');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ bookName: '2 Tessalonicenses', chapter: 2, verseStart: 1 });
  });
  it('"segunda a Tessalonicenses capítulo 2 versos 3" → 2 Tessalonicenses 2:3', () => {
    const r = parseReferences('segunda a Tessalonicenses capítulo 2 versos 3');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ bookName: '2 Tessalonicenses', chapter: 2, verseStart: 3 });
  });
  it('"segunda carta aos Tessalonicenses capítulo 2 verso 3" → 2 Tessalonicenses 2:3', () => {
    const r = parseReferences('segunda carta aos Tessalonicenses capítulo 2 verso 3');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ bookName: '2 Tessalonicenses', chapter: 2, verseStart: 3 });
  });
  it('"primeira epístola de Pedro 1:3" → 1 Pedro 1:3', () => {
    const r = parseReferences('primeira epístola de Pedro 1:3');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ bookName: '1 Pedro', chapter: 1, verseStart: 3 });
  });
  it('"primeira de João 4:8" → 1 João 4:8', () => {
    const r = parseReferences('primeira de João 4:8');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ bookName: '1 João', chapter: 4, verseStart: 8 });
  });
  it('"Tessalonicenses capítulo 1 versículo 1" (sem prefixo) → nenhuma', () => {
    expect(parseReferences('Tessalonicenses capítulo 1 versículo 1')).toHaveLength(0);
  });
  it('"João capítulo 3 e versículo 16" → João 3:16 (conector e)', () => {
    const r = parseReferences('João capítulo 3 e versículo 16');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ bookName: 'João', chapter: 3, verseStart: 16 });
  });
});