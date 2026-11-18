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
- **Descarte de livro numerado:** Livros numerados sem prefixo (ex: "Tessalonicenses 1:1") são rejeitados de propósito.

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
| "Tessalonicenses capítulo 1 versículo 1" | nenhuma (livro numerado exige prefixo) |
| "Salmos 119" → "versículo 105" (completar por contexto) | Salmos 119:105 |
| "segunda a Tessalonicenses capítulo 2 versos 3" | 2 Tessalonicenses 2:3 |
| "segunda carta aos Tessalonicenses capítulo 2 verso 3" | 2 Tessalonicenses 2:3 |
| "primeira epístola de Pedro 1:3" | 1 Pedro 1:3 |
| "primeira de João 4:8" | 1 João 4:8 |
| "verso 5" (após contexto) | (ex: Salmos 23:5) |

## Melhorias planejadas
- Ordem invertida: "capítulo 3, versículo 16 de João".
- Contexto: "versículo 5" usa o último capítulo/livro citado (RF-09).
- Variações de transcrição (Habacuque/Habacuc, Oseias/Oseas, Filemom/Filemon) via tabela de aliases.
- Busca manual separada com abreviações (`jo` = João, `jó` = Jó, `rm`, `1co`, `sl`): tabela própria, sem conflito com a fala.
- Detecção de **trecho falado** (RF-08): índice léxico (tokens normalizados, BM25 ou similar) sobre os versículos, com limiar de confiança e mostrando as 2–3 melhores sugestões. Embeddings só se o léxico não bastar.

## Regras de qualidade
- O módulo não pode importar nada de DOM, React ou rede.
- Cada correção de bug adiciona um caso na tabela e em `__tests__`.
