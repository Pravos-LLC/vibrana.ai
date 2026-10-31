import { NextRequest, NextResponse } from 'next/server';
import { FORM_GUARDS, guardSignedLink } from '@/lib/form-guard/server';
import { emailFromToken, optOutRecorded, unsubscribe } from '@/lib/unsubscribe';

/**
 * Unsubscribe from the scheduled follow-up emails (lib/unsubscribe).
 *
 * Two callers:
 *   - RFC 8058 one-click: a mail app POSTs `List-Unsubscribe=One-Click` to the URL in
 *     the List-Unsubscribe header (`?t=<token>`). Answers with a status code only.
 *   - The button on /unsubscribe: a plain form POST with the token in field `t`.
 *     Redirects back to the page with the outcome.
 *
 * A GET (a mail app that opens the header URL in a browser) goes to the confirmation
 * page, never unsubscribes: link scanners fetch every URL in an email.
 */

export const dynamic = 'force-dynamic';

type Outcome = 'done' | 'invalid' | 'error';

function pageUrl(request: NextRequest, token: string | null, status?: Outcome): URL {
  const url = new URL('/unsubscribe', request.url);
  if (token) url.searchParams.set('t', token);
  if (status) url.searchParams.set('status', status);
  return url;
}

async function readForm(request: NextRequest): Promise<FormData | null> {
  const type = request.headers.get('content-type') || '';
  if (!type.includes('application/x-www-form-urlencoded') && !type.includes('multipart/form-data')) return null;
  try {
    return await request.formData();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.redirect(pageUrl(request, request.nextUrl.searchParams.get('t')), 303);
}

export async function POST(request: NextRequest) {
  const form = await readForm(request);
  const oneClick = form?.get('List-Unsubscribe') === 'One-Click';
  const fieldToken = form?.get('t');
  const token = request.nextUrl.searchParams.get('t') || (typeof fieldToken === 'string' ? fieldToken : null);

  const reply = (status: Outcome, httpStatus: number) =>
    oneClick
      ? new NextResponse(null, { status: httpStatus })
      : NextResponse.redirect(pageUrl(request, token, status), 303);

  const email = emailFromToken(token);
  if (!email) return reply('invalid', 400);

  const guard = await guardSignedLink({ config: FORM_GUARDS.unsubscribe, headers: request.headers, email });
  if (guard.action === 'reject') return reply('error', guard.status);
  if (guard.action === 'drop') {
    // Over the per-address limit: this address has asked many times today. Say done only if it is.
    return (await optOutRecorded(email)) === true ? reply('done', 200) : reply('error', 429);
  }

  const result = await unsubscribe(email, oneClick ? 'one-click' : 'link');
  return result.ok ? reply('done', 200) : reply('error', 500);
}
