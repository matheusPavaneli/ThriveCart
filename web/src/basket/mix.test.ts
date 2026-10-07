import { describe, expect, it } from 'vitest';
import { intensitiesOf, MAX_INTENSITY, mixOf } from './mix';

describe('intensitiesOf', () => {
  it('turns every light off for an empty basket', () => {
    expect(intensitiesOf([])).toEqual({ red: 0, green: 0, blue: 0 });
  });

  it('lights only red for a basket of reds', () => {
    expect(intensitiesOf(['R01', 'R01', 'R01'])).toEqual({ red: MAX_INTENSITY, green: 0, blue: 0 });
  });

  it('lights all three equally for one of each', () => {
    const { red, green, blue } = intensitiesOf(['R01', 'G01', 'B01']);
    expect(red).toBe(green);
    expect(green).toBe(blue);
  });

  it('keeps every light between 0 and the maximum', () => {
    for (const codes of [['R01'], ['B01', 'B01', 'B01', 'B01', 'G01'], ['R01', 'X99'], Array(50).fill('G01')]) {
      for (const value of Object.values(intensitiesOf(codes))) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(MAX_INTENSITY);
      }
    }
  });

  it('ignores products the UI has no colour for', () => {
    expect(intensitiesOf(['X99'])).toEqual({ red: 0, green: 0, blue: 0 });
  });
});

describe('mixOf', () => {
  it('mixes one of each toward white, and reds toward red', () => {
    expect(mixOf(intensitiesOf(['R01', 'G01', 'B01']))).toBe('rgb(255 255 255)');
    expect(mixOf(intensitiesOf(['R01', 'R01', 'R01']))).toBe('rgb(217 78 90)');
  });
});
