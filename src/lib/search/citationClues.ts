/**
 * Expressões introdutórias de citação no púlpito
 */
import { normalize } from '../detect/normalize';

export const CITATION_CLUES = [
  'esta escrito',
  'estao escritos',
  'diz assim',
  'diz a palavra',
  'a palavra diz',
  'a biblia diz',
  'diz a biblia',
  'me ajuda achar',
  'procura pra mim',
  'lembra daquela passagem',
  'como diz',
  'como diz a palavra',
  'conforme diz',
  'o texto diz',
  'diz o texto',
  'diz o senhor',
  'assim diz o senhor',
  'assim diz a palavra',
];

export interface ClueExtractionResult {
  hasClue: boolean;
  cleanedText: string;
  foundClue?: string;
  clueEndIndex?: number;
}

/**
 * Detecta e remove pistas de citação bíblica da fala do pregador
 */
export function extractCitationClue(text: string): ClueExtractionResult {
  const norm = normalize(text);

  for (const clue of CITATION_CLUES) {
    const idx = norm.indexOf(clue);
    if (idx !== -1) {
      // Remove a pista e fica com o que vier em seguida (ou ao redor)
      const before = norm.slice(0, idx).trim();
      const after = norm.slice(idx + clue.length).trim();
      const cleaned = after.length > 0 ? after : before;

      return {
        hasClue: true,
        cleanedText: cleaned,
        foundClue: clue,
        clueEndIndex: idx + clue.length,
      };
    }
  }

  return {
    hasClue: false,
    cleanedText: norm,
  };
}
