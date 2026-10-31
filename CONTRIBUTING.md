# Contributing

Open an issue describing the problem and expected behavior. Keep changes scoped, retain license notices, and run the checks in README before submitting a pull request. Use synthetic test data and local services. Never include client records, private strategy, secrets, or unapproved media.

Read [AGENTS.md](AGENTS.md) and [operations](docs/operations.md) before changing deployment or runtime behavior. Use an isolated task worktree and keep fixtures synthetic. Required executable CI and independent exact-head review must pass before merging. Protected `master` merges deploy the live website; the assigned release owner verifies the deployment. The separate sample preview remains on `publication-production-held`; production-project previews stay disabled. Do not deploy with the Vercel CLI.
