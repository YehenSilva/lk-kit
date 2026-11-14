# lk-kit

Zero-dependency utilities for Sri Lankan apps, written in TypeScript. Works in Node 18+, browsers and bundlers (ESM and CommonJS).

- **NIC**: validate and parse old (9 digits + V/X) and new (12 digit) numbers
- **Phone**: validate, normalise and format numbers, detect the mobile carrier
- **Currency**: format LKR amounts
- **Words**: numbers and amounts in words, for invoices and cheques (English, Sinhala, Tamil)

```sh
npm install lk-kit
```

Import everything from the root, or one module at a time (`lk-kit/nic`, `lk-kit/phone`, `lk-kit/currency`, `lk-kit/words`).

## NIC

```ts
import { parseNIC, isValidNIC, toNewFormat } from 'lk-kit';

parseNIC('853400937V');
// { valid: true, format: 'old', nic: '853400937V', year: 1985, month: 12, day: 5,
//   birthDate: '1985-12-05', gender: 'male', age: 40, voter: true }

parseNIC('198534000937').format; // 'new'
parseNIC('12345');               // { valid: false, reason: 'bad-format' }
isValidNIC('853400937V');        // true
toNewFormat('853400937V');       // '198534000937'
```

Reasons: `empty`, `bad-format`, `bad-day`, `future-date`. Pass `{ now: new Date(...) }` to fix the reference date for age.

Notes:
- The check digit is **not** verified.
- NIC day numbers always count February as 29 days, so day 60 is rejected in non-leap years. Females have 500 added to the day number. Both are handled.

## Phone

```ts
import { parsePhone, isValidPhone, formatPhone } from 'lk-kit';

parsePhone('+94 77 123 4567');
// { valid: true, type: 'mobile', national: '0771234567', e164: '+94771234567', carrier: 'Dialog' }

parsePhone('0112345678');                    // type: 'landline', area: 'Colombo'
formatPhone('771234567');                    // '077 123 4567'
formatPhone('0771234567', 'international');  // '+94 77 123 4567'
formatPhone('0771234567', 'e164');           // '+94771234567'
isValidPhone('0731234567');                  // false
```

Accepts `0771234567`, `771234567`, `+94771234567`, `0094771234567`, `94771234567`, `+94 (0) 77 123 4567`, and spaces, dashes or brackets. Reasons: `empty`, `bad-format`, `bad-length`, `unknown-mobile-prefix`, `unknown-area-code`. Pass `{ strictAreaCode: false }` to accept any area code.

Notes:
- Carrier comes from the number prefix (070/071 SLT-Mobitel, 072/078 Hutch, 074/076/077 Dialog, 075 Airtel). Ported numbers may belong to a different carrier.
- Prefix and area-code tables follow the public numbering plan. Open an issue or PR if a code is missing.

## Currency

```ts
import { formatLKR, parseLKR } from 'lk-kit';

formatLKR(1250000);                          // 'Rs. 1,250,000.00'
formatLKR(1250000, { grouping: 'lakh' });    // 'Rs. 12,50,000.00'
formatLKR(1500.5, { symbol: 'LKR' });        // 'LKR 1,500.50'
formatLKR(1250000, { decimals: 0 });         // 'Rs. 1,250,000'
parseLKR('Rs. 1,250,000.50');                // 1250000.5
```

Grouping in threes is the default, which is the usual Sri Lankan convention. Lakh grouping is optional. Rounding is done without floating-point surprises (`1.005` becomes `1.01`).

## Words

```ts
import { numberToWords, lkrToWords } from 'lk-kit';

numberToWords(1250);                 // 'one thousand two hundred and fifty'
lkrToWords(1250.5);                  // 'One thousand two hundred and fifty rupees and fifty cents only'
lkrToWords(1250.5, { titleCase: true });
// 'One Thousand Two Hundred and Fifty Rupees and Fifty Cents Only'

lkrToWords(25.5, { lang: 'si' });    // 'රුපියල් විසි පහ සහ සත පනහ පමණි'
lkrToWords(25.5, { lang: 'ta' });    // 'இருபத்து ஐந்து ரூபாய் மற்றும் ஐம்பது சதம் மட்டும்'
```

Options: `lang` (`'en' | 'si' | 'ta'`), `british` (default `true`, the "and" in "one hundred and five"), `only` (default `true`), `titleCase` (English only).

Limits: English up to 999 billion, Sinhala and Tamil up to 999,999,999.

**Sinhala and Tamil are a beta.** Words are written in spaced form and grammatical joining (sandhi) is not applied, so some compounds will not match formal writing. Have a native speaker review the output before using it on cheques or legal documents. Corrections are welcome.

## Development

```sh
npm install
npm test
npm run build
```

## License

MIT
