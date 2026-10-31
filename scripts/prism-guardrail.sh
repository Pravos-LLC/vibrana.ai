#!/usr/bin/env bash
# Prism Light guardrail — fails if legacy theme artifacts reappear.
# Run: npm run guardrail   (or wire into CI)
set -uo pipefail
cd "$(dirname "$0")/.."

fail=0
report() { if [ -n "$1" ]; then echo "✗ $2"; echo "$1"; fail=1; else echo "✓ $2"; fi; }

# A) Legacy brand hex (Prism literals like #7c3aed/#f59e0b/#2dd4bf are allowed).
#    Excludes app/globals.css (token defs) and day-14 email content ("Earth Brown").
A=$(grep -rniE '#(FBBF24|10B981|059669|047857|84CC16|A3E635|34D399|65A30D|f4b53f)' src app lib \
  --include='*.tsx' --include='*.ts' --include='*.css' 2>/dev/null \
  | grep -vE 'app/globals.css|day-14\.ts:.*Earth Brown')
report "$A" "no legacy brand hex"

# B) Legacy theme reads (the bridge mount-gate file is allowed).
B=$(grep -rniE 'useTheme|\bisDark\b|--vb-' src app --include='*.tsx' --include='*.ts' 2>/dev/null \
  | grep -vE 'context/ThemeContext\.tsx|app/globals\.css')
report "$B" "no legacy theme reads (useTheme/isDark/--vb-)"

# C) Dark Tailwind surfaces/text (modal scrims bg-black/40-60 are allowed).
C=$(grep -rniE 'bg-(black|zinc-[0-9]|gray-(8|9)[0-9][0-9])|text-(zinc|slate)-[0-9]|bg-slate-[0-9]' src app \
  --include='*.tsx' 2>/dev/null | grep -vE 'bg-black/(40|50|60)')
report "$C" "no dark Tailwind surfaces/text"

# D) Near-black arbitrary-hex backgrounds on marketing pages (bg-[#0a0a0a]-style).
#    Named Tailwind dark classes are caught by (C), but an arbitrary hex value
#    dodges that regex entirely -- which is exactly how bg-[#050505] (near-
#    identical to the dead dark-theme's --surface-raised: #111114) slipped past
#    this guardrail on the swag page. Scoped to src/views (page content), not the
#    whole tree: product-mock "hardware chrome" (MacBookFrame bezel,
#    ResolutionLadder's loading plate) is legitimately dark by design, the same
#    way modal scrims are exempt above.
#    Allowlisted: SwagPage.tsx's two art-plate divs, which use bg-[#111111]
#    deliberately (see the comment above `panel` there) -- it matches the swag
#    artwork's own near-black pixel color (verified against the source webp
#    files), not a reintroduced theme surface.
D=$(grep -rniE 'bg-\[#([0-3][0-9a-f]){3}\]' src/views --include='*.tsx' 2>/dev/null \
  | grep -vE 'SwagPage\.tsx:.*bg-\[#111111\]')
report "$D" "no near-black arbitrary-hex backgrounds on page content"

# E) Tailwind v3-only utilities/directives. Not all of these are actually dead
#    in tailwindcss 4.3.3 -- verified by compiling each class with the pinned
#    version: bg-gradient-to-*, flex-shrink-*/flex-grow, overflow-ellipsis, and
#    decoration-clone/slice all still generate CSS; only the *-opacity-*
#    modifiers (bg-opacity-50 etc., replaced by bg-black/50-style opacity
#    modifiers) are genuinely dropped and compile to nothing. The rest are
#    flagged because they're deprecated v3 aliases for the canonical v4
#    spellings (shrink-*/grow-*, text-ellipsis, box-decoration-*) and may be
#    removed in a future major -- and bg-gradient-to-* specifically is not a
#    no-op swap for bg-linear-to-*: it hard-codes oklab interpolation
#    ("to right in oklab", no fallback), while bg-linear-to-* defaults to
#    srgb ("to right") and only upgrades to oklab via an `@supports`
#    progressive-enhancement branch -- a real, intentional visual difference,
#    not just a renamed utility. @tailwind base/components/utilities and
#    tailwindcss-animate ARE genuinely dead (replaced by `@import
#    'tailwindcss'` and tw-animate-css) -- compiling them emits nothing.
#    Config lives in app/globals.css.
E=$(grep -rnE "(^|[\"'\` :])(bg-gradient-to-[a-z]+|flex-(shrink|grow)(-0)?|(bg|text|border|ring|divide|placeholder)-opacity-[0-9]+|overflow-ellipsis|decoration-(slice|clone))([\"'\` ]|$)|@tailwind (base|components|utilities)|tailwindcss-animate" \
  src app lib --include='*.tsx' --include='*.ts' --include='*.css' 2>/dev/null)
report "$E" "no Tailwind v3-only utilities/directives"

[ "$fail" -eq 0 ] && echo "Prism Light guardrail: PASS" || echo "Prism Light guardrail: FAIL"
exit $fail
