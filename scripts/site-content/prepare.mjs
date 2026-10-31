import { gunzipSync } from 'node:zlib'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile, rename, rm, lstat } from 'node:fs/promises'
import path from 'node:path'

const sha = (value) => createHash('sha256').update(value).digest('hex')
const plain = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const safePath = (value) => typeof value === 'string' && /^\/(?:assets|logos|brand|images|downloads)\/[A-Za-z0-9_./ -]+$/.test(value) && !value.split('/').slice(1).some((part) => part === '..' || part === '.' || !part)
async function restoreAssets(root) {
  const cache = path.join(root, '.site-content-cache')
  try { if ((await lstat(cache)).isSymbolicLink()) throw new Error('Website build cache symlinks are forbidden') } catch (error) { if (error.code === 'ENOENT') return; throw error }
  let records
  try { records = JSON.parse(await readFile(path.join(cache, 'originals.json'), 'utf8')) } catch (error) { if (error.code === 'ENOENT') return; throw error }
  if (!Array.isArray(records)) throw new Error('Invalid website build cache')
  for (const record of records) {
    if (!safePath(record.path) || (record.original !== null && !/^[a-f0-9]{64}$/.test(record.original))) throw new Error('Invalid website build cache record')
    const destination = await safeDestination(root, record.path)
    if (record.original === null) await rm(destination, { force: true })
    else { const original = await readFile(path.join(cache, record.original)); if (sha(original) !== record.original) throw new Error('Website build cache integrity mismatch'); await writeFile(destination, original) }
  }
  await rm(cache, { recursive: true, force: true })
  await rm(path.join(root, 'public/.well-known/site-content-release.json'), { force: true })
}
async function safeDestination(root, assetPath) {
  const publicRoot = path.join(root, 'public')
  const destination = path.join(publicRoot, assetPath)
  const components = path.relative(root, destination).split(path.sep)
  let current = root
  for (const part of components) {
    current = path.join(current, part)
    try { if ((await lstat(current)).isSymbolicLink()) throw new Error('Website asset symlinks are forbidden') } catch (error) { if (error.code !== 'ENOENT') throw error }
  }
  return destination
}
export async function prepareSite({ root = process.cwd(), env = process.env, fetcher = fetch } = {}) {
  const target = path.join(root, 'src/site-content/generated.production.json')
  await restoreAssets(root)
  await rm(target, { force: true })
  let raw = env.PRODUCTION_SITE_CONTENT_JSON
  if (env.VERCEL_ENV === 'production' && env.PRODUCTION_SITE_CONTENT_GZIP_BASE64) {
    if (raw) throw new Error('Ambiguous production website configuration')
    raw = gunzipSync(Buffer.from(env.PRODUCTION_SITE_CONTENT_GZIP_BASE64, 'base64'), { maxOutputLength: 1_000_000 }).toString('utf8')
  }
  // Preview/test builds cannot opt into production by supplying a data envelope.
  if (env.VERCEL_ENV !== 'production') {
    await rm(target, { force: true })
    return { production: false, assets: 0 }
  }
  if (!raw || env.VERCEL_GIT_REPO_OWNER !== 'Pravos-LLC' || env.VERCEL_GIT_REPO_SLUG !== 'vibrana.ai' || env.VERCEL_GIT_COMMIT_REF !== 'master' || env.VERCEL_GIT_PROVIDER !== 'github' || env.VERCEL_GIT_REPO_ID !== '1440507720' || env.VERCEL_PROJECT_ID !== 'prj_9nu4Co7m22huDUI68fh1r1Q3IqV7' || !/^dpl_[A-Za-z0-9]+$/.test(env.VERCEL_DEPLOYMENT_ID ?? '')) throw new Error('Trusted production website content configuration is required')
  if (!/^[a-f0-9]{64}$/.test(env.PRODUCTION_SITE_CONTENT_DIGEST ?? '') || sha(raw) !== env.PRODUCTION_SITE_CONTENT_DIGEST) throw new Error('Production website content digest mismatch')
  const config = JSON.parse(raw)
  if (!plain(config) || config.schema !== 1 || !plain(config.content) || !Array.isArray(config.assets) || !/^[a-f0-9]{40}$/.test(config.sourceRevision ?? '')) throw new Error('Invalid production website content schema')
  if (!/^[a-f0-9]{40}$/.test(env.VERCEL_GIT_COMMIT_SHA ?? '')) throw new Error('Production website source revision missing')
  const keys = JSON.parse(await readFile(path.join(root, 'scripts/site-content/keys.json'), 'utf8'))
  for (const key of Object.keys(config.content)) if (!keys.includes(key)) throw new Error('Unknown website display content key')
  const required = JSON.parse(await readFile(path.join(root, 'scripts/site-content/required-keys.json'), 'utf8'))
  for (const key of required) if (!Object.prototype.hasOwnProperty.call(config.content, key)) throw new Error('Missing production website display content')
  if (JSON.stringify(config.content).length > 500_000 || config.assets.length > 1000) throw new Error('Production website content exceeds bounds')
  const inspectDisplay = (value) => {
    if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) return
    if (Array.isArray(value)) { value.forEach(inspectDisplay); return }
    if (!plain(value)) throw new Error('Invalid website display value')
    for (const [name, child] of Object.entries(value)) {
      if (/^(?:__proto__|constructor|prototype|prompt|promptSource|provenance|source|recipients|invitations|secrets|token|password)$/i.test(name)) throw new Error('Non-display website content is forbidden')
      inspectDisplay(child)
    }
  }
  inspectDisplay(config.content)
  const allowedOrigins = new Set(['https://www.vibrana.ai', 'https://vibrana.ai'])
  // An exact immutable deployment may be pinned by the operator; arbitrary hosts are rejected.
  const protectedOrigin = typeof config.assetOrigin === 'string' && /^https:\/\/vibrana-[a-z0-9]{9}-johnellisons-projects\.vercel\.app$/.test(config.assetOrigin)
  if (config.assetOrigin !== undefined) {
    if (!protectedOrigin && !(typeof config.assetOrigin === 'string' && /^https:\/\/vibrana-ai-[a-z0-9-]+\.vercel\.app$/.test(config.assetOrigin))) throw new Error('Untrusted website asset origin')
    allowedOrigins.add(config.assetOrigin)
  }
  const seen = new Set()
  for (const asset of config.assets) {
    if (!plain(asset) || !safePath(asset.path) || seen.has(asset.path) || !/^[a-f0-9]{64}$/.test(asset.sha256 ?? '') || !Number.isSafeInteger(asset.bytes) || asset.bytes < 1 || asset.bytes > 150_000_000) throw new Error('Invalid website asset record')
    const url = new URL(asset.url)
    if (!allowedOrigins.has(url.origin) || url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || decodeURIComponent(url.pathname) !== asset.path) throw new Error('Untrusted website asset URL')
    seen.add(asset.path)
    if (protectedOrigin && url.origin === config.assetOrigin && !env.PRODUCTION_SITE_ASSET_BYPASS_SECRET) throw new Error('Website asset delivery credential required')
  }
  const cache = path.join(root, '.site-content-cache')
  const staged = []
  const originals = []
  let succeeded = false
  try {
    await mkdir(cache, { recursive: true })
    for (const asset of config.assets) {
      const headers = protectedOrigin && new URL(asset.url).origin === config.assetOrigin
        ? { 'x-vercel-protection-bypass': env.PRODUCTION_SITE_ASSET_BYPASS_SECRET }
        : {}
      const response = await fetcher(asset.url, { headers, redirect: 'error', signal: AbortSignal.timeout(60_000) })
      if (!response.ok || !response.body) throw new Error('Website asset delivery failed')
      const chunks = []
      let length = 0
      for await (const chunk of response.body) {
        length += chunk.length
        if (length > asset.bytes) throw new Error('Website asset delivery exceeds pinned size')
        chunks.push(chunk)
      }
      const bytes = Buffer.concat(chunks)
      if (bytes.length !== asset.bytes || sha(bytes) !== asset.sha256) throw new Error('Website asset integrity mismatch')
      const destination = await safeDestination(root, asset.path)
      await mkdir(path.dirname(destination), { recursive: true })
      const temporary = path.join(cache, sha(asset.path) + '.download')
      await writeFile(temporary, bytes)
      let original = null
      try {
        const previous = await readFile(destination)
        original = sha(previous)
        await writeFile(path.join(cache, original), previous)
      } catch (error) { if (error.code !== 'ENOENT') throw error }
      originals.push({ path: asset.path, original })
      staged.push({ temporary, destination })
    }
    await writeFile(path.join(cache, 'originals.json'), JSON.stringify(originals))
    for (const entry of staged) await rename(entry.temporary, entry.destination)
    const binding = Object.fromEntries(['VERCEL_PROJECT_ID', 'VERCEL_DEPLOYMENT_ID', 'VERCEL_GIT_PROVIDER', 'VERCEL_GIT_REPO_ID', 'VERCEL_GIT_REPO_OWNER', 'VERCEL_GIT_REPO_SLUG', 'VERCEL_GIT_COMMIT_REF', 'VERCEL_GIT_COMMIT_SHA', 'PRODUCTION_SITE_CONTENT_DIGEST'].map((name) => [name, env[name]]))
    await writeFile(target, JSON.stringify({ schema: 1, production: true, content: config.content, binding }) + '\n')
    await mkdir(path.join(root, 'public/.well-known'), { recursive: true })
    await writeFile(path.join(root, 'public/.well-known/site-content-release.json'), JSON.stringify({ schema: 1, binding, applicationRevision: env.VERCEL_GIT_COMMIT_SHA, dataRevision: config.sourceRevision, dataDigest: env.PRODUCTION_SITE_CONTENT_DIGEST }) + '\n')
    succeeded = true
    return { production: true, assets: staged.length }
  } finally {
    for (const entry of staged) await rm(entry.temporary, { force: true })
    if (!succeeded) await restoreAssets(root)
  }
}
if (process.argv[1] === new URL(import.meta.url).pathname) {
  prepareSite().then((result) => process.stdout.write(JSON.stringify(result) + '\n')).catch(() => { process.stderr.write('Website production content preparation failed\n'); process.exitCode = 1 })
}
