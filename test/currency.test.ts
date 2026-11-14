import { describe, expect, it } from 'vitest';
import { formatLKR, parseLKR } from '../src/currency';

describe('formatLKR', () => {
  it('uses standard grouping by default', () => {
    expect(formatLKR(1250000)).toBe('Rs. 1,250,000.00');
    expect(formatLKR(0)).toBe('Rs. 0.00');
    expect(formatLKR(999)).toBe('Rs. 999.00');
    expect(formatLKR(1000)).toBe('Rs. 1,000.00');
  });

  it('supports lakh grouping', () => {
    expect(formatLKR(1250000, { grouping: 'lakh' })).toBe('Rs. 12,50,000.00');
    expect(formatLKR(125000, { grouping: 'lakh' })).toBe('Rs. 1,25,000.00');
    expect(formatLKR(12345678, { grouping: 'lakh' })).toBe('Rs. 1,23,45,678.00');
    expect(formatLKR(500, { grouping: 'lakh' })).toBe('Rs. 500.00');
  });

  it('supports symbol and decimals options', () => {
    expect(formatLKR(1250000, { decimals: 0 })).toBe('Rs. 1,250,000');
    expect(formatLKR(1500.5, { symbol: 'LKR' })).toBe('LKR 1,500.50');
    expect(formatLKR(1500, { symbol: '' })).toBe('1,500.00');
  });

  it('rounds without float errors', () => {
    expect(formatLKR(1.005)).toBe('Rs. 1.01');
    expect(formatLKR(999.999)).toBe('Rs. 1,000.00');
    expect(formatLKR(0.1 + 0.2)).toBe('Rs. 0.30');
  });

  it('handles negatives', () => {
    expect(formatLKR(-1234.5)).toBe('-Rs. 1,234.50');
    expect(formatLKR(-0.001)).toBe('Rs. 0.00');
  });

  it('rejects invalid input', () => {
    expect(() => formatLKR(NaN)).toThrow(TypeError);
    expect(() => formatLKR(Infinity)).toThrow(TypeError);
    expect(() => formatLKR(1, { decimals: -1 })).toThrow(RangeError);
  });
});

describe('parseLKR', () => {
  it('parses common spellings', () => {
    expect(parseLKR('Rs. 1,250,000.50')).toBe(1250000.5);
    expect(parseLKR('LKR 1000')).toBe(1000);
    expect(parseLKR('rs 12,50,000')).toBe(1250000);
    expect(parseLKR('-Rs. 1,000')).toBe(-1000);
  });

  it('returns null for non-amounts', () => {
    expect(parseLKR('abc')).toBeNull();
    expect(parseLKR('')).toBeNull();
  });
});
