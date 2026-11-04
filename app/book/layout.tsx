import type { Metadata } from 'next';
import { BOOKING } from '@/src/booking-content';

export const metadata: Metadata = { title: `${BOOKING.title} | ${BOOKING.brand}`, robots: { index: false, follow: false }, referrer: 'no-referrer' };
export default function BookingLayout({ children }: { children: React.ReactNode }) { return children; }
