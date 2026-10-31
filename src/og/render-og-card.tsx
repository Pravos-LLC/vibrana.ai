import { siteContent } from '@/src/site-content'
import { PublicDemoImg } from '@/src/components/PublicDemoImage'
// Shared renderer for the Open Graph / Twitter share cards (app/**/opengraph-image.tsx).
// Prism Light: white canvas, Bricolage Grotesque display, one Playfair italic
// gradient word, the Vibrana mark, and a three-tile film collage from the approved
// sprint imagery (the About / sprint hero collage idiom).
//
// Server-only: reads fonts and imagery from disk at build time. Satori (ImageResponse)
// can't decode webp, so the tiles are transcoded to JPEG data URLs with sharp.
// Literal hex/rgba are used below because Satori renders outside the DOM and cannot
// resolve CSS variables — the values mirror the Prism Light tokens in DESIGN.md.

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'
import { ImageResponse } from 'next/og'
import { OG_BRAND, type OgCardCopy } from '@/src/og-content'

export const OG_SIZE = { width: 1200, height: 630 } as const

const ROOT = process.cwd()
const TEXT_PRIMARY = 'rgba(15,15,17,0.95)'
const TEXT_TERTIARY = 'rgba(15,15,17,0.48)'
// Prism gradient with the deepened light-mode stops used for display gradient text.
const PRISM_TEXT = 'linear-gradient(135deg, #6d28d9 0%, #2563eb 55%, #0d9488 100%)'

async function font(file: string) {
  return readFile(join(ROOT, 'src/og/fonts', file))
}

/** Transcode a /public image to a JPEG data URL, cropped to the tile's box. */
async function tile(publicPath: string, width: number, height: number) {
  const buf = await sharp(join(ROOT, 'public', publicPath))
    .resize(width * 2, height * 2, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 82 })
    .toBuffer()
  return `data:image/jpeg;base64,${buf.toString('base64')}`
}

async function png(publicPath: string, size: number) {
  const buf = await sharp(join(ROOT, 'public', publicPath)).resize(size * 2, size * 2).png().toBuffer()
  return `data:image/png;base64,${buf.toString('base64')}`
}

const TILES = {
  team: { src: '/assets/imagery/sprint/sprint-whiteboard-team.webp', w: 272, h: 340 },
  laptop: { src: '/assets/imagery/sprint/sprint-prototype-laptop.webp', w: 270, h: 180 },
  hourglass: { src: siteContent("media.c3JjL29nL3JlbmRlci1vZy1jYXJkLnRzeDoy", '/assets/imagery/homepage/prism-grid-solar.webp'), w: 136, h: 136 },
} as const

export async function renderOgCard(copy: OgCardCopy) {
  const [bricolage, playfairItalic, hanken, mark, team, laptop, hourglass] = await Promise.all([
    font('BricolageGrotesque-SemiBold.ttf'),
    font('PlayfairDisplay-SemiBoldItalic.ttf'),
    font('HankenGrotesk-Medium.ttf'),
    png(siteContent("media.c3JjL29nL3JlbmRlci1vZy1jYXJkLnRzeDoz", '/assets/vibrana-v-prism-96.webp'), 48),
    tile(TILES.team.src, TILES.team.w, TILES.team.h),
    tile(TILES.laptop.src, TILES.laptop.w, TILES.laptop.h),
    tile(TILES.hourglass.src, TILES.hourglass.w, TILES.hourglass.h),
  ])

  const { lead, accent, trail } = copy.headline
  const headlineSize = copy.eyebrow ? 64 : 80
  const shadow = '0 18px 40px rgba(76,29,149,0.16)'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          backgroundColor: '#ffffff',
          backgroundImage:
            'radial-gradient(circle at 82% 30%, rgba(124,58,237,0.10), rgba(255,255,255,0) 55%), radial-gradient(circle at 70% 95%, rgba(45,212,191,0.08), rgba(255,255,255,0) 45%)',
          fontFamily: 'Hanken Grotesk',
        }}
      >
        {/* Left column: mark, headline, url */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: 700,
            height: '100%',
            padding: '64px 0 60px 72px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img */}
            <PublicDemoImg src={mark} width={48} height={48} alt="" />
            <div
              style={{
                marginLeft: 16,
                fontFamily: 'Bricolage Grotesque',
                fontSize: 28,
                letterSpacing: '0.12em',
                color: TEXT_PRIMARY,
              }}
            >
              {OG_BRAND.wordmark}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {copy.eyebrow ? (
              <div
                style={{
                  fontSize: 20,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: TEXT_TERTIARY,
                  marginBottom: 22,
                }}
              >
                {copy.eyebrow}
              </div>
            ) : null}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'baseline',
                fontFamily: 'Bricolage Grotesque',
                fontSize: headlineSize,
                lineHeight: 1.08,
                letterSpacing: '-0.02em',
                color: TEXT_PRIMARY,
              }}
            >
              {lead.split(' ').map((w, i) => (
                <span key={`l${i}`} style={{ marginRight: headlineSize * 0.24 }}>
                  {w}
                </span>
              ))}
              <span
                style={{
                  fontFamily: 'Playfair Display',
                  fontStyle: 'italic',
                  fontSize: headlineSize * 1.06,
                  letterSpacing: '-0.01em',
                  marginRight: headlineSize * 0.24,
                  paddingRight: 6,
                  backgroundImage: PRISM_TEXT,
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                {accent}
              </span>
              {trail.split(' ').map((w, i) => (
                <span key={`t${i}`} style={{ marginRight: headlineSize * 0.24 }}>
                  {w}
                </span>
              ))}
            </div>
          </div>

          <div style={{ fontSize: 22, color: TEXT_TERTIARY, letterSpacing: '0.02em' }}>{OG_BRAND.url}</div>
        </div>

        {/* Right: three-tile film collage */}
        <div style={{ display: 'flex', position: 'relative', flexGrow: 1, height: '100%' }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img */}
          <PublicDemoImg
            src={team}
            alt=""
            width={TILES.team.w}
            height={TILES.team.h}
            style={{
              position: 'absolute',
              left: 24,
              top: 70,
              borderRadius: 24,
              objectFit: 'cover',
              transform: 'rotate(-3deg)',
              boxShadow: shadow,
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img */}
          <PublicDemoImg
            src={laptop}
            alt=""
            width={TILES.laptop.w}
            height={TILES.laptop.h}
            style={{
              position: 'absolute',
              left: 190,
              top: 372,
              borderRadius: 22,
              objectFit: 'cover',
              transform: 'rotate(4deg)',
              boxShadow: shadow,
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img */}
          <PublicDemoImg
            src={hourglass}
            alt=""
            width={TILES.hourglass.w}
            height={TILES.hourglass.h}
            style={{
              position: 'absolute',
              left: 290,
              top: 44,
              borderRadius: 9999,
              objectFit: 'cover',
              boxShadow: shadow,
            }}
          />
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: 'Bricolage Grotesque', data: bricolage, weight: 600, style: 'normal' },
        { name: 'Playfair Display', data: playfairItalic, weight: 600, style: 'italic' },
        { name: 'Hanken Grotesk', data: hanken, weight: 500, style: 'normal' },
      ],
    },
  )
}
