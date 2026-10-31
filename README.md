# Vibrana website

Public source for the live Vibrana website, assessments, inquiries and anonymous feedback. The canonical repository is [Pravos-LLC/vibrana.ai](https://github.com/Pravos-LLC/vibrana.ai), with protected `master` serving [www.vibrana.ai](https://www.vibrana.ai) through the Vercel `vibrana-ai` project. The production cutover completed on October 31, 2026. See [operations](docs/operations.md) before changing deployment or runtime configuration, and [AGENTS.md](AGENTS.md) for agent instructions.

## Local development and checks

Requires Node.js 24 and npm. Run `npm ci`, copy `.env.example` to `.env.local`, and supply your own local Supabase URL and service key. For local database setup run `supabase start`. Use a local email stub or your own test provider. Run `npm run dev` and visit http://localhost:3002. Never use production credentials for development or tests.

Checks: `npm run typecheck`, `npm run lint`, `npm run guardrail`, and `npm run test:coverage`. Database and end-to-end checks require Docker and the Supabase CLI; see [E2E instructions](e2e/README.md) and the checked-in CI workflows. Public CI uses synthetic fixtures and local services.

Draft case studies are hidden by default. Explicit local review requires `NODE_ENV=development` and `VIBRANA_CASE_STUDY_DRAFTS=1`. Hosted deployments cannot enable draft review.

## Samples and production data

The public defaults use cleared illustrations, synthetic SAMPLE interface diagrams and text attribution in place of excluded portraits and company marks. Decorative video is static. The sample download is a text guide; the sticker ZIP contains 32 approved WebP previews, not original print files. These defaults support local development, public CI and the separate sample preview. Production combines the public implementation with reviewed display data and approved media delivered through production-only configuration. Approved display values and selected assessment questions intentionally reach the browser; credentials and private input envelopes do not. See [display data](scripts/site-content/README.md).

Feedback forms are anonymous unless a respondent voluntarily provides contact details. The dynamic page and submission API share the validated server-only `FEEDBACK_FORMS_JSON` configuration. Real forms are configured only in Production; hosted previews cannot consume that envelope. The synthetic `sample-feedback` fixture is available locally and in isolated tests. No invitation tokens or recipient mapping are used. See [feedback configuration](docs/feedback-configuration.md).

Source-available under FSL-1.1-ALv2, with the Apache-2.0 future license as described in LICENSE. The npm package remains private.
