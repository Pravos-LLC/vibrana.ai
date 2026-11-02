#!/bin/bash
# cut-loop.sh <raw> <outdir> <slug> <WxH> <poster_t_in_output> <start:end:speed> [...]
# Joins sped-up segments of a raw screen capture into one muted loop, with 0.25 s fades at the
# joins so the cut reads as edited, not glitched. Encodes H.264 (faststart) + AV1 WebM + WebP poster.
set -euo pipefail
RAW=$1; OUT=$2; SLUG=$3; WH=$4; PT=$5; shift 5
W=${WH%x*}; H=${WH#*x}
mkdir -p "$OUT"
FC=""; LABELS=""; i=0
for seg in "$@"; do
  IFS=: read -r A B SP <<< "$seg"
  D=$(python3 -c "print(round(($B-$A)/$SP,3))")
  FO=$(python3 -c "print(round(max($D-0.25,0),3))")
  FC+="[0:v]trim=start=$A:end=$B,setpts=(PTS-STARTPTS)/$SP,fps=30,scale=${W}:${H}:flags=lanczos,setsar=1,fade=t=in:st=0:d=0.25:color=white,fade=t=out:st=$FO:d=0.25:color=white[s$i];"
  LABELS+="[s$i]"; i=$((i+1))
done
FC+="${LABELS}concat=n=$i:v=1:a=0,format=yuv420p[v]"
ffmpeg -v error -y -i "$RAW" -filter_complex "$FC" -map "[v]" -an -c:v libx264 -preset slow -crf ${CRF:-23} -profile:v high -tune stillimage -movflags +faststart "$OUT/$SLUG.mp4"
ffmpeg -v error -y -i "$OUT/$SLUG.mp4" -an -c:v libsvtav1 -preset 5 -crf ${AV1:-36} "$OUT/$SLUG.webm" 2>&1 | grep -v '^Svt' || true
T=$(mktemp -d); ffmpeg -v error -y -ss "$PT" -i "$OUT/$SLUG.mp4" -frames:v 1 "$T/p.png"; cwebp -quiet -q 85 -m 6 "$T/p.png" -o "$OUT/$SLUG-poster.webp"; rm -rf "$T"
ls -la "$OUT" | grep "$SLUG"; ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT/$SLUG.mp4"
