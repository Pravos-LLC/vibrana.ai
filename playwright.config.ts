import { defineConfig, devices } from '@playwright/test'

// E2E runs against a production build (`next build` then `next start`) backed by a
// local Supabase stack, with Resend pointed at e2e/stub-server.mjs.
// The build has to happen first, with the same env (see e2e/README.md and
// .github/workflows/e2e.yml). Nothing here can reach production data or a real
// email provider.

const APP_PORT = Number(process.env.E2E_APP_PORT || 3217)
const STUB_PORT = Number(process.env.STUB_PORT || 4217)

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${APP_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node e2e/stub-server.mjs',
      url: `http://localhost:${STUB_PORT}/__health`,
      reuseExistingServer: false,
      env: { STUB_PORT: String(STUB_PORT) },
    },
    {
      command: `npx next start -p ${APP_PORT}`,
      url: `http://localhost:${APP_PORT}/`,
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
})
