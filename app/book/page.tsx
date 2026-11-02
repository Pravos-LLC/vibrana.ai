import BookingPage from '@/src/components/booking/BookingPage';
import { bookingProof } from '@/src/lib/booking-proof';
export default function Page() { return <BookingPage proof={bookingProof()} />; }
