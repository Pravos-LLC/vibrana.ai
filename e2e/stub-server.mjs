// Local stand-in for Resend during E2E runs.
//
// The app is started with RESEND_BASE_URL pointing here, so no test reaches
// the real email provider. Tests read recorded requests from GET /__requests.
/* global process, console, URL */
import http from 'node:http'

const port = Number(process.env.STUB_PORT || 4217)
const requests = []
// Unique across stub restarts so email IDs never collide.
const runId = Date.now().toString(36)

function parseBody(raw, contentType = '') {
  if (!raw) return null
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(raw)
    } catch {
      return raw
    }
  }
  return raw
}

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

const server = http.createServer((req, res) => {
  let raw = ''
  req.on('data', (chunk) => (raw += chunk))
  req.on('end', () => {
    const url = new URL(req.url, `http://localhost:${port}`)

    if (url.pathname === '/__requests') {
      if (req.method === 'DELETE') requests.length = 0
      return json(res, 200, requests)
    }
    if (url.pathname === '/__health') return json(res, 200, { ok: true })

    const body = parseBody(raw, req.headers['content-type'])
    requests.push({ method: req.method, path: url.pathname, body, at: new Date().toISOString() })

    // Resend: POST /emails (and /emails/batch)
    if (req.method === 'POST' && url.pathname.startsWith('/emails')) {
      return json(res, 200, { id: `email_e2e_${runId}_${requests.length}` })
    }

    return json(res, 404, { error: { message: `stub: no handler for ${req.method} ${url.pathname}` } })
  })
})

server.listen(port, () => {
  console.log(`[stub] Resend stub listening on http://localhost:${port}`)
})
