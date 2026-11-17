// Mapeamento de números por extenso → dígitos
const unidades: Record<string, string> = {
  'zero': '0', 'um': '1', 'uma': '1',
  'dois': '2', 'duas': '2',
  'três': '3', 'tres': '3',
  'quatro': '4',
  'cinco': '5',
  'seis': '6',
  'sete': '7',
  'oito': '8',
  'nove': '9',
};

const teens: Record<string, string> = {
  'dez': '10', 'onze': '11', 'doze': '12', 'treze': '13', 'quatorze': '14',
  'quinze': '15', 'dezesseis': '16', 'dezessete': '17', 'dezoito': '18', 'dezenove': '19',
};

const dezenas: Record<string, string> = {
  'vinte': '20', 'trinta': '30', 'quarenta': '40', 'cinquenta': '50',
  'sessenta': '60', 'setenta': '70', 'oitenta': '80', 'noventa': '90',
};

const centenas: Record<string, string> = {
  'cento': '100', 'c cem': '100', 'duzentos': '200', 'trezentos': '300',
  'quatrocentos': '400', 'quinhentos': '500', 'seicentos': '600', 'setecentos': '700',
  'oitocentos': '800', 'novecentos': '900',
};

export function toNumeric(s: string): string {
  const words = s.trim().split(/\s+/);
  const numericParts: string[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    // Verificar centenas (ex: "cento", "duzentos")
    if (centenas[word]) {
      numericParts.push(centenas[word]);
      continue;
    }

    // Verificar dezenas (ex: "vinte", "trinta")
    if (dezenas[word]) {
      numericParts.push(dezenas[word]);
      continue;
    }

    // Verificar teens (ex: "dezesseis", "dezesseis")
    if (teens[word]) {
      numericParts.push(teens[word]);
      continue;
    }

    // Verificar unidades (ex: "um", "dois", "tres")
    if (unidades[word]) {
      numericParts.push(unidades[word]);
      continue;
    }

    // Se a palavra não for numérica, preserva como está
    numericParts.push(word);
  }

  // Juntar todos os números encontrados
  let result = numericParts.join('');

  // Se não encontrou números, retorna original
  if (result === '') return s;

  return result;
}

export function numWords(s: string): string {
  return toNumeric(s);
}