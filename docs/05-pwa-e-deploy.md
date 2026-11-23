# 05 — PWA e deploy

## Requisitos de PWA
- `manifest.json`: `name` "Passagens Citadas", `short_name`, `display: "standalone"`, `start_url: "/"`, `theme_color`/`background_color` coerentes com o tema, ícones 192 e 512 (+ maskable).
- Service worker: manual (`public/sw.js`).
  - Precache do shell (HTML/JS/CSS/fontes).
  - Dados da ARC e índice de busca: **cache-first, versionado** (`arc.v1.json`, `search-index.v1.json`).
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
O navegador só libera o microfone em HTTPS (ou `localhost`). Hospedar na Vercel resolve nativamente.

## Deploy Protegido na Vercel (Conta Gratuita)

O projeto requer que o texto da Bíblia ARC não fique exposto publicamente nem no Git.

### 1. Proteção por Senha (Basic Auth)
- Implementado em [src/middleware.ts](src/middleware.ts).
- Protege todas as páginas, rotas de API e dados bíblicos (`/`, `/data/*`, `/sw.js`).
- **Exceção para PWA:** `/manifest.json`, `/favicon.ico` e `/icon-*.png` são permitidos sem credenciais para evitar falhas durante o prompt nativo de instalação do PWA em navegadores móveis (Chrome e Safari).
- **Variáveis de Ambiente:**
  - `BASIC_AUTH_USER`: usuário do operador
  - `BASIC_AUTH_PASS`: senha do operador

### 2. Entrega do `arc.v1.json` e `search-index.v1.json`
Como `public/data/` está no `.gitignore` (para não subir a ARC em repositório público):
- O arquivo `.vercelignore` foi configurado para **não** ignorar a pasta `public/data/`.
- Ao usar o deploy via **Vercel CLI** (`vercel --prod`), a CLI faz o upload dos arquivos compilados locais diretamente para a Vercel, sem versionar o texto no Git.

### 3. Passo a Passo para Publicação
1. **Instalar Vercel CLI (se ainda não tiver):**
   ```bash
   npm i -g vercel
   ```
2. **Gerar os arquivos locais de dados:**
   ```bash
   pnpm bible:build
   ```
3. **Login e Link do Projeto:**
   ```bash
   vercel login
   vercel link
   ```
4. **Configurar as Variáveis de Ambiente:**
   No painel da Vercel (Settings → Environment Variables) ou via CLI:
   ```bash
   vercel env add BASIC_AUTH_USER production
   vercel env add BASIC_AUTH_PASS production
   ```
5. **Realizar o Deploy de Produção:**
   ```bash
   vercel --prod
   ```

## Checklist de Teste
- [ ] **Acesso e Autenticação:** Acessar a URL de produção em aba anônima; deve pedir usuário e senha via diálogo nativo HTTP Basic Auth.
- [ ] **Rejeição:** Credenciais incorretas retornam status 401.
- [ ] **Acesso aos Dados:** Acessar `/data/arc.v1.json` diretamente no navegador; deve exigir autenticação.
- [ ] **Instalação do PWA:** No celular (Chrome ou Safari), verificar se o ícone e manifest carregam e o app pode ser instalado na tela inicial.
- [ ] **Operação Offline:** Com o PWA aberto e dados carregados, ativar o Modo Avião e confirmar que a consulta de passagens e visualização funcionam offline.
