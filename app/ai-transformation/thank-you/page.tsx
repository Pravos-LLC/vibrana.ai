import { PUBLIC_DEMO_DOWNLOAD as D } from '@/src/public-demo-download-content'
export default function ThankYouPage() {
  return <main className="mx-auto max-w-2xl px-6 py-32"><h1 className="type-xl text-ink">{D.heading}</h1><p className="mt-6 text-ink-secondary">{D.description}</p><a className="mt-6 inline-block text-brand-violet-strong" href={D.href} download>{D.label}</a></main>
}
