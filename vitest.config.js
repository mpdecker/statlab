import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.js'],
    environment: 'node',
    // A handful of tests exercise genuinely iterative numerical routines
    // (power-search, SEM convergence, MCMC) that comfortably clear the 5s
    // default under plain `vitest run` but tip over it once v8 coverage
    // instrumentation's overhead is added. Raise the default rather than
    // chase each borderline test individually as coverage exposes more.
    testTimeout: 20000,
    coverage: {
      include: ['src/math/**', 'src/methods/**'],
      exclude: ['src/methods/__fixtures__/**', 'src/methods/fixtures/**'],
      thresholds: { lines: 90 },
    },
  },
});
