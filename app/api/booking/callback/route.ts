import { BOOKING_ERRORS as E } from '@/src/booking-content';
import { cookies } from 'next/headers';
import { checked, db } from '@/lib/booking/db';
import { googleFetch, SCOPES } from '@/lib/booking/google';
import type { HostId } from '@/lib/booking/model';
import { BookingError, configuredHost, cookieOptions, origin, publicError, required, seal, session, sign, verify } from '@/lib/booking/security';

export async function GET(request: Request) {
  try {
    const jar = await cookies();
    const state = verify<{ state: string; verifier: string; host: HostId | null; exp: number }>(jar.get('booking_oauth')?.value);
    jar.delete({ name: 'booking_oauth', path: '/api/booking' });
    const params = new URL(request.url).searchParams;
    if (!state || params.get('state') !== state.state || !params.get('code')) throw new BookingError(400, E.oauthExpired);
    if (state.host && await session() !== state.host) throw new BookingError(401, E.signInForConnection);
    const tokens = await googleFetch<{ access_token: string; refresh_token?: string; scope?: string }>('https://oauth2.googleapis.com/token', { method: 'POST', body: new URLSearchParams({
      client_id: required('BOOKING_GOOGLE_CLIENT_ID'), client_secret: required('BOOKING_GOOGLE_CLIENT_SECRET'), redirect_uri: `${origin()}/api/booking/callback`, code: params.get('code')!, code_verifier: state.verifier, grant_type: 'authorization_code',
    }) });
    const granted = tokens.scope?.split(' ') ?? [];
    if (!SCOPES.filter(v => v.startsWith('https://')).every(v => granted.includes(v))) throw new BookingError(400, E.grantScopes);
    const identity = await googleFetch<{ email?: string; email_verified?: boolean }>('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${tokens.access_token}` } });
    if (!identity.email || !identity.email_verified) throw new BookingError(403, E.verifiedAccount);
    const account = identity.email.toLowerCase();
    const host = state.host ?? configuredHost(account);
    if (!host) throw new BookingError(403, E.notHost);
    const prior = await db().from('booking_connections').select('token,calendars').eq('host_id', host).eq('account', account).maybeSingle();
    if (prior.error) throw new BookingError(503, E.connectionSaveFailed);
    const encrypted = tokens.refresh_token ? seal(tokens.refresh_token) : prior.data?.token;
    if (!encrypted) throw new BookingError(400, E.offlineAccess);
    checked(await db().from('booking_connections').upsert({ host_id: host, account, token: encrypted, calendars: prior.data?.calendars ?? [] }, { onConflict: 'host_id,account' }).select('id').single());
    // Connecting another account never changes the authenticated primary identity.
    if (!state.host) jar.set('booking_session', sign({ host, email: account, exp: Date.now() + 7 * 86400_000 }), { ...cookieOptions(), maxAge: 7 * 86400 });
    return Response.redirect(`${origin()}/book/settings`);
  } catch (error) { return publicError(error); }
}
