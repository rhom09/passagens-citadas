/**
 * Radicais simples para português (stemmer leve) e casamento tolerante a 1 erro
 */

/**
 * Remove sufixos comuns de plural e conjugações verbais frequentes em português.
 * Regras determinísticas sem dependências externas.
 */
export function stemWord(word: string): string {
  if (word.length < 5) return word;

  let s = word;

  // 1. Plurais comuns
  if (s.endsWith('oes')) return s.slice(0, -3) + 'ao';
  if (s.endsWith('res') || s.endsWith('zes')) return s.slice(0, -2);
  if (s.endsWith('ais') || s.endsWith('eis') || s.endsWith('ois')) return s.slice(0, -2) + 'l';
  if (s.endsWith('ns')) return s.slice(0, -2) + 'm';
  if (s.endsWith('s') && !s.endsWith('ss') && !s.endsWith('as') && !s.endsWith('es') && !s.endsWith('is') && !s.endsWith('os') && !s.endsWith('us')) {
    s = s.slice(0, -1);
  }

  // 2. Desinências verbais frequentes
  const verbSuffixes = [
    'assem', 'essem', 'issem',
    'aremos', 'eremos', 'iremos',
    'avamos', 'iamos',
    'ariam', 'eriam', 'iriam',
    'ando', 'endo', 'indo',
    'aram', 'eram', 'iram',
    'avam', 'avao',
    'aras', 'eras', 'iras',
    'asse', 'esse', 'isse',
    'aria', 'eria', 'iria',
    'arao', 'erao', 'irao',
    'amos', 'emos', 'imos',
    'aste', 'este', 'iste',
    'ava', 'ara', 'era', 'ira',
    'ara', 'era', 'ira',
    'ou', 'eu', 'iu', 'ei'
  ];

  for (const suf of verbSuffixes) {
    if (s.endsWith(suf) && s.length - suf.length >= 3) {
      return s.slice(0, -suf.length);
    }
  }

  // Plural regular residual
  if (s.endsWith('s') && s.length > 4) {
    return s.slice(0, -1);
  }

  return s;
}

/**
 * Verifica se duas palavras casam com tolerância de até 1 erro (distância de Levenshtein <= 1)
 * Aplicável apenas se ambas tiverem pelo menos 6 letras e a diferença de tamanho for no máximo 1.
 */
export function isFuzzyMatch(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length < 6 || b.length < 6) return false;
  if (Math.abs(a.length - b.length) > 1) return false;

  let errors = 0;
  let i = 0;
  let j = 0;

  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
    } else {
      errors++;
      if (errors > 1) return false;

      if (a.length > b.length) {
        i++;
      } else if (b.length > a.length) {
        j++;
      } else {
        i++;
        j++;
      }
    }
  }

  if (i < a.length || j < b.length) {
    errors++;
  }

  return errors <= 1;
}
