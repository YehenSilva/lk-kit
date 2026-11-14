export type NICFormat = 'old' | 'new';
export type Gender = 'male' | 'female';
export type NICErrorReason = 'empty' | 'bad-format' | 'bad-day' | 'future-date';

export interface NICInfo {
  valid: true;
  /** `old` = 9 digits + V/X, `new` = 12 digits. */
  format: NICFormat;
  /** Normalised NIC: uppercase, no spaces or dashes. */
  nic: string;
  year: number;
  month: number;
  day: number;
  /** ISO date, YYYY-MM-DD. */
  birthDate: string;
  gender: Gender;
  /** Age in whole years as of `now`. */
  age: number;
  /** Old format only: true for a V (voter) suffix, false for X. */
  voter?: boolean;
}

export interface NICError {
  valid: false;
  reason: NICErrorReason;
}

export type NICResult = NICInfo | NICError;

export interface ParseNICOptions {
  /** Reference date for age and future-date checks. Defaults to now. */
  now?: Date;
}

const OLD = /^(\d{2})(\d{3})(\d{3})(\d)([VX])$/;
const NEW = /^(\d{4})(\d{3})(\d{4})(\d)$/;

const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const pad = (n: number, len = 2) => String(n).padStart(len, '0');

/**
 * Parse a Sri Lankan NIC (old 9-digit + V/X, or new 12-digit).
 *
 * The check digit is not verified. NIC day numbers always treat February as
 * 29 days, and females have 500 added to the day number.
 */
export function parseNIC(input: string, options: ParseNICOptions = {}): NICResult {
  const nic = String(input ?? '').replace(/[\s-]/g, '').toUpperCase();
  if (!nic) return { valid: false, reason: 'empty' };

  let format: NICFormat;
  let year: number;
  let dayCode: number;
  let voter: boolean | undefined;

  const old = OLD.exec(nic);
  const neu = old ? null : NEW.exec(nic);
  if (old) {
    format = 'old';
    year = 1900 + Number(old[1]);
    dayCode = Number(old[2]);
    voter = old[5] === 'V';
  } else if (neu) {
    format = 'new';
    year = Number(neu[1]);
    dayCode = Number(neu[2]);
    if (year < 1900) return { valid: false, reason: 'bad-format' };
  } else {
    return { valid: false, reason: 'bad-format' };
  }

  const gender: Gender = dayCode > 500 ? 'female' : 'male';
  const dayOfYear = dayCode > 500 ? dayCode - 500 : dayCode;
  if (dayOfYear < 1 || dayOfYear > 366) return { valid: false, reason: 'bad-day' };

  const leap = isLeap(year);
  // Numbering assumes a leap year, so day 60 (Feb 29) cannot exist otherwise.
  if (!leap && dayOfYear === 60) return { valid: false, reason: 'bad-day' };
  const actualDay = !leap && dayOfYear > 60 ? dayOfYear - 1 : dayOfYear;

  const date = new Date(Date.UTC(year, 0, actualDay));
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  const now = options.now ?? new Date();
  const nowY = now.getFullYear();
  const nowM = now.getMonth() + 1;
  const nowD = now.getDate();
  const afterNow = year > nowY || (year === nowY && (month > nowM || (month === nowM && day > nowD)));
  if (afterNow) return { valid: false, reason: 'future-date' };

  let age = nowY - year;
  if (nowM < month || (nowM === month && nowD < day)) age--;

  const info: NICInfo = {
    valid: true,
    format,
    nic,
    year,
    month,
    day,
    birthDate: `${year}-${pad(month)}-${pad(day)}`,
    gender,
    age,
  };
  if (voter !== undefined) info.voter = voter;
  return info;
}

/** True if the input is a well-formed NIC with a plausible birth date. */
export function isValidNIC(input: string, options: ParseNICOptions = {}): boolean {
  return parseNIC(input, options).valid;
}

/**
 * Convert an old-format NIC to the 12-digit format. A 12-digit NIC is returned
 * normalised. Returns null if the input is not a valid NIC.
 */
export function toNewFormat(input: string, options: ParseNICOptions = {}): string | null {
  const info = parseNIC(input, options);
  if (!info.valid) return null;
  if (info.format === 'new') return info.nic;
  const m = OLD.exec(info.nic)!;
  return `19${m[1]}${m[2]}0${m[3]}${m[4]}`;
}
