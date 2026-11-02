import { open, sleep, BASE } from './lib.mjs';
const out = process.argv[2];
const { b, p } = await open({ width: 1280, height: 800, dpr: 1.25 });
await p.goto(`${BASE}/ai-transformation/assessment`, { waitUntil: 'networkidle' });
await p.fill('input[type=email]', 'dana@lumenworks.example');
const sels = p.locator('select'); await sels.nth(0).selectOption({ index: 3 }); await sels.nth(1).selectOption({ index: 3 });
await p.getByRole('button', { name: /Start the assessment/ }).click();
await sleep(1200);
const pattern = [3,2,3,4,2,3,1,2,3,3,2,4,3,2,2,3,4,3,2,1,3,2,3,3,2,3];
for (let i = 0; i < 9; i++) { await p.keyboard.press(String(pattern[i])); await sleep(700); }
await p.evaluate(() => { for (const el of document.querySelectorAll('body *')) { const cs = getComputedStyle(el); if ((cs.position === 'fixed' || cs.position === 'sticky') && el.getBoundingClientRect().top < 5 && el.getBoundingClientRect().height < 140) el.style.visibility = 'hidden'; } });
await p.evaluate(() => { const el = [...document.querySelectorAll('span')].find(s => /Question \d+ of/i.test(s.textContent)); const r = el.getBoundingClientRect(); window.scrollBy(0, r.top - 150); });
await p.evaluate(() => { const el = [...document.querySelectorAll('div,span,p')].find(d => d.textContent.trim() === 'AI ARCHETYPE'); if (el) { const r = el.getBoundingClientRect(); window.scrollBy(0, r.top - 56); } });
await sleep(900);
await p.screenshot({ path: `${out}/readiness-question.png` });
for (let i = 10; i < 60; i++) { if (!/Question \d+ of/i.test(await p.locator('main').innerText())) break; await p.keyboard.press(String(pattern[i % pattern.length])); await sleep(450); }
await p.locator('select').filter({ hasText: 'Choose a type of work' }).selectOption({ index: 1 });
const nums = p.locator('main input[type=number], main input[inputmode]');
await nums.nth(0).fill('6'); await nums.nth(1).fill('10'); await nums.nth(2).fill('55');
await p.getByRole('button', { name: 'See my report', exact: true }).click();
await sleep(2500);
await p.getByRole('button', { name: /View Full Report/ }).click();
await sleep(2500);
await p.evaluate(() => { for (const el of document.querySelectorAll('body *')) { const cs = getComputedStyle(el); if ((cs.position === 'fixed' || cs.position === 'sticky') && el.getBoundingClientRect().top < 5 && el.getBoundingClientRect().height < 140) el.style.visibility = 'hidden'; } });
const y = await p.evaluate(() => { const el = [...document.querySelectorAll('h1,h2')].find(e => e.textContent.trim() === 'Lumenworks'); return el.getBoundingClientRect().top + window.scrollY; });
await p.evaluate(() => { const t = [...document.querySelectorAll('div')].filter(d => d.textContent.trim().startsWith('A copy of this report')).pop(); let e = t; while (e && e.parentElement && e.parentElement.getBoundingClientRect().height < 90) e = e.parentElement; if (e) e.style.display = 'none'; });
await p.evaluate(y => window.scrollTo(0, y - 140), y); await sleep(1200);
await p.screenshot({ path: `${out}/readiness-profile.png` });
await b.close();
