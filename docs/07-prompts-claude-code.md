# 07 — Prompts para o Claude Code

Cole um por vez, revise o resultado e só então avance. Cada prompt já cita as skills da fase (ver tabela em `CLAUDE.md`). Se uma skill não estiver instalada, o prompt manda seguir o fluxo equivalente.

## Fase 3 — PWA
```
Use a skill writing-plans e proponha o plano da Fase 3 (PWA) conforme docs/05. Depois de
aprovado, implemente: manifest, ícones, service worker com cache versionado dos dados e
Wake Lock. Explique como testar instalação e modo offline.
```

## Fase 4 — Voz em produção
```
Use a skill writing-plans para a Fase 4. Antes de planejar, consulte a documentação atual
do Deepgram sobre chaves temporárias e streaming e me mostre o plano. Depois implemente
src/lib/speech/deepgram.ts e /api/voice-token mantendo a interface SpeechProvider.
```

## Fase 5 — Trecho falado (RF-08)
```
Use a skill brainstorming para comparar abordagens de busca de trecho falado (índice léxico
no cliente vs embeddings) para RF-08, com prós, contras e custo. Espere minha escolha.
Depois implemente com limiar de confiança e testes com 20 versículos comuns.
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

## Teste de campo (Culto)
```
Estamos na fase de observação em culto real. Use o prompt abaixo para registrar os achados:

"Estou no culto. Abaixo a lista de frases ditas, o que o detector captou (Raw) e o que apareceu na tela:
- Dito: '<frase>'
- Raw: '<texto captado>'
- Exibido: '<passagem resultante>'

Analise se o parser falhou (precisa de caso de teste em docs/03) ou se foi instabilidade do áudio/debounce. Se o erro for recorrente, proponha ajustes na estabilização."
```
