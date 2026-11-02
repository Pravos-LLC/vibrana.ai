import { open, startRec, sleep, smoothScroll, BASE } from './lib.mjs';
const [out, W, H, DPR, MOB] = process.argv.slice(2); const w = +W, h = +H, dpr = +DPR, mobile = MOB === '1';
const { b, p } = await open({ width: w, height: h, dpr, mobile });
await p.goto(`${BASE}/eu-ai-act-readiness/assessment`, { waitUntil: 'networkidle' });
await p.fill('#eu-email', 'lena@northwind-logistics.example');
await p.fill('#eu-company', 'Northwind Logistics');
await p.selectOption('#eu-team', { index: 3 }); await p.selectOption('#eu-revenue', { index: 3 });
await p.getByRole('button', { name: /start/i }).last().click();
await sleep(1200);
await p.evaluate(m => { const el = [...document.querySelectorAll('span')].find(s => /Question \d+ of/i.test(s.textContent)); const r = el.getBoundingClientRect(); window.scrollBy(0, r.top - (m ? 90 : 120)); }, mobile);
await sleep(600);
const rec = await startRec(p, `${out}/frames`, Math.round(w * dpr), Math.round(h * dpr));
await sleep(600);
const pattern = [1,1,2,1,1,2,1,3,1,2,2,1,1,3,2,1,2,1,1,2,3,1,2,1,1,2,1,2,1,1];
let n = 0;
for (let i = 0; i < 80; i++) {
  if (!/Question \d+ of/i.test(await p.locator('main').innerText())) break;
  await p.keyboard.press(String(pattern[i % pattern.length])); n++;
  await sleep(800);
}
console.log('answered', n, 'url', p.url());
await p.waitForURL(/results/, { timeout: 15000 }).catch(() => {});
await sleep(3000);
const H2 = await p.evaluate(() => document.body.scrollHeight);
console.log('results height', H2);
await smoothScroll(p, Math.min(H2 - h - 800, mobile ? 5200 : 4200), 14000);
await sleep(1000);
await rec.stop();
await b.close();
