import { describe, it, expect } from 'vitest';
import { normalize } from '../normalize';

describe('normalize', () => {
  it('minúsculas e remove acentos', () => {
    expect(normalize('João')).toBe('joao');
  });
  it('3:16 → 3 versiculo 16', () => {
    expect(normalize('3:16')).toBe('3 versiculo 16');
  });
  it('3,16 → 3 versiculo 16', () => {
    expect(normalize('3,16')).toBe('3 versiculo 16');
  });
  it('3.16 → 3 versiculo 16', () => {
    expect(normalize('3.16')).toBe('3 versiculo 16');
  });
  it('remove pontuação e colapsa espaços', () => {
    expect(normalize('abram em  João! 3:16')).toBe('abram em joao 3 versiculo 16');
  });
});