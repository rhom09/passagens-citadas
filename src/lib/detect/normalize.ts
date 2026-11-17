import { toNumeric } from './numbers';

// Normalize: minúsculas, acentos removidos, formatar para parse
export function normalize(raw: string): string {
  // Converter para minúsculas
  let result = raw.toLowerCase();

  // Remover acentos (NFD + strip combining marks)
  result = result.normalize('NFD').replace(/[̀-ͯ]/g, '');

  // PRIMEIRO: Normalizar "3:16" para "3 versiculo 16" ANTES de remover pontuação
  // Isso preserva os dois pontos para o padrão de formato "capitulo:versiculo"
  result = result.replace(/\b(\d+):(\d+)\b/g, '$1 versiculo $2');

  // DEPOIS: Substituir pontuação e separadores por espaços
  // Agora os dois pontos já foram convertidos, então removemos vírgulas e pontos finais
  result = result.replace(/[.,]/g, ' ');

  // Colapsar múltiplos espaços e remover espaços no início/fim
  result = result.replace(/\s+/g, ' ').trim();

  return result;
}

export { toNumeric };