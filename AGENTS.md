# Agent instructions: Vibrana website

Read [CLAUDE.md](CLAUDE.md), [.claude/RESOLVER.md](.claude/RESOLVER.md) and [operations](docs/operations.md) before acting. This public repository is the live implementation; private historical archives are not development roots.

- Work in an isolated task worktree. In a managed Vibrana hub, create it with `bin/vibrana wt add vibrana.ai <type>/<task>` from the hub root. Preserve existing dirty work and keep primary checkouts on their default branch.
- Use the codebase knowledge graph first for code discovery, project `vibrana.ai`; verify freshness against the current worktree. Targeted text searches are appropriate for docs, literals or unavailable graph results.
- Keep public fixtures synthetic. Never commit private client identities, configuration payloads, credentials, invitation data or private corpus links. Use local services for tests; public CI must not receive production secrets.
- Keep user-facing copy in content modules. Preserve source-backed claims, media rights, license notices and consent wording/version checks. Use the approved brand/copy workflow where available; do not invent facts or fabricate endorsements.
- Before a code PR, run `npm run typecheck`, `npm run lint`, `npm run guardrail` and `npm run test:coverage`, plus relevant database/browser checks. Never lower thresholds or bypass security checks. Docs-only changes require scoped diff/link/confidentiality checks; normal hosted CI still applies.
- Use the maintainer's configured Git identity for work on their behalf; keep branch names, commits and PR text neutral. Preserve third-party authorship and license notices.
- Use conventional commits, explicit staged paths and one PR per task, linked to its tracker issue. Required green CI and independent exact-head review precede merge. A protected `master` merge deploys production: follow assigned release ownership and verify the deployment afterward. Never use the Vercel CLI to deploy.
