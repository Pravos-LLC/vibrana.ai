// The readiness report's prioritized path: lowest areas, then the step-by-step plan.
import { open, startRec, sleep, smoothScroll, BASE } from './lib.mjs';
const [out, W, H, DPR, MOB] = process.argv.slice(2); const w = +W, h = +H, dpr = +DPR, mobile = MOB === '1';
const { b, p } = await open({ width: w, height: h, dpr, mobile });
await p.goto(`${BASE}/ai-transformation/assessment`, { waitUntil: 'networkidle' });
await p.fill('input[type=email]', 'dana@lumenworks.example');
const sels = p.locator('select'); await sels.nth(0).selectOption({ index: 3 }); await sels.nth(1).selectOption({ index: 3 });
await p.getByRole('button', { name: /Start the assessment/ }).click();
await sleep(1200);
const pattern = [3,2,3,4,2,3,1,2,3,3,2,4,3,2,2,3,4,3,2,1,3,2,3,3,2,3];
for (let i = 0; i < 60; i++) { if (!/Question \d+ of/i.test(await p.locator('main').innerText())) break; await p.keyboard.press(String(pattern[i % pattern.length])); await sleep(450); }
await p.locator('select').filter({ hasText: 'Choose a type of work' }).selectOption({ index: 1 });
const nums = p.locator('main input[type=number], main input[inputmode]');
await nums.nth(0).fill('6'); await nums.nth(1).fill('10'); await nums.nth(2).fill('55');
await p.getByRole('button', { name: 'See my report', exact: true }).click();
await sleep(2500);
await p.getByRole('button', { name: /View Full Report/ }).click();
await sleep(2500);
const yOf = t => p.evaluate(t => { const el = [...document.querySelectorAll('h2,h3,h4,p,span')].find(e => e.textContent.trim().startsWith(t)); return el ? el.getBoundingClientRect().top + window.scrollY : null; }, t);
const yLow = await yOf('Your lowest-scoring areas');
const yStart = await yOf('Start with support triage');
const yBuild = await yOf('Build it, then measure it');
console.log({ yLow, yStart, yBuild });
// pre-scroll through once so any scroll-reveal content has fired, then return
for (let y = yLow; y < yBuild + 600; y += 300) { await p.evaluate(y => window.scrollTo(0, y), y); await sleep(120); }
await p.evaluate(y => window.scrollTo(0, y), yLow - 110); await sleep(1200);
const rec = await startRec(p, `${out}/frames`, Math.round(w * dpr), Math.round(h * dpr));
await sleep(1500);
await smoothScroll(p, (yStart - 130) - (yLow - 110), 2500); await sleep(2000);
await smoothScroll(p, (yBuild - 130) - (yStart - 130), 6000); await sleep(1500);
await rec.stop();
await b.close();
