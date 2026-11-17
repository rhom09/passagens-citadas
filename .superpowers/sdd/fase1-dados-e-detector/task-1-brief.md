### Task 1: Tipos compartilhados e tabela de livros

**Files:**
- Create: `src/lib/detect/types.ts`
- Create: `src/lib/detect/books.ts`
- Create: `src/lib/bible/types.ts`
- Test: `src/lib/detect/__tests__/books.test.ts`

**Interfaces:**
- Consumes: nada
- Produces:
  - `Passage` — `{ bookId: number; bookName: string; chapter: number; verseStart?: number; verseEnd?: number; source: 'spoken-ref' | 'quote' | 'manual'; confidence: number }`
  - `BookInfo` — `{ id: number; name: string; normalizedRootKey: string; maxVolumes: number; singleChapter: boolean; isNumbered: boolean }`
  - `BOOKS: readonly BookInfo[]` — array com 66 entradas na ordem canônica
  - `Bible` — `{ version: 'ARC'; books: { id: number; name: string; chapters: string[][] }[] }`

- [ ] **Step 1: Create `src/lib/detect/types.ts`**
```ts
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
```
- [ ] **Step 2: Create `src/lib/bible/types.ts`**
```ts
export type Bible = {
  version: 'ARC';
  books: { id: number; name: string; chapters: string[][] }[];
};
```
- [ ] **Step 3: Create `src/lib/detect/books.ts`**
Definir `BOOKS` como array `readonly BookInfo[]` com os 66 livros na ordem canônica. Dados derivados do protótipo. Exportar também `buildBookLookup()` que retorna `Map<string, { bookInfo: BookInfo, isNumbered: boolean }>` indexado por cada `normalizedRootKey`.
- [ ] **Step 4: Write tests in `src/lib/detect/__tests__/books.test.ts`**
```ts
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
```
- [ ] **Step 5: Run tests to verify they fail**
- [ ] **Step 6: Implement `books.ts` to make tests pass**
- [ ] **Step 7: Run tests to verify they pass**
- [ ] **Step 8: Commit**
