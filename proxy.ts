/**
 * Answers 410 Gone for a deleted shared simulation (spec 13: "a deleted link
 * returns 410"). A page can't set its own status, so the check runs here, only on
 * /ai-transformation/simulator/r/<slug>. Storage errors fail open: the page renders.
 */
import type { NextRequest } from 'next/server';
import { isRunDeleted } from '@/src/lib/simulator/server/db';
import { SIM_SHARED_PAGE } from '@/src/simulator-content';
import { applyEmudhraTrustGuard } from '@/src/lib/security/emudhra-trust-guard';

// The proxy can run as its own function, so it applies the eMudhra trust guard itself.
applyEmudhraTrustGuard();

const SIM_HREF = '/ai-transformation/simulator';

export async function proxy(request: NextRequest) {
  const slug = request.nextUrl.pathname.split('/').pop() ?? '';
  try {
    if (!(await isRunDeleted(slug))) return;
  } catch (err) {
    console.error('[simulator] proxy lookup failed:', err instanceof Error ? err.message : err);
    return;
  }
  const { title, body } = SIM_SHARED_PAGE.gone;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body style="font-family:system-ui,sans-serif;max-width:36rem;margin:20vh auto;padding:0 1.5rem;color:#1a1a1a;text-align:center"><h1 style="font-size:1.75rem">${title}</h1><p style="color:#555">${body}</p><p><a href="${SIM_HREF}">${SIM_SHARED_PAGE.runYours}</a></p></body></html>`;
  return new Response(html, { status: 410, headers: { 'content-type': 'text/html; charset=utf-8', 'x-robots-tag': 'noindex' } });
}

export const config = {
  matcher: '/ai-transformation/simulator/r/:slug',
};
