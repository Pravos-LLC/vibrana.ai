# Landing kit

Shared parts for the offer landing pages (`/ai-build-sprint`, `/ai-transformation`, `/ai-readiness`,
`/eu-ai-act-readiness`, `/ai-transformation/simulator`). Import from `@/src/components/landing`.
Live gallery with synthetic demos, light and dark: `/prism/landing-kit` (and `?theme=dark`), noindex.

Plan and rules: hub `gtm/programs/assessment-landing-pages/plan.md` and `inspiration.md`.

## Components

| Component | What it is for | Key props |
|---|---|---|
| `ReelStage` | A 9:16 reel in a desktop hero, framed over a blurred copy of itself | `clips[]` (`id`, `label`, `mp4`, `webm?`, `poster`, `duration?`), `title`, `strip?`, `captionNote?`, `cardWidth` 300 to 360 |
| `DeliverablePreview` | Real report or app components at preview scale, in three beats with callouts | children (one per beat), `beats[]` (`id`, `label`, `callouts?[]` with `x`/`y` percent and `side`, `hold?` ms), `variant` `paper` or `app`, `title`, `designWidth?`, `autoplay?`, `label` |
| `ProofMetric`, `ProofMetricRow` | Stats that never squish | metric: `value`, `unit?`, `prefix?`, `label`, `source?`; row: `maxColumns` 2 to 4, `source?`, `label?` |
| `DistinctProductFrame` | One product, one frame language | `chrome` `browser`/`app`/`phone`/`terminal`, `accent` `violet`/`teal`, `density` `comfortable`/`compact`, `title?`, `caption?`, `bleed?` |
| `ProductToggle` | Two prototypes, one at a time, full size | `items[]` (`id`, `label`, `audience`, `content`), `label`, `defaultId?` |
| `ProblemSequence` | Problem lines plus a close as one visual moment | `lines[]` (`text`, `visual?`), `close`, `label` |
| `ChapterRail` | Sticky chapter list (Field Report) | `chapters[]` (`id`, `title`, `number?`), `label?`, `top?` |
| `GateCard` | Acceptance gate with a checklist that ticks in view | `gate`, `title`, `criteria[]`, `signedBy?`, `when?` |
| Image slot guard | Test helper: one asset per slot, no placeholders | `assertImageSlots(html, known)`, `findImageSlotViolations`, `checkImageSlots` |

## The mono face

The label voice is **JetBrains Mono** (SIL OFL 1.1, notice in `app/fonts/licenses/`). It was already
self-hosted from `app/fonts/JetBrainsMono-Variable.woff2` through `next/font/local`, so it adds no
new request or bytes. Chosen over Geist Mono and IBM Plex Mono because it is already in the build,
its tall x-height stays legible at 12px, and its plain, open forms sit quietly beside Bricolage
Grotesque and Hanken Grotesk without reading as a code editor.

- `font-label` (Tailwind theme key `--font-label`) for the family alone.
- `.label-mono` for the full label voice: 12px, tabular figures, slight tracking, set as written
  (no forced uppercase). It outranks `.prism-light p`, so `<p className="label-mono">` keeps its size.
- `.tabular` on display numerals (Bricolage ships `tnum`).

Use it for figure numbers (`FIG 2.1`), counters (`01 / 03`), captions, table headers and dates.
Not for body copy or headlines.

## Rules and gotchas for page builders

- **Text size inside `.prism-light`.** `.prism-light p` and `.prism-light h1` to `h6` fix the font
  size and line height, so Tailwind `text-*` and `leading-*` classes on a `p` or heading do nothing.
  Size those elements with an inline `style={{ fontSize, lineHeight }}` or the `.type-*` classes; or
  use a `div`/`span`. This is also why some product mocks look cramped (finding B3).
- **Margins on kit roots.** `ProofMetricRow`, `DeliverablePreview` and `DistinctProductFrame` render a
  `figure` with `m-0`, which cancels Tailwind v4 `space-y-*` (it puts margin on the previous child).
  Space them with `flex flex-col gap-*` or `grid gap-*`.
- **Image slots.** Add your page to `PAGES` in `tests/landing/image-slots.test.tsx` with `known: []`.
  The test renders the page on the server with `next/image` and `PublicDemoImage` mocked to plain
  `<img>`, and fails on an asset in two slots, `/assets/imagery/homepage/prism-grid-solar.webp`, or
  any `public-demo:*` source. Existing pages carry their current violations; delete your page's
  entries when the rebuild clears them (a stale entry fails too). CSS `background-image` is not a
  slot: ReelStage uses it for its blurred backdrop and film-strip thumbnails, which echo the poster.
- **ReelStage loading.** Pass a poster for every clip. Video is `preload="none"` and starts muted
  only when half the stage is in view, never with reduced motion or Save-Data. Keep the hero loop
  under 3 MB. Captions must be burned into the cut; say so in `captionNote`.
- **DeliverablePreview callouts** bleed about 9.5rem past the frame edge at `lg` and up. Leave that
  room beside the frame, or set `side` so labels point into open space. Below `lg` the notes list
  under the frame. Each beat remounts its child, so the component's own entrance plays again.
- **ProblemSequence** pins only at 768px and up with motion allowed; it adds about 70vh of scroll
  per line. Before hydration and under reduced motion it renders the static ledger, so nothing is
  blank in a full-page capture. Keep lines short (under about 45 characters).
- **ChapterRail** must sit in a container that spans the chapters for `sticky` to hold. On mobile
  its sticky bar needs the same; the gallery uses `max-md:contents` on its `aside`.
- **DistinctProductFrame** desktop silhouettes keep 560px on phones and scroll sideways. Do not put
  two frames side by side below 560px each; use `ProductToggle`.
- **Gradient once.** The kit's gradient appears in strikes, rail markers and progress lines.
  A page uses the gradient in one hero element; do not stack several kit gradients in one viewport.
- **Dark mode.** Everything reads tokens, so `data-theme="dark"` on any ancestor flips it. The
  terminal chrome is always dark. Existing product mocks are not dark-safe.
- No em dashes in visible text. American spelling.
