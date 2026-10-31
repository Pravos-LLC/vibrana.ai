import { expect, test } from '@playwright/test'
import { collectErrors, db, stubRequests, testEmail } from './support'

// The org readiness assessment is the main B2B lead funnel:
// "Take the assessment" CTA → /ai-readiness (landing) → /ai-transformation/assessment →
// company step → 24 scored questions → the optional workflow step → results, with the lead,
// the assessment, its question-set version and the named workflow all persisted.

test('assessment funnel: CTA → questions → results, persisted', async ({ page }) => {
  test.setTimeout(90_000)
  const errors = collectErrors(page)
  const email = testEmail('assessment')

  // Company analysis needs live Firecrawl + OpenRouter, which E2E never calls. Answer
  // the way the client treats a skipped analysis, so the rest of the flow runs as in prod.
  await page.route('**/api/analyze-company', (route) =>
    route.fulfill({ status: 200, json: { success: false, error: 'analysis skipped in e2e' } }),
  )

  // Entry: the "Take the assessment" CTA used across the site goes to the /ai-readiness
  // landing page, whose own CTA opens the form.
  await page.goto('/learn')
  await page.getByRole('link', { name: 'Take the assessment' }).first().click()
  await expect(page).toHaveURL(/\/ai-readiness$/)
  await page.getByRole('link', { name: 'Take the assessment' }).first().click()
  await expect(page).toHaveURL(/\/ai-transformation\/assessment$/)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  // Company step: start stays disabled until the required fields are filled.
  const start = page.getByRole('button', { name: 'Start the assessment' })
  await expect(start).toBeDisabled()
  await page.getByLabel('Work Email').fill(email)
  // Index 2 is "50-150 employees": the full 24-question set (only 1-50 skips two).
  await page.getByLabel('Team size').selectOption({ index: 2 })
  await page.getByLabel('Annual revenue').selectOption({ index: 2 })
  await expect(start).toBeEnabled()
  await start.click()

  // Answer every question with its second option until the workflow step shows.
  const form = page.locator('.assessment-form')
  const question = form.locator('.flow-assessment h2')
  const workflowStep = form.locator('.workflow-module')
  const complete = page.getByText('Assessment Complete')
  let answered = 0
  while (!(await workflowStep.isVisible())) {
    await expect(question.or(workflowStep).first()).toBeVisible({ timeout: 10_000 })
    if (await workflowStep.isVisible()) break
    const text = await question.textContent()
    await form.locator('.space-y-3 > button').nth(1).click()
    answered++
    await expect(async () => {
      const done = await workflowStep.isVisible()
      const moved = (await question.count()) > 0 && (await question.textContent()) !== text
      expect(done || moved).toBe(true)
    }).toPass({ timeout: 10_000 })
    expect(answered, 'runaway question loop').toBeLessThan(40)
  }
  expect(answered).toBe(24)

  // The workflow step: name one workflow, then see the report.
  await page.getByLabel('Type of work').selectOption('support')
  await page.getByLabel('People doing this work').fill('4')
  await page.getByLabel('Hours a week, each').fill('10')
  await page.getByRole('button', { name: 'See my report', exact: true }).click()

  await expect(complete).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('Your AI Archetype')).toBeVisible()
  await expect(page.getByText(`Report sent to ${email}`)).toBeVisible()

  // Persistence: the lead (captured at the company step) and the assessment row.
  const supabase = db()
  await expect(async () => {
    const { data: lead } = await supabase.from('assessment_leads').select('email').eq('email', email)
    expect(lead).toHaveLength(1)
  }).toPass({ timeout: 10_000 })

  const { data: rows, error } = await supabase
    .from('assessments')
    .select('email, overall_score, status, dimension_scores, team_size, revenue_band, instrument_version, workflows, answers')
    .eq('email', email)
  expect(error).toBeNull()
  expect(rows).toHaveLength(1)
  expect(rows![0].status).toBe('delivered')
  expect(rows![0].instrument_version).toBe(2)
  expect(Object.keys(rows![0].answers as Record<string, number>)).toHaveLength(24)
  expect(rows![0].workflows).toEqual({ currency: 'USD', items: [{ id: 'support', people: 4, hoursPerWeek: 10, hourlyCost: null }] })
  // Every answer was the 70-point option, so the overall score is 70.
  expect(rows![0].overall_score).toBe(70)
  const dims = rows![0].dimension_scores as Record<string, number>
  expect(Object.keys(dims)).toHaveLength(6)
  expect(Object.values(dims).every((score) => score === 70)).toBe(true)
  expect(rows![0].team_size).toBeTruthy()
  expect(rows![0].revenue_band).toBeTruthy()

  // The receipt email went to the (stubbed) provider, never a real one.
  await expect(async () => {
    const sent = (await stubRequests()).filter(
      (r) => r.path.startsWith('/emails') && JSON.stringify(r.body).includes(email),
    )
    expect(sent.length).toBeGreaterThan(0)
  }).toPass({ timeout: 10_000 })

  expect(errors).toEqual([])
})
