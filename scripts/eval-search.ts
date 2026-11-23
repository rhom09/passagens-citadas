import fs from 'fs';
import path from 'path';
import { searchSpokenPassage } from '../src/lib/search/bm25';
import type { SearchIndexData } from '../src/lib/search/types';

// Carregar índice de busca
const searchIndexPath = path.resolve(process.cwd(), 'public', 'data', 'search-index.v1.json');
if (!fs.existsSync(searchIndexPath)) {
  console.error('Índice de busca não encontrado! Execute primeiro: pnpm bible:build');
  process.exit(1);
}

const indexData = JSON.parse(fs.readFileSync(searchIndexPath, 'utf-8')) as SearchIndexData;
console.log(`Índice carregado: ${indexData.docCount} versículos.`);

// 30 Frases comuns de pregação que NÃO são versículos bíblicos literais
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
];

// 30 versículos selecionados da ARC (versículos bem distribuídos e conhecidos ou aleatórios)
const TEST_INDICES = [
  // Gênesis 1:1
  0,
  // João 3:16
  26136, // aprox
  // Salmo 23:1
  14234, // aprox
  // Romanos 8:28
  28117, // aprox
];

// Completar até 30 índices com amostragem determinística espalhada
const step = Math.floor(indexData.docCount / 30);
const selectedIndices: number[] = [];
for (let i = 0; i < 30; i++) {
  selectedIndices.push((i * step + 42) % indexData.docCount);
}

console.log(`\n=================================================`);
console.log(`        AVALIAÇÃO DE QUALIDADE (RF-08)           `);
console.log(`=================================================\n`);

// ── Teste 1: Versículos da ARC (Amostra de 30) ──────────────────────────────
console.log('1. Testando 30 trechos retirados da Bíblia (primeiras ~10 palavras)...');

let top1Correct = 0;
let top3Correct = 0;

selectedIndices.forEach((idx, i) => {
  const doc = indexData.verses[idx]!;
  const words = doc.text.split(/\s+/);
  // Usa as primeiras 8 a 10 palavras do versículo como "fala" do pregador
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

  if (isTop1) top1Correct++;
  if (isTop3) top3Correct++;

  const status = isTop1 ? '✓ TOP 1' : isTop3 ? '✓ TOP 3' : '✗ MISS';
  console.log(
    `[${(i + 1).toString().padStart(2)}] ${status.padEnd(7)} | Alvo: Livro ${doc.bookId} ${doc.chapter}:${doc.verse} | Sugestão: ${
      suggestions[0]
        ? `${suggestions[0].passage.bookName} ${suggestions[0].passage.chapter}:${suggestions[0].passage.verseStart} (score ${suggestions[0].score})`
        : 'Nenhuma'
    }`
  );
});

const top1Rate = ((top1Correct / selectedIndices.length) * 100).toFixed(1);
const top3Rate = ((top3Correct / selectedIndices.length) * 100).toFixed(1);

console.log(`\nTaxa Top 1: ${top1Correct}/${selectedIndices.length} (${top1Rate}%)`);
console.log(`Taxa Top 3: ${top3Correct}/${selectedIndices.length} (${top3Rate}%) [Meta: ≥ 90%]\n`);

// ── Teste 2: Frases Comuns de Pregação (30 frases) ──────────────────────────
console.log('2. Testando 30 frases comuns de pregação (não são versículos)...');
let falsePositives = 0;

COMMON_PREACHING_PHRASES.forEach((phrase, i) => {
  const suggestions = searchSpokenPassage(phrase, indexData);
  if (suggestions.length > 0) {
    falsePositives++;
    console.log(
      `[${(i + 1).toString().padStart(2)}] ✗ FALSO POSITIVO! Frase: "${phrase}" → Sugeriu: ${
        suggestions[0]!.passage.bookName
      } ${suggestions[0]!.passage.chapter}:${suggestions[0]!.passage.verseStart} (score ${suggestions[0]!.score})`
    );
  } else {
    console.log(`[${(i + 1).toString().padStart(2)}] ✓ ZERO SUGESTÕES (OK) | "${phrase.slice(0, 35)}..."`);
  }
});

console.log(`\nFalsos positivos: ${falsePositives}/30 [Meta: 0]\n`);

// ── Resumo Final ────────────────────────────────────────────────────────────
console.log('================ RESUMO DA AVALIAÇÃO ================');
console.log(`Top 1: ${top1Rate}%`);
console.log(`Top 3: ${top3Rate}% (Meta: >= 90%) -> ${Number(top3Rate) >= 90 ? 'PASSOU' : 'NÃO ATINGIU'}`);
console.log(`Falsos Positivos: ${falsePositives} (Meta: 0) -> ${falsePositives === 0 ? 'PASSOU' : 'FALHOU'}`);
console.log('=====================================================');

if (Number(top3Rate) < 90 || falsePositives > 0) {
  process.exit(1);
}
