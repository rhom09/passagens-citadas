# 07 — Prompts para o Claude Code

Cole um por vez, revise o resultado e só então avance. Cada prompt já cita as skills da fase (ver tabela em `CLAUDE.md`). Se uma skill não estiver instalada, o prompt manda seguir o fluxo equivalente.

## Fase 0 (sem skills)
```
Leia CLAUDE.md e os arquivos em docs/. Execute a Fase 0 de docs/06-roadmap-e-tarefas.md:
crie o projeto Next.js (App Router, TypeScript strict, Tailwind), ESLint, Vitest e pnpm,
com a estrutura de pastas do CLAUDE.md. Não use skills nesta fase e não instale
dependências fora do escopo. Ao final, rode test, lint e build e me mostre o resultado.
```

## Fase 1 — dados e detector
```
Leia CLAUDE.md e docs/03 e docs/04. Use a skill writing-plans para propor o plano da Fase 1
e espere minha aprovação.
Depois de aprovado, use dispatching-parallel-agents para trabalhar em paralelo em:
(A) scripts/build-bible.ts + src/lib/bible, e (B) o detector em src/lib/detect.
Para o detector, use a skill test-driven-development: escreva primeiro os testes com a tabela
de casos de docs/03, veja-os falhar e só então implemente, portando a lógica de
prototype/passagens-citadas.html, agora validando capítulo E versículo.
Antes de converter a ARC, inspecione data/arc.source.json e mostre a estrutura real.
Não versione o texto. Se alguma skill não estiver instalada, siga o fluxo equivalente
(plano → aprovação; testes primeiro).
```

## Fase 2
```
Use a skill frontend-design (e ui-ux-pro-max, se instalada) para a Fase 2: tela do operador
com botão de escuta (SpeechProvider web-speech), ReferenceCard com referência e texto,
histórico (tocar traz de volta ao destaque), barra de transcrição e busca manual.
Siga docs/01 e docs/02: leitura de relance, alto contraste, tema claro/escuro, alvos ≥ 48px,
mobile em retrato. Resultados parciais substituem as passagens do mesmo segmentId.
Mostre o plano de layout antes de implementar.
```

## Fase 3
```
Use a skill writing-plans e proponha o plano da Fase 3 (PWA) conforme docs/05. Depois de
aprovado, implemente: manifest, ícones, service worker com cache versionado dos dados e
Wake Lock. Explique como testar instalação e modo offline.
```

## Fase 4
```
Use a skill writing-plans para a Fase 4. Antes de planejar, consulte a documentação atual
do Deepgram sobre chaves temporárias e streaming e me mostre o plano. Depois implemente
src/lib/speech/deepgram.ts e /api/voice-token mantendo a interface SpeechProvider.
```

## Fase 5 — trecho falado
```
Use a skill brainstorming para comparar abordagens de busca de trecho falado (índice léxico
no cliente vs embeddings) para RF-08, com prós, contras e custo. Espere minha escolha.
Depois implemente com a skill test-driven-development, com limiar de confiança e testes com
20 versículos comuns.
```

## Fase 6 — contexto e refinamentos
```
Use test-driven-development e a skill do projeto adicionar-caso-de-deteccao para implementar
RF-09 (contexto de capítulo), ordem invertida ("capítulo 3 versículo 16 de João") e aliases,
cada um com casos novos em docs/03 e nos testes.
```

## Fases 7 e 8
```
Use a skill brainstorming para a Fase <7 ou 8>. Para a 7, consulte a documentação oficial
do Holyrics antes de qualquer proposta e não assuma endpoints. Mostre opções e riscos e
espere minha escolha antes de implementar.
```

## Bug de detecção (a qualquer momento)
```
Use a skill adicionar-caso-de-deteccao.
Frase dita: "<frase>"
Resultado obtido: "<resultado>"
Resultado esperado: "<esperado ou nenhuma>"
```

## Release
```
Use a skill checklist-de-release e me entregue a lista final: pronto, pendente e riscos.
```
