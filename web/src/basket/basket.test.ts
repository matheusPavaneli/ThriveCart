import { describe, expect, it } from 'vitest';
import { basketReducer, linesOf } from './basket';

describe('basketReducer', () => {
  it('appends added codes in order', () => {
    expect(basketReducer(['R01'], { type: 'add', code: 'B01' })).toEqual(['R01', 'B01']);
  });

  it('removes one occurrence of that code only', () => {
    expect(basketReducer(['R01', 'B01', 'R01'], { type: 'remove', code: 'R01' })).toEqual(['R01', 'B01']);
  });

  it('leaves the basket alone when removing a code it does not hold', () => {
    const codes = ['R01'];
    expect(basketReducer(codes, { type: 'remove', code: 'G01' })).toBe(codes);
  });

  it('replaces the whole basket', () => {
    expect(basketReducer(['G01'], { type: 'replace', codes: ['B01', 'B01'] })).toEqual(['B01', 'B01']);
  });
});

describe('linesOf', () => {
  it('groups codes with counts in first-added order', () => {
    expect(linesOf(['B01', 'R01', 'B01', 'R01', 'R01'])).toEqual([
      { code: 'B01', count: 2 },
      { code: 'R01', count: 3 },
    ]);
  });

  it('has no lines for an empty basket', () => {
    expect(linesOf([])).toEqual([]);
  });
});
