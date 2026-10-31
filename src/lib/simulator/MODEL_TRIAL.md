# Simulator classifier: model trial

Spec: hub `gtm/simulator/SPEC.md` section 10. The website step asks one model to pick a
sector from `SECTOR_IDS` and score each function. Rule (John, 2026-10-12): an open-weight
model through OpenRouter, chosen by a trial, never an Anthropic model.

**Chosen: `mistralai/mistral-small-3.2-24b-instruct`** (set as `DEFAULT_CLASSIFIER_MODEL`
in `profile/classify.ts`; override with `SIMULATOR_CLASSIFIER_MODEL`). It was the cheapest
model that cleared every bar.

## Method (run 2026-10-13)

- Script: `scripts/simulator/model-trial.ts`, run as `npx tsx scripts/simulator/model-trial.ts <cache-dir>`.
  Page text is cached outside the repo and never committed; only the domains below are.
- Inputs: 32 company homepages, each hand-labeled with its sector **before** the run, spread
  across `SECTORS` and weighted to ICP-A (insurance 5, financial services 5, proptech 3,
  consumer brands 3). One (open.ac.uk) could not be read, so 31 were scored.
- Each homepage was scraped once with Firecrawl and trimmed with the production
  `trimMarkdown`. Every call used the production request (`classifyOnce`): JSON-schema
  structured output, `provider.require_parameters`, `data_collection: "deny"`, `zdr: true`,
  temperature 0, with the production one retry.
- Candidates: current open-weight instruct models on OpenRouter that support structured
  outputs. No reasoning models.
- Bar, set before the run: top-1 accuracy at least 85%, schema valid 100% after one retry,
  p95 latency under 5 s. Then the cheapest model that clears it.

## Results

| Model | Top-1 | Top-3 | Schema valid, first call | Schema valid after one retry | p50 latency | p95 latency | Cost per site | Clears bar |
|---|---|---|---|---|---|---|---|---|
| meta-llama/llama-3.3-70b-instruct | 100% (31/31) | 100% | 97% | 100% | 0.7 s | 1.9 s | $0.00057 | yes |
| meta-llama/llama-4-maverick | 90% (28/31) | 90% | 81% | 90% | 1.0 s | 1.7 s | $0.00082 | no (schema) |
| **mistralai/mistral-small-3.2-24b-instruct** | **100% (31/31)** | **100%** | **97%** | **100%** | **0.8 s** | **2.2 s** | **$0.00029** | **yes, cheapest** |
| google/gemma-3-27b-it | 97% (30/31) | 97% | 97% | 97% | 0.8 s | 2.4 s | $0.00028 | no (schema) |
| qwen/qwen3-235b-a22b-2507 | 97% (30/31) | 100% | 97% | 100% | 0.8 s | 2.1 s | $0.00053 | yes |

Cost per site includes any retry, from OpenRouter's reported `usage.cost`.

Misses: llama-4-maverick returned invalid JSON twice for hiscox.co.uk, rightmove.co.uk and
slaughterandmay.com; gemma-3-27b-it for dhl.com; qwen3-235b classed multiverse.io as
professional services (labeled education).

An earlier round the same day scored only 18 sites (Firecrawl rate-limited the rest) with
the same ranking; that round's p95 of 12 s for llama-3.3-70b was one slow provider.

**Firecrawl latency:** p50 1.3 s, p95 2.7 s over the fresh scrapes, well inside the 8 s
production timeout. Firecrawl's plan returned HTTP 429 after about ten scrapes in quick
succession; the production route treats that as an unreadable site (manual sector path).

## Labeled inputs

insurance: lemonade.com, hiscox.co.uk, zego.com, wefox.com, manypets.com ·
financial services: monzo.com, starlingbank.com, wise.com, nutmeg.com, fundingcircle.com ·
real estate: zoopla.co.uk, rightmove.co.uk, openrent.co.uk ·
software: personio.com, pipedrive.com, intercom.com ·
marketing and media: wearesocial.com, ogilvy.com, monks.com ·
e-commerce and retail: gymshark.com, allbirds.com, asos.com ·
professional services: mckinsey.com, slaughterandmay.com ·
healthcare: ceracare.co.uk, spirehealthcare.com ·
manufacturing and logistics: dhl.com, jcb.com ·
education: open.ac.uk (unreadable), multiverse.io ·
public and nonprofit: oxfam.org.uk, redcross.org.uk

Re-run this trial whenever the model changes, and record the new table here.

## v2 schema check (2026-10-15)

Same model (`mistralai/mistral-small-3.2-24b-instruct`), schema extended with `summary` (at most 200
characters, homepage facts only), `offerings` (up to three 2-to-4-word noun phrases) and `hq_country`
(ISO alpha-2 or empty). Eight live homepages through the real `buildProfile` (Firecrawl with screenshot,
logo copy, classifier), storage on an isolated local Supabase, calls spaced 8 s apart for the Firecrawl
rate limit. Domains only below; no page text kept.

| Domain | Time | Sector (confidence) | HQ | Offerings kept | Logo | Screenshot |
|---|---|---|---|---|---|---|
| sampleb544654a4d1a.com | 10.6 s | insurance (0.90) | GB, right | 2 | stored | stored |
| hippo.com | 10.6 s | insurance (0.90) | US, right | 2 | stored | stored |
| zoopla.co.uk | 9.9 s | real-estate (0.90) | GB, right | 2 | stored | stored |
| linear.app | 10.2 s | software (0.90) | US, right | 2 | stored | stored |
| monzo.com | 10.3 s | financial-services (0.90) | GB, right | 2 | stored | stored |
| octopus.energy | 11.0 s | financial-services (0.90) | GB, right | 1 | stored | stored |
| n26.com | 10.0 s | financial-services (0.90) | DE, right | 2 (60-char cap) | stored | stored |
| mollie.com | 9.7 s | financial-services (0.90) | NL, right | 3 | stored | stored |

- **Schema-valid:** 8 of 8 on the first call. **HQ country:** 8 of 8 right.
- **Summaries:** plain, factual, grounded in the page; no invented results. The model ignores the
  150-character hint and writes 155 to 200 characters, so the server cap (200, cut at a word with an
  ellipsis) does the work; about one in four is cut. Some repeat the site's own adjectives
  ("cheaper, greener"), which is the page's claim, not ours.
- **Offerings:** often longer than asked. Phrases over 60 characters are dropped rather than cut, so a
  site can show one or two.
- **Known miss:** octopus.energy (an energy supplier) lands in financial-services; the sector list has no
  utilities option, so `other` would be the honest answer. A sector-list change, not a model change.
