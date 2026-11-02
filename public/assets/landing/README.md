# Landing media

Web-ready video and stills for the five offer landing pages (Build Sprint, Transformation,
Readiness, EU AI Act, Simulator) and the home page placeholders. `manifest.json` lists every file
with its page, slot, dimensions, duration, bytes, sha256, source, approval and alt text.
`tests/landing/media-manifest.test.ts` fails if a file drifts from its manifest entry, a file has
no entry, a loop exceeds 3 MB, or a source points at an unapproved clip.

## Folders

| Folder | What |
|---|---|
| `build-sprint/` | AI software factory reel (Build Sprint stand-in until the film clears), the two new track images, `broll/` John b-roll loops |
| `eu-ai-act/` | EU AI Act explainer reel, EU assessment and report screen loops |
| `simulator/` | Simulator sizzle reel |
| `readiness/` | Readiness assessment screen loops, assessment and report stills |
| `transformation/` | Report pathway screen loops |
| `home/` | AIOS workspace and team brain screenshots, light and dark |

## Encodes

- **Approved reels (9:16):** `-full` is the whole cut with sound at 540x960 (H.264 high + AAC,
  faststart; AV1 + Opus WebM), for lazy loading. `-loop` is a muted 7 to 12 s hero loop at
  720x1280. `-poster` is the opening hook of the full cut; `-loop-poster` is a strong frame inside
  the loop, for `prefers-reduced-motion` and before playback. Every reel has its text burned in,
  so it reads muted.
- **John b-roll:** 4.4 s seamless loops (the last 0.6 s cross-fades into the first frame), a shared
  light grade so B, B2 and C match, 1280x720 and 404x720. C is 16:9 only.
- **Screen loops:** recorded from the real local app with synthetic answers (fictional companies,
  `.example` email domains), 16:9 at 1280x720 and 9:16 at 720x1280, muted, 11 to 12 s, cut from
  sped-up segments with short white dips at the joins.
- Serve WebM (AV1) first and MP4 (H.264) as the fallback:
  `<source src="…webm" type="video/webm; codecs=av01">` then the MP4, since Safari before 17 cannot play AV1.

## Regenerate

Tools: ffmpeg with libx264, libsvtav1 and libopus; `cwebp`; Chrome; Node with Playwright.
Scripts live in `scripts/landing-media/`.

1. **Reels:** `encode-reel.sh <src> <outdir> <slug> <loop_start> <loop_dur> <full_poster_t> <loop_poster_t>`.
   Used: EU `7.9 11.8 1.5 17.0` with `DENOISE=1 FULLCRF=30 FULLAV1=46 ABR=64k OPUS=48k`;
   Simulator `5.3 8.7 1.0 12.5`; factory `34.6 7.2 2.5 39.0` (both at the defaults).
   Verify the source sha256 against the manifest `source` field first.
2. **B-roll:** `encode-broll.sh <src> <outdir> <slug> <WxH> <poster_t>`.
3. **Screen loops:** run the app (`npx next dev -p 3117`, with placeholder `SUPABASE_URL`,
   `SUPABASE_SERVICE_KEY` and `RESEND_API_KEY` values so the API routes load; nothing is stored or
   sent). Then `FDSF=2 node scripts/landing-media/record/<readiness|transformation|eu>.mjs <outdir> <w> <h> <dpr> <mobile 0|1>`
   (16:9: `1152 648 1.6667 0`; 9:16: `390 693 2 1`). Assemble the frames with
   `ffmpeg -f concat -safe 0 -i <outdir>/frames/list.txt -vf fps=30 … raw.mp4`, then
   `cut-loop.sh <raw> <outdir> <slug> <WxH> <poster_t> <start:end:speed> …`. Segment timings
   depend on the run; pick them from a contact sheet.
4. **Stills:** `node scripts/landing-media/record/shots.mjs <outdir>`, then `cwebp -q 86`.
   Track images go through the Orchid grade (`people-v2`) before `cwebp -q 80`.
5. `node scripts/landing-media/build-manifest.mjs` rewrites `manifest.json`; then `npx vitest run tests/landing`.
