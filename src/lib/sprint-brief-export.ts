import { escapeHtml } from '@/lib/escape-html'
import { BRIEF_EXPORT as C } from '@/src/sprint-brief-export-content'
import { SPRINT_FIT_CALL_URL } from '@/src/ai-build-sprint-content'
import type { SprintBrief } from './sprint-brief'

export type BriefAssets = {
  mark?: string
  companyLogo?: string
  john?: string
  displayFont?: string
  bodyFont?: string
  bodySemiboldFont?: string
}

/** Only embedded assets are emitted into the downloaded document: no tracking requests. */
function dataAsset(value: string | undefined, kind: 'image' | 'font'): string {
  const pattern = kind === 'image' ? /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/ : /^data:font\/ttf;base64,[A-Za-z0-9+/=]+$/
  return value && pattern.test(value) ? value : ''
}

export function briefSafeLink(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null
  } catch { return null }
}

const number = (value: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value)
const money = (value: number, currency: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
export function briefCaseRows(brief: SprintBrief): [string, string][] {
  const r = brief.calculation
  const rows: [string, string][] = []
  for (const [label, value] of [[C.currentHours, r.currentHours], [C.targetHours, r.targetHours], [C.releasedHours, r.releasedHours]] as const) {
    if (value !== null) rows.push([label === C.releasedHours && value < 0 ? C.additionalHours : label, `${number(label === C.releasedHours ? Math.abs(value) : value)} ${C.hours}`])
  }
  for (const [label, value] of [[C.currentCost, r.currentCost], [C.targetCost, r.targetCost], [C.capacityValue, r.capacityValue], [C.softwareCost, r.inputs.softwareCostMonthly]] as const) {
    if (value !== null) rows.push([label === C.capacityValue && value < 0 ? C.additionalCost : label, money(label === C.capacityValue ? Math.abs(value) : value, r.inputs.currency)])
  }
  return rows
}
export function briefInputRows(brief: SprintBrief): [string, string][] {
  const i = brief.calculation.inputs
  const rows: [string, string][] = []
  for (const [label, value] of [[C.tasks, i.tasksPerWeek], [C.minutes, i.minutesPerTask], [C.people, i.peoplePerTask], [C.targetMinutes, i.targetMinutesPerTask]] as const) {
    if (value !== null) rows.push([label, number(value)])
  }
  if (i.hourlyCost !== null) rows.push([C.hourlyCost, money(i.hourlyCost, i.currency)])
  return rows
}
export function briefDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date)
}

const esc = escapeHtml
const scopeIcons = [`<svg class="scope-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`, `<svg class="scope-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2 8l10 5 10-5-10-5 M2 12l10 5 10-5 M2 16l10 5 10-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`, `<svg class="scope-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 22V3 M4 3h14l-3 5 3 5H4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`, `<svg class="scope-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V12 M10 20V4 M16 20V9 M22 20H2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`]
const list = (values: string[]) => `<ul>${values.map(value => `<li>${esc(value)}</li>`).join('')}</ul>`
const table = (rows: [string, string][]) => `<dl class="answer-list">${rows.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>`

/** Pure renderer shared with tests; its input is the saved server-computed brief. */
export function renderSprintBriefHtml(brief: SprintBrief, assets: BriefAssets = {}): string {
  const mark = dataAsset(assets.mark, 'image')
  const logo = dataAsset(assets.companyLogo, 'image')
  const john = dataAsset(assets.john, 'image')
  const font = (family: string, value: string | undefined, weight: number) => {
    const src = dataAsset(value, 'font')
    return src ? `@font-face{font-family:${family};src:url('${src}') format('truetype');font-weight:${weight};font-display:swap}` : ''
  }
  const scope = [brief.scope.user, brief.scope.task, brief.scope.firstRelease, brief.scope.successMeasure]
  const caseRows = briefCaseRows(brief)
  const inputRows = briefInputRows(brief)
  const benchmark = brief.benchmark
  const evidenceUrl = briefSafeLink(benchmark?.url)
  const website = briefSafeLink(brief.company.website)
  const source = briefSafeLink(brief.company.sourceUrl)
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'"><title>${esc(brief.company.name)} · ${esc(C.title)}</title><style>
${font('Bricolage', assets.displayFont, 600)}${font('Hanken', assets.bodyFont, 400)}${font('Hanken', assets.bodySemiboldFont, 600)}
*{box-sizing:border-box}body{margin:0;background:#f4f2f7;color:#211b2b;font:16px/1.65 Hanken,system-ui,sans-serif}main{max-width:960px;margin:40px auto;padding:50px 56px;background:#fff;border:1px solid #e7e1ed;border-radius:12px}header{display:flex;justify-content:space-between;align-items:center;gap:24px;border-bottom:1px solid #e8e3ed;padding-bottom:25px}.brand{display:flex;align-items:center;gap:10px;font:600 17px Bricolage,system-ui,sans-serif;letter-spacing:.02em}.brand img{width:34px;height:34px;object-fit:contain}.date{font-size:12px;color:#6b6375}h1,h2,h3{font-family:Bricolage,system-ui,sans-serif;font-weight:600;line-height:1.15;letter-spacing:-.03em;color:#211b2b}h1{font-size:42px;margin:38px 0 28px}h2{font-size:22px;margin:0 0 18px}h3{font-size:16px;margin:22px 0 12px}p{margin:0 0 16px;overflow-wrap:anywhere}a{color:#7131ca;text-decoration:underline;text-underline-offset:3px}.company{display:flex;align-items:center;gap:18px;margin:30px 0 24px}.company img{width:60px;height:60px;object-fit:contain;border-radius:6px}.company strong{font:600 25px/1.2 Bricolage,system-ui,sans-serif;letter-spacing:-.02em}.company a{display:block;font-size:13px;text-decoration:none;margin-top:8px}.eyebrow{color:#7131ca;font-size:10px;letter-spacing:.09em;text-transform:uppercase;font-weight:600;margin-bottom:5px}.intro{font-size:17px;line-height:1.65;max-width:740px;color:#51475e}.section{margin-top:32px;padding-top:27px;border-top:1px solid #e8e3ed}.scope{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid #ded5e9;border-radius:10px;overflow:hidden;margin-top:24px}.scope article{padding:22px;background:#faf8fd;break-inside:avoid}.scope article:nth-child(odd){border-right:1px solid #e8e3ed}.scope article:nth-child(-n+2){border-bottom:1px solid #e8e3ed}.scope span{font-size:12px;color:#211b2b;font-weight:600;display:flex;align-items:center;gap:9px}.scope p{font-size:15px;line-height:1.55;font-weight:600;color:#211b2b;margin:12px 0 0}.scope-icon{width:17px;height:17px;color:#7131ca;flex:none}.stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px;background:#f5f1fa;border-radius:9px;padding:24px}.stat span{font-size:12px;display:block;color:#655a70}.stat strong{font:600 27px/1.2 Bricolage,system-ui,sans-serif;display:block;margin-top:9px;overflow-wrap:anywhere}.note{font-size:12px;line-height:1.65;color:#6b6375;margin-top:14px}.answer-list{margin:0}.answer-list>div{display:grid;grid-template-columns:30% 1fr;gap:20px;padding:12px 0;border-bottom:1px solid #eeeaf2;break-inside:avoid}dt{font-size:12px;color:#6b6375}dd{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}.example{border:1px solid #e8e3ed;border-left:3px solid #7c3aed;border-radius:0 8px 8px 0;padding:22px}.example strong{font:600 22px Bricolage,system-ui,sans-serif}.example p{margin:12px 0}.call{display:flex;align-items:center;gap:22px;border:1px solid #e0d7ed;border-radius:9px;padding:25px;margin-top:38px;break-inside:avoid}.call img{width:74px;height:94px;object-fit:cover;border-radius:5px}.call a{font:600 21px Bricolage,system-ui,sans-serif}.call p{margin:9px 0 0;color:#6b6375;font-size:13px}ul{padding-left:20px}li{padding-left:4px;margin:9px 0}footer{margin-top:35px;padding-top:20px;border-top:1px solid #e8e3ed;font-size:11px;color:#6b6375}.source-meta{font-size:12px;color:#6b6375}section,.scope article{break-inside:auto}@media(max-width:650px){body{background:white}main{margin:0;padding:28px 22px;border:0;border-radius:0}h1{font-size:36px}header{align-items:flex-start}.date{max-width:110px;text-align:right}.scope,.stats{grid-template-columns:1fr}.scope article{border-right:0!important;border-bottom:1px solid #e8e3ed}.scope article:last-child{border-bottom:0}.answer-list>div{grid-template-columns:1fr;gap:3px}.call{padding:20px;gap:16px}.call img{width:60px;height:80px}.call a{font-size:19px}.company strong{font-size:23px}}@media print{@page{size:A4;margin:16mm}body{font-size:10pt;background:white}main{margin:0;padding:0;border:0;max-width:none}h1{font-size:28pt;margin:24px 0}h2{font-size:16pt}h1,h2,h3{break-after:avoid}.section{padding-top:18px;margin-top:24px}.stats,.example,.call{break-inside:avoid}.call img{width:60px;height:74px}.scope p{font-size:10pt}.scope article{padding:14px}.intro{font-size:11pt}footer{font-size:8pt}a{color:inherit}}
</style></head><body><main><header><div class="brand">${mark ? `<img src="${mark}" alt="">` : ''}${C.brand}</div><div class="date">${C.created} ${esc(briefDate(brief.createdAt))}</div></header>
<h1>${C.title}</h1><div class="company">${logo ? `<img src="${logo}" alt="">` : ''}<div><div class="eyebrow">${C.preparedFor}</div><strong>${esc(brief.company.name)}</strong>${website ? `<a href="${esc(website)}" rel="noreferrer">${esc(new URL(website).hostname)}</a>` : ''}</div></div>
${brief.narrative.summary ? `<p class="intro">${esc(brief.narrative.summary)}</p>` : ''}
${brief.company.description && brief.company.description !== brief.narrative.summary ? `<section class="section"><h2>${C.businessContext}</h2><p>${esc(brief.company.description)}</p></section>` : ''}
<section class="section"><h2>${C.proposedBuild}</h2><p>${esc(brief.narrative.proposal)}</p><div class="scope">${scope.map((value, i) => `<article><span>${scopeIcons[i]}${C.scopeLabels[i]}</span><p>${esc(value)}</p></article>`).join('')}</div></section>
${caseRows.length || inputRows.length ? `<section class="section"><h2>${C.businessCase}</h2>${caseRows.length ? `<div class="stats">${caseRows.map(([label, value]) => `<div class="stat"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('')}</div>` : ''}<p class="note">${C.caseNote}</p>${inputRows.length ? `<h3>${C.inputs}</h3>${table(inputRows)}` : ''}<p class="note">${C.formula}</p></section>` : ''}
${benchmark && evidenceUrl ? `<section class="section"><h2>${C.evidence}</h2><div class="example"><strong>${esc(benchmark.company)}</strong><p class="source-meta">${esc(benchmark.descriptor)}</p><p>${esc(benchmark.result)}</p><a href="${esc(evidenceUrl)}" rel="noreferrer">${esc(benchmark.publisher)} · ${esc(benchmark.date)}</a><p class="note">${benchmark.reportedBy === 'company' ? C.companyReported : C.vendorReported}. ${C.evidenceNote}</p></div></section>` : ''}
${brief.preparation.length ? `<section class="section"><h2>${C.preparation}</h2>${list(brief.preparation)}</section>` : ''}
${brief.narrative.assumptions.length ? `<section class="section"><h2>${C.assumptions}</h2>${list(brief.narrative.assumptions)}</section>` : ''}
${brief.rows.length ? `<section class="section"><h2>${C.answers}</h2>${table(brief.rows)}</section>` : ''}
${source ? `<section class="section"><h2>${C.provenance}</h2><p class="source-meta"><a href="${esc(source)}" rel="noreferrer">${esc(source)}</a>${brief.company.researchedAt ? ` · ${C.researched} ${esc(briefDate(brief.company.researchedAt))}` : ''}</p></section>` : ''}
<section class="call">${john ? `<img src="${john}" alt="${C.john}">` : ''}<div><a href="${esc(SPRINT_FIT_CALL_URL)}" rel="noreferrer">${C.book}</a><p>${C.john} · ${C.johnRole}<br>${C.studio} · ${C.bookingNote}</p></div></section><footer>${C.footer}</footer></main></body></html>`
}

/** Company images must come from our re-hosted, public profile asset bucket. */
export function isBriefAssetUrl(raw: string, origin: string): boolean {
  try {
    const url = new URL(raw, origin)
    if (url.origin === origin) return url.pathname.startsWith('/assets/') || url.pathname.startsWith('/fonts/sprint-brief/')
    return url.protocol === 'https:' && !url.username && !url.password && /^[a-z0-9-]+\.supabase\.co$/.test(url.hostname) && url.pathname.startsWith('/storage/v1/object/public/simulator-screens/logos/')
  } catch { return false }
}

async function embeddedAsset(raw: string, type: 'image' | 'font', origin: string): Promise<string | undefined> {
  if (!isBriefAssetUrl(raw, origin)) return undefined
  try {
    const response = await fetch(new URL(raw, origin), { credentials: 'omit', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(8_000), redirect: 'error' })
    if (!response.ok) return undefined
    const mime = (response.headers.get('content-type') || '').split(';')[0]
    if (type === 'image' && !['image/png', 'image/jpeg', 'image/webp'].includes(mime)) return undefined
    if (Number(response.headers.get('content-length')) > 1_500_000) return undefined
    const bytes = new Uint8Array(await response.arrayBuffer())
    if (bytes.byteLength > 1_500_000) return undefined
    let binary = ''
    for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192))
    return `data:${type === 'font' ? 'font/ttf' : mime};base64,${btoa(binary)}`
  } catch { return undefined }
}

export async function loadBriefAssets(brief: SprintBrief, origin = window.location.origin): Promise<BriefAssets> {
  const [mark, companyLogo, john, displayFont, bodyFont, bodySemiboldFont] = await Promise.all([
    embeddedAsset('/assets/vibrana-v-prism-export.png', 'image', origin),
    brief.company.logoUrl ? embeddedAsset(brief.company.logoUrl, 'image', origin) : undefined,
    embeddedAsset('/assets/team/john-ellison.webp', 'image', origin),
    embeddedAsset('/fonts/sprint-brief/Bricolage-600.ttf', 'font', origin),
    embeddedAsset('/fonts/sprint-brief/Hanken-400.ttf', 'font', origin),
    embeddedAsset('/fonts/sprint-brief/Hanken-600.ttf', 'font', origin),
  ])
  return { mark, companyLogo, john, displayFont, bodyFont, bodySemiboldFont }
}

export async function sprintBriefHtml(brief: SprintBrief): Promise<string> {
  return renderSprintBriefHtml(brief, await loadBriefAssets(brief))
}

export async function sprintBriefPdf(brief: SprintBrief): Promise<Blob> {
  const [{ pdf }, { BriefPdf, registerBriefFonts }] = await Promise.all([
    import('@react-pdf/renderer'), import('@/src/components/sprint-fit/BriefPdf'),
  ])
  const assets = await loadBriefAssets(brief)
  // React-PDF supports PNG/JPEG, not WebP. Convert the existing portrait locally.
  if (assets.john) assets.john = await rasterImage(assets.john)
  if (assets.companyLogo?.startsWith('data:image/webp')) assets.companyLogo = await rasterImage(assets.companyLogo)
  registerBriefFonts(assets)
  return pdf(BriefPdf({ brief, assets })).toBlob()
}
async function rasterImage(dataUrl: string): Promise<string | undefined> {
  try {
    const image = new Image()
    image.src = dataUrl
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const context = canvas.getContext('2d')
    if (!context) return undefined
    context.drawImage(image, 0, 0)
    return canvas.toDataURL('image/png')
  } catch { return undefined }
}

/** Transactional email uses the same saved snapshot, with email-safe table layout. */
export function renderSprintBriefEmail(brief: SprintBrief): string {
  const rows = (values: [string, string][]) => `<table role="presentation" style="width:100%;border-collapse:collapse">${values.map(([label, value]) => `<tr><td style="width:35%;padding:10px 14px 10px 0;border-bottom:1px solid #e8e3ed;color:#6b6375;vertical-align:top;font-size:13px">${esc(label)}</td><td style="padding:10px 0;border-bottom:1px solid #e8e3ed;white-space:pre-wrap;overflow-wrap:anywhere">${esc(value)}</td></tr>`).join('')}</table>`
  const heading = (text: string) => `<h2 style="font-size:21px;line-height:1.2;margin:30px 0 14px;color:#211b2b">${esc(text)}</h2>`
  const caseRows = briefCaseRows(brief)
  const inputRows = briefInputRows(brief)
  const benchmark = brief.benchmark
  const evidenceUrl = briefSafeLink(benchmark?.url)
  const website = briefSafeLink(brief.company.website)
  const source = briefSafeLink(brief.company.sourceUrl)
  return `<div style="max-width:680px;margin:0 auto;padding:32px 24px;color:#211b2b;font:16px/1.6 Arial,sans-serif">
<p style="font-size:14px;letter-spacing:.05em;font-weight:700;color:#7131ca">${C.brand}</p><p style="font-size:12px;color:#6b6375">${C.created} ${esc(briefDate(brief.createdAt))}</p>
<h1 style="font-size:34px;line-height:1.1;margin:24px 0 14px">${C.title}</h1><p style="font-size:21px;font-weight:600;margin:0">${esc(brief.company.name)}</p>${website ? `<p><a href="${esc(website)}" style="color:#7131ca" rel="noreferrer">${esc(new URL(website).hostname)}</a></p>` : ''}
${brief.narrative.summary ? `<p>${esc(brief.narrative.summary)}</p>` : ''}${brief.company.description && brief.company.description !== brief.narrative.summary ? heading(C.businessContext) + `<p>${esc(brief.company.description)}</p>` : ''}
${heading(C.proposedBuild)}<p>${esc(brief.narrative.proposal)}</p>${rows([[C.scopeLabels[0], brief.scope.user], [C.scopeLabels[1], brief.scope.task], [C.scopeLabels[2], brief.scope.firstRelease], [C.scopeLabels[3], brief.scope.successMeasure]])}
${caseRows.length || inputRows.length ? heading(C.businessCase) + rows(caseRows) + `<p style="font-size:13px;color:#6b6375">${C.caseNote}</p>` + (inputRows.length ? heading(C.inputs) + rows(inputRows) : '') + `<p style="font-size:13px;color:#6b6375">${C.formula}</p>` : ''}
${benchmark && evidenceUrl ? heading(C.evidence) + `<p><strong>${esc(benchmark.company)}</strong><br><span style="color:#6b6375;font-size:13px">${esc(benchmark.descriptor)}</span></p><p>${esc(benchmark.result)}</p><p><a href="${esc(evidenceUrl)}" style="color:#7131ca" rel="noreferrer">${esc(benchmark.publisher)} · ${esc(benchmark.date)}</a></p><p style="font-size:13px;color:#6b6375">${benchmark.reportedBy === 'company' ? C.companyReported : C.vendorReported}. ${C.evidenceNote}</p>` : ''}
${brief.preparation.length ? heading(C.preparation) + list(brief.preparation) : ''}${brief.narrative.assumptions.length ? heading(C.assumptions) + list(brief.narrative.assumptions) : ''}
${brief.rows.length ? heading(C.answers) + rows(brief.rows) : ''}
${source ? heading(C.provenance) + `<p style="font-size:13px;color:#6b6375"><a href="${esc(source)}" style="color:#7131ca" rel="noreferrer">${esc(source)}</a>${brief.company.researchedAt ? ` · ${C.researched} ${esc(briefDate(brief.company.researchedAt))}` : ''}</p>` : ''}
<p style="margin:30px 0 12px"><a href="${esc(SPRINT_FIT_CALL_URL)}" style="display:inline-block;background:#7131ca;color:#fff;text-decoration:none;padding:13px 18px;border-radius:6px">${C.book}</a></p><p>${C.john} · ${C.johnRole}, ${C.studio}</p><p style="font-size:12px;color:#6b6375;border-top:1px solid #e8e3ed;padding-top:20px">${C.footer}</p></div>`
}
