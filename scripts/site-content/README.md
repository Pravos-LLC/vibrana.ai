# Trusted production display data

Public CI, local development and previews use the committed demo defaults. `npm run build`
prepares production data only for the canonical repository's protected `master` release.

The canonical project and repository IDs, GitHub provider, protected branch, deployment
ID and actual application commit are validated before loading production data. Server
consumption revalidates the emitted deployment binding.

Production configuration is server/build-only `PRODUCTION_SITE_CONTENT_JSON` or compressed
`PRODUCTION_SITE_CONTENT_GZIP_BASE64`, plus `PRODUCTION_SITE_CONTENT_DIGEST` (SHA256 of the
uncompressed JSON bytes). Both input forms together are rejected.

Schema 1 contains `sourceRevision` (the immutable 40-character data-source commit ID), `content`
(display-only values keyed by `keys.json`), and `assets` (`path`, `url`, `sha256`, `bytes`).
The actual protected application commit and data pins are stamped in the build's
`/.well-known/site-content-release.json`; ordinary reviewed master releases do not need
a replacement data envelope. Every `required-keys.json` entry must
be supplied. Asset URLs must use the current first-party domains, or the single optional
`assetOrigin` matching a pinned first-party Vercel deployment. Redirects are rejected.

The committed `generated.json` is always an empty sample. Production output is a
separate ignored JSON module selected by the production bundler configuration. The
preparer restores overwritten sample assets and removes fetched assets before a
subsequent preview build, preventing stale production payloads from serving there.

Only reviewed public display values may be placed in `content`. The preparation step emits
those values for the application; it never emits the input envelope, delivery URLs or pins.
Credentials, invitation identities, private strategy and unpublished content do not belong
in this envelope. Downloaded asset/document bytes are build outputs, never Git inputs.

`siteContent(key, demoDefault)` changes data without replacing application implementation.
Public source layout and behavior remain authoritative for future changes. Reconcile any
changed display key against the private envelope before a production release. Missing pins,
incomplete content, failed downloads and byte/hash mismatches fail the production build.
