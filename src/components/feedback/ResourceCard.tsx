import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

type Props = { href: string; title: string; description: string; image: string }

/** A small link card for the thank-you screen: the destination's share image, title and one line. */
export function ResourceCard({ href, title, description, image }: Props) {
  return (
    <Link href={href} className="fb-card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="" width={1200} height={630} loading="lazy" decoding="async" className="fb-card-img" />
      <span className="fb-card-body">
        <span className="fb-card-title">
          {title}
          <ArrowUpRight aria-hidden className="fb-card-arrow" size={16} />
        </span>
        <span className="fb-card-desc">{description}</span>
      </span>
    </Link>
  )
}
