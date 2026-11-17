# 05 — PWA e deploy

## Requisitos de PWA
- `manifest.webmanifest`: `name` "Passagens Citadas", `short_name`, `display: "standalone"`, `start_url: "/"`, `theme_color`/`background_color` coerentes com o tema, ícones 192 e 512 (+ maskable).
- Service worker: Serwist (`@serwist/next`) ou manual.
  - Precache do shell (HTML/JS/CSS/fontes).
  - Dados da ARC: **cache-first, versionado** (`arc.v1.json`).
  - Rotas de API e transcrição: sempre rede.
- Página offline funcional com dados em cache.
- Tela sempre acesa durante a escuta (Wake Lock API, com tratamento de falha e reativação ao voltar à aba).

## Instalação
- **Android/Chrome e desktop:** prompt "Instalar app" ou menu do navegador.
- **iPhone:** Safari → Compartilhar → "Adicionar à Tela de Início".

## Cuidados no iPhone (validar em aparelho real)
- Reconhecimento de voz do navegador é limitado no iOS (sessões que encerram, precisa de Ditado ativo). Por isso a produção usa Deepgram via `getUserMedia` + `MediaRecorder`/`AudioWorklet`.
- Microfone em PWA instalada: testar; se falhar, orientar uso no Safari.

## HTTPS e microfone
O navegador só libera o microfone em HTTPS (ou `localhost`). Hospedar em Vercel ou Netlify resolve.

## Deploy e acesso
- Vercel ou Netlify, repositório privado.
- **Proteger o acesso** (texto da ARC): middleware com Basic Auth e senha em variável de ambiente.
- Variáveis: `DEEPGRAM_API_KEY` (servidor), `BASIC_AUTH_USER`, `BASIC_AUTH_PASS`.
- Domínio próprio opcional.

## Checklist de release
- [ ] `pnpm test` e `pnpm lint` verdes
- [ ] Lighthouse PWA aprovado
- [ ] Testado offline (modo avião) com dados em cache
- [ ] Testado em Chrome desktop, Android e iPhone
- [ ] Teste real de culto com gravação de falhas anotadas
