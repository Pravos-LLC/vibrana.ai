# Motion: how every page enters

Every element on a Vibrana page enters with motion. A static page is a defect. The pattern is the homepage's: content fades in, rises, settles from a soft blur, and sections land one part after another like a waterfall. This is not optional polish; build it in from the first draft.

## The rules

1. **Hero on load.** Each hero part (eyebrow, h1, subhead, CTAs, media) fades up out of a 6px blur, 120 ms apart, 1.1 s each, ease `[0.23, 1, 0.32, 1]`. See `heroReveal` in `src/views/EnterpriseHomePage.tsx` and `src/components/sprint/SprintHero.tsx`.
2. **Everything below the hero on scroll.** Wrap each section heading in a self-triggering reveal, and each group of siblings (cards, list rows, grid cells) in a staggered group. Use the Prism primitives: `RevealGroup` / `RevealItem` / `RevealBlock` (`src/components/prism/motion/Reveal.tsx`, tokens in `motion/tokens.ts`). The sprint page wraps them as `Reveal` / `RevealStack` in `src/components/sprint/motion.tsx`.
3. **Drawn objects deal in.** A mock window, card stack or diagram arrives part by part (rise, a few degrees of turn, a spring settle), like a dealer laying cards. Use `Deal` / `DealItem` in `src/components/sprint/motion.tsx`. Animate each part, not the whole box.
4. **Scroll-linked visuals fade, they never cut.** No pin-and-swap that blinks out at a page height. Tie opacity to scroll progress with long, soft ramps (`useScroll` + `useTransform`) so an element fades in and out gently.
5. **Key phrase in every h2.** One word or phrase per h2 is set in italic serif with the Prism gradient (`GradientText gradient="prism" className="font-serif-accent"`). On the sprint page that is the `accent` field in the content file, rendered by `SprintHeading`.
6. **Color, not gray.** Illustrations use the Prism palette (violet `#7c3aed`, blue `#3b82f6`, teal `#2dd4bf`) and the semantic emerald, amber and red. Gray-only mocks read as unfinished.
7. **Reduced motion.** Render the final state with no transforms (MotionConfig strips them; the reveals fall back to a short fade). Never render blank content.
8. **Real people on landing pages.** Landing pages use real or approved photography and footage, not Orchid abstract imagery. Orchid is for abstract concepts on pages like /about.
9. **No figure captions.** Landing pages carry no "FIG 1.2 /" captions, numbered callout circles or section counters. Those belong in a paper, not on a landing page.

## Checklist before opening a PR

- Scroll the page top to bottom at 1440 and 390 wide with motion on: does every block enter? Does anything pop, jump or disappear abruptly?
- Reload with `prefers-reduced-motion: reduce`: is everything visible?
- Does each h2 have its gradient key phrase?
