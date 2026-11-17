---
name: adicionar-caso-de-deteccao
description: Use quando uma frase falada gerar uma passagem errada, nenhuma passagem ou uma referência inexistente no detector de passagens bíblicas. Registra o caso, confirma a falha em teste, corrige src/lib/detect e roda a suíte.
---

# Adicionar caso de detecção

Entrada esperada: a frase dita, o resultado obtido e o resultado esperado (ou "nenhuma").

## Passos
1. Leia `docs/03-deteccao-de-passagens.md` e a pasta `src/lib/detect/__tests__`.
2. Adicione o caso na tabela de "Casos de teste" de `docs/03` e como teste em `src/lib/detect/__tests__`.
3. Rode `pnpm test` e **confirme que o novo teste falha** pelo motivo certo.
4. Corrija `src/lib/detect` com a menor mudança possível. O módulo continua puro: sem DOM, rede ou estado global.
5. Rode `pnpm test` e `pnpm lint`. Nenhum teste antigo pode quebrar.
6. Revise os princípios do `CLAUDE.md`: na dúvida, não exibir; nunca mostrar referência inexistente.
7. Resuma: causa, correção e o caso adicionado.
