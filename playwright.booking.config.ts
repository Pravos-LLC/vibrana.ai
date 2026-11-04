import { defineConfig, devices } from '@playwright/test';

// Run after a production build. Provider APIs are intercepted in booking.spec.ts.
export default defineConfig({
  testDir: './e2e', testMatch: 'booking.spec.ts', fullyParallel: true,
  use: { baseURL: 'http://localhost:3237', ...devices['Desktop Chrome'], screenshot: 'only-on-failure' },
  webServer: { command: 'npx next start -p 3237', url: 'http://localhost:3237/book', reuseExistingServer: false, env: { SUPABASE_URL: 'http://127.0.0.1:54321', SUPABASE_SERVICE_KEY: 'test', RESEND_API_KEY: 're_test' } },
});
