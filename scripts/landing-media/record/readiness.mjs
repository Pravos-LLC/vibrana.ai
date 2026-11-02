// node readiness.mjs <out_dir> <w> <h> <dpr> <mobile 0|1>
import { open, startRec, sleep, smoothScroll, BASE } from './lib.mjs';
const [out, W, H, DPR, MOB] = process.argv.slice(2); const w = +W, h = +H, dpr = +DPR, mobile = MOB === '1';
const { b, p } = await open({ width: w, height: h, dpr, mobile });
await p.goto(`${BASE}/ai-transformation/assessment`, { waitUntil: 'networkidle' });
await p.fill('input[type=email]', 'dana@lumenworks.example');
const sels = p.locator('select'); await sels.nth(0).selectOption({ index: 3 }); await sels.nth(1).selectOption({ index: 3 });
await p.getByRole('button', { name: /Start the assessment/ }).click();
await sleep(1200);
// frame the question card
const q = p.getByText(/Question 1 of/i).first();
await q.scrollIntoViewIfNeeded();
await p.evaluate(m => { const el = [...document.querySelectorAll('span')].find(s => /Question 1 of/i.test(s.textContent)); const r = el.getBoundingClientRect(); window.scrollBy(0, r.top - (m ? 90 : 100)); }, mobile);
await sleep(800);
const rec = await startRec(p, `${out}/frames`, Math.round(w * dpr), Math.round(h * dpr));
await sleep(600);
const pattern = [3,2,3,4,2,3,1,2,3,3,2,4,3,2,2,3,4,3,2,1,3,2,3,3,2,3];
for (let i = 0; i < 30; i++) {
  const txt = await p.locator('main').innerText();
  if (!/Question \d+ of/i.test(txt)) break;
  await p.keyboard.press(String(pattern[i]));
  await sleep(850);
}
await sleep(500);
await p.locator('select').filter({ hasText: 'Choose a type of work' }).selectOption({ index: 1 });
const nums = p.locator('main input[type=number], main input[inputmode]');
await nums.nth(0).fill('6'); await sleep(250); await nums.nth(1).fill('10'); await sleep(250); await nums.nth(2).fill('55'); await sleep(500);
await p.getByRole('button', { name: 'See my report', exact: true }).click();
await sleep(2800);
await p.getByRole('button', { name: /View Full Report/ }).click();
await sleep(2500);
await smoothScroll(p, mobile ? 1400 : 1000, 3500);
await sleep(800);
await rec.stop();
await b.close();
