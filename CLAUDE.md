# Passagens Citadas

Webapp (PWA) que escuta a pregação, detecta passagens bíblicas citadas e mostra a referência (e o texto da ARC) para o **operador** do PC da igreja, que então projeta pelo Holyrics.

## Princípios (não quebrar)
1. **Operador no controle.** O app sugere; nunca envia nada automaticamente para a TV/Holyrics sem ação do operador.
2. **Falso positivo é pior que perder uma detecção.** Na dúvida, não mostre. Valide livro, capítulo e versículo contra os dados reais.
3. **Legível de relance**, em ambiente com pouca luz, no celular e no PC: referência em fonte grande, alto contraste, alvos de toque grandes.
4. **Funciona offline** (dados bíblicos em cache); só a transcrição pode exigir internet.
5. **Privacidade:** o áudio não é gravado nem enviado a nada além do provedor de transcrição; transcrições não são persistidas por padrão.
6. **Texto da ARC não vai para repositório público.** Ver `docs/04-dados-biblia.md`.

## Stack
Next.js (App Router) + TypeScript (strict) + Tailwind CSS + PWA (Serwist ou service worker manual) + Vitest. Sem backend próprio além de rotas de API mínimas (token do provedor de voz, auth básica).

## Comandos
```bash
pnpm dev          # desenvolvimento (http://localhost:3000)
pnpm test         # Vitest (obrigatório passar antes de qualquer commit)
pnpm lint         # ESLint + tsc --noEmit
pnpm build        # build de produção
pnpm bible:build  # gera o JSON normalizado da ARC (docs/04)
```
Se um comando ainda não existir, crie-o conforme o roadmap em `docs/06-roadmap-e-tarefas.md`.

## Estrutura alvo
```
src/app/                 # rotas (/, /buscar, /config) e rotas de API
src/components/          # UI (ReferenceCard, History, TranscriptBar, Mic button)
src/lib/bible/           # tipos, carregamento e consulta dos dados
src/lib/detect/          # normalize, numbers, books, parse, validate (puro, sem DOM)
src/lib/speech/          # SpeechProvider + web-speech.ts + deepgram.ts
scripts/                 # build-bible.ts
data/                    # fonte da ARC (gitignored)
prototype/               # protótipo HTML original (referência de comportamento)
docs/                    # documentação do projeto
```

## Convenções
- UI, textos e documentação em **pt-BR**; identificadores de código em **inglês**.
- `src/lib/detect` é **função pura** e 100% testável: sem DOM, sem fetch, sem estado global.
- Todo bug de detecção vira um caso de teste em `src/lib/detect/__tests__`.
- Sem dependências novas sem necessidade clara; prefira a plataforma (Web APIs).
- Commits pequenos, mensagens em pt-BR no imperativo ("adiciona validação de versículo").
- Acessibilidade: contraste AA, foco visível, respeitar `prefers-reduced-motion` e tema claro/escuro.

## Antes de codar
Leia, nesta ordem: `docs/01-visao-e-requisitos.md`, `docs/03-deteccao-de-passagens.md`, `docs/02-arquitetura.md`. O comportamento de referência do detector está em `prototype/passagens-citadas.html` (inclui um bug conhecido, descrito em `docs/03`).
Para tarefas grandes, proponha um plano curto e espere aprovação antes de implementar.

## Skills por fase
Use a skill indicada se estiver instalada; se não estiver, siga o fluxo descrito no prompt da fase (`docs/07`). Não ative skills fora da fase indicada.

| Fase | Skills |
|---|---|
| 0 | nenhuma |
| 1 | `writing-plans`, `dispatching-parallel-agents` (dados e detector em paralelo) |
| 2 | `frontend-design` (opcional: `ui-ux-pro-max` para mobile) |
| 3 | `writing-plans` |
| 4 | `writing-plans` |
| 5 | `brainstorming` |
| 6 | `adicionar-caso-de-deteccao` |
| 7–8 | `brainstorming` |
| Bug de detecção (qualquer momento) | `adicionar-caso-de-deteccao` (`.claude/skills/`) |
| Release | `checklist-de-release` (`.claude/skills/`) |
