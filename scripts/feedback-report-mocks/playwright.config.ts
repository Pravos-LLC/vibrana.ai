import { defineConfig, devices } from '@playwright/test'

// Captures the report mockups for the feedback thank-you screen. Run against a local dev server:
//   npm run dev   (port 3002), then
//   npx playwright test -c scripts/feedback-report-mocks/playwright.config.ts
// Writes public/assets/feedback/report-*.png (convert to webp afterwards, see capture.spec.ts).
export default defineConfig({
  testDir: '.',
  testMatch: 'capture.spec.ts',
  workers: 1,
  reporter: 'list',
  use: { ...devices['Desktop Chrome'], baseURL: process.env.CAPTURE_BASE_URL || 'http://localhost:3002', viewport: { width: 1440, height: 900 }, colorScheme: 'dark', deviceScaleFactor: 2, reducedMotion: 'reduce' },
})
