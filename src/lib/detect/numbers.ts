/**
 * Converte números por extenso em dígitos dentro de uma string.
 *
 * Suporta: unidades, dezenas, teens, centenas, com conectores "e".
 * Ex: "cento e dezenove" → "119", "vinte e oito" → "28"
 * Preserva palavras não-numéricas no contexto correto.
 */

const UNIDADES: Record<string, number> = {
  zero: 0, um: 1, uma: 1,
  dois: 2, duas: 2,
  tres: 3,   // normalizado (sem acento)
  quatro: 4,
  cinco: 5,
  seis: 6,
  sete: 7,
  oito: 8,
  nove: 9,
};

const TEENS: Record<string, number> = {
  dez: 10, onze: 11, doze: 12, treze: 13, quatorze: 14, catorze: 14,
  quinze: 15, dezesseis: 16, dezessete: 17, dezoito: 18, dezenove: 19,
};

const DEZENAS: Record<string, number> = {
  vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50,
  sessenta: 60, setenta: 70, oitenta: 80, noventa: 90,
};

const CENTENAS: Record<string, number> = {
  cento: 100, cem: 100,
  duzentos: 200, duzentas: 200,
  trezentos: 300, trezentas: 300,
  quatrocentos: 400, quatrocentas: 400,
  quinhentos: 500, quinhentas: 500,
  seiscentos: 600, seiscentas: 600,
  setecentos: 700, setecentas: 700,
  oitocentos: 800, oitocentas: 800,
  novecentos: 900, novecentas: 900,
};

function wordToValue(w: string): number | null {
  if (CENTENAS[w] !== undefined) return CENTENAS[w]!;
  if (DEZENAS[w] !== undefined) return DEZENAS[w]!;
  if (TEENS[w] !== undefined) return TEENS[w]!;
  if (UNIDADES[w] !== undefined) return UNIDADES[w]!;
  return null;
}

/**
 * Tenta converter uma sequência de tokens começando em `start` para um número.
 * Retorna { value, end } onde end é o índice exclusivo do último token consumido,
 * ou null se nenhum número foi encontrado.
 *
 * Padrão: [centena] ["e" dezena/teen/unidade] ["e" unidade]
 */
function parseNumberAt(
  tokens: string[],
  start: number
): { value: number; end: number } | null {
  let i = start;
  let acc = 0;
  let found = false;

  // Centena?
  if (i < tokens.length) {
    const v = wordToValue(tokens[i]!);
    if (v !== null && v >= 100) {
      acc += v;
      i++;
      found = true;

      // "e" + (dezena | teen | unidade)?
      if (i < tokens.length && tokens[i] === 'e') {
        const next = tokens[i + 1];
        if (next !== undefined && wordToValue(next) !== null && wordToValue(next)! < 100) {
          i++; // pular "e"
          acc += wordToValue(tokens[i]!)!;
          i++;

          // mais "e" + unidade (ex: cento e setenta e seis)
          if (i < tokens.length && tokens[i] === 'e') {
            const next2 = tokens[i + 1];
            if (next2 !== undefined) {
              const v2 = wordToValue(next2);
              if (v2 !== null && v2 < 10) {
                i++;
                acc += wordToValue(tokens[i]!)!;
                i++;
              }
            }
          }
        }
      }
    }
  }

  // Dezena?
  if (!found && i < tokens.length) {
    const v = wordToValue(tokens[i]!);
    if (v !== null && v >= 20 && v < 100) {
      acc += v;
      i++;
      found = true;

      // "e" + unidade?
      if (i < tokens.length && tokens[i] === 'e') {
        const next = tokens[i + 1];
        if (next !== undefined) {
          const v2 = wordToValue(next);
          if (v2 !== null && v2 < 10) {
            i++;
            acc += wordToValue(tokens[i]!)!;
            i++;
          }
        }
      }
    }
  }

  // Teen ou unidade simples?
  if (!found && i < tokens.length) {
    const v = wordToValue(tokens[i]!);
    if (v !== null) {
      acc += v;
      i++;
      found = true;
    }
  }

  if (!found) return null;
  return { value: acc, end: i };
}

/**
 * Substitui sequências de números por extenso em `s` pelos seus dígitos,
 * preservando as palavras não-numéricas e os espaços entre elas.
 *
 * Ex: "joao capitulo tres versiculo dezesseis"
 *     → "joao capitulo 3 versiculo 16"
 */
export function numWords(s: string): string {
  const tokens = s.split(/\s+/);
  const out: string[] = [];
  let i = 0;

  while (i < tokens.length) {
    // Pular conectores soltos "e" que não fazem parte de número
    if (tokens[i] === 'e') {
      out.push('e');
      i++;
      continue;
    }

    const result = parseNumberAt(tokens, i);
    if (result !== null) {
      out.push(String(result.value));
      i = result.end;
    } else {
      out.push(tokens[i]!);
      i++;
    }
  }

  return out.join(' ');
}

/**
 * Alias: recebe uma string com apenas um número por extenso.
 * Usado pelos testes de unidade.
 */
export function toNumeric(s: string): string {
  return numWords(s.trim());
}
