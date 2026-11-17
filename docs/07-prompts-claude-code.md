# 07 — Prompts para o Claude Code

Cole um por vez, revise o resultado e só então avance. Para tarefas grandes, peça primeiro um plano.

## Fase 0
```
Leia CLAUDE.md e os arquivos em docs/. Execute a Fase 0 de docs/06-roadmap-e-tarefas.md:
crie o projeto Next.js (App Router, TypeScript strict, Tailwind), ESLint, Vitest e pnpm,
com a estrutura de pastas do CLAUDE.md. Não instale dependências fora do escopo.
Ao final, rode test, lint e build e me mostre o resultado.
```

## Fase 1 — dados
```
Execute a primeira metade da Fase 1. Inspecione data/arc.source.json (vou colocá-lo lá)
e mostre a estrutura real antes de converter. Depois implemente scripts/build-bible.ts e
src/lib/bible conforme docs/04, imprimindo o relatório de verificações. Não versione o texto.
```

## Fase 1 — detector
```
Porte o detector de prototype/passagens-citadas.html para src/lib/detect como módulo puro,
conforme docs/03, agora validando capítulo E versículo com a contagem gerada.
Escreva primeiro os testes com a tabela de casos de docs/03 e faça todos passarem.
```

## Fase 2
```
Implemente a Fase 2: tela do operador com botão de escuta (SpeechProvider web-speech),
ReferenceCard com referência e texto, histórico (tocar traz de volta ao destaque),
barra de transcrição e busca manual. Siga os requisitos de docs/01 e a arquitetura de docs/02.
Resultados parciais substituem as passagens do mesmo segmentId.
```

## Fase 3
```
Implemente a Fase 3 (PWA) conforme docs/05: manifest, ícones, service worker com cache
versionado dos dados, Wake Lock. Explique como testar a instalação e o modo offline.
```

## Fase 4
```
Implemente a Fase 4: provider Deepgram (src/lib/speech/deepgram.ts) e /api/voice-token.
Antes de codar, consulte a documentação atual do Deepgram sobre chaves temporárias e
streaming e me mostre o plano. Mantenha a interface SpeechProvider.
```

## Para corrigir um bug de detecção
```
A frase "<frase dita>" gerou "<resultado>" mas o esperado era "<esperado>".
Adicione o caso em docs/03 e nos testes, veja-o falhar, corrija o detector e rode a suíte.
```

## Revisão antes de release
```
Faça uma revisão do projeto contra docs/01 (requisitos) e o checklist de docs/05.
Liste o que falta, riscos e qualquer referência inválida que ainda possa aparecer.
```
