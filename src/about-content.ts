// About page content. Copy is data (repo rule).
//
// Vibrana presents as a small, senior, hands-on studio — no Collective framing
// (shelved until more revenue is in). Titles are kept short on purpose.
//
// TEAM: bios + photos are SLOTS for JE to fill. Marked [DRAFT]. Sample16d516d6680b removed;
// Stephan omitted until confirmed.

// The About hero — a "Center-Seam Duality" treatment: a full-height diptych
// with the headline broken across the seam, machine/AI imagery on the left,
// planetary-crisis imagery on the right. Narrative-led rather than a plain
// description, so `topEyebrow` says outright what Vibrana is, and `eyebrow`
// labels the panel below the headline.
export const ABOUT_HERO = {
  topEyebrow: 'AI Transformation Studio',
  eyebrow: 'About Vibrana',
  seamLeft: 'We build for',
  seamWord: 'the edge',
  seamRight: 'of two futures.',
  subtitle:
    'Vibrana sits between transhumanist ambition and planetary crisis, building the agentic systems that let organizations move fast without losing what matters.',
  ctaPrimary: { label: 'Start a project', href: '/contact' },
  ctaSecondary: { label: 'See our approach', href: '#approach' },
}

export interface AboutHeroImage {
  /** Path under /public. */
  src: string
  alt: string
  /** Drives which tile component renders it — RoleImage (illustration) vs AboutHeroPhotoTile (photo). */
  kind: 'illustration' | 'photo'
  theme: 'machine' | 'crisis'
  provenance: 'placeholder-role-art' | 'ai-generated' | 'unsplash-sourced' | 'nasa-public-domain' | 'wikimedia-public-domain'
  /** [c1, c2] rgb triples — only meaningful for kind: 'illustration' (RoleImage). */
  accents?: [string, string]
  /** Only meaningful for kind: 'illustration' (RoleImage's bokeh seed). */
  seed?: number
}

const HERO_MACHINE_ACCENTS: [string, string] = ['59,130,246', '45,212,191'] // blue / cyan
const HERO_CRISIS_ACCENTS: [string, string] = ['245,158,11', '239,68,68'] // amber / red

// The hero's image pool — machine/AI imagery vs planetary-crisis imagery.
// Real photography (AI-generated + Unsplash-sourced + one NASA public-domain
// Earth photo) first; abstract role-art illustrations stay at the end as a
// fallback so the pool is never empty even if a real asset goes missing.
export const ABOUT_HERO_IMAGES: { machine: AboutHeroImage[]; crisis: AboutHeroImage[] } = {
  machine: [
    {
      src: '/assets/imagery/homepage/prism-grid-solar.webp',
      alt: 'Dim data-center hall, long rows of server racks, glowing blue/cyan cable runs down a receding aisle',
      kind: 'photo', theme: 'machine', provenance: 'ai-generated', accents: HERO_MACHINE_ACCENTS,
    },
    {
      src: '/assets/imagery/homepage/prism-grid-solar.webp',
      alt: 'Macro photo of a chronic multi-wire neural electrode array, fine gold-wire threads fanning out from a green PCB connector, evoking a brain-computer interface implant',
      kind: 'photo', theme: 'machine', provenance: 'wikimedia-public-domain', accents: HERO_MACHINE_ACCENTS,
    },
    {
      src: '/assets/imagery/homepage/prism-grid-solar.webp',
      alt: 'Unbranded silver industrial robotic arm in a dim factory bay under a single spotlight',
      kind: 'photo', theme: 'machine', provenance: 'ai-generated', accents: HERO_MACHINE_ACCENTS,
    },
    {
      src: '/assets/imagery/homepage/prism-grid-solar.webp',
      alt: 'Macro close-up of a processor die and PCB, orange circuit traces on a dark background',
      kind: 'photo', theme: 'machine', provenance: 'unsplash-sourced', accents: HERO_MACHINE_ACCENTS,
    },
    {
      src: '/assets/imagery/homepage/prism-grid-solar.webp',
      alt: 'Macro close-up of a semiconductor wafer and chip array, gold circuitry catching light',
      kind: 'photo', theme: 'machine', provenance: 'ai-generated', accents: HERO_MACHINE_ACCENTS,
    },
    {
      src: '/assets/imagery/homepage/prism-grid-solar.webp',
      alt: 'Macro black circuit board with visible chips and traces',
      kind: 'photo', theme: 'machine', provenance: 'unsplash-sourced', accents: HERO_MACHINE_ACCENTS,
    },
    {
      src: '/assets/imagery/homepage/prism-grid-solar.webp',
      alt: 'Dark control room with a wall of screens showing data-visualization and network graphs',
      kind: 'photo', theme: 'machine', provenance: 'ai-generated', accents: HERO_MACHINE_ACCENTS,
    },
    {
      src: '/assets/imagery/homepage/prism-grid-solar.webp',
      alt: 'Sleek modern humanoid robot, white/grey full-body figure standing against a plain backdrop, portrait orientation',
      kind: 'photo', theme: 'machine', provenance: 'wikimedia-public-domain', accents: HERO_MACHINE_ACCENTS,
    },
    {
      src: '/assets/imagery/homepage/prism-grid-solar.webp',
      alt: 'Abstract illustration standing in for AI/machine-learning systems',
      kind: 'illustration', theme: 'machine', provenance: 'placeholder-role-art',
      accents: HERO_MACHINE_ACCENTS, seed: 11,
    },
  ],
  crisis: [
    {
      src: '/assets/imagery/homepage/prism-grid-solar.webp',
      alt: 'Forest wildfire at dusk, orange flames and thick smoke over a dark treeline silhouette',
      kind: 'photo', theme: 'crisis', provenance: 'ai-generated', accents: HERO_CRISIS_ACCENTS,
    },
    {
      src: '/assets/imagery/homepage/prism-grid-solar.webp',
      alt: 'Aerial view of a large open rock quarry/mining pit with roads carved into terraces',
      kind: 'photo', theme: 'crisis', provenance: 'unsplash-sourced', accents: HERO_CRISIS_ACCENTS,
    },
    {
      src: '/assets/imagery/homepage/prism-grid-solar.webp',
      alt: 'Aerial shot of a dried, cracked lakebed with deep drought fissures and a thin remaining water trickle',
      kind: 'photo', theme: 'crisis', provenance: 'ai-generated', accents: HERO_CRISIS_ACCENTS,
    },
    {
      src: '/assets/imagery/homepage/prism-grid-solar.webp',
      alt: 'Massive wildfire at night, orange blaze and dense smoke plume behind transmission towers',
      kind: 'photo', theme: 'crisis', provenance: 'unsplash-sourced', accents: HERO_CRISIS_ACCENTS,
    },
    {
      src: '/assets/imagery/homepage/prism-grid-solar.webp',
      alt: 'Aerial view of a vast open-pit rare-earth mineral mine, terraced ochre earth, haze in the distance',
      kind: 'photo', theme: 'crisis', provenance: 'ai-generated', accents: HERO_CRISIS_ACCENTS,
    },
    {
      src: '/assets/imagery/homepage/prism-grid-solar.webp',
      alt: 'Cracked, dry drought-stricken earth with sparse green grass and a rock',
      kind: 'photo', theme: 'crisis', provenance: 'unsplash-sourced', accents: HERO_CRISIS_ACCENTS,
    },
    {
      src: '/assets/imagery/homepage/prism-grid-solar.webp',
      alt: 'Exterior of a large silicon chip fabrication plant at dusk, steam rising from vents',
      kind: 'photo', theme: 'crisis', provenance: 'ai-generated', accents: HERO_CRISIS_ACCENTS,
    },
    {
      src: '/assets/imagery/homepage/prism-grid-solar.webp',
      alt: 'Workers in protective gear inside an industrial cleanroom manufacturing facility',
      kind: 'photo', theme: 'crisis', provenance: 'unsplash-sourced', accents: HERO_CRISIS_ACCENTS,
    },
    // NASA "Blue Marble 2012" — real, public-domain full-disc Earth photo
    // (images.nasa.gov, nasa_id GSFC_20171208_Archive_e001386). NASA imagery
    // is not copyrighted.
    {
      src: '/assets/imagery/homepage/prism-grid-solar.webp',
      alt: 'NASA Blue Marble photograph of Earth’s full disc from space, North and Central America visible',
      kind: 'photo', theme: 'crisis', provenance: 'nasa-public-domain', accents: HERO_CRISIS_ACCENTS,
    },
    {
      src: '/assets/imagery/homepage/prism-grid-solar.webp',
      alt: 'Abstract illustration standing in for planetary/environmental crisis',
      kind: 'illustration', theme: 'crisis', provenance: 'placeholder-role-art',
      accents: HERO_CRISIS_ACCENTS, seed: 23,
    },
  ],
}

export const ABOUT_WHAT = {
  eyebrow: 'What we do',
  title: 'We implement. We don\'t advise.',
  body: `Most AI initiatives stall because someone wrote a plan and left. We do the opposite: we pair with your internal teams to build in your environment, mapping how the organization really works, standing up the agentic systems that run on that map, and training every person for their actual job. When we leave, your people own the systems and know how to evolve them.`,
}

export const ABOUT_WHY = {
  eyebrow: 'Why it matters',
  title: 'AI transformation is a people change first.',
  body: "The hard part of AI isn't the tools - it's the redesign. The habits, hand-offs, and org structures built for a pre-AI world quietly smother new capability before it takes hold. We believe the goal of transformation should be to build lasting capacity - for your people, your organization, and the world we all depend on. We treat this work as what it is: the hardest professional change most teams will go through, and one worth doing properly.",
}

// How we work — three plain principles (no collective language).
export const ABOUT_PRINCIPLES = {
  eyebrow: 'How we work',
  title: 'Senior-led. Hands-on. Yours to keep.',
  principles: [
    {
      title: 'Senior people do the work',
      description: 'The people you meet are the people on your engagement, with no hand-off to a pyramid of juniors.',
    },
    {
      title: 'We build in your environment',
      description: 'We pair with your teams and ship inside your stack, so the systems and the know-how stay with you.',
    },
    {
      title: 'We leave you self-sufficient',
      description: 'Every engagement trains a named internal lead who can run and evolve what we built after we go.',
    },
  ],
}

// Team roster. Abe + Chetan + JE + FGE. Bios/photos are SLOTS — JE to fill.
// photo: null renders an initials avatar placeholder.
export interface TeamMember {
  name: string
  role: string
  /** Two short credential tags rendered as badges under the role, e.g. "16 years building" / "Stanford-trained". */
  credentials?: [string, string]
  /** [DRAFT], JE to finalise. */
  bio: string
  /** Path under /public, or null for an initials placeholder. */
  photo: string | null
  /**
   * Path under /public to the Polaroid-treatment source — already light-graded
   * (warm cast, fine grain, face stays fully clear; see research/homepage-visual-
   * exploration/05-photographic-blur/06-polaroid-treatment.md). Falls back to
   * `photo` if unset.
   */
  polaroidPhoto?: string
  /** Fixed rotation in degrees for the Polaroid card, e.g. -3.5. Hand-picked, not random. */
  polaroidAngle?: number
  /**
   * Revealed when the Polaroid is clicked/tapped — a real candid, off-duty photo,
   * not a studio shot. Unset shows a "coming soon" placeholder back; never
   * fabricate a stand-in photo of a real person here.
   */
  polaroidBackPhoto?: string
  links?: { label: string; href: string }[]
}

// DRAFT bios — synthesised from public sources (john-ellison.com, cooncircles.com,
// stephanledain.com/AdaptAI, the Sample235fedd93a54 deck, AIOS, LinkedIn). JE to review + tweak.
// Photos are still slots (only JE's is set) — null renders an initials avatar.
export const ABOUT_TEAM: { eyebrow: string; title: string; members: TeamMember[] } = {
  eyebrow: 'The team',
  title: 'The people who do the work.',
  members: [
    {
      name: 'John Ellison',
      role: 'Founder',
      credentials: ['16 years building', 'BJ Fogg certified teacher'],
      bio: "16 years turning vision into working software, including two exits (Peak Democracy to OpenGov; Goodery) and co-founding ReFi DAO. Trained directly under Dr. BJ Fogg through his Behavior Design Teacher Team Training Program and is on his official certified teaching team. Now helps companies put AI to work in how they actually operate.",
      photo: 'public-demo:portrait',
      polaroidPhoto: 'public-demo:portrait',
      polaroidAngle: -4.5,
      links: [
        { label: 'LinkedIn', href: 'https://www.linkedin.com/in/johnellison/' },
        { label: 'Website', href: 'https://john-ellison.com' },
      ],
    },
    {
      name: 'Fatma Ghedira',
      role: 'Co-founder · People & Change',
      credentials: ['Org psychology', 'Google · Snapchat · WEF'],
      bio: "Leads the human side of transformation: the habits, hand-offs, and org design work that decide whether AI actually sticks. An organizational psychologist (master's degrees in social & organizational and forensic psychology), she has worked with Google, Snapchat, and the World Economic Forum.",
      photo: 'public-demo:portrait',
      polaroidPhoto: 'public-demo:portrait',
      polaroidAngle: 3.5,
      links: [{ label: 'Website', href: 'https://cooncircles.com' }],
    },
    {
      name: 'Chetan Nandakumar',
      role: 'Principal · AI & Machine Learning',
      credentials: ['AI PhD, UC Berkeley', 'Founder & CEO, Rio'],
      bio: "An AI PhD (UC Berkeley) with 10+ years launching AI products, now founder and CEO of Rio. Builds the machine-learning core of our work, including the Insights Engine behind AIOS.",
      photo: 'public-demo:portrait',
      polaroidPhoto: 'public-demo:portrait',
      polaroidAngle: -1.5,
      links: [{ label: 'LinkedIn', href: 'https://www.linkedin.com/in/cnandakumar' }],
    },
    {
      name: 'Abe Isleem',
      role: 'Principal · AI Engineering',
      credentials: ['8+ years AI eng', 'Formerly Microsoft'],
      bio: "A senior AI engineer with 8+ years in the field, formerly at Microsoft. An end-to-end builder across LLMs, RAG, and agent systems, and the lead technical hand who ships production systems on our engagements.",
      photo: 'public-demo:portrait',
      // Provisional, John expects a new source photo from Abe directly.
      polaroidPhoto: 'public-demo:portrait',
      polaroidAngle: 2,
      links: [{ label: 'LinkedIn', href: 'https://www.linkedin.com/in/abeisleem' }],
    },
    {
      name: 'Stephan Ledain',
      role: 'Principal · AI Adoption',
      credentials: ['EU AI Act specialist', 'Founder, AdaptAI'],
      bio: "An executive coach and organizational psychologist, founder of AdaptAI. Leads our governance and compliance work, including the EU AI Act, and paces adoption so your people's questions are heard and answered before anything changes.",
      photo: 'public-demo:portrait',
      polaroidPhoto: 'public-demo:portrait',
      polaroidAngle: 4.5,
      links: [
        { label: 'LinkedIn', href: 'https://www.linkedin.com/in/stephanledain' },
        { label: 'Website', href: 'https://www.stephanledain.com' },
      ],
    },
  ],
}

// The recruiting card that sits in the team grid, next to the last real teammate.
export const ABOUT_JOIN_US = {
  image: 'public-demo:portrait',
  imageAlt: 'A soft, anonymous silhouette — a placeholder for whoever joins next',
  caption: 'Your photo here?',
  role: 'We’re hiring',
  body: "We're looking for principal-level, multidisciplinary AI transformation specialists: deep expertise in one domain, 10+ years of experience, comfortable being the senior person in the room on day one.",
  cta: { text: 'Get in touch', href: '/contact' },
  angle: -2.5,
}

// Life on Film culture strip. Reuses the same five real, already-graded team
// photos as the /prism FilmRoll demo (public/assets/team/polaroid/). No
// silhouette/join-us frame, no AI-generated people, per the imagery hard
// rules. Alt text still carries each real name for accessibility even though
// FilmRoll never renders name labels visually. See
// research/homepage-visual-exploration/13-life-on-film-language.md.
export const ABOUT_FILM_ROLL = {
  frames: [
    { src: 'public-demo:portrait', alt: 'John Ellison, founder' },
    { src: 'public-demo:portrait', alt: 'Fatma Ghedira, co-founder' },
    { src: 'public-demo:portrait', alt: 'Chetan Nandakumar, principal' },
    { src: 'public-demo:portrait', alt: 'Abe Isleem, principal' },
    { src: 'public-demo:portrait', alt: 'Stephan Ledain, principal' },
  ],
}

export const ABOUT_CTA = {
  title: 'See where your organization stands.',
  subtitle: 'Take the AI readiness assessment: 24 questions, with your scores on screen when you finish.',
  primary: { text: 'Take the assessment', href: '/ai-readiness' },
  secondary: { text: 'Contact us', href: '/contact' },
}
