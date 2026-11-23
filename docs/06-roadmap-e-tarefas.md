# 06 — Roadmap e tarefas

Cada fase só termina quando os critérios de aceite passam.

## Fase 0 — Setup
- [x] Concluída (Arquitetura & Config)

## Fase 1 — Dados e detector
- [x] Concluída (Dados Bíblicos & Detecção)

## Fase 2 — Interface do operador
- [x] Concluída (UI, Estabilização, Parser ajustes, RF-09/Contexto)
  - Ajustes feitos: `useStabilizedPassages`, `DebugInspector`, `explainDetection`, conectores, "verso/versos", RF-09.

## Fase 3 — PWA
- [x] Concluída (PWA/Offline)
  - Manifest com ícones 192, 512 e maskable (`manifest.json`).
  - Fonte DM Mono local via `next/font/google` (sem `@import` remoto).
  - Service worker manual (`public/sw.js`): cache-first versionado para shell e `/data/arc.v1.json`, network-only para `/api/*`.
  - Wake Lock API (`useWakeLock`) com reativação automática em `visibilitychange` e fallback resiliente.
  - **Aceite:** instalável; abre e consulta versículos offline.

## Fase 4 — Voz em produção
- **Skills:** `writing-plans`
- Implementar `deepgram.ts` e `/api/voice-token`; seletor em `/config`.
- Vocabulário customizado com nomes dos livros.
- **Aceite:** funciona no iPhone e no Android; reconexão automática; latência ≈ 2 s.

## Fase 5 — Trecho falado (RF-08)
- [x] Concluída (Busca léxica BM25 no cliente)
  - Índice BM25 gerado em `public/data/search-index.v1.json` via `pnpm bible:build`.
  - Módulo puro `src/lib/search` com BM25, janela de 20 palavras e boost para n-gramas contíguos.
  - Limiares estritos: mínimo 4 palavras em comum, score mínimo 12, margem mínima 35% sobre 2º colocado.
  - Web Worker `search.worker.ts` + hook `useSpokenSearch` executado somente em falas sem referência explícita.
  - Componente `SpokenTextSuggestions` com promoção manual pelo operador.
  - Script de avaliação `pnpm search:eval` (taxa top 3 ≥ 90% e 0 falsos positivos em frases comuns).
  - **Aceite:** aprovado nos critérios de qualidade e integrado à UI.

## Fase 6 — Contexto e refinamentos
- [x] RF-09 (contexto de capítulo): concluído.
- [x] Copiar referência: concluído.
- [x] Ordem invertida: "capítulo N versículo M de LIVRO" → passagem detectada.
- [x] Aliases de transcrição: Habacuc/Oseas/Filemon/Canticos/Atos dos Apóstolos.
- [x] Livro numerado sem ordinal: sugestões ambíguas (operador toca para promover; nunca vai ao destaque sozinha).
- **Aceite:** novos casos em docs/03 e testes em `src/lib/detect/__tests__/parse.test.ts`.

Pendentes menores (backlog):
- Aliases adicionais encontrados em campo (adicionar em `TRANSCRIPTION_ALIASES` em `parse.ts`).

## Fase 7 — Integração Holyrics (opcional)
- **Skills:** `brainstorming`
- **Antes de planejar**, confirmar na documentação oficial do Holyrics se há API/controle remoto e como autenticar; não assumir endpoints.
- Botão "enviar ao Holyrics" com confirmação do operador.

## Fase 8 — Microfone remoto (opcional)
- **Skills:** `brainstorming` (opcional: `using-git-worktrees`)
- Celular capta e transmite; PC exibe (WebSocket/Realtime).
- **Aceite:** latência adicional < 500 ms em Wi-Fi local.

## Backlog / ideias
Modo ensaio (reproduzir áudio gravado), exportar log do culto, outras versões, atalhos de teclado.
