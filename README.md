# Passagens Citadas

Assistente de projeção para cultos: escuta a pregação, detecta passagens bíblicas e mostra a referência (e o texto da ARC) para o operador.

## Como começar (Antigravity + Claude Code)
1. Crie o repositório (privado) e coloque estes arquivos na raiz.
2. Abra a pasta no Antigravity e, no terminal integrado, rode `claude`.
3. Cole o prompt da **Fase 0** de `docs/07-prompts-claude-code.md`.
4. Avance fase por fase (`docs/06-roadmap-e-tarefas.md`), revisando cada entrega.

## Documentação
| Arquivo | Conteúdo |
|---|---|
| `CLAUDE.md` | Regras e contexto que o Claude Code lê automaticamente |
| `docs/01-visao-e-requisitos.md` | Problema, usuários, requisitos funcionais e não funcionais |
| `docs/02-arquitetura.md` | Stack, módulos, fluxo de dados, provedores de voz |
| `docs/03-deteccao-de-passagens.md` | Especificação do detector, bug conhecido, casos de teste |
| `docs/04-dados-biblia.md` | Obtenção e normalização da ARC, validação, licença |
| `docs/05-pwa-e-deploy.md` | PWA, instalação no celular, deploy e acesso |
| `docs/06-roadmap-e-tarefas.md` | Fases com critérios de aceite |
| `docs/07-prompts-claude-code.md` | Prompts prontos por fase |
| `prototype/passagens-citadas.html` | Protótipo funcional (referência) |
