import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { gzipSync } from 'node:zlib'
import { prepareSite } from './prepare.mjs'
const hash = (v) => createHash('sha256').update(v).digest('hex')
const sha = 'a'.repeat(40)
async function fixture(run) {
  const root = await mkdtemp(path.join(tmpdir(), 'site-content-'))
  await mkdir(path.join(root, 'src/site-content'), { recursive: true })
  await mkdir(path.join(root, 'scripts/site-content'), { recursive: true })
  await writeFile(path.join(root, 'scripts/site-content/keys.json'), '["hero"]')
  await writeFile(path.join(root, 'scripts/site-content/required-keys.json'), '["hero"]')
  const bytes = Buffer.from('synthetic asset')
  const config = { schema: 1, sourceRevision: sha, releaseRevision: sha, content: { hero: { heading: 'Synthetic' } }, assets: [{ path: '/assets/sample.webp', url: 'https://www.vibrana.ai/assets/sample.webp', bytes: bytes.length, sha256: hash(bytes) }] }
  const envFor = (value = config) => { const raw = JSON.stringify(value); return { VERCEL_ENV: 'production', VERCEL_GIT_REPO_OWNER: 'Pravos-LLC', VERCEL_GIT_REPO_SLUG: 'vibrana.ai', VERCEL_GIT_COMMIT_REF: 'master', VERCEL_GIT_COMMIT_SHA: sha, VERCEL_GIT_PROVIDER: 'github', VERCEL_GIT_REPO_ID: '1440507720', VERCEL_PROJECT_ID: 'prj_9nu4Co7m22huDUI68fh1r1Q3IqV7', VERCEL_DEPLOYMENT_ID: 'dpl_synthetic', PRODUCTION_SITE_CONTENT_JSON: raw, PRODUCTION_SITE_CONTENT_DIGEST: hash(raw) } }
  try { await run({ root, config, bytes, envFor }) } finally { await rm(root, { recursive: true, force: true }) }
}
test('previews ignore private configuration and never fetch', () => fixture(async ({ root, envFor }) => {
  const result = await prepareSite({ root, env: { ...envFor(), VERCEL_ENV: 'preview' }, fetcher: () => { throw Error('unexpected fetch') } })
  assert.equal(result.production, false)
  await assert.rejects(readFile(path.join(root, 'src/site-content/generated.production.json')), { code: 'ENOENT' })
}))
test('trusted production verifies assets and emits only display data', () => fixture(async ({ root, config, bytes, envFor }) => {
  const result = await prepareSite({ root, env: envFor(), fetcher: async () => new Response(bytes) })
  assert.equal(result.assets, 1)
  assert.deepEqual(await readFile(path.join(root, 'public/assets/sample.webp')), bytes)
  const generated = JSON.parse(await readFile(path.join(root, 'src/site-content/generated.production.json')))
  assert.equal(generated.production, true)
  assert.deepEqual(generated.content, config.content)
  assert.equal(generated.binding.VERCEL_DEPLOYMENT_ID, 'dpl_synthetic')
}))
test('compressed envelope retains the exact JSON digest', () => fixture(async ({ root, bytes, envFor }) => {
  const env = envFor(); env.PRODUCTION_SITE_CONTENT_GZIP_BASE64 = gzipSync(env.PRODUCTION_SITE_CONTENT_JSON).toString('base64'); delete env.PRODUCTION_SITE_CONTENT_JSON
  assert.equal((await prepareSite({ root, env, fetcher: async () => new Response(bytes) })).production, true)
}))
test('missing, stale, incomplete, untrusted and corrupt production inputs fail closed', () => fixture(async ({ root, config, bytes, envFor }) => {
  const invalid = [undefined, { ...envFor(), VERCEL_GIT_COMMIT_SHA: 'invalid' }, { ...envFor(), VERCEL_GIT_COMMIT_REF: 'untrusted' }, { ...envFor(), PRODUCTION_SITE_CONTENT_DIGEST: '0'.repeat(64) }, envFor({ ...config, content: {} }), envFor({ ...config, content: { unknown: 'x' } }), envFor({ ...config, assets: [{ ...config.assets[0], path: '/assets/../escape' }] }), envFor({ ...config, assets: [{ ...config.assets[0], url: 'https://example.com/assets/sample.webp' }] })]
  for (const env of invalid) await assert.rejects(prepareSite({ root, env: env ?? { VERCEL_ENV: 'production' }, fetcher: async () => new Response(bytes) }))
  await assert.rejects(prepareSite({ root, env: envFor(), fetcher: async () => new Response('wrong') }))
}))
test('identical content can be delivered to distinct paths and is removed for a sample build', () => fixture(async ({ root, config, bytes, envFor }) => {
  const second = { ...config.assets[0], path: '/assets/second.webp', url: 'https://www.vibrana.ai/assets/second.webp' }
  await prepareSite({ root, env: envFor({ ...config, assets: [...config.assets, second] }), fetcher: async () => new Response(bytes) })
  assert.deepEqual(await readFile(path.join(root, 'public/assets/second.webp')), bytes)
  await prepareSite({ root, env: { VERCEL_ENV: 'preview' } })
  for (const name of ['sample.webp', 'second.webp']) await assert.rejects(readFile(path.join(root, 'public/assets', name)), { code: 'ENOENT' })
  await assert.rejects(readFile(path.join(root, 'src/site-content/generated.production.json')), { code: 'ENOENT' })
}))
test('sample cleanup restores an overwritten public sample asset', () => fixture(async ({ root, config, bytes, envFor }) => {
  await mkdir(path.join(root, 'public/assets'), { recursive: true })
  await writeFile(path.join(root, 'public/assets/sample.webp'), 'original public sample')
  await prepareSite({ root, env: envFor(), fetcher: async () => new Response(bytes) })
  await prepareSite({ root, env: { VERCEL_ENV: 'preview' } })
  assert.equal(await readFile(path.join(root, 'public/assets/sample.webp'), 'utf8'), 'original public sample')
}))
test('protected asset delivery scopes its header to the pinned immutable origin', () => fixture(async ({ root, config, bytes, envFor }) => {
  const origin = 'https://vibrana-abcdef123-johnellisons-projects.vercel.app'
  const value = { ...config, assetOrigin: origin, assets: [...config.assets, { ...config.assets[0], path: '/assets/portrait.webp', url: origin + '/assets/portrait.webp' }] }
  const secret = 'synthetic-build-only-secret'
  const calls = []
  await prepareSite({ root, env: { ...envFor(value), PRODUCTION_SITE_ASSET_BYPASS_SECRET: secret }, fetcher: async (url, options) => { calls.push({ url, ...options }); return new Response(bytes) } })
  assert.deepEqual(calls.map(c => c.headers), [{}, { 'x-vercel-protection-bypass': secret }])
  assert.ok(calls.every(c => c.redirect === 'error'))
  for (const file of ['src/site-content/generated.production.json', 'public/.well-known/site-content-release.json']) assert.ok(!(await readFile(path.join(root, file), 'utf8')).includes(secret))
}))
test('protected assets reject missing credentials and malformed or unpinned origins before fetching', () => fixture(async ({ root, config, envFor }) => {
  const origin = 'https://vibrana-abcdef123-johnellisons-projects.vercel.app'
  const protectedAsset = { ...config.assets[0], url: origin + config.assets[0].path }
  const invalid = [
    { ...config, assets: [protectedAsset] },
    { ...config, assetOrigin: origin, assets: [protectedAsset] },
    ...['https://example.com', origin + '/', origin + ':443', 'https://vibrana-git-master-johnellisons-projects.vercel.app', origin + '@example.com'].map(assetOrigin => ({ ...config, assetOrigin })),
  ]
  for (const value of invalid) await assert.rejects(prepareSite({ root, env: envFor(value), fetcher: () => { throw Error('must not fetch') } }), /Untrusted|credential/)
}))
