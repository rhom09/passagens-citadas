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
- **Skills:** `brainstorming`
- Índice léxico dos versículos no cliente; sugestões com confiança.
- **Aceite:** ao citar um versículo sem a referência, aparece entre as 3 sugestões em testes com 20 versículos comuns; sem sugestões fracas (limiar).

## Fase 6 — Contexto e refinamentos
- **Skills:** `test-driven-development`, `adicionar-caso-de-deteccao`
- RF-09 (contexto de capítulo), ordem invertida, aliases, copiar referência.
- **Aceite:** novos casos em docs/03 e testes.

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
