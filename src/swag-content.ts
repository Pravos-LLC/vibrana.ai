/**
 * Swag / brand-assets page copy -- data, never hardcoded in the view. See
 * DESIGN.md -> "Page copy is data".
 */

export const SWAG_HERO = {
  eyebrow: 'Brand Assets',
  titleLead: 'Vibrana ',
  titleAccent: 'Swag',
  subhead:
    "A retro-arcade sticker pack we made for ourselves, for contributors, and for anyone who's been in the trenches of agentic engineering. 32 sticker previews are included in this public demo.",
};

export const SWAG_STICKER_SECTION = {
  eyebrow: 'The Pack',
  heading: '32 stickers, ',
  gradientWord: 'zero repeats',
  gradient: 'prism' as const,
  intro:
    "4 themes are included in this public demo. Each one is its own arcade or RPG UI moment. If you've shipped an agent-written PR straight to main, one of these is about you.",
};

export interface SwagStickerItem {
  slug: string;
  title: string;
}

export interface SwagStickerTheme {
  theme: string;
  stickers: SwagStickerItem[];
}

export const STICKER_THEMES: SwagStickerTheme[] = [
  {
    theme: 'Vibrana Mythology',
    stickers: [
      { slug: 'wetiko-404', title: 'ERROR 404: WETIKO NOT FOUND' },
      { slug: 'insert-consciousness', title: 'INSERT CONSCIOUSNESS TO CONTINUE' },
      { slug: 'level-up-stages', title: 'LEVEL UP: ASSOCIATE TO MEMBER TO PARTNER' },
      { slug: 'separation-exe-crash', title: 'SEPARATION.EXE HAS STOPPED WORKING' },
      { slug: 'achievement-pod', title: 'ACHIEVEMENT: FOUND YOUR BLISS' },
    ],
  },
  {
    theme: 'Agentic Engineering',
    stickers: [
      { slug: 'level-up-agentic', title: 'LEVEL UP: PROMPT TO CONTEXT TO AGENT' },
      { slug: 'dangerously-skip-permissions', title: 'life --dangerously-skip-permissions' },
      { slug: 'mcp-player-joined', title: 'MCP HANDSHAKE: PLAYER AGENT HAS JOINED' },
      { slug: 'context-window-full', title: 'CONTEXT WINDOW: GAME OVER' },
      { slug: 'yolo-merged-main', title: 'ACHIEVEMENT: YOLO MERGED TO MAIN' },
      { slug: 'vibe-coded-env-to-main', title: 'no hooks. no skills. no evals. no tests.' },
      { slug: 'agentic-boss-hallucination', title: 'BOSS FIGHT: HALLUCINATION (LVL 99)' },
      {
        slug: 'agentic-skilltree-prompt-context-architect',
        title: 'SKILL TREE: PROMPT ENGINEER TO SYSTEMS ARCHITECT',
      },
      { slug: 'agentic-pause-agent-thinking', title: 'PAUSE MENU: AGENT IS THINKING...' },
      { slug: 'agentic-newrecord-fewest-tokens', title: 'NEW RECORD! FEWEST TOKENS TO FIRST PROTOTYPE' },
      { slug: 'agentic-combo-tool-calls', title: 'COMBO x47: CONSECUTIVE TOOL CALLS' },
      { slug: 'agentic-fogofwar-codebase', title: 'FOG OF WAR: CODEBASE UNEXPLORED' },
      { slug: 'agentic-gitmerge-conflict-boss', title: 'MERGE CONFLICT INCOMING' },
    ],
  },
  {
    theme: 'AI Transformation',
    stickers: [
      { slug: 'ai-boss-legacy-process', title: 'BOSS FIGHT: LEGACY PROCESS' },
      { slug: 'ai-quest-digitize-spreadsheet', title: 'NEW QUEST: DIGITIZE THE SPREADSHEET OF DESTINY' },
      { slug: 'ai-loading-culture-change', title: 'LOADING: CULTURE CHANGE... 97%' },
      { slug: 'ai-difficulty-enterprise', title: 'DIFFICULTY SELECT: ENTERPRISE (HARD MODE)' },
      { slug: 'ai-highscore-pilot-to-scale', title: 'NEW HIGH SCORE: FASTEST PILOT-TO-SCALE' },
      { slug: 'ai-savepoint-poc', title: 'SAVE POINT REACHED: PROOF OF CONCEPT' },
      { slug: 'ai-patchnotes-v2', title: 'PATCH NOTES v2.0: REMOVED MANUAL PROCESS, ADDED CHAOS' },
    ],
  },
  {
    theme: 'Human Transformation',
    stickers: [
      { slug: 'human-boss-ego', title: 'BOSS FIGHT: YOUR OWN EGO' },
      { slug: 'human-skilltree-self-awareness', title: 'SKILL TREE: SELF-AWARENESS' },
      { slug: 'human-dialogue-shadow', title: '[SHADOW]: WE MEET AGAIN.' },
      { slug: 'human-mana-rest-recover', title: 'MANA: 0/100. REST TO RECOVER' },
      { slug: 'human-newability-boundaries', title: 'NEW ABILITY LEARNED: BOUNDARIES' },
      { slug: 'human-1up-therapy', title: '1UP (THERAPY)' },
      { slug: 'human-checkpoint-breathe', title: "CHECKPOINT: BREATHE. YOU'VE GOT THIS." },
    ],
  },
];

export const SWAG_STICKER_DOWNLOAD = {
  label: 'Download the demo pack',
  href: '/downloads/vibrana-sticker-pack.zip',
  note: '32 approved sticker previews (.webp) in a ZIP. Original print files are not included.',
};

export interface SwagShirt {
  slug: string;
  image: string;
  imageAlt: string;
  caption: string;
}

export const SWAG_SHIRT_SECTION = {
  eyebrow: 'The Shirts',
  heading: 'Wearable ',
  gradientWord: 'evidence',
  gradient: 'warm' as const,
  intro:
    "A couple of the pack's flagship designs, printed big. (Yes, hooks and evals and tests exist. This one's about the moment they don't.)",
};

export const SWAG_SHIRTS: SwagShirt[] = [
  {
    slug: 'vibe-coded-env-to-main',
    image: '/assets/imagery/homepage/prism-grid-solar.webp',
    imageAlt: 'Black t-shirt with a pixel-art tweet card reading "just shipped .env into main"',
    caption: 'no hooks. no skills. no evals. no tests.',
  },
  {
    slug: 'wetiko-404',
    image: '/assets/imagery/homepage/prism-grid-solar.webp',
    imageAlt: 'Black t-shirt with a retro pixel-art badge reading "ERROR 404: WETIKO NOT FOUND"',
    caption: 'ERROR 404: WETIKO NOT FOUND',
  },
];

export const SWAG_CLOSING = {
  eyebrow: 'More Coming',
  heading: "That's the pack for now.",
  body: "This page grows as we make more. If you're a contributor or collaborator and want physical copies, ask in your pod.",
  primaryCta: { label: 'Get in touch', href: '/contact' },
};
