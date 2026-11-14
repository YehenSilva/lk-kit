import { toScaled } from './internal';

export interface FormatLKROptions {
  /** Currency symbol. Default "Rs.". Use "LKR", "රු." or "" as needed. */
  symbol?: string;
  /** Decimal places. Default 2. */
  decimals?: number;
  /**
   * `standard` groups in threes (1,250,000), the usual Sri Lankan convention.
   * `lakh` groups 3 then 2 (12,50,000).
   */
  grouping?: 'standard' | 'lakh';
}

function groupLakh(int: string): string {
  if (int.length <= 3) return int;
  const last3 = int.slice(-3);
  const rest = int.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${rest},${last3}`;
}

/** Format an amount as rupees, e.g. 1250000 -> "Rs. 1,250,000.00". */
export function formatLKR(amount: number, options: FormatLKROptions = {}): string {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    throw new TypeError('amount must be a finite number');
  }
  const { symbol = 'Rs.', decimals = 2, grouping = 'standard' } = options;
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 6) {
    throw new RangeError('decimals must be an integer between 0 and 6');
  }

  const scaled = toScaled(Math.abs(amount), decimals);
  if (!Number.isSafeInteger(scaled)) throw new RangeError('amount is too large');

  const digits = String(scaled).padStart(decimals + 1, '0');
  const int = digits.slice(0, digits.length - decimals);
  const frac = digits.slice(digits.length - decimals);

  const grouped =
    grouping === 'lakh' ? groupLakh(int) : int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const body = decimals > 0 ? `${grouped}.${frac}` : grouped;
  const sign = amount < 0 && scaled > 0 ? '-' : '';
  return `${sign}${symbol ? `${symbol} ` : ''}${body}`;
}

/**
 * Parse text such as "Rs. 1,250,000.50" or "LKR 1000" into a number.
 * Returns null if the text is not a plain amount.
 */
export function parseLKR(text: string): number | null {
  const cleaned = String(text ?? '')
    .replace(/LKR|Rs\.?|රු\.?|ரூ\.?/gi, '')
    .replace(/[,\s]/g, '');
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  return Number(cleaned);
}
