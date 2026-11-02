#!/bin/bash
# encode-broll.sh <src> <outdir> <slug> <WxH> <poster_t>
# Seamless 4.4 s loop: source 0.6-5.0 s with its last 0.6 s cross-faded into source 0-0.6 s,
# so the final frame flows back into the first. Shared light grade so B, B2 and C match.
set -euo pipefail
SRC=$1; OUT=$2; SLUG=$3; WH=$4; PT=$5
W=${WH%x*}; H=${WH#*x}
mkdir -p "$OUT"
GRADE="eq=saturation=0.9:contrast=1.03:gamma=0.98,colorbalance=rs=-0.02:bs=0.02:rh=0.02"
FC="[0:v]scale=${W}:${H}:flags=lanczos,setsar=1,${GRADE},fps=24,split[a][b];[a]trim=start=0.6:end=5.0,setpts=PTS-STARTPTS[A];[b]trim=start=0:end=0.6,setpts=PTS-STARTPTS[B];[A][B]xfade=transition=fade:duration=0.6:offset=3.8,format=yuv420p[v]"
ffmpeg -v error -y -i "$SRC" -filter_complex "$FC" -map "[v]" -an -c:v libx264 -preset slow -crf ${CRF:-24} -profile:v high -movflags +faststart "$OUT/$SLUG.mp4"
ffmpeg -v error -y -i "$SRC" -filter_complex "$FC" -map "[v]" -an -c:v libsvtav1 -preset 5 -crf ${AV1:-36} "$OUT/$SLUG.webm" 2>&1 | grep -v '^Svt' || true
T=$(mktemp -d)
ffmpeg -v error -y -ss "$PT" -i "$SRC" -frames:v 1 -vf "scale=${W}:${H}:flags=lanczos,setsar=1,${GRADE}" "$T/p.png"
cwebp -quiet -q 80 -m 6 "$T/p.png" -o "$OUT/$SLUG-poster.webp"; rm -rf "$T"
ls -la "$OUT" | grep "$SLUG"
