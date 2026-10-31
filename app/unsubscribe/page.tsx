import type { Metadata } from 'next';
import { Button } from '@/src/components/prism';
import { emailFromToken } from '@/lib/unsubscribe';
import { UNSUBSCRIBE_PAGE as C } from '@/src/unsubscribe-content';

// The footer link of the assessment follow-up emails lands here. Loading the page
// changes nothing (mail scanners open every link); the button posts to
// /api/unsubscribe, which cancels the scheduled sends and redirects back with ?status.

export const metadata: Metadata = {
  title: C.metaTitle,
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function UnsubscribePage({ searchParams }: Props) {
  const params = await searchParams;
  const token = first(params.t) ?? '';
  const status = first(params.status);
  const email = emailFromToken(token);

  let heading: string;
  let body: React.ReactNode;
  let form: { label: string } | null = null;

  if (!email || status === 'invalid') {
    heading = C.invalid.heading;
    body = C.invalid.body;
  } else if (status === 'done') {
    heading = C.done.heading;
    body = C.done.body;
  } else if (status === 'error') {
    heading = C.error.heading;
    body = C.error.body;
    form = { label: C.error.retry };
  } else {
    heading = C.confirm.heading;
    body = (
      <>
        {C.confirm.before}
        <strong className="font-semibold text-ink">{email}</strong>
        {C.confirm.after}
      </>
    );
    form = { label: C.confirm.button };
  }

  return (
    <main className="prism-light flex min-h-screen items-center justify-center px-6 py-24">
      <div className="w-full max-w-lg text-center">
        <p className="type-xs mb-4 uppercase tracking-[0.15em] text-ink-tertiary">{C.eyebrow}</p>
        <h1 className="mb-4 text-2xl font-semibold text-ink md:text-3xl">{heading}</h1>
        <p className="mb-8 text-sm text-ink-secondary md:text-base">{body}</p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          {form && (
            <form method="post" action="/api/unsubscribe">
              <input type="hidden" name="t" value={token} />
              <Button type="submit" showArrow={false}>{form.label}</Button>
            </form>
          )}
          <Button href="/" variant="secondary">{C.homeLabel}</Button>
        </div>
      </div>
    </main>
  );
}
