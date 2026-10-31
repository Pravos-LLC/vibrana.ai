import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Providers } from '@/src/components/Providers';
import { SEO_CONFIGS } from '@/src/components/seo-configs';
import { SITE_URL } from '@/src/lib/site';
import './globals.css';
import '@/src/styles/assessment.css';

// All faces are self-hosted from app/fonts/ (the latin woff2 files Google Fonts
// serves) so the build never fetches fonts over the network — a Google Fonts
// hiccup used to fail `next build` in CI.

// Prism Light display face — see DESIGN.md (Typography). Replaces Clash Display.
// Note: the `variable` name is deliberately NOT `--font-display` — that name is
// also a Tailwind theme key in app/globals.css's `@theme inline` block (it feeds
// the `font-display` utility). Reusing it here would make Tailwind's generated
// `:root { --font-display: var(--font-display), ... }` self-referential (a
// cyclic custom property — invalid per spec). It only "worked" before because
// next/font's unlayered class rule on <html> outranks the `@layer theme` rule
// that Tailwind wraps :root declarations in. See globals.css for the non-cyclic
// wiring: `--font-display: var(--next-font-display), ...`.
const bricolageGrotesque = localFont({
  src: './fonts/BricolageGrotesque-Variable.woff2',
  variable: '--next-font-display',
  display: 'swap',
  preload: true,
  weight: '400 700',
});

// Prism Light body face — clean geometric grotesque, the premium Satoshi analog.
// See the `--next-font-display` note above — same reasoning applies to `--font-body`.
const hankenGrotesk = localFont({
  src: './fonts/HankenGrotesk-Variable.woff2',
  variable: '--next-font-body',
  display: 'swap',
  preload: true,
  weight: '300 700',
});

// Serif accent — Playfair Display 600 italic for hero gradient-text contrast
// moments only. Used sparingly (one word per page) to create the serif/grotesque
// contrast. Preload off — progressive enhancement, reads fine with system serif.
const playfair = localFont({
  src: './fonts/PlayfairDisplay-SemiBold.woff2',
  variable: '--font-display-serif',
  display: 'swap',
  preload: false,
  weight: '600',
  adjustFontFallback: 'Times New Roman',
});
const playfairItalic = localFont({
  src: './fonts/PlayfairDisplay-SemiBoldItalic.woff2',
  variable: '--font-display-serif-italic',
  display: 'swap',
  preload: false,
  weight: '600',
  style: 'italic',
  adjustFontFallback: 'Times New Roman',
});

// See the `--next-font-display` note above — same reasoning applies to `--font-mono`.
const jetbrainsMono = localFont({
  src: './fonts/JetBrainsMono-Variable.woff2',
  variable: '--next-font-mono',
  display: 'swap',
  preload: false,
  weight: '400 700',
});

// Sharpie/marker accent — powers the small "marker accent" family in
// src/components/prism/ (MarkerNote, MarkerCaption, MarkerUnderline, MarkerCircle,
// MarkerArrow; see research/design-components/marker-accents.md for the restraint
// rules). Originally scoped to the Polaroid photo caption only; the charter widened
// to any hand-touched annotation moment (margin notes, circled stats, hand-drawn
// underlines/arrows) while keeping the same discipline as the Playfair serif accent
// above — used sparingly, one deliberate moment at a time, never a third body/display
// face for the system generally, and never in section headers or eyebrows.
const permanentMarker = localFont({
  src: './fonts/PermanentMarker-Regular.woff2',
  variable: '--font-marker',
  display: 'swap',
  preload: false,
  weight: '400',
});

export const metadata: Metadata = {
  // Resolves the file-based share cards (app/**/opengraph-image.tsx) to absolute URLs.
  metadataBase: new URL(SITE_URL),
  // Fallbacks for any route without its own metadata. Kept in step with the homepage.
  title: SEO_CONFIGS.home.title,
  description: SEO_CONFIGS.home.description,
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon-256x256.png',
  },
  // No canonical here: a root-level canonical is inherited by every page that doesn't
  // set its own, which pointed /about, /contact, the case studies etc. at the homepage.
  // Each indexable page declares its own `alternates.canonical`.
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bricolageGrotesque.variable} ${playfair.variable} ${playfairItalic.variable} ${hankenGrotesk.variable} ${jetbrainsMono.variable} ${permanentMarker.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: "try{var t=document.cookie.split('; ').find(function(c){return c.indexOf('vibrana-theme=')===0});if(t&&t.split('=')[1]==='dark'){document.documentElement.dataset.theme='dark';document.documentElement.style.colorScheme='dark'}}catch(e){}",
          }}
        />
      </head>
      <body className="font-body prism-light">
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
