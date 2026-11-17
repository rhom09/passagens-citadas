# Fase 1 — Dados e Detector: Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Converter os dados da ARC para formato normalizado, gerar contagens de versículos e implementar o detector de passagens bíblicas com validação de capítulo E versículo.

**Architecture:** Duas trilhas independentes que convergem: (A) `scripts/build-bible.ts` lê `data/arc.source.json` (array de 66 objetos `{abbrev, name, chapters: string[][]}`) e gera `public/data/arc.v1.json` + `src/lib/bible/counts.generated.ts`; (B) o detector em `src/lib/detect/` é um pipeline puro (normalize → numWords → parse → validate) que usa as contagens para rejeitar referências inválidas. As duas trilhas compartilham apenas a tabela de livros (`books.ts`) e o tipo `Passage`.

**Tech Stack:** TypeScript strict, Vitest, Node.js (scripts), ESM, tsx.

**Spec:** `docs/01-visao-e-requisitos.md`, `docs/03-deteccao-de-passagens.md`, `docs/04-dados-biblia.md`, `docs/02-arquitetura.md`

## Global Constraints

- TypeScript strict; ESM (`"type": "module"` no package.json).
- `src/lib/detect` é **função pura**: sem DOM, sem fetch, sem estado global.
- Identificadores de código em **inglês**; textos de UI em pt-BR.
- Sem dependências novas.
- Texto da ARC não vai para o repositório: `data/` e `public/data/` estão no `.gitignore`.
- `counts.generated.ts` contém só números e **pode** ser versionado.
- `tsx` como devDependency para rodar scripts TypeScript diretamente.
- Commits pequenos, mensagens em pt-BR no imperativo.

## Review Focus

1. **Referência com versículo inexistente** (ex: "Números 2:88") — deve retornar array vazio, nunca uma `Passage`.
2. **Livro numerado sem prefixo ordinal** (ex: "Samuel 3") — deve retornar array vazio; "1 Samuel 3" funciona.
3. **Livro de capítulo único** (ex: "Judas 5") — deve interpretar como Judas 1:5, não Judas capítulo 5.
4. **"João" sem prefixo** — deve mapear para o Evangelho (21 capítulos), não para 1/2/3 João.
5. **Números por extenso com conector "e"** (ex: "cento e dezenove") — deve virar 119, não 100 ou erro.

---

## Estrutura de Arquivos

```
src/lib/detect/types.ts          — tipo Passage + BookInfo
src/lib/detect/books.ts          — BOOKS: BookInfo[] (66 livros, ordem canônica, rootKey)
src/lib/detect/normalize.ts      — norm(): minúsculas, strip acentos, normalizar separadores
src/lib/detect/numbers.ts        — numWords(): números por extenso → dígitos
src/lib/detect/parse.ts          — parseReferences(): regex + casamento de livro
src/lib/detect/validate.ts       — validatePassage(): checar cap/vers contra contagens
src/lib/detect/index.ts          — detect(): pipeline completo, re-exporta tipos
src/lib/detect/__tests__/        — testes unitários de cada módulo

src/lib/bible/counts.ts          — VERSE_COUNTS, verseCount, chapterCount
src/lib/bible/loader.ts          — loadBible(), getVerse
src/lib/bible/types.ts           — tipo Bible

scripts/build-bible.ts           — lê arc.source.json, gera arc.v1.json + counts.generated.ts
```

---

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

Definir `BOOKS` como array `readonly BookInfo[]` com os 66 livros na ordem canônica. Dados derivados do protótipo.

Exportar também `buildBookLookup()` que retorna `Map<string, { bookInfo: BookInfo, isNumbered: boolean }>` indexado por cada `normalizedRootKey`.

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

Run: `pnpm test -- src/lib/detect/__tests__/books.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 6: Implement `books.ts` to make tests pass**

Portar dados do protótipo para a estrutura `BookInfo[]`. O protótipo usa `[nome, aliases, chaps]` — converter para objetos tipados. Para livros que aparecem duas vezes no protótipo (João evangelho + João epístolas), usar o mesmo `name` ("João") mas ids distintos (43 e 62).

- [ ] **Step 7: Run tests to verify they pass**

Run: `pnpm test -- src/lib/detect/__tests__/books.test.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/lib/detect/types.ts src/lib/detect/books.ts src/lib/bible/types.ts src/lib/detect/__tests__/books.test.ts
git commit -m "adiciona tipos Passage/BookInfo/Bible e tabela de 66 livros"
```

---

### Task 2: Normalize e números por extenso

**Files:**
- Create: `src/lib/detect/normalize.ts`
- Create: `src/lib/detect/numbers.ts`
- Test: `src/lib/detect/__tests__/normalize.test.ts`
- Test: `src/lib/detect/__tests__/numbers.test.ts`

**Interfaces:**
- Consumes: nada
- Produces:
  - `normalize(raw: string): string` — minúsculas, strip acentos, `3:16` → `3 versiculo 16`, remove pontuação, colapsa espaços
  - `numWords(s: string): string` — números por extenso → dígitos no texto

- [ ] **Step 1: Write tests in `src/lib/detect/__tests__/normalize.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { normalize } from '../normalize';

describe('normalize', () => {
  it('minúsculas e remove acentos', () => {
    expect(normalize('João')).toBe('joao');
  });
  it('3:16 → 3 versiculo 16', () => {
    expect(normalize('3:16')).toBe('3 versiculo 16');
  });
  it('3,16 → 3 versiculo 16', () => {
    expect(normalize('3,16')).toBe('3 versiculo 16');
  });
  it('3.16 → 3 versiculo 16', () => {
    expect(normalize('3.16')).toBe('3 versiculo 16');
  });
  it('remove pontuação e colapsa espaços', () => {
    expect(normalize('abram em  João! 3:16')).toBe('abram em joao 3 versiculo 16');
  });
});
```

- [ ] **Step 2: Write tests in `src/lib/detect/__tests__/numbers.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { numWords } from '../numbers';

describe('numWords', () => {
  it('cento e dezenove → 119', () => {
    expect(numWords('cento e dezenove')).toBe('119');
  });
  it('vinte e oito → 28', () => {
    expect(numWords('vinte e oito')).toBe('28');
  });
  it('tres → 3', () => {
    expect(numWords('tres')).toBe('3');
  });
  it('cento e cinco → 105', () => {
    expect(numWords('cento e cinco')).toBe('105');
  });
  it('dezesseis → 16', () => {
    expect(numWords('dezesseis')).toBe('16');
  });
  it('cento e setenta e seis → 176', () => {
    expect(numWords('cento e setenta e seis')).toBe('176');
  });
  it('preserva texto não-numérico', () => {
    expect(numWords('joao capitulo tres versiculo dezesseis')).toBe('joao capitulo 3 versiculo 16');
  });
  it('um/uma → 1', () => {
    expect(numWords('um')).toBe('1');
    expect(numWords('uma')).toBe('1');
  });
  it('dois/duas → 2', () => {
    expect(numWords('dois')).toBe('2');
    expect(numWords('duas')).toBe('2');
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm test -- src/lib/detect/__tests__/normalize.test.ts src/lib/detect/__tests__/numbers.test.ts`
Expected: FAIL

- [ ] **Step 4: Implement `normalize.ts`**

Portar de `norm` e da transformação inline na função `detect` do protótipo: `toLowerCase()`, `normalize('NFD')` + strip combining marks, regex para `digit:digit` → `digit versiculo digit`, remover `[^a-z0-9 ]`, colapsar espaços, trim.

- [ ] **Step 5: Implement `numbers.ts`**

Portar `numWords` do protótipo. Mapas: unidades (zero..nove, um/uma, dois/duas), teens (dez..dezenove), dezenas (vinte..noventa), centenas (cem/cento, duzentos, trezentos). Lógica de agrupamento com conector "e".

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm test -- src/lib/detect/__tests__/normalize.test.ts src/lib/detect/__tests__/numbers.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/detect/normalize.ts src/lib/detect/numbers.ts src/lib/detect/__tests__/normalize.test.ts src/lib/detect/__tests__/numbers.test.ts
git commit -m "adiciona normalize e conversão de números por extenso"
```

---

### Task 3: Script build-bible e contagens geradas

**Files:**
- Create: `scripts/build-bible.ts`
- Create: `src/lib/bible/counts.ts`
- Create: `src/lib/bible/loader.ts`
- Create: `src/lib/bible/types.ts`
- Test: `src/lib/bible/__tests__/counts.test.ts`

**Interfaces:**
- Consumes: `BookInfo` e `BOOKS` de `src/lib/detect/books.ts`; `Bible` de `src/lib/bible/types.ts`
- Produces:
  - `VERSE_COUNTS: readonly (readonly number[])[]` — `VERSE_COUNTS[bookIndex][chapterIndex]`
  - `verseCount(bookId: number, chapter: number): number | undefined`
  - `chapterCount(bookId: number): number | undefined`
  - `loadBible(): Promise<Bible>`
  - `getVerse(bible: Bible, bookId: number, ch: number, v: number): string | undefined`
  - `pnpm bible:build`

- [ ] **Step 1: Write tests in `src/lib/bible/__tests__/counts.test.ts`**

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- src/lib/bible/__tests__/counts.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `scripts/build-bible.ts`**

1. Lê `data/arc.source.json`
2. Verifica 66 livros, conta capítulos (1189), conta versículos (~31102, listar diferença)
3. Verifica casos conhecidos: Salmos 119=176v, Números 2=34v, João 3=36v
4. Relata versículos vazios ou muito curtos (< 5 chars)
5. Gera `public/data/arc.v1.json`
6. Gera `src/lib/bible/counts.ts`
7. Gera `src/lib/bible/loader.ts`
8. Imprime relatório no console

Adicionar script npm `"bible:build": "tsx scripts/build-bible.ts"`.

- [ ] **Step 4: Run the script**

Run: `mkdir -p public/data && pnpm bible:build`
Expected: relatório impresso, arquivos criados.

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test -- src/lib/bible/__tests__/counts.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add scripts/build-bible.ts src/lib/bible/counts.ts src/lib/bible/loader.ts src/lib/bible/types.ts src/lib/bible/__tests__/counts.test.ts package.json
git commit -m "adiciona script build-bible e módulos bible (counts.ts + loader.ts)"
```

---

### Task 4: Parser de referências (parse.ts)

**Files:**
- Create: `src/lib/detect/parse.ts`
- Test: `src/lib/detect/__tests__/parse.test.ts`

**Interfaces:**
- Consumes: `normalize` de `normalize.ts`, `numWords` de `numbers.ts`, `BOOKS` e `buildBookLookup` de `books.ts`, `Passage` de `types.ts`
- Produces:
  - `RawMatch` — `{ bookId: number; bookName: string; chapter: number; verseStart?: number; verseEnd?: number }`
  - `parseReferences(text: string): RawMatch[]`

- [ ] **Step 1: Write tests in `src/lib/detect/__tests__/parse.test.ts`**

```ts
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
    const r = parseReferences('Salmos cento e dezenoves versículo cento e cinco');
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- src/lib/detect/__tests__/parse.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `parse.ts`**

Portar lógica do protótipo (linhas 89-107), adaptando:
- Usar `normalize()` e `numWords()`
- Usar `buildBookLookup()`
- Construir regex dinamicamente a partir das keys do lookup
- Para livros numerados sem prefixo, pular (como protótipo)
- Para livros de capítulo único sem versículo, interpretar como `verseStart` do capítulo 1
- Retornar `RawMatch[]` sem validação

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- src/lib/detect/__tests__/parse.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/detect/parse.ts src/lib/detect/__tests__/parse.test.ts
git commit -m "adiciona parser de referências bíblicas"
```

---

### Task 5: Validação e pipeline detect()

**Files:**
- Create: `src/lib/detect/validate.ts`
- Create: `src/lib/detect/index.ts`
- Test: `src/lib/detect/__tests__/detect.test.ts`

**Interfaces:**
- Consumes: `RawMatch` de `parse.ts`, `VERSE_COUNTS` de `counts.ts`, `verseCount`, `chapterCount` de `counts.ts`, `Passage` de `types.ts`
- Produces:
  - `validatePassage(match: RawMatch): Passage | null`
  - `detect(text: string): Passage[]`

- [ ] **Step 1: Write tests in `src/lib/detect/__tests__/detect.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { detect } from '../index';

describe('detect — tabela de docs/03', () => {
  it('"abram em João 3:16" → João 3:16', () => {
    const r = detect('abram em João 3:16');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ bookId: 43, bookName: 'João', chapter: 3, verseStart: 16 });
  });
  it('"João capítulo três versículo dezesseis" → João 3:16', () => {
    const r = detect('João capítulo três versículo dezesseis');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ bookId: 43, chapter: 3, verseStart: 16 });
  });
  it('"Romanos 8 versículo 28" → Romanos 8:28', () => {
    const r = detect('Romanos 8 versículo 28');
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
  it('"Salmos cento e dezenoves versículo cento e cinco" → Salmos 119:105', () => {
    const r = detect('Salmos cento e dezenoves versículo cento e cinco');
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
  it('"Salmos 119 versículo 176" → Salmos 119:176', () => {
    const r = detect('Salmos 119 versículo 176');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ bookId: 19, chapter: 119, verseStart: 176 });
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- src/lib/detect/__tests__/detect.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `validate.ts`**

`validatePassage(match: RawMatch): Passage | null`:
- Usa `chapterCount(bookId)` para verificar se o capítulo existe
- Usa `verseCount(bookId, chapter)` para verificar `verseStart` e `verseEnd`
- Se `verseEnd > chapterMax`, ajusta `verseEnd = chapterMax`
- Se `verseEnd` inexistente, retorna sem intervalo
- Retorna `Passage` com `source: 'spoken-ref'` e `confidence: 1`

- [ ] **Step 4: Implement `index.ts`**

Re-exporta tipos. `detect(text: string): Passage[]` = `parseReferences(text).map(validatePassage).filter(notNull)`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test -- src/lib/detect/__tests__/detect.test.ts`
Expected: PASS

- [ ] **Step 6: Run all tests**

Run: `pnpm test`
Expected: ALL PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/detect/validate.ts src/lib/detect/index.ts src/lib/detect/__tests__/detect.test.ts
git commit -m "adiciona validação de versículo e pipeline detect()"
```

---

### Task 6: Lint, build, integração final

**Files:**
- Modify: `package.json` (script `lint` versão correta)
- Modify: `eslint.config.mjs` (react version setting)

**Interfaces:**
- Consumes: tudo das tasks anteriores
- Produces: `pnpm lint`, `pnpm build`, `pnpm test` passando limpo

- [ ] **Step 1: Atualizar script `lint`**

Alterar para: `"lint": "tsc --noEmit && eslint . --ignore-pattern node_modules --ignore-pattern .next"`

- [ ] **Step 2: Corrigir `eslint.config.mjs`**

Adicionar `settings: { react: { version: '19.0' } }`.

- [ ] **Step 3: Corrigir `next.config.mjs`**

Remover chaves `experimental` inválidas (`appDir`, `serverComponents`).

- [ ] **Step 4: Run all checks**

Run: `pnpm test && pnpm lint && pnpm build`
Expected: tudo passa.

- [ ] **Step 5: Commit**

```bash
git add package.json eslint.config.mjs next.config.mjs
git commit -m "corrige lint, build e configurações da Fase 1"
```