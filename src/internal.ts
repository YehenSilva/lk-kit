/**
 * Round a non-negative number to `decimals` places and return it as an integer
 * count of 10^-decimals units. Shifting via the exponent avoids float errors
 * such as 1.005 -> "1.00".
 */
export function toScaled(abs: number, decimals: number): number {
  const s = String(abs);
  if (s.includes('e')) return Math.round(abs * 10 ** decimals);
  return Math.round(Number(`${s}e${decimals}`));
}
