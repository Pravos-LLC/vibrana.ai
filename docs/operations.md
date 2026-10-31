# Website operations

## Current topology

As of the October 31, 2026 cutover, the public `Pravos-LLC/vibrana.ai` repository is the active implementation source. Protected `master` is connected to the Vercel `vibrana-ai` project and serves `https://www.vibrana.ai`. This is the production application, not an unconnected source export. Private historical repositories retain ref-frozen history with Actions disabled; they are not active development roots. This is a release preservation policy, not a claim that all repository metadata is technically immutable. Do not develop there or copy their history, corpus, configuration or private content into this repository.

A merge to `master` triggers a production deployment. Standing release practice is to merge after required executable CI is green and an independent exact-head review has resolved blocking findings, then verify the resulting deployment and public routes. Preserve repository protections and security checks. Use the normal Git integration; do not deploy with the Vercel CLI. A task can assign merge and verification to a release coordinator; contributors must respect that ownership.

## Preview and test isolation

The separate public sample preview stays on `publication-production-held`. It deliberately uses sample defaults and does not follow production `master`. Preview execution on the real production project is disabled. Do not re-enable it to test a PR, promote the held branch to production, or supply production configuration to a preview. Use local services and synthetic fixtures for development and public CI, including database and email tests.

## Runtime configuration and public display

Production alone receives the private website display envelope and feedback form configuration. Follow [display-data validation](../scripts/site-content/README.md) and [feedback configuration](feedback-configuration.md). Never place private payloads, client form identities, credentials or invitation data in Git, PRs, logs, build reports or public CI.

The configuration boundary does not mean all rendered content is secret or server-only. Reviewed display data, approved media and selected assessment questions are intentionally public when rendered. Input envelopes, credentials, unpublished material and unselected private records remain private. A form's configured display fields are intentionally visible at its anonymous shared route; `noindex` is not authentication.

The display-data source revision and digest identify the approved data independently of ordinary application commits. Protected releases bind the actual application commit during preparation and server validation. Do not require a new environment pin for every application head or substitute a historical deployment SHA for the current release. Reconcile changed display keys with the production envelope before release; retain fail-closed validation.

## Database and rollback

Production retains the existing shared Supabase database. The reviewed forward grant migration was applied during cutover. Do not reset production or replay its historical migrations. Migration replay belongs to isolated local/CI databases; future production schema changes require reviewed forward migrations and explicit operational scope.

For a release incident, preserve the current deployment and configuration evidence privately and coordinate rollback through the existing deployment controls. Never overwrite unrelated dirty worktrees, rotate credentials casually, or replace the retained database to match a local fixture. Dated pre-cutover plans and research are historical evidence; this document supersedes their deployment topology claims.
