import { createHash } from 'node:crypto';
import { cookies } from 'next/headers';
import { SCOPES } from '@/lib/booking/google';
import { cookieOptions, origin, publicError, required, secret, session, sign } from '@/lib/booking/security';

export async function GET(request: Request) {
  try {
    if (new URL(request.url).origin !== origin()) return Response.redirect(`${origin()}/api/booking/connect`);
    const host = await session();
    const state = secret(), verifier = secret();
    (await cookies()).set('booking_oauth', sign({ state, verifier, host, exp: Date.now() + 600_000 }), cookieOptions());
    const query = new URLSearchParams({
      client_id: required('BOOKING_GOOGLE_CLIENT_ID'), redirect_uri: `${origin()}/api/booking/callback`, response_type: 'code',
      scope: SCOPES.join(' '), access_type: 'offline', prompt: 'consent select_account', state,
      code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256',
    });
    return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${query}`);
  } catch (error) { return publicError(error); }
}
