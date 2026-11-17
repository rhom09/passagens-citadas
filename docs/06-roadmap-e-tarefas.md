# 06 — Roadmap e tarefas

Cada fase só termina quando os critérios de aceite passam.

## Fase 0 — Setup
- Criar app Next.js (App Router, TS strict, Tailwind), ESLint, Vitest, pnpm.
- Estrutura de pastas conforme `CLAUDE.md`; manter o protótipo em `prototype/`.
- **Aceite:** `pnpm dev`, `pnpm test`, `pnpm lint`, `pnpm build` funcionam.

## Fase 1 — Dados e detector
- Implementar `scripts/build-bible.ts` e `src/lib/bible` (docs/04).
- Portar o detector do protótipo para `src/lib/detect` (docs/03) **com validação de versículo**.
- **Aceite:** todos os casos da tabela de docs/03 em testes; "Números 2:88" rejeitado; 66 livros / 1.189 capítulos verificados.

## Fase 2 — Interface do operador
- Tela principal: botão de escuta, `ReferenceCard` (referência + texto), `History`, barra de transcrição, busca manual (RF-06).
- Tema claro/escuro, fonte grande, alvos de toque ≥ 48px.
- **Aceite:** fluxo completo com Web Speech no Chrome desktop; sem referência inválida na tela.

## Fase 3 — PWA
- Manifest, ícones, service worker, cache dos dados, Wake Lock (docs/05).
- **Aceite:** instalável; abre e consulta versículos offline.

## Fase 4 — Voz em produção
- Implementar `deepgram.ts` e `/api/voice-token`; seletor em `/config`.
- Vocabulário customizado com nomes dos livros.
- **Aceite:** funciona no iPhone e no Android; reconexão automática; latência ≈ 2 s.

## Fase 5 — Trecho falado (RF-08)
- Índice léxico dos versículos no cliente; sugestões com confiança.
- **Aceite:** ao citar um versículo sem a referência, aparece entre as 3 sugestões em testes com 20 versículos comuns; sem sugestões fracas (limiar).

## Fase 6 — Contexto e refinamentos
- RF-09 (contexto de capítulo), ordem invertida, aliases, copiar referência.
- **Aceite:** novos casos em docs/03 e testes.

## Fase 7 — Integração Holyrics (opcional)
- **Antes de planejar**, confirmar na documentação oficial do Holyrics se há API/controle remoto e como autenticar; não assumir endpoints.
- Botão "enviar ao Holyrics" com confirmação do operador.

## Fase 8 — Microfone remoto (opcional)
- Celular capta e transmite; PC exibe (WebSocket/Realtime).
- **Aceite:** latência adicional < 500 ms em Wi-Fi local.

## Backlog / ideias
Modo ensaio (reproduzir áudio gravado), exportar log do culto, outras versões, atalhos de teclado.
