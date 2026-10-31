'use client'
import { PublicDemoImg } from '@/src/components/PublicDemoImage'

import React from 'react'
import Link from 'next/link'
import { useMotionValue } from 'framer-motion'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowLeft, ArrowRight, Play } from 'lucide-react'
import { EnterprisePageShell } from '@/src/components/enterprise/EnterprisePageShell'
import { Background } from '@/src/components/prism/Background'
import { Button, Eyebrow, Stat } from '@/src/components/prism'
import { CaseStudyChart, parseChartSpec } from '@/src/components/case-studies/CaseStudyChart'
import { CaseStudyArtifactOverview } from '@/src/components/case-studies/CaseStudyScreenshotGallery'
import { CASE_STUDY_ARTICLE_CLASS } from '@/src/case-study-screenshots-content'
import { CASE_STUDY_PAGE_COPY } from '@/src/case-study-page-content'
import type { CaseStudy } from '@/src/lib/case-studies'
import { AnonymizedTag } from '@/src/components/proof/AnonymizedMark'
import { cn } from '@/src/components/prism/utils/cn'

const markdownComponents: Components = {
  pre({ children }) {
    const child = Array.isArray(children) ? children[0] : children
    if (React.isValidElement(child)) {
      const props = child.props as { className?: string; children?: React.ReactNode }
      if (props.className === 'language-chart') {
        const spec = parseChartSpec(String(props.children ?? ''))
        if (spec) return <CaseStudyChart spec={spec} />
      }
    }
    return <pre>{children}</pre>
  },
}

const panel =
  'rounded-2xl border border-line-subtle bg-surface-frost backdrop-blur-md'

function ArticleWrap({
  children,
  className,
  as: Tag = 'div',
}: {
  children: React.ReactNode
  className?: string
  as?: 'div' | 'section' | 'article'
}) {
  return (
    <Tag className={cn('px-6', className)}>
      <div className={CASE_STUDY_ARTICLE_CLASS}>{children}</div>
    </Tag>
  )
}

export default function CaseStudyPage({
  study,
  relatedStudies = [],
}: {
  study: CaseStudy
  relatedStudies?: Array<Pick<CaseStudy, 'slug' | 'oneLineOutcome' | 'summary'>>
}) {
  const name = study.client ?? study.anonymizedName
  const isAnon = study.client === null
  const meta = [study.vertical, study.size, study.geography].filter(Boolean)
  // Static, centered field for the CTA panel's ambient background — this is a
  // decorative, section-scoped mount, not a live cursor-tracked one, so the
  // mouse position and scroll progress are fixed rather than wired to input.
  const ctaMouseX = useMotionValue(0.5)
  const ctaMouseY = useMotionValue(0.5)

  return (
    <EnterprisePageShell>
      {!study.published && (
        <ArticleWrap className={study.published ? undefined : 'pt-24'}>
          <div className="rounded-xl border border-amber-400/40 bg-amber-50/70 px-5 py-3 text-center text-sm text-amber-900">
            {CASE_STUDY_PAGE_COPY.draftBanner.prefix}{' '}
            <code>
              {CASE_STUDY_PAGE_COPY.draftBanner.pathTemplate.replace('{slug}', study.slug)}
            </code>{' '}
            {CASE_STUDY_PAGE_COPY.draftBanner.middle}{' '}
            <code>{CASE_STUDY_PAGE_COPY.draftBanner.flag}</code>{' '}
            {CASE_STUDY_PAGE_COPY.draftBanner.suffix}
          </div>
        </ArticleWrap>
      )}

      <article>
        {/* ── BACK LINK — always first, above the video (when present) and the H1 ── */}
        <ArticleWrap
          as="section"
          className={cn('pb-4', study.published ? 'pt-32 md:pt-44' : 'pt-10')}
        >
          <Link
            href="/case-studies"
            className="inline-flex items-center gap-2 text-sm text-ink-secondary transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            {CASE_STUDY_PAGE_COPY.backLinkLabel}
          </Link>
        </ArticleWrap>

        {/* ── HERO VIDEO — sizzle reel, opt-in per study via frontmatter ── */}
        {study.sizzleReel && (
          <ArticleWrap as="section" className="pb-0">
            <div
              className="media-frame relative w-full overflow-hidden"
              style={{ aspectRatio: '16 / 9' }}
            >
              <SizzleReel
                youTubeId={study.sizzleReelYouTubeId}
                src={study.sizzleReelSrc}
                poster={study.sizzleReelPoster}
                title={CASE_STUDY_PAGE_COPY.heroVideo.youTubeTitle}
                placeholderLabel={CASE_STUDY_PAGE_COPY.heroVideo.placeholderLabel}
              />
            </div>
          </ArticleWrap>
        )}

        {/* ── HERO ── */}
        <ArticleWrap as="section" className={cn('pb-10', study.sizzleReel && 'pt-8')}>
          <div className="mt-8">
            {study.logo && !isAnon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <PublicDemoImg
                src={study.logo}
                alt={name}
                className="logo-mono mb-5 h-8 w-auto max-w-[180px]"
              />
            ) : (
              <Eyebrow gradient="prism">{name}</Eyebrow>
            )}
            <h1 className="mt-5 text-[2.25rem] font-semibold leading-[1.1] tracking-tight text-ink md:text-[2.75rem]">
              {study.oneLineOutcome}
            </h1>
            <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-2 text-[11px] uppercase tracking-wider text-ink-tertiary">
              {isAnon && <AnonymizedTag long />}
              {meta.map((m) => (
                <span key={m} className="rounded-full border border-line-subtle px-2.5 py-0.5">
                  {m}
                </span>
              ))}
            </div>
            <p className="mt-5 text-base leading-7 text-ink-secondary">{study.engagement}</p>
          </div>
        </ArticleWrap>

        {/* ── METRICS ── */}
        {study.metrics.length > 0 && (
          <ArticleWrap as="section" className="pb-8">
            <div className={`${panel} grid gap-5 p-6 sm:grid-cols-3`}>
              {study.metrics.map((m) => (
                <Stat key={m.label} value={m.value} label={m.label} align="center" size="2xl" />
              ))}
            </div>
          </ArticleWrap>
        )}

        {/* ── ARTIFACT RIBBON — before narrative, follows "what we built" heading ── */}
        <CaseStudyArtifactOverview studySlug={study.slug} />

        {/* ── NARRATIVE ── */}
        <ArticleWrap as="section" className="pb-10">
          <div className="cs-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {study.body}
            </ReactMarkdown>
          </div>
        </ArticleWrap>

      {isAnon && (
          <ArticleWrap as="section" className="pb-12">
            <p className="rounded-xl border border-line-subtle bg-surface-frost px-5 py-4 text-xs leading-6 text-ink-tertiary backdrop-blur-md">
              {CASE_STUDY_PAGE_COPY.ndaDisclaimer}
            </p>
          </ArticleWrap>
      )}

      {relatedStudies.length > 0 && (
        <ArticleWrap as="section" className="pb-12">
          <h2 className="text-2xl font-semibold text-ink">
            {CASE_STUDY_PAGE_COPY.relatedStudies.heading}
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {relatedStudies.map((related) => (
              <Link
                key={related.slug}
                href={`/case-studies/${related.slug}`}
                className={`${panel} group block p-5 transition-colors hover:border-line-strong`}
              >
                <h3 className="font-semibold text-ink">{related.oneLineOutcome}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-secondary">{related.summary}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-violet-strong">
                  {CASE_STUDY_PAGE_COPY.relatedStudies.readLabel}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
          <Link
            href="/case-studies"
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-brand-violet-strong hover:underline"
          >
            {CASE_STUDY_PAGE_COPY.relatedStudies.browseAll}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </ArticleWrap>
      )}
      </article>

      {/* ── CTA ── */}
      <section className="px-6 pb-24 pt-4">
        <div
          className={cn(
            CASE_STUDY_ARTICLE_CLASS,
            'relative flex flex-col items-center gap-5 overflow-hidden rounded-2xl border border-line-subtle p-8 text-center',
          )}
        >
          <Background
            mouseX={ctaMouseX}
            mouseY={ctaMouseY}
            scrollProgress={0.4}
            variant="rich"
            coverage="section"
            position="absolute"
          />
          <div className="relative z-10 flex flex-col items-center gap-5">
            <h2 className="text-xl font-semibold text-ink md:text-2xl">
              {CASE_STUDY_PAGE_COPY.cta.heading}
            </h2>
            <p className="text-sm leading-6 text-ink-secondary">{CASE_STUDY_PAGE_COPY.cta.body}</p>
            <Button href={CASE_STUDY_PAGE_COPY.cta.href} showArrow>
              {CASE_STUDY_PAGE_COPY.cta.buttonLabel}
            </Button>
          </div>
        </div>
      </section>
    </EnterprisePageShell>
  )
}

/** Hero video slot. Shows the poster (the video's thumbnail) with a play button and only mounts the
 *  player on click. A self-hosted `src` plays in a native <video> (with sound, controls, inline);
 *  otherwise the YouTube iframe mounts: faster page loads, no YouTube requests until the reader opts in, and
 *  the designed thumbnail is always the first frame people see. With no video id yet, the poster
 *  (or the gradient placeholder) stands in without a play button. */
function SizzleReel({
  youTubeId,
  src,
  poster,
  title,
  placeholderLabel,
}: {
  youTubeId: string | null
  src: string | null
  poster: string | null
  title: string
  placeholderLabel: string
}) {
  const [playing, setPlaying] = React.useState(false)
  const playable = Boolean(src || youTubeId)
  if (src && playing) {
    return (
      <video
        className="absolute inset-0 h-full w-full"
        src={src}
        poster={poster ?? undefined}
        controls
        autoPlay
        playsInline
        preload="auto"
      />
    )
  }
  if (youTubeId && playing) {
    return (
      <iframe
        className="absolute inset-0 h-full w-full"
        src={`https://www.youtube-nocookie.com/embed/${youTubeId}?autoplay=1&rel=0`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    )
  }
  if (poster) {
    return (
      <button
        type="button"
        onClick={() => playable && setPlaying(true)}
        disabled={!playable}
        aria-label={playable ? `Play: ${title}` : placeholderLabel}
        className="group absolute inset-0 h-full w-full cursor-pointer disabled:cursor-default"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <PublicDemoImg src={poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
        {playable && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span
              className="flex h-16 w-16 items-center justify-center rounded-full ring-1 ring-white/60 backdrop-blur-md transition-transform group-hover:scale-110"
              style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.38), rgba(45,212,191,0.34))', boxShadow: '0 8px 28px rgba(49,46,129,0.28), inset 0 1px 0 rgba(255,255,255,0.5)' }}
            >
              <Play className="h-7 w-7 translate-x-0.5 fill-white text-white drop-shadow" />
            </span>
          </span>
        )}
      </button>
    )
  }
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-linear-to-br/srgb from-ink via-ink to-violet-950">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
        <Play className="h-6 w-6 fill-white text-white" />
      </div>
      <p className="px-6 text-center text-sm text-white/70">{placeholderLabel}</p>
    </div>
  )
}
