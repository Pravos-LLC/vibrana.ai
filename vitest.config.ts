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
    env: { FORM_GUARD_SECRET: '', SUPABASE_SERVICE_KEY: '', SUPABASE_URL: '', FORM_GUARD_MIN_FILL_MS: '', VERCEL: '', VERCEL_ENV: '', FEEDBACK_FORMS_JSON: '' },
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'json-summary'],
      reportsDirectory: 'coverage',
      // Server and logic code the unit suite exercises: API routes, email/DB
      // helpers, and assessment scoring. UI components are covered by e2e.
      include: ['app/api/**/*.ts', 'lib/**/*.ts', 'src/lib/**/*.ts'],
      exclude: ['**/*.d.ts', '**/*.test.ts'],
      // Ratchet: measured after the sprint assessment overhaul at 76.06% statements,
      // 76.11% branches, 87.01% functions and 77.54% lines. Keep floors below
      // that verified run; never lower them to make a PR pass.
      thresholds: {
        statements: 75,
        branches: 75,
        functions: 86,
        lines: 76,
      },
    },
  },
});
