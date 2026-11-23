# 08 — Estado Atual

## Status por Fase
- Fase 0 (Arquitetura & Config): Concluída.
- Fase 1 (Dados Bíblicos & Detecção): Concluída.
- Fase 2 (UI & Estabilização): Concluída.
- Fase 3 (PWA/Offline): Concluída.

## Ajustes Pós-Fases
- Estabilização de reconhecimento via `useStabilizedPassages`:
  - 700ms para passagens com versículo (ex: "João 3:16").
  - 1500ms para passagens apenas com capítulo (ex: "João 3").
- `DebugInspector` (`?debug=1`): Exibe os últimos 30 segmentos, incluindo `rawText`, `normalized` e, se completado por contexto, a passagem resultante.
- Detector:
  - Suporte a conectores (até 3 palavras) entre ordinal e livro: "segunda carta aos Tessalonicenses".
  - Suporte a "verso/versos" como marcador de versículo.
  - Completar por contexto (RF-09): "versículo N" completa a passagem do último capítulo citado, com janela de 15 segundos.
  - Descarte: Livros numerados sem ordinal são descartados (ex: "Tessalonicenses 1:1" → nenhuma).
  - Descarte: Intervalos inválidos (ex: final < inicial) retornam apenas o versículo inicial.
- Fase 3 (PWA & Offline):
  - Fontes locais gerenciadas via `next/font/google` com injeção de variável CSS `--font-dm-mono`.
  - Remoção do `@import` externo do Google Fonts em `globals.css`.
  - Service worker manual implementado em `public/sw.js` com precache de shell, cache-first para `/data/arc.v1.json` e rede para `/api/*`.
  - Registro de SW via `ServiceWorkerRegister` no layout raiz.
  - Web App Manifest configurado com `purpose: "any"` e `purpose: "maskable"`, cores do tema e `display: standalone`.
  - Screen Wake Lock implementado via `useWakeLock` ativado quando o microfone está escutando, com suporte à retomada no `visibilitychange`.

## Decisões
- TDD estrito foi abandonado em favor de TDD orientado a casos (tabela em docs/03 + testes em `src/lib/detect/__tests__`). Todo bug vira caso de teste.
- Função `explainDetection(rawText)` criada para facilitar depuração no `DebugInspector`.
- A passagem sem ordinal em livro numerado é descartada por segurança; no backlog: sugerir "1 ou 2" para o operador.
- PWA implementado com Service Worker nativo/manual para evitar conflitos de compatibilidade entre Serwist e Next 16 / Turbopack.

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
- Gerado: `src/lib/bible/counts.generated.ts` (versionado).
- Geração: `pnpm bible:build`.

## Backlog / Próximos Passos
- Teste em culto real (observar dita vs apareceu vs Raw).
- Fase 4 (Deepgram).
- Fase 7 (Integração Holyrics - aguardar API definitiva).
