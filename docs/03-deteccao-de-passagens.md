# 03 — Detecção de passagens

Referência de comportamento: `prototype/passagens-citadas.html` (funções `norm`, `numWords`, `detect`).

## Pipeline
1. **Normalizar:** minúsculas, remover acentos, trocar `3:16`/`3,16`/`3.16` por `3 versiculo 16`, remover pontuação, colapsar espaços.
2. **Números por extenso → dígitos** (até 3 dígitos, com conector "e"): "cento e dezenove" → 119; "vinte e oito" → 28. "um/uma" → 1, "dois/duas" → 2, "três" → 3.
3. **Casar referência** com regex: `[prefixo ordinal] LIVRO [capítulo] N [versículo] M [ao/até/a/e] K`.
   - Prefixo: `primeiro/primeira/segundo/.../1/2/3`, opcionalmente seguido de "carta" e "de/do/aos".
   - Livros numerados (1–2 Samuel, Reis, Crônicas, Coríntios, Tessalonicenses, Timóteo, Pedro; 1–3 João) **exigem** prefixo; sem ele, ignorar.
   - "João" sem prefixo = Evangelho; "Jó" é a forma normalizada `jo` (na fala, `jo` = Jó).
4. **Validar** contra os dados: capítulo existe; **versículo existe no capítulo**; fim do intervalo > início e existe.
5. **Livros de capítulo único** (Obadias, Filemom, 2 João, 3 João, Judas): "Judas 5" = Judas 1:5.
6. **Emitir** `Passage[]` (ver docs/02).

## Bug conhecido do protótipo
O protótipo valida só o capítulo, não o versículo. Exemplo real de teste: falar "Números 2:88" exibiu **Números 2:88**, que não existe (Números 2 tem 34 versículos). A versão nova deve rejeitar. Corrigir exige os dados da ARC (docs/04).

## Regras de conectores, contexto e descarte
- **Conectores:** Aceita até 3 palavras de ligação ("carta", "epístola", "a", "de", "ao", etc.) entre prefixo ordinal e livro.
- **Contexto (RF-09):** Frases do tipo "versículo N" completam a passagem anterior (se houver capítulo citado) dentro de uma janela de 15 segundos.
- **Descarte de intervalo:** Se o versículo final for inválido (ex: menor que o inicial, ou inexistente), a detecção descarta o final e considera apenas o inicial (se válido).
- **Livro numerado sem prefixo:** Citações como "Tessalonicenses 1:1" geram **sugestões ambíguas** (nunca vão ao destaque sozinhas). O operador toca em uma das sugestões para promover. "João" sem prefixo continua sendo o Evangelho.
- **Ordem invertida:** "capítulo N versículo M de LIVRO" é detectada. Para livros numerados em ordem invertida, o prefixo ordinal continua sendo exigido para evitar falso positivo (ex: "capítulo 2 versículo 3 da segunda carta aos Tessalonicenses" → 2 Tessalonicenses 2:3).
- **Aliases de transcrição:** Variantes de pronúncia/transcrição mapeiam para a forma canônica:
  - Habacuc → Habacuque
  - Oseas → Oséias
  - Filemon → Filemom
  - Cânticos/Canticos → Cantares
  - Atos dos Apóstolos → Atos
  - Para adicionar nova variante: normalize (minúsculas, sem acentos) e insira em `TRANSCRIPTION_ALIASES` em `src/lib/detect/parse.ts`.

## Detecção de Trecho Falado (RF-08 — Busca Léxica BM25)
Quando o orador cita o texto do versículo diretamente sem dizer a referência bíblica (ex: *"porque Deus amou o mundo de tal maneira..."*):
- **Algoritmo:** BM25 no cliente com índice invertido e IDF pré-calculados em `public/data/search-index.v1.json` via `pnpm bible:build`.
- **Janela deslizante:** últimas 20 palavras da fala normalizada, sem stopwords em português.
- **Limiares de segurança (falso positivo é pior que perder detecção):**
  1. No mínimo 4 palavras de conteúdo em comum com o versículo.
  2. Score BM25 mínimo: 12.0.
  3. Margem: o score do 1º colocado deve ser pelo menos 35% superior ao 2º colocado (ou score absoluto massivo).
  4. Boost para bigramas e trigramas contíguos na mesma ordem (1.5x).
  5. Se houver dúvida, nenhuma sugestão é emitida.
- **Execução:** Web Worker dedicado (`src/lib/search/search.worker.ts`), sem travar a thread principal da UI.
- **UI:** Exibido em card próprio *"📖 Sugestões pelo texto (fala)"*. **Nunca é promovido ao destaque automaticamente**; o operador deve tocar para promover.
- **Disparo:** Executado apenas em trechos estáveis ou finais **sem** referência explícita detectada.

## Casos de teste (mínimo)
| Entrada | Esperado |
|---|---|
| "abram em João 3:16" | João 3:16 |
| "João capítulo três versículo dezesseis" | João 3:16 |
| "Romanos 8 versículo 28" | Romanos 8:28 |
| "primeira de Coríntios 13:4 ao 7" | 1 Coríntios 13:4-7 |
| "dois Timóteo três dezesseis" | 2 Timóteo 3:16 |
| "Salmos cento e dezenove versículo cento e cinco" | Salmos 119:105 |
| "Salmo 23" | Salmos 23 (sem versículo) |
| "Judas 5" | Judas 1:5 |
| "Números 2:88" | nenhuma (versículo inexistente) |
| "João 22" | nenhuma (João tem 21 capítulos) |
| "Samuel 3" | nenhuma (livro numerado sem prefixo) |
| "Pedro disse que..." | nenhuma |
| "Salmos 119 versículo 176" | Salmos 119:176 |
| parcial "joão 3" → depois "joão 3 16" | substitui no mesmo segmento, resultado final João 3:16 |
| "segunda Tessalonicenses capítulo 2 verso 1" | 2 Tessalonicenses 2:1 |
| "João capítulo 3 e versículo 16" | João 3:16 |
| "Tessalonicenses capítulo 1 versículo 1" | sugestões ambíguas (1 Tess 1:1 e 2 Tess 1:1) |
| "Salmos 119" → "versículo 105" (completar por contexto) | Salmos 119:105 |
| "segunda a Tessalonicenses capítulo 2 versos 3" | 2 Tessalonicenses 2:3 |
| "segunda carta aos Tessalonicenses capítulo 2 verso 3" | 2 Tessalonicenses 2:3 |
| "primeira epístola de Pedro 1:3" | 1 Pedro 1:3 |
| "primeira de João 4:8" | 1 João 4:8 |
| "verso 5" (após contexto) | (ex: Salmos 23:5) |
| "capítulo 3 versículo 16 de João" | João 3:16 (ordem invertida) |
| "capítulo 8 de Romanos" | Romanos 8 (ordem invertida) |
| "capítulo 2 versículo 3 da segunda carta aos Tessalonicenses" | 2 Tessalonicenses 2:3 |
| "Habacuc 3:17" | Habacuque 3:17 (alias de transcrição) |
| "Oseas 2:1" | Oséias 2:1 (alias de transcrição) |
| "Filemon 10" | Filemom 1:10 (alias de transcrição + capítulo único) |
| "Canticos 1:2" | Cantares 1:2 (alias de transcrição) |
| "Coríntios 13:4" | sugestões ambíguas (1 e 2 Coríntios 13:4) |

## Melhorias planejadas
- Busca manual separada com abreviações (`jo` = João, `jó` = Jó, `rm`, `1co`, `sl`): tabela própria, sem conflito com a fala.

## Regras de qualidade
- O módulo `src/lib/detect` e `src/lib/search` não pode importar nada de DOM, React ou rede.
- Cada correção de bug adiciona um caso na tabela e em `__tests__`.
