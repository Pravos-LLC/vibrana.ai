# E2E tests (Playwright)

End-to-end tests of the key funnels, run on every PR by `.github/workflows/e2e.yml`
as the `e2e` check.

| Spec | Covers |
|---|---|
| `smoke.spec.ts` | Every public page under `app/` (found automatically) returns 200, has an `<h1>`, and logs no console or page errors. Also: case studies, homepage header/footer links, 404s. |
| `assessment.spec.ts` | "Take the assessment" CTA → `/ai-transformation/assessment` → all 24 questions → the workflow step (one workflow named) → results. Checks the lead row, the assessment row (scores, instrument version, answers, workflows) and the receipt email. |
| `feedback-v2.spec.ts` | Synthetic anonymous form: score-gated consent, stale-response draft retention/retry, mobile keyboard/Back behavior and button label contrast. UI submission responses are intercepted; unit tests separately exercise API/database/email contracts. |
| `inquiries.spec.ts` | `/ai-build-sprint` fit-call form: validation, saved row with UTM metadata, emails, calendar hand-off, honeypot rejection. `/contact` enterprise form: saved row and confirmation. |

## What runs where

- **Database:** a local Supabase stack with every migration replayed from scratch.
  `e2e/support.ts` refuses to run against any non-local Supabase URL.
- **Resend:** `e2e/stub-server.mjs` records every request so tests can assert
  what the server sent. The app uses `RESEND_BASE_URL` only in this local suite.
- **OpenRouter / Firecrawl:** keys are empty, so those features skip themselves. The
  assessment test intercepts `/api/analyze-company`.

## Run locally

```bash
supabase start                              # or: supabase start --workdir <dir>
eval "$(bash scripts/e2e-env.sh)"           # or: bash scripts/e2e-env.sh <dir>
NODE_OPTIONS=--max-old-space-size=6144 npm run build
npm run test:e2e                            # starts the stub + `next start` itself
```

The app runs on port 3217 and the stub on 4217 (`E2E_APP_PORT` / `STUB_PORT` override
them). Playwright never reuses an already-running server, so it can't accidentally
test some other app on the port.

These checks run against local services and synthetic configuration, never production. The Playwright server receives only its synthetic feedback envelope. The retained shared production Supabase database is not reset or replayed by this suite. Hosted production-project previews remain disabled; the separate public sample preview stays on `publication-production-held`. See [operations](../docs/operations.md).
