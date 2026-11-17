# 04 — Dados da Bíblia (ARC)

## Fonte
Repositório **damarals/biblias** (GitHub), que oferece a ARC 1995 SBB em JSON, SQLite e Zefania. Baixe o **JSON da ARC** e salve em `data/arc.source.json` (pasta no `.gitignore`).

> Atenção: o repositório avisa que algumas versões têm versículos truncados na origem. O script de build deve **relatar anomalias**, não falhar silenciosamente.

## Formato normalizado (saída)
```ts
type Bible = {
  version: 'ARC';
  books: { id: number; name: string; chapters: string[][] }[]; // chapters[c-1][v-1] = texto
};
```
Contagem de versículos por capítulo = `chapters[c-1].length`. Essa é a base da validação de versículo.

## Script `scripts/build-bible.ts`
1. Ler `data/arc.source.json` e **inspecionar a estrutura real** antes de converter (não assumir).
2. Mapear para os 66 livros, na ordem canônica, com os nomes de `src/lib/detect/books.ts`.
3. Gerar `public/data/arc.v1.json` (minificado) e `src/lib/bible/counts.generated.ts` (contagem de versículos por capítulo, para validar sem carregar o texto).
4. Verificações (imprimir relatório):
   - 66 livros; 1.189 capítulos; total próximo de 31.102 versículos (pequenas diferenças são esperadas, listar quais).
   - Versículos vazios ou muito curtos.
   - Capítulos conhecidos como teste: Salmos 119 = 176 versículos; Números 2 = 34; João 3 = 36.
5. Idempotente e rápido.

## Licença e distribuição
O texto da ARC (SBB) tem direitos autorais. Uso pessoal/na igreja é razoável; **não publique o texto num repositório público nem num endereço aberto**:
- Repositório privado; `data/` e `public/data/` no `.gitignore`.
- Deploy com acesso protegido (ver docs/05).
- O `counts.generated.ts` contém só números e pode ser versionado.

## Consulta
`src/lib/bible/index.ts` expõe: `loadBible()` (cache em memória + IndexedDB), `getVerse(book, ch, v)`, `getRange(...)`, `verseCount(book, ch)`, `chapterCount(book)`.
