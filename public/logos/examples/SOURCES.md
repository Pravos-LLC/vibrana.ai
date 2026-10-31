# Example-company logos (simulator sector examples + marketing/media candidates)

Read 2026-10-15. Every file below came from the company's own website (header logo, brand asset or press kit), not from a logo farm or Wikipedia. No file was redrawn or edited except where noted. Brand marks belong to their owners; usage here is nominative (identifying the company the visitor is reading about). None of these companies has granted Vibrana a license, and none of the files below came with a written license.

Usage note legend:
- **Press kit**: the company publishes the file for press and media use (nominative use is the stated purpose).
- **Site header**: logo file as served in the company's public website header; no brand-use terms were found or read. Treat as nominative use only, unverified.

Rendering convention: matches the existing logos in `public/logos/` (see `src/logo-rows-content.ts`). Files keep their original colors; the page applies `.logo-mono` / `.proof-logo` (`filter: brightness(0)`, plus `invert(1)` in `[data-theme="dark"]`) to get black on light and white on dark. This works for every file here because all marks are shape-on-transparent. Two caveats under that filter: the Brisbane Catholic Education mark and the ENEOS red box lose their internal detail and read as solid blobs.

| Company | File | Kind | Source URL | Usage note |
|---|---|---|---|---|
| Univé | unive.svg | wordmark (with apple leaf) | https://www.unive.nl/ (inline header SVG; the payoff variant is https://www.unive.nl/assets/images/unive-logo-payoff.svg) | Site header |
| JLL | jll.svg | symbol + wordmark | https://www.jll.com/en-us (inline header SVG). Cropped viewBox to drop the "See a brighter way" tagline; CSS variables replaced with the site's computed values (#000, #de0614). | Site header |
| ENEOS Materials | eneos-materials.png (364x36, below the 512px target; no SVG found) | symbol + Japanese/Latin wordmark | https://www.eneos-materials.com/common/images/com_logo01.png | Site header |
| Brisbane Catholic Education | brisbane-catholic-education.svg | symbol + wordmark + tagline | https://www.bne.catholic.edu.au/images/UserUploadedImages/11/BCE_logo_negativeA.svg (white-on-dark variant, fine under the mono filter) | Site header |
| UK Government | uk-government.svg | GOV.UK logotype (crown + wordmark). This is the GOV.UK mark, not the "HM Government" lockup. | https://www.gov.uk (inline header SVG) | Site header. The crown is protected; GOV.UK marks are for government use, so treat as nominative only. |
| Oak National Academy (Aila) | oak-national-academy.svg | symbol + wordmark. Aila is a product of Oak; it has no separate mark in use here. | https://res.cloudinary.com/oak-web-application/image/upload/v1765468420/OakLogoWithText.svg (linked from https://www.thenational.academy) | Site header |
| Holiday Extras | holiday-extras.svg | wordmark | https://d17s4kc6349e5h.cloudfront.net/holidayextras/assets/images/logos/HolidayExtras-logo-horizontal-transparent.svg (linked from https://www.holidayextras.com) | Site header (white-and-yellow variant) |
| Moderna | moderna.svg | wordmark | https://www.modernatx.com (inline header SVG) | Site header |
| OCBC | ocbc.png (1160x312) | symbol + wordmark | https://www.ocbc.com/iwov-resources/sg/ocbc/gbc/img/logo_ocbc.png | Site header |
| Paddle | paddle.svg | wordmark (white variant) | https://www.paddle.com/_next/static/media/paddle-logo.3nuh_p47ikphg.svg | Site header |
| PwC | pwc.svg | wordmark ("pwc" with orange bars) | https://www.pwc.com/etc.clientlibs/pwc/clientlibs/rebrand-clientlibs/components-colors/resources/images/slim-header-v2/PwC-logo.svg (curl got 403; read through a headless browser) | Site header |
| Alma (Dust case study; the French BNPL firm) | alma.svg | wordmark | https://getalma.eu (inline header SVG) | Site header |
| SYXPERIANE | syxperiane.svg | symbol + wordmark + tagline | https://syxperiane.com/wp-content/uploads/2022/07/logo_sys_mono.svg | Site header (white variant) |
| Applium | applium.svg | wordmark (white + orange variant) | https://www.applium.com/fr/wp-content/uploads/2024/02/logo-white.svg | Site header |
| Satispay | satispay.png (2726x666, red horizontal lockup) | symbol + wordmark | Press kit zip linked from https://www.satispay.com/it-it/brand-asset-repository/ (https://www.datocms-assets.com/133951/1785848311-satispay-stampa-e-media.zip), file `Logo/Satispay Red/png/03_horizontal-lockup.png`. The kit ships PNG only. | Press kit |
| Walmart | walmart.svg | wordmark + spark (white text variant). Added a viewBox so it scales. | https://i5.walmartimages.com/dfw/63fd9f59-b3e1/7a569e53-f29a-4c3d-bfaf-6f7a158bfadd/v1/walmartLogo.svg (linked from https://www.walmart.com) | Site header |
| JPMorgan Chase | jpmorgan-chase.svg | wordmark | https://www.jpmorganchase.com/content/dam/jpmorganchase/images/logos/jpmc-logo.svg | Site header |
| WPP | wpp.svg | wordmark (dot-matrix; 57 KB) | https://www.wpp.com (inline header SVG; stripped a Tailwind class attribute) | Site header |
| Omnicom | omnicom.png (680x104) | wordmark | https://www.omc.com/wp-content/uploads/2025/11/omnicom-logo-large-hp.png | Site header. No SVG found. |
| Publicis Groupe | publicis-groupe.svg | symbol (lion) + wordmark | https://www.publicisgroupe.com/sites/default/files/2021-02/publicis-groupe-logo_0.svg | Site header |
| Dentsu | dentsu.png (304x64, below the 512px target; no SVG found) | wordmark | https://www.dentsu.com/assets/images/main-logo-alt.png | Site header |
| Havas | havas.svg | wordmark | https://www.havas.com/wp-content/themes/havas-group/dist/assets/images/logo.svg | Site header |
| Mediahuis | mediahuis.svg | symbol + wordmark | https://www.mediahuis.com (inline header SVG, fetched through Firecrawl; the standalone logo-color.svg returned 403) | Site header |
| Spotify | spotify.svg | symbol + wordmark | https://www.spotify.com/us/about-us/contact/ (inline header SVG; CSS variable and class attributes stripped). Spotify's newsroom media kit (https://newsroom.spotify.com/media-kit/logo-and-brand-assets/) is the stated source for press use and offers PNG. | Site header. Press kit exists but was not used for the file. |
| Schibsted | schibsted.svg | wordmark (white variant) | https://schibsted.com/wp-content/themes/scom/assets/img/Schibsted-logo-medium-white.svg | Site header |
| News Corp | news-corp.png (932x227) | script wordmark | https://newscorp.com/wp-content/uploads/2021/06/news_corp_logo-edited.png | Site header |
| Sample7762ced80e09 | not copied; already in the repo at `public/logos/logo-samplea7f1e6bfe611.svg` (used in `src/logo-rows-content.ts`, delivered client, naming approved 2026-09-26) | wordmark | existing repo file | Client logo, already approved for use |

## No usable logo

| Company | Why |
|---|---|
| Axel Springer | The site renders its mark as web-font text ("axel springer" with a tilde), not a logo file. No press kit found. |
| Reach plc | The logo exists at https://www.reachplc.com/content/dam/reach/corporate/images/home/reach-logo.svg but the host returns 403 to curl, headless browser and Firecrawl (Akamai block). Not downloaded. Third-party copies exist (Seeklogo, VectorSeek) but were not used. |

Companies named in the research file with no mark of their own here: Aila (use Oak National Academy), UK Government (GOV.UK logotype used).

## Not verified

- No brand guideline PDF was read for any company except where noted. Typical guidelines forbid recoloring; the mono filter is a CSS rendering choice, same as the existing proof-row logos.
- Sizes below the 512px target: ENEOS Materials (364), Dentsu (304).
