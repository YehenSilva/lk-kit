import { toScaled } from './internal';

export type Lang = 'en' | 'si' | 'ta';

export interface WordsOptions {
  lang?: Lang;
  /** English only: "one hundred and five" (default true) vs "one hundred five". */
  british?: boolean;
}

export interface LKRWordsOptions extends WordsOptions {
  /** Append "only" (or its Sinhala/Tamil equivalent). Default true. */
  only?: boolean;
  /** English only: "One Thousand and Fifty Rupees". Default false (sentence case). */
  titleCase?: boolean;
}

// ---------- English ----------

const EN_UNITS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
];
const EN_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const EN_SCALES = ['', 'thousand', 'million', 'billion'];

function enBelow1000(n: number, british: boolean): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  const parts: string[] = [];
  if (h) parts.push(`${EN_UNITS[h]} hundred`);
  if (r) {
    if (h && british) parts.push('and');
    parts.push(
      r < 20 ? EN_UNITS[r]! : `${EN_TENS[Math.floor(r / 10)]}${r % 10 ? `-${EN_UNITS[r % 10]}` : ''}`,
    );
  }
  return parts.join(' ');
}

function enWords(n: number, british: boolean): string {
  if (n === 0) return 'zero';
  const groups: { scale: number; value: number; text: string }[] = [];
  for (let i = 0; n > 0; i++, n = Math.floor(n / 1000)) {
    const value = n % 1000;
    if (value) {
      const scale = EN_SCALES[i];
      groups.unshift({ scale: i, value, text: enBelow1000(value, british) + (scale ? ` ${scale}` : '') });
    }
  }
  const texts = groups.map((g) => g.text);
  const last = groups[groups.length - 1]!;
  // "one thousand and five" (British): final group is below 100 and follows a larger one.
  if (british && groups.length > 1 && last.scale === 0 && last.value < 100) {
    texts.splice(texts.length - 1, 0, 'and');
  }
  return texts.join(' ');
}

// ---------- Sinhala / Tamil ----------

interface Table {
  units: string[];
  teens: string[]; // 10-19
  tens: string[]; // standalone 20, 30, ... (index = tens digit)
  tensJoin: string[]; // combining stem before a unit
  hundred: string[]; // standalone 100..900
  hundredJoin: string[]; // before a remainder
  thousand: string;
  thousandJoin: string; // thousand when a remainder follows
  million: string;
  oneMillion?: string; // replaces "one" before million
}

const SI: Table = {
  units: ['බිංදුව', 'එක', 'දෙක', 'තුන', 'හතර', 'පහ', 'හය', 'හත', 'අට', 'නවය'],
  teens: ['දහය', 'එකොළහ', 'දොළහ', 'දහතුන', 'දාහතර', 'පහළොව', 'දහසය', 'දාහත', 'දහඅට', 'දහනවය'],
  tens: ['', '', 'විස්ස', 'තිහ', 'හතළිහ', 'පනහ', 'හැට', 'හැත්තෑව', 'අසූව', 'අනූව'],
  tensJoin: ['', '', 'විසි', 'තිස්', 'හතළිස්', 'පනස්', 'හැට', 'හැත්තෑ', 'අසූ', 'අනූ'],
  hundred: ['', 'සියය', 'දෙසියය', 'තුන්සියය', 'හාරසියය', 'පන්සියය', 'හයසියය', 'හත්සියය', 'අටසියය', 'නවසියය'],
  hundredJoin: ['', 'එකසිය', 'දෙසිය', 'තුන්සිය', 'හාරසිය', 'පන්සිය', 'හයසිය', 'හත්සිය', 'අටසිය', 'නවසිය'],
  thousand: 'දහස',
  thousandJoin: 'දහස',
  million: 'මිලියනය',
};

const TA: Table = {
  units: ['பூஜ்ஜியம்', 'ஒன்று', 'இரண்டு', 'மூன்று', 'நான்கு', 'ஐந்து', 'ஆறு', 'ஏழு', 'எட்டு', 'ஒன்பது'],
  teens: ['பத்து', 'பதினொன்று', 'பன்னிரண்டு', 'பதின்மூன்று', 'பதினான்கு', 'பதினைந்து', 'பதினாறு', 'பதினேழு', 'பதினெட்டு', 'பத்தொன்பது'],
  tens: ['', '', 'இருபது', 'முப்பது', 'நாற்பது', 'ஐம்பது', 'அறுபது', 'எழுபது', 'எண்பது', 'தொண்ணூறு'],
  tensJoin: ['', '', 'இருபத்து', 'முப்பத்து', 'நாற்பத்து', 'ஐம்பத்து', 'அறுபத்து', 'எழுபத்து', 'எண்பத்து', 'தொண்ணூற்று'],
  hundred: ['', 'நூறு', 'இருநூறு', 'முந்நூறு', 'நானூறு', 'ஐந்நூறு', 'அறுநூறு', 'எழுநூறு', 'எண்ணூறு', 'தொள்ளாயிரம்'],
  hundredJoin: ['', 'நூற்று', 'இருநூற்று', 'முந்நூற்று', 'நானூற்று', 'ஐந்நூற்று', 'அறுநூற்று', 'எழுநூற்று', 'எண்ணூற்று', 'தொள்ளாயிரத்து'],
  thousand: 'ஆயிரம்',
  thousandJoin: 'ஆயிரத்து',
  million: 'மில்லியன்',
  oneMillion: 'ஒரு',
};

function below100(r: number, T: Table): string {
  if (r < 10) return T.units[r]!;
  if (r < 20) return T.teens[r - 10]!;
  const t = Math.floor(r / 10);
  const u = r % 10;
  return u ? `${T.tensJoin[t]} ${T.units[u]}` : T.tens[t]!;
}

function below1000(n: number, T: Table): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  const parts: string[] = [];
  if (h) parts.push(r ? T.hundredJoin[h]! : T.hundred[h]!);
  if (r) parts.push(below100(r, T));
  return parts.join(' ');
}

function indicWords(n: number, T: Table): string {
  if (n === 0) return T.units[0]!;
  const m = Math.floor(n / 1e6);
  const th = Math.floor((n % 1e6) / 1e3);
  const rest = n % 1e3;
  const out: string[] = [];
  if (m) out.push(`${m === 1 && T.oneMillion ? T.oneMillion : below1000(m, T)} ${T.million}`);
  if (th) {
    const scale = rest ? T.thousandJoin : T.thousand;
    out.push(th === 1 ? scale : `${below1000(th, T)} ${scale}`);
  }
  if (rest) out.push(below1000(rest, T));
  return out.join(' ');
}

// ---------- Public API ----------

/**
 * Convert a non-negative integer to words. English supports up to 999 billion;
 * Sinhala and Tamil up to 999,999,999.
 *
 * Sinhala and Tamil output is a beta: words are written in spaced form and
 * grammatical joining (sandhi) is not applied. Have a native speaker review it
 * before using it on legal documents or cheques.
 */
export function numberToWords(n: number, options: WordsOptions = {}): string {
  const { lang = 'en', british = true } = options;
  if (!Number.isSafeInteger(n) || n < 0) {
    throw new RangeError('n must be a non-negative integer');
  }
  if (lang === 'en') {
    if (n >= 1e12) throw new RangeError('n must be below 1,000,000,000,000');
    return enWords(n, british);
  }
  if (n >= 1e9) throw new RangeError('n must be below 1,000,000,000 for Sinhala and Tamil');
  return indicWords(n, lang === 'si' ? SI : TA);
}

function titleCase(s: string): string {
  return s
    .split(' ')
    .map((w) =>
      w === 'and' ? w : w.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('-'),
    )
    .join(' ');
}

/**
 * Write an amount in words for invoices and cheques, e.g.
 * 1250.5 -> "One thousand two hundred and fifty rupees and fifty cents only".
 */
export function lkrToWords(amount: number, options: LKRWordsOptions = {}): string {
  const { lang = 'en', british = true, only = true, titleCase: title = false } = options;
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) {
    throw new RangeError('amount must be a non-negative finite number');
  }
  const scaled = toScaled(amount, 2);
  const rupees = Math.floor(scaled / 100);
  const cents = scaled % 100;
  const w = (n: number) => numberToWords(n, { lang, british });

  if (lang === 'si') {
    const parts: string[] = [];
    if (rupees > 0 || cents === 0) parts.push(`රුපියල් ${w(rupees)}`);
    if (cents > 0) parts.push(`සත ${w(cents)}`);
    return parts.join(' සහ ') + (only ? ' පමණි' : '');
  }

  if (lang === 'ta') {
    const parts: string[] = [];
    if (rupees > 0 || cents === 0) parts.push(`${w(rupees)} ரூபாய்`);
    if (cents > 0) parts.push(`${w(cents)} சதம்`);
    return parts.join(' மற்றும் ') + (only ? ' மட்டும்' : '');
  }

  const parts: string[] = [];
  if (rupees > 0 || cents === 0) parts.push(`${w(rupees)} ${rupees === 1 ? 'rupee' : 'rupees'}`);
  if (cents > 0) parts.push(`${w(cents)} ${cents === 1 ? 'cent' : 'cents'}`);
  const text = parts.join(' and ') + (only ? ' only' : '');
  return title ? titleCase(text) : text.charAt(0).toUpperCase() + text.slice(1);
}
