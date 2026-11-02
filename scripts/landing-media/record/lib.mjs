import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
export const BASE = process.env.BASE_URL || 'http://localhost:3117';
export async function open({ width, height, dpr, mobile = false }) {
  const b = await chromium.launch({ channel: 'chrome', headless: true, args: process.env.FDSF ? [`--force-device-scale-factor=${process.env.FDSF}`] : [] });
  const ctx = await b.newContext({ viewport: { width, height }, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile, colorScheme: 'light', reducedMotion: 'no-preference' });
  await ctx.addInitScript(() => {
    const css = 'nextjs-portal{display:none!important} *{scrollbar-width:none!important} ::-webkit-scrollbar{display:none!important}';
    document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); });
  });
  const p = await ctx.newPage();
  // Synthetic run: nothing is stored, sent or counted. Every API write is stubbed (funnel events,
  // lead capture, website analysis, inquiries, feedback, whitepaper, ...). The one exception is the
  // assessment POST, which goes through with the honeypot set so the server scores it and returns the
  // real report without saving or emailing. GET requests (form token) pass through.
  await p.route('**/api/**', async r => {
    const req = r.request();
    if (req.method() === 'GET') return r.continue();
    const url = new URL(req.url());
    if (/^\/api\/(assessments|eu-ai-act-assessments)$/.test(url.pathname)) {
      const body = JSON.parse(req.postData()); body._gotcha = 'synthetic-recording';
      return r.continue({ postData: JSON.stringify(body) });
    }
    if (url.pathname === '/api/analyze-company') return r.fulfill({ status: 200, json: { success: false, error: 'skipped' } });
    return r.fulfill({ status: 200, json: { success: true } });
  });
  return { b, ctx, p };
}
export async function startRec(p, dir, w, h) {
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const cdp = await p.context().newCDPSession(p);
  const frames = [];
  cdp.on('Page.screencastFrame', async f => {
    const n = frames.length; const file = path.join(dir, `f${String(n).padStart(5, '0')}.jpg`);
    fs.writeFileSync(file, Buffer.from(f.data, 'base64'));
    frames.push({ file, t: f.metadata.timestamp });
    cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 95, maxWidth: w, maxHeight: h, everyNthFrame: 1 });
  const t0 = Date.now() / 1000;
  return { async stop() {
    const t1 = Date.now() / 1000;
    await cdp.send('Page.stopScreencast');
    // concat list with real durations (screencast only emits on change)
    let txt = '';
    for (let i = 0; i < frames.length; i++) {
      const d = (i + 1 < frames.length ? frames[i + 1].t : t1) - frames[i].t;
      txt += `file '${frames[i].file}'\nduration ${Math.max(d, 0.001).toFixed(4)}\n`;
    }
    txt += `file '${frames[frames.length - 1].file}'\n`;
    fs.writeFileSync(path.join(dir, 'list.txt'), txt);
    console.log(`frames=${frames.length} span=${(t1 - frames[0].t).toFixed(1)}s`);
  } };
}
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export async function smoothScroll(p, dy, ms) {
  await p.evaluate(async ([dy, ms]) => {
    const y0 = window.scrollY, t0 = performance.now();
    await new Promise(res => { const step = now => { const k = Math.min(1, (now - t0) / ms); const e = k < .5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2) / 2; window.scrollTo(0, y0 + dy * e); k < 1 ? requestAnimationFrame(step) : res(); }; requestAnimationFrame(step); });
  }, [dy, ms]);
}
