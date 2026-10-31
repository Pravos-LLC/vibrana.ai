import type { Metadata } from 'next';
import SwagPage from '@/src/views/SwagPage';

export const metadata: Metadata = {
  alternates: { canonical: '/swag' },
  title: 'Swag | Vibrana',
  description: 'A 50-piece retro-arcade sticker pack and shirt designs made by Vibrana, for contributors and collaborators.',
};

export default function Page() {
  return <SwagPage />;
}
