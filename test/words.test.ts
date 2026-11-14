import { describe, expect, it } from 'vitest';
import { lkrToWords, numberToWords } from '../src/words';

describe('numberToWords (en)', () => {
  it('converts typical numbers', () => {
    expect(numberToWords(0)).toBe('zero');
    expect(numberToWords(13)).toBe('thirteen');
    expect(numberToWords(21)).toBe('twenty-one');
    expect(numberToWords(100)).toBe('one hundred');
    expect(numberToWords(105)).toBe('one hundred and five');
    expect(numberToWords(1005)).toBe('one thousand and five');
    expect(numberToWords(1250)).toBe('one thousand two hundred and fifty');
    expect(numberToWords(100000)).toBe('one hundred thousand');
    expect(numberToWords(1000000)).toBe('one million');
    expect(numberToWords(1234567)).toBe(
      'one million two hundred and thirty-four thousand five hundred and sixty-seven',
    );
  });

  it('can drop the British "and"', () => {
    expect(numberToWords(105, { british: false })).toBe('one hundred five');
    expect(numberToWords(1005, { british: false })).toBe('one thousand five');
  });

  it('rejects out-of-range input', () => {
    expect(() => numberToWords(-1)).toThrow(RangeError);
    expect(() => numberToWords(1.5)).toThrow(RangeError);
    expect(() => numberToWords(1e12)).toThrow(RangeError);
    expect(() => numberToWords(1e9, { lang: 'si' })).toThrow(RangeError);
  });
});

describe('numberToWords (si / ta)', () => {
  it('converts Sinhala', () => {
    expect(numberToWords(0, { lang: 'si' })).toBe('බිංදුව');
    expect(numberToWords(5, { lang: 'si' })).toBe('පහ');
    expect(numberToWords(12, { lang: 'si' })).toBe('දොළහ');
    expect(numberToWords(25, { lang: 'si' })).toBe('විසි පහ');
    expect(numberToWords(100, { lang: 'si' })).toBe('සියය');
    expect(numberToWords(250, { lang: 'si' })).toBe('දෙසිය පනහ');
    expect(numberToWords(1000, { lang: 'si' })).toBe('දහස');
  });

  it('converts Tamil', () => {
    expect(numberToWords(5, { lang: 'ta' })).toBe('ஐந்து');
    expect(numberToWords(25, { lang: 'ta' })).toBe('இருபத்து ஐந்து');
    expect(numberToWords(100, { lang: 'ta' })).toBe('நூறு');
    expect(numberToWords(1000, { lang: 'ta' })).toBe('ஆயிரம்');
    expect(numberToWords(1250, { lang: 'ta' })).toBe('ஆயிரத்து இருநூற்று ஐம்பது');
    expect(numberToWords(1000000, { lang: 'ta' })).toBe('ஒரு மில்லியன்');
  });
});

describe('lkrToWords', () => {
  it('writes rupees and cents', () => {
    expect(lkrToWords(1250.5)).toBe('One thousand two hundred and fifty rupees and fifty cents only');
    expect(lkrToWords(1)).toBe('One rupee only');
    expect(lkrToWords(0.01)).toBe('One cent only');
    expect(lkrToWords(0.5)).toBe('Fifty cents only');
    expect(lkrToWords(0)).toBe('Zero rupees only');
  });

  it('supports title case and dropping "only"', () => {
    expect(lkrToWords(1250.5, { titleCase: true })).toBe(
      'One Thousand Two Hundred and Fifty Rupees and Fifty Cents Only',
    );
    expect(lkrToWords(21, { only: false })).toBe('Twenty-one rupees');
  });

  it('rounds to the nearest cent', () => {
    expect(lkrToWords(1.005)).toBe('One rupee and one cent only');
    expect(lkrToWords(0.999)).toBe('One rupee only');
  });

  it('works in Sinhala and Tamil', () => {
    expect(lkrToWords(25.5, { lang: 'si' })).toBe('රුපියල් විසි පහ සහ සත පනහ පමණි');
    expect(lkrToWords(25.5, { lang: 'ta' })).toBe('இருபத்து ஐந்து ரூபாய் மற்றும் ஐம்பது சதம் மட்டும்');
  });

  it('rejects negatives and non-finite numbers', () => {
    expect(() => lkrToWords(-1)).toThrow(RangeError);
    expect(() => lkrToWords(NaN)).toThrow(RangeError);
  });
});
