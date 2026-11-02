# Website operations

## Current topology

As of the October 31, 2026 cutover, the public `Pravos-LLC/vibrana.ai` repository is the active implementation source. Protected `master` is connected to the Vercel `vibrana-ai` project and serves `https://www.vibrana.ai`. This is the production application, not an unconnected source export. Private historical repositories retain ref-frozen history with Actions disabled; they are not active development roots. This is a release preservation policy, not a claim that all repository metadata is technically immutable. Do not develop there or copy their history, corpus, configuration or private content into this repository.

A merge to `master` triggers a production deployment. Standing release practice is to merge after required executable CI is green and an independent exact-head review has resolved blocking findings, then verify the resulting deployment and public routes. Preserve repository protections and security checks. Use the normal Git integration; do not deploy with the Vercel CLI. A task can assign merge and verification to a release coordinator; contributors must respect that ownership.

## Preview and test isolation

The separate public sample preview stays on `publication-production-held`. It deliberately uses sample defaults and does not follow production `master`. Preview execution on the real production project is disabled. Do not re-enable it to test a PR, promote the held branch to production, or supply production configuration to a preview. Use local services and synthetic fixtures for development and public CI, including database and email tests.

## Runtime configuration and public display

Production builds exactly what is committed; there is no private display envelope (removed 2026-11-02). Production alone receives the feedback form configuration; see [feedback configuration](feedback-configuration.md). Never place private payloads, client form identities, credentials or invitation data in Git, PRs, logs, build reports or public CI.

Credentials, unpublished material and unselected private records stay out of Git. A form's configured display fields are intentionally visible at its anonymous shared route; `noindex` is not authentication.

## Database and rollback

Production retains the existing shared Supabase database. The reviewed forward grant migration was applied during cutover. Do not reset production or replay its historical migrations. Migration replay belongs to isolated local/CI databases; future production schema changes require reviewed forward migrations and explicit operational scope.

For a release incident, preserve the current deployment and configuration evidence privately and coordinate rollback through the existing deployment controls. Never overwrite unrelated dirty worktrees, rotate credentials casually, or replace the retained database to match a local fixture. Dated pre-cutover plans and research are historical evidence; this document supersedes their deployment topology claims.
