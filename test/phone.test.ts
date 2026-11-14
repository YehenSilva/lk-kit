import { describe, expect, it } from 'vitest';
import { formatPhone, isValidPhone, parsePhone } from '../src/phone';

describe('parsePhone', () => {
  it('accepts every common spelling of the same mobile number', () => {
    const inputs = [
      '0771234567',
      '771234567',
      '+94771234567',
      '+94 77 123 4567',
      '+94 (0) 77 123 4567',
      '0094771234567',
      '94771234567',
      '077-123-4567',
      '(077) 123 4567',
    ];
    for (const i of inputs) {
      expect(parsePhone(i), i).toMatchObject({
        valid: true,
        type: 'mobile',
        national: '0771234567',
        e164: '+94771234567',
        carrier: 'Dialog',
      });
    }
  });

  it('detects carriers by prefix', () => {
    const carrier = (n: string) => (parsePhone(n) as { carrier?: string }).carrier;
    expect(carrier('0701234567')).toBe('SLT-Mobitel');
    expect(carrier('0711234567')).toBe('SLT-Mobitel');
    expect(carrier('0721234567')).toBe('Hutch');
    expect(carrier('0741234567')).toBe('Dialog');
    expect(carrier('0751234567')).toBe('Airtel');
    expect(carrier('0761234567')).toBe('Dialog');
    expect(carrier('0781234567')).toBe('Hutch');
  });

  it('parses landlines with area names', () => {
    expect(parsePhone('0112345678')).toMatchObject({ valid: true, type: 'landline', area: 'Colombo' });
    expect(parsePhone('+94 81 234 5678')).toMatchObject({ valid: true, area: 'Kandy' });
  });

  it('handles unknown area codes strictly or leniently', () => {
    expect(parsePhone('0991234567')).toEqual({ valid: false, reason: 'unknown-area-code' });
    const lenient = parsePhone('0991234567', { strictAreaCode: false });
    expect(lenient).toMatchObject({ valid: true, type: 'landline' });
    expect((lenient as { area?: string }).area).toBeUndefined();
  });

  it('rejects bad input', () => {
    expect(parsePhone('')).toEqual({ valid: false, reason: 'empty' });
    expect(parsePhone('0731234567')).toEqual({ valid: false, reason: 'unknown-mobile-prefix' });
    expect(parsePhone('077123456')).toEqual({ valid: false, reason: 'bad-length' });
    expect(parsePhone('077123456789')).toEqual({ valid: false, reason: 'bad-length' });
    expect(parsePhone('abc')).toEqual({ valid: false, reason: 'bad-format' });
    expect(parsePhone('+44771234567')).toMatchObject({ valid: false });
  });
});

describe('formatPhone / isValidPhone', () => {
  it('formats in each style', () => {
    expect(formatPhone('771234567')).toBe('077 123 4567');
    expect(formatPhone('0771234567', 'international')).toBe('+94 77 123 4567');
    expect(formatPhone('0771234567', 'e164')).toBe('+94771234567');
    expect(formatPhone('0112345678', 'international')).toBe('+94 11 234 5678');
    expect(formatPhone('nope')).toBeNull();
  });

  it('works as a boolean check', () => {
    expect(isValidPhone('0771234567')).toBe(true);
    expect(isValidPhone('12345')).toBe(false);
  });
});
