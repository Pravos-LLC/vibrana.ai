# Website

Next.js website with assessment, inquiry, and email workflows.

Requires Node.js 24 and npm. Run `npm ci`, copy `.env.example` to `.env.local`, and supply your own local Supabase URL and service key. For local database setup run `supabase start`. Use a local email stub or your own test provider. Run `npm run dev` and visit http://localhost:3002. Never use production credentials for development or tests.

Checks: `npm run typecheck`, `npm run lint`, `npm run guardrail`, and `npm run test:coverage`. Database and end-to-end checks require Docker and the Supabase CLI; see the checked-in CI workflows and `scripts/e2e-env.sh`.

Draft case studies are hidden by default. Explicit local review requires `NODE_ENV=development` and `VIBRANA_CASE_STUDY_DRAFTS=1`. Hosted deployments cannot enable draft review.

This public demo uses cleared illustrations, synthetic SAMPLE interface diagrams and text attribution in place of excluded portraits and company marks. Decorative video is static. The download fixture is a text guide; the sticker ZIP contains32approved WebP previews, not original print files. Production private data and media delivery are separate configuration.

Feedback forms are anonymous unless a respondent voluntarily provides contact details. Both the dynamic page and submission API use the same server-only `FEEDBACK_FORMS_JSON` configuration: `{ "schema": 1, "forms": { "form-slug": FeedbackFormConfig } }`. See [feedback configuration](docs/feedback-configuration.md). Hosted deployments require this configuration; the synthetic `sample-feedback` fixture is available only in local development and tests. No invitation tokens or recipient mapping are used.

Source-available under FSL-1.1-ALv2, with the Apache-2.0 future license as described in LICENSE. The npm package remains private.
