/**
  * Constantes configuráveis do algoritmo de busca léxica (BM25)
  */

// Stopwords em português brasileiro (palavras comuns sem valor discriminatório para versículos)
export const PORTUGUESE_STOPWORDS = new Set([
  'a', 'ao', 'aos', 'aquela', 'aquelas', 'aquele', 'aqueles', 'aquilo', 'as', 'ate',
  'com', 'como', 'da', 'das', 'de', 'dela', 'delas', 'dele', 'deles', 'do', 'dos',
  'e', 'ela', 'elas', 'ele', 'eles', 'em', 'entre', 'era', 'eram', 'essa', 'essas',
  'esse', 'esses', 'esta', 'estas', 'este', 'estes', 'eu', 'foi', 'fomos', 'foram',
  'ha', 'isso', 'isto', 'ja', 'lhe', 'lhes', 'mais', 'mas', 'me', 'mesmo', 'meu',
  'meus', 'minha', 'minhas', 'na', 'nas', 'nao', 'nas', 'no', 'nos', 'nossa',
  'nossas', 'nosso', 'nossos', 'num', 'numa', 'o', 'os', 'ou', 'para', 'pela',
  'pelas', 'pelo', 'pelos', 'por', 'qual', 'quando', 'que', 'quem', 'se', 'sem',
  'ser', 'seu', 'seus', 'so', 'sua', 'suas', 'tambem', 'te', 'tem', 'teu', 'teus',
  'tu', 'tua', 'tuas', 'um', 'uma', 'umas', 'uns', 'voce', 'voces', 'vos'
]);

// Parâmetros BM25 padrão
export const BM25_K1 = 1.2;
export const BM25_B = 0.75;

// Limiares de segurança (RF-08)
export const MIN_MATCHING_WORDS = 4; // Pelo menos 4 palavras de conteúdo em comum
export const SLIDING_WINDOW_WORDS = 20; // Janela deslizante das últimas ~20 palavras
export const MIN_ABSOLUTE_SCORE = 12.0; // Pontuação BM25 mínima
export const TOP_SCORE_MARGIN_RATIO = 1.35; // Score do 1º deve ser ≥ 35% superior ao 2º colocado
export const NGRAM_BOOST = 1.5; // Multiplicador para bigramas/trigramas consecutivos na mesma ordem
