---
name: checklist-de-release
description: Use antes de publicar uma versão do app Passagens Citadas. Confere requisitos de docs/01 e o checklist de docs/05, e lista pendências e riscos.
---

# Checklist de release

1. Leia `docs/01-visao-e-requisitos.md` e `docs/05-pwa-e-deploy.md`.
2. Rode `pnpm test`, `pnpm lint` e `pnpm build` e registre o resultado.
3. Para cada requisito RF Must/Should, diga se está implementado, parcial ou ausente, com o arquivo que o atende.
4. Confira: nenhuma referência inválida possível (validação de versículo ativa), dados da ARC fora do Git (`.gitignore`), nenhuma chave de API no cliente, acesso protegido no deploy.
5. Liste o que só pode ser verificado manualmente (offline, iPhone, Android, teste real de culto).
6. Entregue uma lista final: **pronto**, **pendente** e **riscos**.
