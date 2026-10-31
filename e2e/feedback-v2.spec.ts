import { expect, test } from '@playwright/test'
import { SAMPLE_FEEDBACK_FORM as form } from '../src/feedback-content'

test.use({ reducedMotion: 'reduce' })

for (const score of [7, 9]) {
  test(`anonymous feedback ${score}: consent gate, stale retry and optional contact`, async ({ page }) => {
    const errors: string[] = []
    page.on('response', (response) => {
      if (response.url().includes('/assets/') && response.status() >= 400) errors.push(`asset HTTP ${response.status()}`)
    })
    page.on('pageerror', (error) => errors.push(error.message))
    await page.addInitScript(({ slug, score }) => {
      localStorage.setItem(`vibrana-feedback:${slug}`, JSON.stringify({
        submissionId: crypto.randomUUID(), step: 'intro', answers: { overall: score }, consent: { quote: null }, done: false,
      }))
    }, { slug: form.slug, score })
    const bodies: Record<string, unknown>[] = []
    await page.route('**/api/feedback', async (route) => {
      bodies.push(route.request().postDataJSON())
      await route.fulfill({ status: bodies.length === 1 ? 409 : 200, json: bodies.length === 1 ? { error: 'Consent wording changed. Reload before retrying.' } : { saved: true } })
    })
    await page.goto(`/feedback/${form.slug}?r=forged-recipient`)
    await expect(page.getByRole('heading', { name: 'Feedback Request' })).toBeVisible()
    await expect(page.getByText(form.consent.privacyLine, { exact: false })).toBeVisible()
    await page.getByRole('button', { name: 'Start', exact: true }).click()
    await expect(page.getByRole('radiogroup').first()).toBeVisible()
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    // All substantive questions are optional except the overall score.
    for (const question of form.questions.slice(1, -1)) {
      await expect(page.getByRole('heading', { name: question.prompt })).toBeVisible()
      await page.getByRole('button', { name: 'Skip', exact: true }).click()
    }
    if (score >= form.consent.minScore) {
      await expect(page.getByRole('heading', { name: form.consent.heading })).toBeVisible()
      await page.getByRole('radio', { name: 'Yes', exact: true }).check({ force: true })
    } else {
      await expect(page.getByRole('heading', { name: form.consent.heading })).toHaveCount(0)
    }
    await expect(page.getByRole('heading', { name: 'Your details' })).toBeVisible()
    await page.getByRole('button', { name: 'Send', exact: true }).click()
    await expect(page.getByText('Consent wording changed. Reload before retrying.')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Thank you.' })).toHaveCount(0)
    const draft = await page.evaluate((slug) => JSON.parse(localStorage.getItem(`vibrana-feedback:${slug}`)!), form.slug)
    expect(draft.done).toBe(false)
    expect(draft.answers.overall).toBe(score)
    await page.getByRole('button', { name: 'Try again', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Thank you.' })).toBeVisible()
    expect(bodies).toHaveLength(2)
    expect(bodies[0]).toEqual(bodies[1])
    expect(bodies[1]).not.toHaveProperty('r')
    expect(bodies[1].consent).toEqual(score >= form.consent.minScore ? { version: form.consent.version, anonymous_quote: true } : null)
    await expect(page.getByRole('link', { name: 'Connect on LinkedIn' })).toHaveCount(0)
    expect(errors).toEqual([])
  })
}

test('mobile keyboard navigation and Back do not auto-advance an unchanged score', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto(`/feedback/${form.slug}`)
  await page.getByRole('button', { name: 'Start', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: form.questions[0].prompt })).toBeVisible()
  await page.getByRole('radio', { name: '9', exact: true }).check({ force: true })
  await expect(page.getByRole('heading', { name: form.questions[1].prompt })).toBeVisible()
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await expect(page.getByRole('heading', { name: form.questions[0].prompt })).toBeVisible()
  await page.getByRole('radio', { name: '9', exact: true }).click({ force: true })
  // Wait beyond the specified 250ms auto-advance delay: re-tapping must stay on this step.
  await page.waitForTimeout(400)
  await expect(page.getByRole('heading', { name: form.questions[0].prompt })).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(overflow).toBe(false)
  const button = page.getByRole('button', { name: 'Continue', exact: true })
  const contrast = await button.evaluate((element) => {
    const style = getComputedStyle(element)
    return { color: style.color, background: style.getPropertyValue('--g-bg') }
  })
  expect(contrast.color).toBe('rgb(245, 243, 255)')
  expect(contrast.background).toBe('linear-gradient(135deg, #7c3aed80, #3b82f661 50%, #2dd4bf66)')
})
