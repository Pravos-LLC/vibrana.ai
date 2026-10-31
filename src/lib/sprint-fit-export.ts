import { escapeHtml } from '@/lib/escape-html'
import { FIT } from '@/src/sprint-fit-content'
import { evaluateFit, fitRows, type FitAnswers } from './sprint-fit'

/** Downloadable, self-contained HTML. Every visitor-provided value is escaped. */
export function fitBriefHtml(answers: FitAnswers): string {
  const result = evaluateFit(answers)
  const rows = fitRows(answers).map(([label, value]) => `<tr><th scope="row">${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join('')
  const actions = result.actions.map(action => `<li>${escapeHtml(action)}</li>`).join('')
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(FIT.result.title)}</title><style>body{margin:0;background:#fcfcfa;color:#252329;font:17px/1.65 system-ui,sans-serif}main{max-width:850px;margin:60px auto;padding:30px}.brand{font-weight:700;font-size:26px;letter-spacing:-1px}h1{font-size:clamp(36px,7vw,58px);line-height:1.05;letter-spacing:-.05em;margin:55px 0 20px}p{color:#66616d}table{width:100%;border-collapse:collapse;margin:35px 0}th,td{text-align:left;vertical-align:top;padding:15px 0;border-bottom:1px solid #dedbe3;white-space:pre-wrap;overflow-wrap:anywhere}th{width:32%;padding-right:25px;font-size:13px;color:#69636f;font-weight:500}.next{padding:25px 30px;background:#eeebf6;border-radius:12px}.next h2{font-size:25px;line-height:1.2;letter-spacing:-.025em}li{margin:10px 0}footer{font-size:13px;color:#69636f;margin-top:35px}@media(max-width:550px){main{margin:10px auto;padding:24px}th{width:36%;padding-right:16px}th,td{font-size:13px}.next{padding:20px}}@media print{main{margin:0}body{background:white}.next{break-inside:avoid}}</style></head><body><main><div class="brand">${escapeHtml(FIT.brand)}</div><h1>${escapeHtml(FIT.result.title)}</h1><p>${escapeHtml(FIT.result.intro)}</p><table>${rows}</table><section class="next"><h2>${escapeHtml(FIT.routes[result.route])}</h2><ul>${actions}</ul></section><footer>${escapeHtml(FIT.result.footer)}</footer></main></body></html>`
}
