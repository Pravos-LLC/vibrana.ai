# Sourced photography — about-hero-lab

Real stock photography sourced from Unsplash for the about-page hero design
exploration. Sourced key-lessly: found via web search, opened the actual
Unsplash photo page, pulled the direct `images.unsplash.com/photo-...` CDN
URL from the page's image data, downloaded the bytes with `curl`, then
resized (`sips -Z 1600`) and converted to webp (`cwebp -q 84`).

All images below are confirmed "Free to use under the Unsplash License" on
their photo page (not Unsplash+ / premium).

Format: `local-filename.webp — https://unsplash.com/photos/... — Photo by <name>`

## Theme: machine (AI / tech / futurism)

- machine-server-racks-01.webp — https://unsplash.com/photos/a-rack-of-servers-in-a-server-room-2JJ3wBHu4_0 — Photo by Kevin Ache
- machine-processor-chip-01.webp — https://unsplash.com/photos/close-up-of-a-computer-processor-chip-with-ryzen-branding-utzc2cBWUag — Photo by BoliviaInteligente
- machine-circuit-board-01.webp — https://unsplash.com/photos/macro-photography-of-black-circuit-board-FO7JIlwjOtU — Photo by Alexandre Debiève
- machine-robot-arm-factory-01.webp — https://unsplash.com/photos/a-robot-arm-works-in-a-factory-setting-nM71nHjH4Vk — Photo by Oso-rio
- machine-humanoid-01.webp — https://commons.wikimedia.org/wiki/File:Optimus_Tesla.jpg — Photo by Benjamin Ceci, released into the public domain (not Unsplash; Unsplash search was inaccessible behind a bot-block at sourcing time, so this asset was sourced from Wikimedia Commons instead — public domain is a strictly more permissive license than the Unsplash License used elsewhere in this file)

## Theme: crisis (environmental / planetary crisis)

- crisis-drought-cracked-earth-01.webp — https://unsplash.com/photos/cracked-dry-earth-with-sparse-green-grass-and-a-rock-yNcRlpFA5CU — Photo by Lucas Schneider
- crisis-mining-pit-aerial-01.webp — https://unsplash.com/photos/an-aerial-view-of-a-large-rock-quarry-ZCsAkC4TnGw — Photo by Aleksandr Galichkin
- crisis-chip-fab-cleanroom-01.webp — https://unsplash.com/photos/workers-are-inside-a-clean-room-manufacturing-something-6RyofJC3sUw — Photo by TECNIC Bioprocess Solutions
- crisis-wildfire-smoke-01.webp — https://unsplash.com/photos/a-massive-wildfire-rages-under-an-orange-smoke-filled-sky-hUgNAfO5I4Y — Photo by Mike Newbry

## Round 2 addition (About hero refinement pass — BCI swap)

- machine-bci-01.webp — https://commons.wikimedia.org/wiki/File:16wire_electrode_array.jpg — "chronic multi-wire probe", Photo by Steve M. Potter (uploader: Professorpotter, English Wikipedia), released into the public domain by the author. Original is 300x180px; upscaled 3x via Lanczos resample before grading (source-first — Unsplash, Pexels, and Openverse were all bot-blocking headless browsing at sourcing time; Wikimedia Commons' "Implanted electrodes" category had this real macro photo, public domain, no generation needed). Replaces `machine-server-racks-01` in the hero's machine[1] slot — the old orange patch-panel cabling photo read as a generic "server plug-in"; this wire-electrode-array photo reads unambiguously as a neural/BCI device.

## Notes

- Excluded candidate: a data-center server-rack shot ("Data center server
  rack with tangled network cables" by Dmitrii Shirnin) initially looked
  good in search results but its photo page is licensed under Unsplash+
  (paid/premium), not the free Unsplash License — swapped for Kevin Ache's
  free "a rack of servers in a server room" instead.
- The Unsplash License permits free commercial use without required
  attribution; photographer credit above is kept for traceability in case
  attribution is wanted later or an image needs replacing.
