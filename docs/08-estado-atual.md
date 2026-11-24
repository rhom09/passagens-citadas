# 08 — Estado Atual

## Status por Fase
- Fase 0 (Arquitetura & Config): Concluída.
- Fase 1 (Dados Bíblicos & Detecção): Concluída.
- Fase 2 (UI & Estabilização): Concluída.
- Fase 3 (PWA/Offline): Concluída.
- Fase 5 (Trecho falado / Busca Léxica BM25 Aprimorada): Concluída.
- Fase 6 (Refinamentos do detector): Concluída.
- Deploy Protegido (Docs/05): Concluído (Middleware Basic Auth + .vercelignore).

## Ajustes Pós-Fases
- Estabilização de reconhecimento via `useStabilizedPassages`:
  - 700ms para passagens com versículo (ex: "João 3:16").
  - 1500ms para passagens apenas com capítulo (ex: "João 3").
- `DebugInspector` (`?debug=1`): Exibe os últimos 30 segmentos, incluindo `rawText`, `normalized`, passagens aceitas/rejeitadas, sugestões ambíguas, sugestões de trecho falado por BM25, scores, identificação de pista de citação e a janela vencedora.
- Detector:
  - Suporte a conectores (até 3 palavras) entre ordinal e livro: "segunda carta aos Tessalonicenses".
  - Suporte a "verso/versos" como marcador de versículo.
  - Completar por contexto (RF-09): "versículo N" completa a passagem do último capítulo citado, com janela de 15 segundos.
  - Descarte: Livros numerados sem ordinal geram sugestões ambíguas (nunca vão ao destaque sozinhos). "João" sem prefixo continua sendo o Evangelho.
  - Descarte: Intervalos inválidos (ex: final < inicial) retornam apenas o versículo inicial.
  - **Ordem invertida:** "capítulo N versículo M de LIVRO" é detectada. Para numerados, o ordinal ainda é exigido.
  - **Aliases de transcrição:** Habacuc→Habacuque, Oseas→Oséias, Filemon→Filemom, Canticos→Cantares, Atos dos Apóstolos→Atos. Para adicionar: `TRANSCRIPTION_ALIASES` em `src/lib/detect/parse.ts`.
  - **Sugestões ambíguas:** `AmbiguousSuggestions` exibe botões abaixo do ReferenceCard; operador toca para promover. `DebugInspector` mostra sugestões e candidatos validados.
- **Fase 5 Aprimorada (Trecho falado — RF-08):**
  - **Janelas deslizantes:** geração de janelas de 5 a 10 palavras sobre o buffer, elegendo a janela com maior score.
  - **Buffer entre segmentos:** retém até 25 palavras dos segmentos recentes com expiração automática após 20s de silêncio para contornar pausas na transcrição do Chrome.
  - **Pistas de citação:** detecção de expressões como "está escrito", "diz assim", "a palavra diz", etc. Remove da consulta e aplica limiar adaptativo para o trecho seguinte.
  - **Pontuação por raridade:** prioriza palavras raras usando IDF acumulado e n-gramas na ordem, substituindo o mínimo fixo rígido de palavras.
  - **Tolerância morfológica:** stemmer leve de radicais para português (plurais/verbos) e tolerância a 1 erro de digitação/transcrição (Levenshtein ≤ 1) em palavras com 6+ caracteres.
  - **Maturidade contínua:** reavaliação a cada atualização de transcrição; na UI, as palavras correspondentes são destacadas em negrito (`HighlightedSnippet`).
  - **Avaliação estendida (`pnpm search:eval`):** avalia trechos do meio, citações precedidas por contexto de púlpito e frases divididas em dois segmentos, com 50 frases comuns de pregação (zero falsos positivos).
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
