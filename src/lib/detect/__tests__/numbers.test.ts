import { describe, it, expect } from 'vitest';
import { numWords, toNumeric } from '../numbers';

describe('numWords', () => {
  it('cento e dezenove → 119', () => {
    expect(numWords('cento e dezenove')).toBe('119');
  });
  it('vinte e oito → 28', () => {
    expect(numWords('vinte e oito')).toBe('28');
  });
  it('tres → 3', () => {
    expect(numWords('tres')).toBe('3');
  });
  it('cento e cinco → 105', () => {
    expect(numWords('cento e cinco')).toBe('105');
  });
  it('dezesseis → 16', () => {
    expect(numWords('dezesseis')).toBe('16');
  });
  it('cento e setenta e seis → 176', () => {
    expect(numWords('cento e setenta e seis')).toBe('176');
  });
  it('preserva texto não-numérico', () => {
    expect(numWords('joao capitulo tres versiculo dezesseis')).toBe('joao capitulo 3 versiculo 16');
  });
  it('um/uma → 1', () => {
    expect(numWords('um')).toBe('1');
    expect(numWords('uma')).toBe('1');
  });
  it('dois/duas → 2', () => {
    expect(numWords('dois')).toBe('2');
    expect(numWords('duas')).toBe('2');
  });
});