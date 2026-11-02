# Landing media

Web-ready video and stills for the five offer landing pages (Build Sprint, Transformation,
Readiness, EU AI Act, Simulator) and the home page placeholders, under `public/assets/landing/`.

## Using them in a page

Import the typed accessor, never a literal path. File names carry a content hash (see Caching), so
look assets up by their stable id, which is the path under `/assets/landing/` without the hash:

```ts
import { landingVideo, landingMedia, landingMediaForPage } from '@/src/landing-media'

const reel = landingVideo('eu-ai-act/eu-ai-act-explainer-loop') // { mp4, webm, poster }
const shot = landingMedia('readiness/readiness-question.webp')  // { path, width, height, alt, ... }
```

`src/landing-media/manifest.json` holds what pages need: path, kind, page, slot, dimensions,
duration, codecs, bytes, sha256, captions and alt text. Source files, approvals and cut notes live in
`scripts/landing-media/provenance.json`, which is never bundled or served.

`tests/landing/media-manifest.test.ts` fails if:
- a file drifts from its sha256, or its name does not carry its own hash;
- a file has no manifest entry, or an entry has no provenance;
- a manifest or notes file appears under `public/`;
- a loop exceeds 3 MB;
- a b-roll source is not on the approved list (John's clips B and B2).

## Folders

| Folder | What |
|---|---|
| `build-sprint/` | AI software factory reel, Product and Governance track images, `broll/` John b-roll loops |
| `eu-ai-act/` | EU AI Act explainer reel, EU assessment and report screen loops |
| `simulator/` | Simulator sizzle reel |
| `readiness/` | Readiness assessment screen loops, assessment and report stills |
| `transformation/` | Report pathway screen loops |
| `home/` | AIOS workspace and team brain screenshots, light and dark |

## Encodes

- **Reels (9:16):**
  - `-full` is the whole cut with sound at 540x960 (H.264 high + AAC, faststart; AV1 + Opus WebM). Load it lazily.
  - `-loop` is a muted 7 to 12 s hero loop at 720x1280.
  - `-poster` is the opening frame of the full cut. `-loop-poster` is a strong frame inside the loop, for `prefers-reduced-motion` and before playback.
  - Every reel has its text burned in, so it reads muted.
- **John b-roll:** 4.4 s seamless loops (the last 0.6 s cross-fades into the first frame), one shared light grade, 1280x720 and 404x720.
- **Screen loops:**
  - Recorded from the real local app with synthetic answers: fictional companies, `.example` email domains.
  - 16:9 at 1280x720 and 9:16 at 720x1280, muted, 11 to 12 s.
  - Cut from sped-up segments, with short white dips at the joins.
- **Serving:** list the AV1 WebM first (`type="video/webm; codecs=av01"`) and the H.264 MP4 second. Safari before 17 cannot play AV1.

## Caching

`vercel.json` serves `/assets/*` with `max-age=31536000, immutable`. Every file here is named
`<name>.<first 8 hex of sha256>.<ext>`, so a re-encode gets a new URL and a returning visitor never
keeps stale bytes. The encode scripts write plain names; `build-manifest.mjs` renames them.

## Regenerate

Tools: ffmpeg with libx264, libsvtav1 and libopus; `cwebp`; Chrome; Node with Playwright.
Scripts are in `scripts/landing-media/`. Encode into `public/assets/landing/<folder>/`, delete the
old hashed file it replaces, then run step 5.

1. **Reels:** `encode-reel.sh <src> <outdir> <slug> <loop_start> <loop_dur> <full_poster_t> <loop_poster_t>`.
   - EU: `7.9 11.8 1.5 17.0`, with `DENOISE=1 FULLCRF=30 FULLAV1=46 ABR=64k OPUS=48k LOOPCRF=25 LOOPAV1=37`.
   - Simulator: `5.3 8.7 1.0 12.5`, at the defaults.
   - Factory: `34.6 7.2 2.5 39.0`, at the defaults.
   - First verify the source sha256 against `provenance.json`.
2. **B-roll:** `encode-broll.sh <src> <outdir> <slug> <WxH> <poster_t>`. Approved sources only.
3. **Screen loops:**
   - Run the app with placeholder values so the API routes load: `SUPABASE_URL=http://127.0.0.1:9 SUPABASE_SERVICE_KEY=x RESEND_API_KEY=x npx next dev -p 3117`.
   - The recorder stubs every API write. The assessment POST goes through only to be scored, and is never saved or sent.
   - Record: `FDSF=2 node scripts/landing-media/record/<readiness|transformation|eu>.mjs <outdir> <w> <h> <dpr> <mobile 0|1>`. Use `1152 648 1.6667 0` for 16:9 and `390 693 2 1` for 9:16.
   - Assemble: `ffmpeg -f concat -safe 0 -i <outdir>/frames/list.txt -vf fps=30 … raw.mp4`.
   - Cut: `cut-loop.sh <raw> <outdir> <slug> <WxH> <poster_t> <start:end:speed> …`. Timings vary by run; pick them from a contact sheet.
4. **Stills:**
   - Screenshots: `node scripts/landing-media/record/shots.mjs <outdir>`, then `cwebp -q 86`.
   - Track images: Orchid grade (`people-v2`), then `cwebp -q 80`.
5. **Manifest:** `node scripts/landing-media/build-manifest.mjs` hashes and renames the files and rewrites both manifests. Then run `npx vitest run tests/landing`.
