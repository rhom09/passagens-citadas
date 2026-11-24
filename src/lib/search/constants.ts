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

// Configuração de janelas deslizantes e buffer
export const SLIDING_WINDOW_MIN = 5; // Janela mínima de palavras
export const SLIDING_WINDOW_MAX = 10; // Janela máxima de palavras
export const RECENT_SEGMENTS_BUFFER_WORDS = 25; // Palavras mantidas no buffer multi-segmentos
export const BUFFER_EXPIRY_MS = 20_000; // Expira buffer após 20s de silêncio

// Limiares de segurança
export const MIN_ABSOLUTE_SCORE = 11.0; // Pontuação BM25 mínima padrão
export const MIN_ABSOLUTE_SCORE_WITH_CLUE = 8.0; // Pontuação mínima quando há pista de citação ("diz assim", etc.)
export const MIN_ACCUMULATED_IDF = 6.5; // Mínimo de IDF acumulado nas palavras que deram match
export const MIN_ACCUMULATED_IDF_WITH_CLUE = 4.8;
export const TOP_SCORE_MARGIN_RATIO = 1.30; // Score do 1º deve ser ≥ 30% superior ao 2º colocado
export const NGRAM_BOOST = 1.5; // Multiplicador para bigramas/trigramas consecutivos na mesma ordem
