import { describe, expect, it } from 'vitest';
import { isValidNIC, parseNIC, toNewFormat } from '../src/nic';

const NOW = new Date(2026, 10, 14); // 14 Nov 2026

describe('parseNIC', () => {
  it('parses an old-format male NIC', () => {
    const r = parseNIC('853400937V', { now: NOW });
    expect(r).toMatchObject({
      valid: true,
      format: 'old',
      birthDate: '1985-12-05',
      gender: 'male',
      voter: true,
      age: 40,
    });
  });

  it('parses an old-format female NIC with X suffix', () => {
    const r = parseNIC('858400937x', { now: NOW });
    expect(r).toMatchObject({ valid: true, gender: 'female', birthDate: '1985-12-05', voter: false });
  });

  it('parses a new-format NIC', () => {
    expect(parseNIC('198534000937', { now: NOW })).toMatchObject({
      valid: true,
      format: 'new',
      birthDate: '1985-12-05',
      gender: 'male',
    });
  });

  it('normalises spaces and dashes', () => {
    const r = parseNIC(' 1985-3400-0937 ', { now: NOW });
    expect(r).toMatchObject({ valid: true, nic: '198534000937' });
  });

  it('computes age around the birthday', () => {
    expect(parseNIC('853400937V', { now: new Date(2026, 11, 4) })).toMatchObject({ age: 40 });
    expect(parseNIC('853400937V', { now: new Date(2026, 11, 5) })).toMatchObject({ age: 41 });
  });

  it('handles Feb 29 in leap years and rejects it otherwise', () => {
    expect(parseNIC('200006001234', { now: NOW })).toMatchObject({ valid: true, birthDate: '2000-02-29' });
    expect(parseNIC('199906001234', { now: NOW })).toEqual({ valid: false, reason: 'bad-day' });
  });

  it('shifts days after February in non-leap years', () => {
    expect(parseNIC('199906101234', { now: NOW })).toMatchObject({ birthDate: '1999-03-01' });
    expect(parseNIC('199936601234', { now: NOW })).toMatchObject({ birthDate: '1999-12-31' });
  });

  it('decodes the female offset', () => {
    expect(parseNIC('200150101234', { now: NOW })).toMatchObject({
      birthDate: '2001-01-01',
      gender: 'female',
    });
  });

  it('rejects bad input', () => {
    expect(parseNIC('')).toEqual({ valid: false, reason: 'empty' });
    expect(parseNIC('12345')).toEqual({ valid: false, reason: 'bad-format' });
    expect(parseNIC('85340093VV')).toEqual({ valid: false, reason: 'bad-format' });
    expect(parseNIC('850000937V')).toEqual({ valid: false, reason: 'bad-day' });
    expect(parseNIC('853670937V')).toEqual({ valid: false, reason: 'bad-day' });
    expect(parseNIC('858670937V')).toEqual({ valid: false, reason: 'bad-day' });
  });

  it('rejects birth dates in the future', () => {
    expect(parseNIC('203000101234', { now: NOW })).toEqual({ valid: false, reason: 'future-date' });
  });
});

describe('isValidNIC / toNewFormat', () => {
  it('works as a boolean check', () => {
    expect(isValidNIC('853400937V', { now: NOW })).toBe(true);
    expect(isValidNIC('nope')).toBe(false);
  });

  it('converts old to new format', () => {
    expect(toNewFormat('853400937V', { now: NOW })).toBe('198534000937');
    expect(toNewFormat('198534000937', { now: NOW })).toBe('198534000937');
    expect(toNewFormat('bad')).toBeNull();
  });
});
