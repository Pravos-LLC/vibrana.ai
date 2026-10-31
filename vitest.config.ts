import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Mirror tsconfig.json's `"@/*": ["./*"]` — `@` maps to the project root.
export default defineConfig({
  resolve: {
    alias: {
      'server-only': fileURLToPath(new URL('./node_modules/next/dist/compiled/server-only/empty.js', import.meta.url)),
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    // Hermetic: a developer shell that exports the Supabase key must not switch the form guard on.
    // Guard tests set FORM_GUARD_SECRET themselves.
    env: { FORM_GUARD_SECRET: '', SUPABASE_SERVICE_KEY: '', SUPABASE_URL: '', FORM_GUARD_MIN_FILL_MS: '', VERCEL: '', VERCEL_ENV: '', FEEDBACK_RECIPIENTS_JSON: '' },
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'json-summary'],
      reportsDirectory: 'coverage',
      // Server and logic code the unit suite exercises: API routes, email/DB
      // helpers, and assessment scoring. UI components are covered by e2e.
      include: ['app/api/**/*.ts', 'lib/**/*.ts', 'src/lib/**/*.ts'],
      exclude: ['**/*.d.ts', '**/*.test.ts'],
      // Ratchet: floors set just below the numbers measured when this was added
      // (statements 49.17, branches 50.63, functions 62.96, lines 50.00). Raise
      // them when coverage goes up; never lower them to make a PR pass.
      thresholds: {
        statements: 49,
        branches: 50,
        functions: 62,
        lines: 49,
      },
    },
  },
});
