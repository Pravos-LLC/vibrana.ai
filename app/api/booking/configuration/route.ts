import { configurationComplete, origin } from '@/lib/booking/security';

export const dynamic = 'force-dynamic';
export function GET() {
  const configured = configurationComplete();
  return Response.json({ configured, origin: configured ? origin() : null }, { headers: { 'Cache-Control': 'no-store' } });
}
