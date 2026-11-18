import { toNumeric } from './numbers';

// Normalize: minúsculas, acentos removidos, formatar para parse
export function normalize(raw: string): string {
  // Converter para minúsculas
  let result = raw.toLowerCase();

  // Remover acentos (NFD + strip combining marks)
  result = result.normalize('NFD').replace(/[̀-ͯ]/g, '');

  // PRIMEIRO: Normalizar separadores capítulo:versículo para "N versiculo M"
  // Suporta "3:16", "3,16" e "3.16" — ANTES de remover pontuação
  result = result.replace(/\b(\d+)[:.;,](\d+)\b/g, '$1 versiculo $2');

  // DEPOIS: Remover pontuação restante (exceto hífens entre números)
  // Mantém apenas letras, dígitos, espaços e hífen
  result = result.replace(/[^a-z0-9\s-]/g, ' ');

  // Colapsar múltiplos espaços e remover espaços no início/fim
  result = result.replace(/\s+/g, ' ').trim();

  return result;
}

export { toNumeric };
