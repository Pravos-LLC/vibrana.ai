import { expect, test } from '@playwright/test'

test('Build Sprint respects reduced motion and preference changes without hydration errors', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('**/api/form-token', route => route.fulfill({ status: 503 }))
  const hydrationErrors: string[] = []
  page.on('console', message => {
    if (message.type() === 'error' && /hydrat/i.test(message.text())) hydrationErrors.push(message.text())
  })
  await page.goto('/ai-build-sprint')
  // The hero and the timeline both render under reduced motion, then keep working when the preference flips.
  const hero = page.locator('#sprint-hero h1')
  await expect(hero).toBeVisible()
  await expect(page.getByTestId('sprint-timeline')).toBeAttached()
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect(hero).toBeVisible()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(hero).toBeVisible()
  expect(hydrationErrors).toEqual([])
})
