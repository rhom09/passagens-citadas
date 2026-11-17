# 02 — Arquitetura

## Visão geral
```
Microfone → SpeechProvider → {segmentId, text, isFinal}
          → detect(text, bible) → Passage[]
          → store (histórico por segmento) → UI (ReferenceCard + History)
Busca manual → parseManual(text, bible) → Passage → store
```
Quase tudo roda no navegador. Backend mínimo: rota para token do provedor de voz e (opcional) autenticação básica.

## Decisões
| Tema | Decisão | Motivo |
|---|---|---|
| Framework | Next.js App Router + TS strict + Tailwind | Perfil do dev; PWA e deploy simples |
| Detector | Módulo puro em `src/lib/detect` | Testável, reutilizável, sem acoplamento |
| Voz (MVP) | Web Speech API (`webkitSpeechRecognition`, pt-BR) | Grátis; já validado no protótipo (Chrome desktop) |
| Voz (produção) | Deepgram streaming via WebSocket | Funciona em qualquer celular; melhor em pt-BR; aceita vocabulário customizado |
| Dados | JSON da ARC normalizado, em cache no service worker | Offline e validação de versículo |
| Estado | `useReducer` + contexto; sem libs de estado | Estado pequeno |
| Testes | Vitest para detector e dados | É o núcleo de risco |

## Interface do provedor de voz
```ts
export type TranscriptEvent = { segmentId: string; text: string; isFinal: boolean };
export interface SpeechProvider {
  start(): Promise<void>;
  stop(): void;
  onTranscript(cb: (e: TranscriptEvent) => void): void;
  onError(cb: (e: { code: 'denied' | 'unsupported' | 'network' | 'unknown'; message: string }) => void): void;
}
```
Implementações: `web-speech.ts` (MVP, auto-restart ao fim da sessão, prefixo de sessão no `segmentId`) e `deepgram.ts`. Escolha por configuração em `/config`.

## Tipos centrais
```ts
export type Passage = {
  bookId: number;        // 1..66
  bookName: string;      // "1 Coríntios"
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
  source: 'spoken-ref' | 'quote' | 'manual';
  confidence: number;    // 0..1 (spoken-ref explícita = 1)
};
```

## Tratamento de resultados parciais
O reconhecimento envia textos parciais que mudam ("joão 3" → "joão 3 16"). A cada evento, **substitua** as passagens do mesmo `segmentId` em vez de acrescentar. Descarte repetição consecutiva da mesma passagem.

## Rotas
- `/` operador (tela principal)
- `/buscar` busca manual dedicada (pode ser painel da tela principal)
- `/config` provedor de voz, tamanho da fonte, tema
- `/api/voice-token` token temporário do Deepgram (verificar na documentação do Deepgram o mecanismo de chaves temporárias; se não houver, usar proxy WebSocket)

## Segurança
- Nenhuma chave de API no cliente.
- Acesso protegido (Basic Auth em middleware ou equivalente) por causa do texto da ARC.
- Sem logs de áudio ou transcrição.
