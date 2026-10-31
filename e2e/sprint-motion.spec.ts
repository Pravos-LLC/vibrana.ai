import { expect, test } from '@playwright/test'

test('Build Sprint respects reduced motion and preference changes without hydration errors', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('**/api/form-token', route => route.fulfill({ status: 503 }))
  const hydrationErrors: string[] = []
  page.on('console', message => {
    if (message.type() === 'error' && /hydrat/i.test(message.text())) hydrationErrors.push(message.text())
  })
  await page.goto('/ai-build-sprint')
  const trackImage = page.locator('img[src*="sprint-track-workflow"]').first()
  await expect(trackImage).toBeVisible()
  await expect(trackImage).not.toHaveClass(/group-hover/)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect(trackImage).toHaveClass(/group-hover/)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(trackImage).not.toHaveClass(/group-hover/)
  expect(hydrationErrors).toEqual([])
})
