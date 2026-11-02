'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

export function SiteTelemetry() {
  const pathname = usePathname();
  const [hostname, setHostname] = useState<string | null>(null);
  useEffect(() => { setHostname(window.location.hostname); }, []);
  // Resolve the host after hydration as host rewrites may expose '/' to the
  // browser. Never mount collection scripts around private booking fragments.
  if (hostname === null || hostname === 'book.vibrana.ai' || pathname === '/book' || pathname.startsWith('/book/')) return null;
  return <><Analytics /><SpeedInsights /></>;
}
