import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    nic: 'src/nic.ts',
    phone: 'src/phone.ts',
    currency: 'src/currency.ts',
    words: 'src/words.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'es2020',
});
