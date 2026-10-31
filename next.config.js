const path = require('path')
const { existsSync } = require('fs')
const productionContent = process.env.VERCEL_ENV === 'production'
const productionData = path.join(__dirname, 'src/site-content/generated.production.json')
if (productionContent && !existsSync(productionData)) throw new Error('Production website content was not prepared')
const { withBotId } = require('botid/next/config')
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Every task-worktree (per CLAUDE.md's workflow) symlinks node_modules from the
  // primary `vibrana.ai` checkout. Turbopack's root auto-detection treats that
  // resolved symlink target as outside the project root and panics
  // ("Symlink [project]/node_modules is invalid, it points out of the filesystem
  // root") unless a shared root containing BOTH the checkout and the symlink
  // target is declared. Worktrees live either as siblings of the primary checkout
  // or nested one level deeper under `vibrana.ai-worktrees/`, so the shared root
  // is the `Projects/` ancestor in both cases. See
  // https://github.com/vercel/next.js/issues/88335.
  webpack(config) {
    if (productionContent) {
      config.resolve.alias['@/src/site-content/generated.json$'] = productionData
      // Next resolves tsconfig paths before webpack aliases run.
      // Also match the resolved sample path so prepared data is consumed.
      config.resolve.alias[path.join(__dirname, 'src/site-content/generated.json') + '$'] = productionData
    }
    return config
  },
  turbopack: {
    ...(productionContent ? { resolveAlias: { '@/src/site-content/generated.json': './src/site-content/generated.production.json' } } : {}),
    root: __dirname.includes(`${path.sep}vibrana.ai-worktrees${path.sep}`)
      ? path.join(__dirname, '..', '..')
      : path.join(__dirname, '..'),
  },
  // The simulator's plan-email PDF renders on the server with React-PDF (yoga wasm,
  // pdfkit); load it from node_modules at runtime instead of bundling it.
  serverExternalPackages: ['@react-pdf/renderer'],
  // pdfkit's ESM build loads its built-in fonts with a createRequire'd
  // require('#standard-fonts/<Name>'), which its package `imports` map sends to the
  // `.cjs` files. The webpack build Vercel runs (vercel.json: `next build --webpack`)
  // traces only the `.mjs` twins, so production threw MODULE_NOT_FOUND for
  // Helvetica.cjs. Ship the `.cjs` fonts (and their shared chunk) with the route.
  outputFileTracingIncludes: {
    '/api/assessment-leads': ['./node_modules/pdfkit/js/standard-fonts/**/*.cjs'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    optimizePackageImports: ['framer-motion', 'lucide-react'],
  },
  async redirects() {
    return [
      // Short link for the AI Transformation Simulator (VIB-430).
      {
        source: '/simulator',
        destination: '/ai-transformation/simulator',
        permanent: false,
      },
      // The curriculum landing is now canonical at /learn. Preserve links / SEO
      // from every prior path (job-functions → curriculum → learn).
      {
        source: '/curriculum',
        destination: '/learn',
        permanent: true,
      },
      {
        source: '/job-functions',
        destination: '/learn',
        permanent: true,
      },
      {
        source: '/learning-journeys',
        destination: '/learn',
        permanent: true,
      },
      // Retired B2C course pages — full B2B pivot. Send stragglers to /learn.
      {
        source: '/intro-to-vibe-coding',
        destination: '/learn',
        permanent: true,
      },
      {
        source: '/design-course',
        destination: '/learn',
        permanent: true,
      },
      {
        source: '/build-like-a-pro',
        destination: '/learn',
        permanent: true,
      },
      // Retired Build Like a Pro booking flow (Stripe return pages).
      {
        source: '/booking/:path*',
        destination: '/learn',
        permanent: true,
      },
      {
        source: '/vibe-sprint',
        destination: '/learn',
        permanent: true,
      },
      // Retired Collective page.
      {
        source: '/collective',
        destination: '/about',
        permanent: true,
      },
    ]
  },
}

module.exports = withBotId(withBundleAnalyzer(nextConfig))
