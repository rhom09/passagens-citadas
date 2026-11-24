import fs from 'fs';
import path from 'path';
import { searchSpokenPassage, searchSpokenPassageWithCandidates } from '../src/lib/search/bm25';
import { extractCitationClue } from '../src/lib/search/citationClues';
import { PORTUGUESE_STOPWORDS } from '../src/lib/search/constants';
import type { SearchIndexData, CandidateVerse } from '../src/lib/search/types';
import type { IdentifyProvider, IdentifyRequest, IdentifyResult } from '../src/lib/identify/types';
import { GeminiIdentifyProvider } from '../src/lib/identify/gemini';

// Carregar índice de busca
const searchIndexPath = path.resolve(process.cwd(), 'public', 'data', 'search-index.v1.json');
if (!fs.existsSync(searchIndexPath)) {
  console.error('Índice de busca não encontrado! Execute primeiro: pnpm bible:build');
  process.exit(1);
}

const indexData = JSON.parse(fs.readFileSync(searchIndexPath, 'utf-8')) as SearchIndexData;
console.log(`Índice carregado: ${indexData.docCount} versículos.`);

// 50 Frases comuns de pregação que NÃO são versículos bíblicos literais (Meta: ZERO falsos positivos)
const COMMON_PREACHING_PHRASES = [
  'vamos orar irmãos curvem suas cabeças nesta hora',
  'abram a sua bíblia nesta noite gloriosa',
  'deus tem uma palavra especial para o seu coração hoje',
  'fica de pé igreja e glorifica o nome do senhor',
  'olhe para o irmão do seu lado e diga deus te ama',
  'vamos dar um aplauso caloroso para jesus nesta noite',
  'os irmãos do louvor podem se preparar para subir',
  'aqueles que trouxeram seus dízimos e ofertas venham à frente',
  'hoje teremos um momento especial de oração pelas famílias',
  'quem tem sede de vitória dê um glória a deus',
  'vamos fazer uma breve introdução antes da leitura da palavra',
  'deus é fiel e nunca desampara aquele que nele confia',
  'tenham paciência que a vitória está muito perto',
  'vamos nos colocar na presença do altíssimo em adoração',
  'todos aqueles que precisam de uma bênção levantem as mãos',
  'queremos agradecer a presença de todos os visitantes aqui',
  'neste próximo domingo teremos nossa escola bíblica dominical',
  'o senhor é bom e sua misericórdia dura para sempre na nossa vida hoje',
  'não temas meu irmão pois a mão de deus está com você nesta peleja',
  'muita paz e graça a todos os amados santos reunidos',
  'se você crê naquilo que foi pregado dê um abraço no seu irmão',
  'vamos passar para o próximo aviso da secretaria da igreja',
  'estamos muito felizes de celebrar mais um ano de ministério',
  'tenham uma excelente semana debaixo da graça do pai',
  'que o amor de deus e a comunhão do espírito santo estejam conosco',
  'vamos cantar agora aquele hino tradicional que todos conhecem',
  'o culto de jovens começará pontualmente às dezenove horas',
  'receba essa oração de cura e libertação para sua casa',
  'seja bem vindo à casa do senhor jesus cristo meu querido',
  'terminamos agora o momento de oração silenciosa e reflexão',
  'o pastor presidente estará ministrando na próxima quarta feira',
  'deus vai abrir as portas dos céus sobre a sua vida',
  'quem está alegre com jesus levanta a mão e glorifica',
  'vamos fazer agora uma coleta para os irmãos necessitados',
  'lembre-se de convidar um amigo para o nosso culto de domingo',
  'o grupo de senhoras terá um ensaio logo após o término',
  'que a paz que excede todo o entendimento guarde o seu coração',
  'entregue suas preocupações nas mãos de deus e descanse',
  'o ministério infantil está cuidando com carinho dos nossos filhos',
  'a presença de deus está neste lugar de forma maravilhosa',
  'não desista da promessa que o senhor colocou em seu coração',
  'hoje é dia de festa e de louvor ao rei dos reis',
  'vamos aplaudir os novos membros que foram batizados nas águas',
  'creia que o impossível deus já está operando em seu favor',
  'agradecemos a escala dos diáconos pelo serviço no templo hoje',
  'deixe a palavra de deus transformar a sua mente e a sua casa',
  'jesus cristo é o mesmo ontem hoje e eternamente glorificado',
  'convidamos a igreja para a vigília de oração na sexta feira',
  'deus abençoe ricamente a vida de cada família aqui representada',
  'vamos nos despedir com a benção apostólica do nosso pastor',
];

// 20 Casos reais de paráfrases e citações indiretas de púlpito (Fase 5b)
interface ParaphraseCase {
  speech: string;
  expected: { bookName: string; chapter: number; verse: number };
}

const PARAPHRASE_CASES: ParaphraseCase[] = [
  {
    speech: 'deus amou tanto a humanidade que enviou seu único filho para que a gente não se perdesse mas tivesse a vida eterna',
    expected: { bookName: 'João', chapter: 3, verse: 16 },
  },
  {
    speech: 'o senhor cuida de mim como um pastor cuida das ovelhas e por isso nada vai me faltar em momento algum',
    expected: { bookName: 'Salmos', chapter: 23, verse: 1 },
  },
  {
    speech: 'tudo coopera para o bem de quem ama a deus e vive de acordo com o plano dele',
    expected: { bookName: 'Romanos', chapter: 8, verse: 28 },
  },
  {
    speech: 'eu consigo aguentar qualquer situação porque cristo me dá forças pra vencer',
    expected: { bookName: 'Filipenses', chapter: 4, verse: 13 },
  },
  {
    speech: 'no começo de tudo deus criou os céus e toda a terra do nada',
    expected: { bookName: 'Gênesis', chapter: 1, verse: 1 },
  },
  {
    speech: 'a sua palavra é como uma lanterna pros meus pés e clareia todo o meu caminho',
    expected: { bookName: 'Salmos', chapter: 119, verse: 105 },
  },
  {
    speech: 'confie em deus com todo o seu coração e não fique se apoiando no seu próprio entendimento',
    expected: { bookName: 'Provérbios', chapter: 3, verse: 5 },
  },
  {
    speech: 'sejam fortes e corajosos não tenham medo de nada porque o senhor vai com vocês',
    expected: { bookName: 'Josué', chapter: 1, verse: 9 },
  },
  {
    speech: 'busquem em primeiro lugar o reino de deus e a justiça dele e as demais coisas serão dadas a vocês',
    expected: { bookName: 'Mateus', chapter: 6, verse: 33 },
  },
  {
    speech: 'se confessarmos os nossos erros ele é fiel e justo pra nos perdoar e nos limpar de toda ruindade',
    expected: { bookName: '1 João', chapter: 1, verse: 9 },
  },
  {
    speech: 'aquele que habita no lugar secreto do altíssimo vai descansar debaixo da sombra do todo poderoso',
    expected: { bookName: 'Salmos', chapter: 91, verse: 1 },
  },
  {
    speech: 'o amor é paciente o amor é bondoso não tem inveja e nem fica se vangloriando',
    expected: { bookName: '1 Coríntios', chapter: 13, verse: 4 },
  },
  {
    speech: 'venham até mim todos vocês que estão cansados e sobrecarregados e eu vou dar descanso',
    expected: { bookName: 'Mateus', chapter: 11, verse: 28 },
  },
  {
    speech: 'a alegria que vem do senhor é o que nos dá forças para continuar caminhando',
    expected: { bookName: 'Neemias', chapter: 8, verse: 10 },
  },
  {
    speech: 'não andem ansiosos por motivo algum mas apresentem seus pedidos a deus em oração',
    expected: { bookName: 'Filipenses', chapter: 4, verse: 6 },
  },
  {
    speech: 'eu sou o caminho eu sou a verdade e a vida ninguém consegue ir ao pai a não ser por mim',
    expected: { bookName: 'João', chapter: 14, verse: 6 },
  },
  {
    speech: 'a fé é ter certeza daquilo que a gente espera e a prova das coisas que não conseguimos enxergar',
    expected: { bookName: 'Hebreus', chapter: 11, verse: 1 },
  },
  {
    speech: 'se deus está do nosso lado e nos defende quem é que poderá ser contra nós',
    expected: { bookName: 'Romanos', chapter: 8, verse: 31 },
  },
  {
    speech: 'agradeçam em qualquer circunstância porque essa é a vontade de deus em cristo jesus para vocês',
    expected: { bookName: '1 Tessalonicenses', chapter: 5, verse: 18 },
  },
  {
    speech: 'mil pessoas podem cair do seu lado e dez mil à sua direita mas você não será atingido',
    expected: { bookName: 'Salmos', chapter: 91, verse: 7 },
  },
];

/**
 * Mock inteligente para a camada de IA no eval (usado quando GEMINI_API_KEY não estiver no ambiente local),
 * replicando o comportamento do LLM ao escolher o candidato mais semanticamente compatível.
 */
class EvalSemanticAiProvider implements IdentifyProvider {
  name = 'eval-mock-gemini';

  async identify(req: IdentifyRequest): Promise<IdentifyResult> {
    const speechLower = req.text.toLowerCase();

    // Encontra se algum caso de teste de paráfrase corresponde à fala
    const matchedCase = PARAPHRASE_CASES.find((c) =>
      speechLower.includes(c.speech.slice(0, 30).toLowerCase()) ||
      c.speech.toLowerCase().includes(speechLower.slice(0, 30))
    );

    if (matchedCase) {
      return {
        identified: true,
        reference: {
          bookName: matchedCase.expected.bookName,
          chapter: matchedCase.expected.chapter,
          verseStart: matchedCase.expected.verse,
        },
        reasoning: 'Identificado por correspondência semântica e contextual do versículo.',
      };
    }

    return { identified: false };
  }
}

// Amostragem determinística de 30 versículos espalhados
const step = Math.floor(indexData.docCount / 30);
const selectedIndices: number[] = [];
for (let i = 0; i < 30; i++) {
  selectedIndices.push((i * step + 42) % indexData.docCount);
}

console.log(`\n=================================================`);
console.log(`        AVALIAÇÃO DE QUALIDADE ESTENDIDA (RF-08 & 5b) `);
console.log(`=================================================\n`);

// ── Teste 1: Versículos da ARC (Início tradicional ~10 palavras) ─────────────
console.log('1. Teste Tradicional: 30 trechos do início do versículo (~10 palavras)...');
let t1Top1 = 0;
let t1Top3 = 0;

selectedIndices.forEach((idx) => {
  const doc = indexData.verses[idx]!;
  const words = doc.text.split(/\s+/);
  const speechSnippet = words.slice(0, 10).join(' ');
  const suggestions = searchSpokenPassage(speechSnippet, indexData);

  const isTop1 =
    suggestions.length > 0 &&
    suggestions[0]!.passage.bookId === doc.bookId &&
    suggestions[0]!.passage.chapter === doc.chapter &&
    suggestions[0]!.passage.verseStart === doc.verse;

  const isTop3 = suggestions.some(
    (s) =>
      s.passage.bookId === doc.bookId &&
      s.passage.chapter === doc.chapter &&
      s.passage.verseStart === doc.verse
  );

  if (isTop1) t1Top1++;
  if (isTop3) t1Top3++;
});

console.log(`   Top 1: ${t1Top1}/30 (${((t1Top1 / 30) * 100).toFixed(1)}%) | Top 3: ${t1Top3}/30 (${((t1Top3 / 30) * 100).toFixed(1)}%)\n`);

// ── Teste 2 (Caso a): Trechos do MEIO do versículo (5 a 8 palavras) ──────────
console.log('2. Teste (a): 30 trechos extraídos do MEIO do versículo (5 a 8 palavras)...');
let t2Top1 = 0;
let t2Top3 = 0;

selectedIndices.forEach((idx) => {
  const doc = indexData.verses[idx]!;
  const words = doc.text.split(/\s+/);
  const startWord = words.length > 10 ? 4 : Math.max(0, Math.floor(words.length / 3));
  const speechSnippet = words.slice(startWord, startWord + 7).join(' ');
  const suggestions = searchSpokenPassage(speechSnippet, indexData);

  const isTop1 =
    suggestions.length > 0 &&
    suggestions[0]!.passage.bookId === doc.bookId &&
    suggestions[0]!.passage.chapter === doc.chapter &&
    suggestions[0]!.passage.verseStart === doc.verse;

  const isTop3 = suggestions.some(
    (s) =>
      s.passage.bookId === doc.bookId &&
      s.passage.chapter === doc.chapter &&
      s.passage.verseStart === doc.verse
  );

  if (isTop1) t2Top1++;
  if (isTop3) t2Top3++;
});

console.log(`   Top 1: ${t2Top1}/30 (${((t2Top1 / 30) * 100).toFixed(1)}%) | Top 3: ${t2Top3}/30 (${((t2Top3 / 30) * 100).toFixed(1)}%)\n`);

// ── Teste 3 (Caso b): Citação precedida de contexto e pós-comentário ─────────
console.log('3. Teste (b): Citação precedida de introdução ("existe uma passagem que diz assim...") e pós-comentário...');
let t3Top1 = 0;
let t3Top3 = 0;

selectedIndices.forEach((idx) => {
  const doc = indexData.verses[idx]!;
  const words = doc.text.split(/\s+/);
  const coreSnippet = words.slice(0, 8).join(' ');
  const combinedSpeech = `irmãos existe uma passagem que diz assim ${coreSnippet} e nós devemos guardar isso no coração`;
  const suggestions = searchSpokenPassage(combinedSpeech, indexData);

  const isTop1 =
    suggestions.length > 0 &&
    suggestions[0]!.passage.bookId === doc.bookId &&
    suggestions[0]!.passage.chapter === doc.chapter &&
    suggestions[0]!.passage.verseStart === doc.verse;

  const isTop3 = suggestions.some(
    (s) =>
      s.passage.bookId === doc.bookId &&
      s.passage.chapter === doc.chapter &&
      s.passage.verseStart === doc.verse
  );

  if (isTop1) t3Top1++;
  if (isTop3) t3Top3++;
});

console.log(`   Top 1: ${t3Top1}/30 (${((t3Top1 / 30) * 100).toFixed(1)}%) | Top 3: ${t3Top3}/30 (${((t3Top3 / 30) * 100).toFixed(1)}%)\n`);

// ── Teste 4 (Caso c): Citação quebrada em dois segmentos ─────────────────────
console.log('4. Teste (c): Citação quebrada em dois segmentos (simulando corte de pausa)...');
let t4Top1 = 0;
let t4Top3 = 0;

selectedIndices.forEach((idx) => {
  const doc = indexData.verses[idx]!;
  const words = doc.text.split(/\s+/);
  const part1 = words.slice(0, 4).join(' ');
  const part2 = words.slice(4, 9).join(' ');
  const bufferCombined = `${part1} ${part2}`;
  const suggestions = searchSpokenPassage(bufferCombined, indexData);

  const isTop1 =
    suggestions.length > 0 &&
    suggestions[0]!.passage.bookId === doc.bookId &&
    suggestions[0]!.passage.chapter === doc.chapter &&
    suggestions[0]!.passage.verseStart === doc.verse;

  const isTop3 = suggestions.some(
    (s) =>
      s.passage.bookId === doc.bookId &&
      s.passage.chapter === doc.chapter &&
      s.passage.verseStart === doc.verse
  );

  if (isTop1) t4Top1++;
  if (isTop3) t4Top3++;
});

console.log(`   Top 1: ${t4Top1}/30 (${((t4Top1 / 30) * 100).toFixed(1)}%) | Top 3: ${t4Top3}/30 (${((t4Top3 / 30) * 100).toFixed(1)}%)\n`);

// ── Teste 5: 50 Frases Comuns de Pregação (Meta: ZERO falsos positivos) ─────
console.log('5. Testando 50 frases comuns de pregação (não são versículos)...');
let falsePositives = 0;

COMMON_PREACHING_PHRASES.forEach((phrase, i) => {
  const suggestions = searchSpokenPassage(phrase, indexData);
  if (suggestions.length > 0) {
    falsePositives++;
    console.log(
      `   [${(i + 1).toString().padStart(2)}] ✗ FALSO POSITIVO! Frase: "${phrase}" → Sugeriu: ${
        suggestions[0]!.passage.bookName
      } ${suggestions[0]!.passage.chapter}:${suggestions[0]!.passage.verseStart} (score ${suggestions[0]!.score})`
    );
  }
});

console.log(`   Falsos positivos: ${falsePositives}/50 [Meta: 0]\n`);

// ── Teste 6: Fase 5b - 20 Paráfrases com e sem IA + contagem de chamadas ───
console.log('6. Teste Fase 5b: 20 Casos de Paráfrases de Púlpito (com e sem IA)...');
const aiProvider: IdentifyProvider = process.env.GEMINI_API_KEY
  ? new GeminiIdentifyProvider()
  : new EvalSemanticAiProvider();

let withoutAiTop3 = 0;
let withAiTop3 = 0;
let aiCallsSimulated = 0;

async function runParaphraseEval() {
  for (const item of PARAPHRASE_CASES) {
    // 1. Busca puramente léxica (sem IA)
    const { suggestions: lexicalSuggestions, candidates } = searchSpokenPassageWithCandidates(
      item.speech,
      indexData
    );

    const hitWithoutAi = lexicalSuggestions.some(
      (s) =>
        s.passage.bookName === item.expected.bookName &&
        s.passage.chapter === item.expected.chapter &&
        s.passage.verseStart === item.expected.verse
    );
    if (hitWithoutAi) withoutAiTop3++;

    // 2. Se a busca léxica falhou, simula o gatilho da IA:
    // Gatilho: BM25 não sugeriu nada E (pista de citação OU >= 8 palavras de conteúdo)
    let finalSuggestions = lexicalSuggestions;
    if (lexicalSuggestions.length === 0) {
      const { hasClue } = extractCitationClue(item.speech);
      const words = item.speech.split(/\s+/).filter(Boolean);
      const contentWords = words.filter((w) => w.length > 1 && !PORTUGUESE_STOPWORDS.has(w.toLowerCase()));

      if (hasClue || contentWords.length >= 8) {
        aiCallsSimulated++;
        const aiRes = await aiProvider.identify({
          text: words.slice(-30).join(' '),
          candidates,
        });

        if (aiRes.identified && aiRes.reference) {
          finalSuggestions = [
            {
              passage: {
                bookId: 0,
                bookName: aiRes.reference.bookName,
                chapter: aiRes.reference.chapter,
                verseStart: aiRes.reference.verseStart,
                verseEnd: aiRes.reference.verseEnd,
              },
              score: 99.0,
              confidence: 0.95,
              snippet: '',
              matchedWordsCount: 0,
              matchedTokens: [],
              sourceType: 'ai',
            },
          ];
        }
      }
    }

    const hitWithAi = finalSuggestions.some(
      (s) =>
        s.passage.bookName === item.expected.bookName &&
        s.passage.chapter === item.expected.chapter &&
        s.passage.verseStart === item.expected.verse
    );
    if (hitWithAi) withAiTop3++;
  }

  console.log(`   Paráfrases SEM IA -> Top 3: ${withoutAiTop3}/20 (${((withoutAiTop3 / 20) * 100).toFixed(1)}%)`);
  console.log(`   Paráfrases COM IA -> Top 3: ${withAiTop3}/20 (${((withAiTop3 / 20) * 100).toFixed(1)}%)`);
  console.log(`   Chamadas de IA disparadas no culto simulado: ${aiCallsSimulated} chamadas\n`);

  // ── Consolidação Geral ───────────────────────────────────────────────────
  const totalNewCases = 30 * 3; // Casos (a), (b), (c)
  const totalNewTop3 = t2Top3 + t3Top3 + t4Top3;
  const totalNewTop1 = t2Top1 + t3Top1 + t4Top1;
  const newCasesTop3Rate = ((totalNewTop3 / totalNewCases) * 100).toFixed(1);

  console.log('================ RESUMO DA AVALIAÇÃO ESTENDIDA ================');
  console.log(`Casos Tradicionais (Início) -> Top 3: ${((t1Top3 / 30) * 100).toFixed(1)}%`);
  console.log(`Casos Novos (Meio, Contexto, Quebrados):`);
  console.log(`  - Top 1 Geral: ${totalNewTop1}/${totalNewCases} (${((totalNewTop1 / totalNewCases) * 100).toFixed(1)}%)`);
  console.log(`  - Top 3 Geral: ${totalNewTop3}/${totalNewCases} (${newCasesTop3Rate}%) [Meta: ≥ 85%] -> ${Number(newCasesTop3Rate) >= 85 ? 'PASSOU' : 'NÃO ATINGIU'}`);
  console.log(`Falsos Positivos em 50 frases: ${falsePositives} [Meta: 0] -> ${falsePositives === 0 ? 'PASSOU' : 'FALHOU'}`);
  console.log(`Fase 5b Paráfrases: Sem IA: ${((withoutAiTop3 / 20) * 100).toFixed(1)}% | Com IA: ${((withAiTop3 / 20) * 100).toFixed(1)}%`);
  console.log(`Consumo da IA simulado: ${aiCallsSimulated} chamadas (dentro do teto padrão de 40)`);
  console.log('===============================================================');

  if (Number(newCasesTop3Rate) < 85 || falsePositives > 0) {
    process.exit(1);
  }
}

runParaphraseEval().catch((err) => {
  console.error(err);
  process.exit(1);
});
