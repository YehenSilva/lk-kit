export type Carrier = 'Dialog' | 'SLT-Mobitel' | 'Hutch' | 'Airtel';
export type PhoneType = 'mobile' | 'landline';
export type PhoneErrorReason =
  | 'empty'
  | 'bad-format'
  | 'bad-length'
  | 'unknown-mobile-prefix'
  | 'unknown-area-code';
export type PhoneFormat = 'national' | 'international' | 'e164';

export interface PhoneInfo {
  valid: true;
  type: PhoneType;
  /** National form with trunk prefix, e.g. 0771234567. */
  national: string;
  /** E.164, e.g. +94771234567. */
  e164: string;
  /** Mobile numbers only. Based on the number prefix, so ported numbers may differ. */
  carrier?: Carrier;
  /** Landline numbers only, e.g. "Colombo". Absent in lenient mode for unknown codes. */
  area?: string;
}

export interface PhoneError {
  valid: false;
  reason: PhoneErrorReason;
}

export type PhoneResult = PhoneInfo | PhoneError;

export interface ParsePhoneOptions {
  /** Reject landline numbers whose area code is not in the known table. Default true. */
  strictAreaCode?: boolean;
}

/** Mobile prefixes (without the leading 0). 075 is Airtel, now operated by Dialog. */
const MOBILE_PREFIXES: Record<string, Carrier> = {
  '70': 'SLT-Mobitel',
  '71': 'SLT-Mobitel',
  '72': 'Hutch',
  '74': 'Dialog',
  '75': 'Airtel',
  '76': 'Dialog',
  '77': 'Dialog',
  '78': 'Hutch',
};

/** Landline area codes (without the leading 0). */
const AREA_CODES: Record<string, string> = {
  '11': 'Colombo',
  '21': 'Jaffna',
  '23': 'Mannar',
  '24': 'Vavuniya',
  '25': 'Anuradhapura',
  '26': 'Trincomalee',
  '27': 'Polonnaruwa',
  '31': 'Negombo',
  '32': 'Chilaw',
  '33': 'Gampaha',
  '34': 'Kalutara',
  '35': 'Kegalle',
  '36': 'Avissawella',
  '37': 'Kurunegala',
  '38': 'Panadura',
  '41': 'Matara',
  '45': 'Ratnapura',
  '47': 'Hambantota',
  '51': 'Hatton',
  '52': 'Nuwara Eliya',
  '54': 'Nawalapitiya',
  '55': 'Badulla / Monaragala',
  '57': 'Bandarawela',
  '63': 'Ampara',
  '65': 'Batticaloa',
  '66': 'Matale',
  '67': 'Kalmunai',
  '81': 'Kandy',
  '91': 'Galle',
};

/** Reduce any accepted spelling to the 9-digit national significant number, or null. */
function toNSN(input: string): string | null {
  let s = String(input ?? '').trim().replace(/[\s().-]/g, '');
  let plus = false;
  if (s.startsWith('+')) {
    plus = true;
    s = s.slice(1);
  }
  if (!/^\d+$/.test(s)) return null;

  if (plus) {
    if (!s.startsWith('94')) return null;
    s = s.slice(2);
  } else if (s.startsWith('0094')) {
    s = s.slice(4);
  } else if (s.startsWith('94') && s.length === 11) {
    s = s.slice(2);
  }
  if (s.length === 10 && s.startsWith('0')) s = s.slice(1);
  // A national significant number is 9 digits and never starts with the trunk 0.
  return s.length === 9 && !s.startsWith('0') ? s : null;
}

/**
 * Parse a Sri Lankan phone number. Accepts 0771234567, 771234567,
 * +94 77 123 4567, 0094771234567, 94771234567 and common separators.
 */
export function parsePhone(input: string, options: ParsePhoneOptions = {}): PhoneResult {
  const raw = String(input ?? '').trim();
  if (!raw) return { valid: false, reason: 'empty' };

  const nsn = toNSN(raw);
  if (!nsn) {
    const digitsOnly = raw.replace(/[\s().+-]/g, '');
    return { valid: false, reason: /^\d+$/.test(digitsOnly) ? 'bad-length' : 'bad-format' };
  }

  const prefix = nsn.slice(0, 2);
  const base = { valid: true as const, national: `0${nsn}`, e164: `+94${nsn}` };

  if (nsn.startsWith('7')) {
    const carrier = MOBILE_PREFIXES[prefix];
    if (!carrier) return { valid: false, reason: 'unknown-mobile-prefix' };
    return { ...base, type: 'mobile', carrier };
  }

  const area = AREA_CODES[prefix];
  if (!area && (options.strictAreaCode ?? true)) {
    return { valid: false, reason: 'unknown-area-code' };
  }
  const info: PhoneInfo = { ...base, type: 'landline' };
  if (area) info.area = area;
  return info;
}

export function isValidPhone(input: string, options: ParsePhoneOptions = {}): boolean {
  return parsePhone(input, options).valid;
}

/**
 * Format a number as national ("077 123 4567"), international
 * ("+94 77 123 4567") or e164 ("+94771234567"). Returns null if invalid.
 */
export function formatPhone(
  input: string,
  style: PhoneFormat = 'national',
  options: ParsePhoneOptions = {},
): string | null {
  const info = parsePhone(input, options);
  if (!info.valid) return null;
  if (style === 'e164') return info.e164;
  const nsn = info.national.slice(1);
  const grouped = `${nsn.slice(0, 2)} ${nsn.slice(2, 5)} ${nsn.slice(5)}`;
  return style === 'international' ? `+94 ${grouped}` : `0${grouped}`;
}
