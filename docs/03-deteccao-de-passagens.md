# 03 — Detecção de passagens e Busca por Trecho

## O que o detector faz
Recebe texto falado (transcrito) e identifica passagens bíblicas citadas, com três mecanismos complementares:
1. **Detecção Explícita de Referência (`src/lib/detect`):** Identifica livro, capítulo e versículo (ex: "João 3:16").
2. **Busca de Trecho Falado (`src/lib/search` - RF-08):** Busca léxica BM25 no texto da ARC quando o pastor cita o texto bíblico sem dizer a referência.
3. **Camada de IA para Paráfrases (`src/lib/identify` - Fase 5b, opcional):** Identifica citações parafraseadas ou com muito contexto quando a busca léxica não encontra sugestões.

---

## 1. Detecção Explícita de Referência

1. **Normalização:** minúsculas, remove pontuação, converte números por extenso para dígitos ("três" → 3, "primeira" → 1ª).
2. **Identificação do livro:** compara com lista canônica dos 66 livros da Bíblia protestante, aceitando abreviações e variações fonéticas comuns.
3. **Extração de capítulo e versículo(s):**
   - "livro capítulo versículo" (ex.: "João 3 16", "João 3 verso 16", "João capítulo 3 versículo 16")
   - Notação padrão: "João 3:16", "João 3.16"
   - Intervalos: "João 3:16-18", "João 3 16 ao 18"
   - Ordem invertida: "capítulo 3 versículo 16 de João"
4. **Validação contra a Bíblia:**
   - O livro existe?
   - O capítulo existe no livro?
   - O(s) versículo(s) existem no capítulo?
   - Se qualquer verificação falhar, **não detecta**.
5. **Classificação de confiança:**
   - Alta: livro + capítulo + versículo
   - Média: livro + capítulo (sem versículo)
   - Baixa / Ambígua: livros numerados sem ordinal geram sugestões secundárias para o operador escolher

---

## 2. Busca de Trecho Falado (BM25 Aprimorado)

Quando o pastor cita o texto da Bíblia de memória sem citar o livro/capítulo:

1. **Buffer entre segmentos:**
   - Mantém as últimas 25 palavras dos segmentos recentes para contornar cortes causados por pausas no reconhecimento de voz do navegador.
   - Expira após 20 segundos de silêncio.
2. **Pistas de citação:**
   - Reconhece expressões introdutórias: `"está escrito"`, `"diz assim"`, `"a palavra diz"`, `"a Bíblia diz"`, `"como diz"`, etc.
   - Remove essas expressões da consulta para não poluir o score léxico.
   - Aplica sensibilidade ajustada (limiar de score de 8.0 vs 11.0) para as janelas que sucedem a pista.
3. **Janelas deslizantes:**
   - Avalia subconjuntos de 5 a 10 palavras sobre o buffer e elege a janela com maior pontuação e relevância.
4. **Pontuação & Relevância:**
   - Prioriza palavras raras usando IDF acumulado.
   - Aplica boost de 1.5x para bigramas e trigramas adjacentes preservados na ordem do versículo.
5. **Tolerância Morfológica:**
   - Radicais simples em português (stemmer leve para plurais e desinências verbais frequentes).
   - Tolerância a 1 erro de digitação/transcrição (distância de Levenshtein ≤ 1) em palavras com 6 ou mais letras.
6. **Maturidade da sugestão & UI:**
   - Reavaliação contínua conforme o pastor fala, sem piscar na interface (estabilização).
   - Na interface do operador, as palavras do versículo correspondentes à fala aparecem destacadas em negrito.
   - Exibição de score e janela vencedora no `DebugInspector` (`?debug=1`).

---

## 3. Camada de IA (Fase 5b — Opcional / Desligada por padrão)

Quando a busca léxica não encontra correspondência e a citação é parafraseada:
1. **Interface Desacoplada (`IdentifyProvider`):** Suporte nativo ao Google Gemini (via `GEMINI_API_KEY` e modelo configurável em `GEMINI_MODEL`), com rota protegida `/api/identify` sob Basic Auth e timeout de 3 segundos. Preparado para Anthropic e outros provedores.
2. **Gatilhos de Disparo:**
   - Ocorre apenas se a busca léxica (BM25) não retornou nenhuma sugestão.
   - O buffer contém pista de citação OU possui $\ge 8$ palavras de conteúdo bíblico.
   - Respeita intervalo mínimo de 8 segundos entre requisições.
   - Teto configurável por culto em `/config` (padrão: 40 chamadas). Em caso de 429 (rate limit), entra em pausa silenciosa por 60 segundos.
3. **Validação Obrigatória & Segurança:**
   - A resposta da IA é sempre validada contra as contagens canônicas da Bíblia (`validatePassage`).
   - O texto exibido ao operador vem **sempre** da ARC local; alucinações de texto do modelo são ignoradas.
   - Marcada na interface com badge **"🤖 pela IA"** e nunca é promovida sozinha ao destaque.

---

## 4. Busca Manual Unificada (`src/components/SearchBar.tsx` — RF-06)

Combina em um único campo livre:
1. **Parser de referências e abreviações rápidas (`src/lib/detect/manual.ts`):**
   - Suporta abreviações comuns (`jo` = João, `jó` = Jó, `rm`, `1co`, `sl`, etc.) e sintaxes com números colados ou pontuações diversas (`jo3:16`, `jo 3 16`, `1co 13:4-7`).
   - Suporta toda a flexibilidade do detector falado (números por extenso, ordem invertida, conectores como "carta aos").
   - Resolução de conflitos de acentuação: `jo` (sem acento) mapeia para o Evangelho de João; `jó` (com acento) mapeia para o livro de Jó.
2. **Busca léxica BM25 relaxada (`searchManualPassage`):**
   - Limiares próprios e separados da fala: sem exigência de mínimo de palavras raras/IDF, sem restrição de margem entre 1º e 2º colocados, aceita consultas a partir de 1 palavra.
   - Retorna até 8 resultados ordenados por score.
3. **Experiência de Usuário (UI/UX) & Acessibilidade:**
   - Debounce de ~200ms e ativação a partir de 3 caracteres digitados.
   - Menu dropdown suspenso exibindo a referência detectada em 1º lugar (se houver) e versículos encontrados por texto com os termos correspondentes em negrito.
   - Navegação por teclado: setas `↑` / `↓` para alternar o foco (`aria-activedescendant`), `Enter` para selecionar e promover ao destaque e histórico, e `Esc` para limpar e fechar.
   - Alvos de toque com altura mínima de 48px/52px para uso ágil no celular ou tablet do operador.

---

## Casos de teste de referência

| Fala (transcrita) | Resultado esperado |
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
| "existe uma passagem que diz assim porque deus amou o mundo" | Sugestão por trecho: João 3:16 |
| "deus amou tanto a humanidade que enviou seu único filho..." | Sugestão por IA: João 3:16 (Fase 5b) |

---

## Regras de qualidade
- Os módulos `src/lib/detect` e `src/lib/search` não importam nada de DOM, React ou rede.
- O operador está sempre no controle: sugestões de trecho nunca são promovidas sozinhas ao destaque.
- Zero falsos positivos em frases típicas de pregação que não sejam citações da Escritura.
