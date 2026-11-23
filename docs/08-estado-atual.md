# 08 — Estado Atual

## Status por Fase
- Fase 0 (Arquitetura & Config): Concluída.
- Fase 1 (Dados Bíblicos & Detecção): Concluída.
- Fase 2 (UI & Estabilização): Concluída.
- Fase 3 (PWA/Offline): Concluída.
- Fase 5 (Trecho falado / Busca Léxica BM25): Concluída.
- Fase 6 (Refinamentos do detector): Concluída.
- Deploy Protegido (Docs/05): Concluído (Middleware Basic Auth + .vercelignore).

## Ajustes Pós-Fases
- Estabilização de reconhecimento via `useStabilizedPassages`:
  - 700ms para passagens com versículo (ex: "João 3:16").
  - 1500ms para passagens apenas com capítulo (ex: "João 3").
- `DebugInspector` (`?debug=1`): Exibe os últimos 30 segmentos, incluindo `rawText`, `normalized`, passagens aceitas/rejeitadas, sugestões ambíguas e sugestões de trecho falado por BM25.
- Detector:
  - Suporte a conectores (até 3 palavras) entre ordinal e livro: "segunda carta aos Tessalonicenses".
  - Suporte a "verso/versos" como marcador de versículo.
  - Completar por contexto (RF-09): "versículo N" completa a passagem do último capítulo citado, com janela de 15 segundos.
  - Descarte: Livros numerados sem ordinal geram sugestões ambíguas (nunca vão ao destaque sozinhos). "João" sem prefixo continua sendo o Evangelho.
  - Descarte: Intervalos inválidos (ex: final < inicial) retornam apenas o versículo inicial.
  - **Ordem invertida:** "capítulo N versículo M de LIVRO" é detectada. Para numerados, o ordinal ainda é exigido.
  - **Aliases de transcrição:** Habacuc→Habacuque, Oseas→Oséias, Filemon→Filemom, Canticos→Cantares, Atos dos Apóstolos→Atos. Para adicionar: `TRANSCRIPTION_ALIASES` em `src/lib/detect/parse.ts`.
  - **Sugestões ambíguas:** `AmbiguousSuggestions` exibe botões abaixo do ReferenceCard; operador toca para promover. `DebugInspector` mostra sugestões e candidatos validados.
- **Fase 5 (Trecho falado — RF-08):**
  - Busca léxica local com BM25 próprio em `src/lib/search` (sem dependências externas).
  - Geração de `public/data/search-index.v1.json` via `pnpm bible:build` (composto de tokens normalizados, sem stopwords e com IDF).
  - Cache-first no Service Worker (`public/sw.js`).
  - Execução desacoplada via Web Worker (`search.worker.ts`) e hook `useSpokenSearch` executado apenas quando não há referência explícita na fala.
  - Limiares estritos de segurança: mínimo de 4 palavras de conteúdo em comum, score ≥ 12, margem mínima de 35% sobre 2º colocado, boost de 1.5x em n-gramas contíguos.
  - Interface do operador: card `SpokenTextSuggestions` com destaque manual e exibição no `DebugInspector`.
  - Script de avaliação `pnpm search:eval` para validação de meta (≥ 90% top 3, zero falsos positivos em frases de púlpito).
- Fase 3 (PWA & Offline):
  - Fontes locais gerenciadas via `next/font/google` com injeção de variável CSS `--font-dm-mono`.
  - Remoção do `@import` externo do Google Fonts em `globals.css`.
  - Service worker manual implementado em `public/sw.js` com precache de shell, cache-first para `/data/arc.v1.json` e `/data/search-index.v1.json`, rede para `/api/*`.
  - Registro de SW via `ServiceWorkerRegister` no layout raiz.
  - Web App Manifest configurado com `purpose: "any"` e `purpose: "maskable"`, cores do tema e `display: standalone`.
  - Screen Wake Lock implementado via `useWakeLock` ativado quando o microfone está escutando, com suporte à retomada no `visibilitychange`.
- **Deploy Protegido (Docs/05):**
  - Implementado `src/middleware.ts` com proteção HTTP Basic Auth baseada em `BASIC_AUTH_USER` e `BASIC_AUTH_PASS`.
  - Protege todas as páginas, rotas de API, dados bíblicos (`/data/*`) e Service Worker (`/sw.js`).
  - Metadados públicos essenciais para PWA (`/manifest.json`, `/favicon.ico` e `/icon-*.png`) liberados para não quebrar a instalação nos navegadores.
  - Arquivo `.vercelignore` configurado para não ignorar `public/data/`, viabilizando o upload direto de `arc.v1.json` e `search-index.v1.json` via Vercel CLI (`vercel --prod`) sem versionar texto bíblico no Git.

## Decisões
- TDD estrito foi abandonado em favor de TDD orientado a casos (tabela em docs/03 + testes em `src/lib/detect/__tests__`). Todo bug vira caso de teste.
- Função `explainDetection(rawText)` criada para facilitar depuração no `DebugInspector`.
- Livros numerados sem ordinal geram sugestões ambíguas (em vez de serem descartados). O operador sempre decide qual promover.
- Trecho falado usa busca BM25 própria no navegador via Web Worker, sem embeddings nem serviços externos (mantendo 100% de privacidade e viabilidade offline).
- PWA implementado com Service Worker nativo/manual para evitar conflitos de compatibilidade entre Serwist e Next 16 / Turbopack.
- Aliases de transcrição em tabela única (`TRANSCRIPTION_ALIASES`) em `parse.ts`, fácil de ampliar a partir de observações do DebugInspector em campo.

## Ambiente e Armadilhas
- Windows 11 + PowerShell + Antigravity.
- pnpm instalado via `get.pnpm.io`.
- `pnpm vitest run`: não usar `watch`, rodar uma vez por execução.
- Tailwind v4 exige `@tailwindcss/postcss` e `@import "tailwindcss"`.
- `postcss.config.cjs`: package.json está como `"type": "module"`.
- Web Speech: conflito entre abas usando o microfone.
- Google Fonts: substituído por `next/font/google`, operando 100% offline.

## Dados
- Local: `data/` e `public/data/` (gitignored).
- Gerado: `src/lib/bible/counts.generated.ts` (versionado), `public/data/search-index.v1.json` (gitignored).
- Geração: `pnpm bible:build`.

## Backlog / Próximos Passos
- Teste em culto real (observar dita vs apareceu vs Raw); acumular variantes em `TRANSCRIPTION_ALIASES`.
- Fase 4 (Deepgram).
- Fase 7 (Integração Holyrics - aguardar API definitiva).
