import { expect, test } from '@playwright/test'

/**
 * The motion studio is an internal tool: every /studio route, including the reel embeds, must 404
 * unless the server runs with VIBRANA_STUDIO=1. CI never sets the flag, so this locks the
 * production gate in (the smoke spec skips /studio for the same reason).
 */
for (const route of ['/studio/eu-ai-act-explainer', '/studio/meridian-proof', '/studio/embed/eu-ai-act-results']) {
  test(`${route} is gated (404 without VIBRANA_STUDIO)`, async ({ request }) => {
    const res = await request.get(route)
    expect(res.status(), `HTTP status for ${route}`).toBe(404)
  })
}
