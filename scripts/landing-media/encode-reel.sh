#!/bin/bash
# encode-reel.sh <src> <outdir> <slug> <loop_start> <loop_dur> <full_poster_t> <loop_poster_t>
#
# Web encodes of one approved 9:16 reel:
#   <slug>-full.mp4 / .webm   whole cut with sound, 540x960 (H.264 + AAC faststart, AV1 + Opus)
#   <slug>-loop.mp4 / .webm   muted hero loop, 720x1280
#   <slug>-poster.webp        opening hook of the full cut
#   <slug>-loop-poster.webp   a strong frame inside the loop (what reduced-motion visitors see)
#
# Tunables (env): FULLCRF FULLAV1 LOOPCRF LOOPAV1 ABR OPUS DENOISE=1 (light hqdn3d for grainy footage)
set -euo pipefail
SRC=$1; OUT=$2; SLUG=$3; LS=$4; LD=$5; PT=$6; LPT=$7
mkdir -p "$OUT"
FULLCRF=${FULLCRF:-26}; FULLAV1=${FULLAV1:-40}; LOOPCRF=${LOOPCRF:-22}; LOOPAV1=${LOOPAV1:-34}
ABR=${ABR:-80k}; OPUS=${OPUS:-56k}
FULLVF="scale=540:960:flags=lanczos"
[ "${DENOISE:-0}" = 1 ] && FULLVF="$FULLVF,hqdn3d=1.5:1.5:6:6"
FULLVF="$FULLVF,format=yuv420p"
quiet() { grep -v '^Svt' || true; }

ffmpeg -v error -y -i "$SRC" -vf "$FULLVF" -c:v libx264 -preset slower -crf "$FULLCRF" -profile:v high \
  -c:a aac -b:a "$ABR" -ac 2 -movflags +faststart "$OUT/$SLUG-full.mp4"
ffmpeg -v error -y -i "$SRC" -vf "$FULLVF" -c:v libsvtav1 -preset 4 -crf "$FULLAV1" -g 240 \
  -c:a libopus -b:a "$OPUS" "$OUT/$SLUG-full.webm" 2>&1 | quiet

ffmpeg -v error -y -ss "$LS" -t "$LD" -i "$SRC" -an -vf "scale=720:1280:flags=lanczos,format=yuv420p" \
  -c:v libx264 -preset slow -crf "$LOOPCRF" -profile:v high -movflags +faststart "$OUT/$SLUG-loop.mp4"
ffmpeg -v error -y -ss "$LS" -t "$LD" -i "$SRC" -an -vf "scale=720:1280:flags=lanczos,format=yuv420p" \
  -c:v libsvtav1 -preset 5 -crf "$LOOPAV1" -g 240 "$OUT/$SLUG-loop.webm" 2>&1 | quiet

T=$(mktemp -d)
ffmpeg -v error -y -ss "$LPT" -i "$SRC" -frames:v 1 -vf "scale=720:1280:flags=lanczos" "$T/a.png"
ffmpeg -v error -y -ss "$PT" -i "$SRC" -frames:v 1 -vf "scale=720:1280:flags=lanczos" "$T/b.png"
cwebp -quiet -q 82 -m 6 "$T/a.png" -o "$OUT/$SLUG-loop-poster.webp"
cwebp -quiet -q 82 -m 6 "$T/b.png" -o "$OUT/$SLUG-poster.webp"
rm -rf "$T"
ls -la "$OUT" | grep "$SLUG"
