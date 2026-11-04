import { notFound } from 'next/navigation';
import BookingPage from '@/src/components/booking/BookingPage';
import { hostId } from '@/lib/booking/model';
import { bookingProof } from '@/src/lib/booking-proof';
export default async function Page({ params }: { params: Promise<{ host: string }> }) {
  const parsed = hostId.safeParse((await params).host);
  if (!parsed.success) notFound();
  return <BookingPage host={parsed.data} proof={bookingProof()} />;
}
