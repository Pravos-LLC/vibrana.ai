import type { Metadata } from 'next';
import { ArrowRight, Sparkles, Layers, Leaf, Zap, Download, Settings } from 'lucide-react';
import {
  Button, Eyebrow, GradientText, Heading, Text, Badge, Card, IconBox,
  Divider, Stat, SectionHeader, Field, Input, Select, Textarea, Nav, Reveal,
} from '@/src/components/prism';
import ShadcnKit from './ShadcnKit';
import {
  ScrollFillTextDemo,
  BackgroundDemo,
  ShaderFieldDemo,
  WaveFieldDemo,
  ScrollMotionDemo,
  AsciiFieldDemo,
  ResolutionLadderDemo,
  FilmRollDemo,
  MarkerAccentsDemo,
  MarkerHoverDemo,
  NewsletterFooterDemo,
  MetricProofDemo,
  PunkThumbnailDemo,
} from './ResearchPreview';
import { PrismSidebar } from './PrismSidebar';

export const metadata: Metadata = {
  title: 'Vibrana Component Library — Prism Light',
  robots: { index: false, follow: false },
};

/**
 * Vibrana component library — the canonical code board.
 *
 * Everything lives under `.prism-light` so the ported component CSS
 * (app/globals.css) and tokens apply without touching the legacy ThemeContext /
 * assessment systems. Organized into the same 8 groups the Pencil "Component
 * Library" board mirrors 1:1. See DESIGN.md.
 *
 * Import contract:
 *   - Product UI  → `@/src/components/prism`   (Tier 2, brand-strict)
 *   - Primitives  → `@/src/components/ui`      (Tier 1, shadcn substrate)
 */
export default function ComponentLibrary() {
  return (
    <div className="prism-light min-h-screen">
      {/* Live Prism Nav at the top — this is the real component, not a mock */}
      <Nav
        logoText="VIBRANA"
        logoHref="#top"
        items={[
          { label: 'Foundations', href: '#foundations' },
          { label: 'Typography', href: '#typography' },
          { label: 'Components', href: '#buttons', hasDropdown: true },
          { label: 'Forms', href: '#forms' },
        ]}
        dropdownItems={[
          { label: 'Buttons', sublabel: 'CTAs and actions', href: '#buttons' },
          { label: 'Menus & Nav', sublabel: 'Navigation + side nav', href: '#menus' },
          { label: 'Accordions', sublabel: 'Disclosure + overlays', href: '#accordions' },
          { label: 'Data & Surface', sublabel: 'Cards, badges, tables', href: '#data' },
        ]}
        cta={{ label: 'Source', href: '#top' }}
        activeHref="#foundations"
      />

      <main id="top" className="mesh-prism pt-24">
        <div className="mx-auto flex max-w-384 gap-6 lg:pl-6">
          <PrismSidebar />
          <div className="min-w-0 flex-1">
        {/* ---- Header ---- */}
        <header className="mx-auto max-w-6xl px-6 pt-12 pb-16 text-center">
          <Eyebrow className="mb-6">Prism Light · Design System</Eyebrow>
          <Heading level={1} className="mx-auto max-w-4xl" gradientWord="components">
            The Vibrana components, in one place
          </Heading>
          <Text size="lg" className="mx-auto mt-6 max-w-176">
            Two coherent layers: the brand-strict <strong>Prism</strong> set we own, on
            the shadcn primitive <strong>substrate</strong>. Everything below is a live,
            modular component — the same inventory the Pencil board mirrors.
          </Text>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Badge tint="violet">19 Prism components</Badge>
            <Badge tint="cyan">21 shadcn primitives</Badge>
            <Badge tint="emerald">1 token system</Badge>
          </div>
          <Divider animated className="mx-auto mt-16 max-w-160" />
        </header>

        {/* ============ 1 · FOUNDATIONS ============ */}
        <Group id="foundations" n="01" eyebrow="Foundations" title="Tokens — color, gradient, scale">
          <Text size="sm" className="mb-6">
            Cool → warm spectrum (invariant). Pick stops from it; never introduce new hues.
          </Text>
          <div className="flex flex-wrap gap-3">
            {[
              ['violet', '--violet'], ['violet-tint', '--violet-tint'], ['blue', '--blue'],
              ['cyan', '--cyan'], ['emerald', '--emerald'], ['red', '--red'],
              ['amber', '--amber'], ['yellow', '--yellow'],
            ].map(([name, v]) => (
              <div key={name} className="flex flex-col items-center gap-2">
                <div
                  className="h-16 w-16 rounded-xl"
                  style={{ background: `var(${v})`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                />
                <span className="type-xs text-tertiary-token">{name}</span>
              </div>
            ))}
          </div>

          <Heading level={4} className="mt-12 mb-4">Named gradients</Heading>
          <div className="grid gap-4 md:grid-cols-3">
            <GradientBar label="prism" v="--gradient-prism" />
            <GradientBar label="warm" v="--gradient-warm" />
            <GradientBar label="regenerative" v="--gradient-regenerative" />
          </div>

          <Heading level={4} className="mt-12 mb-4">Text + surface steps</Heading>
          <Card variant="feature">
            <Text tone="primary">text-primary — 0.95 alpha</Text>
            <Text tone="secondary">text-secondary — 0.66 alpha</Text>
            <Text tone="tertiary">text-tertiary — 0.48 alpha</Text>
          </Card>
        </Group>

        {/* ============ 2 · TYPOGRAPHY ============ */}
        <Group id="typography" n="02" eyebrow="Typography" title="Bricolage Grotesque + Hanken Grotesk">
          <div className="space-y-4">
            <p className="type-4xl font-display leading-tight">Display 4xl — Hero</p>
            <p className="type-3xl font-display leading-tight">Display 3xl — Section</p>
            <p className="type-2xl font-display">Display 2xl — Heading</p>
            <p className="type-xl font-display">Display xl — Card title</p>
            <Text size="lg" tone="primary">Body lg — supporting copy at a comfortable reading size.</Text>
            <Text size="base" tone="primary">
              Body base — Hanken Grotesk at relaxed leading. The tight-heading / loose-body
              contrast is deliberate; it gives the page its calm rhythm while the display
              face carries the statements.
            </Text>
            <Text size="sm">Caption sm — meta, captions, secondary detail.</Text>
            <Eyebrow>Label xs — uppercase tracked label</Eyebrow>
          </div>

          <Heading level={4} className="mt-12 mb-4">Gradient text (large display only)</Heading>
          <div className="space-y-2">
            <p className="type-3xl font-display"><GradientText gradient="prism">Prismatic</GradientText></p>
            <p className="type-3xl font-display"><GradientText gradient="warm">Warmth</GradientText></p>
            <p className="type-3xl font-display"><GradientText gradient="regenerative">Regenerative</GradientText></p>
            <p className="type-3xl font-display"><GradientText gradient="animated">Animated rainbow</GradientText></p>
          </div>

          <Heading level={4} className="mt-12 mb-4">SectionHeader (composed)</Heading>
          <Card>
            <SectionHeader
              eyebrow="Composed pattern"
              title="Eyebrow + heading + subtitle"
              gradientWord="heading"
              subtitle="The standard section intro — Eyebrow, display Heading, supporting Text — wrapped in a Reveal."
              reveal={false}
              align="left"
            />
          </Card>

          <div className="mt-14 border-t pt-12" style={{ borderColor: 'var(--border-subtle)' }}>
            <ScrollFillTextDemo />
          </div>
        </Group>

        {/* ============ 3 · BUTTONS ============ */}
        <Group id="buttons" n="03" eyebrow="Components" title="Buttons">
          <Text size="sm" className="mb-6">
            Prism Button (Tier 2): one size, primary / secondary, optional leading icon and
            trailing arrow, link-or-button render, loading + disabled states.
          </Text>
          <div className="flex flex-wrap items-center gap-4">
            <Button showArrow>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button icon={Download}>With icon</Button>
            <Button icon={Settings} variant="secondary">Settings</Button>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
            <Button href="#top">As link</Button>
          </div>
          <Text size="sm" className="mt-6">
            For the multi-variant headless fallback (outline / ghost / link / destructive,
            three sizes), use the shadcn Button — shown in the substrate group below.
          </Text>
        </Group>

        {/* ============ 4 · MENUS & NAV ============ */}
        <Group id="menus" n="04" eyebrow="Navigation" title="Menus, nav & side navigation">
          <Text size="sm" className="mb-6">
            The Prism <code>Nav</code> (frosted bar with dropdown + mobile overlay) is live at
            the top of this page. The shadcn substrate adds navigation-menu, dropdown-menu,
            command palette, and the <code>Sheet</code> off-canvas side nav — all in the kit below.
          </Text>
          <Card>
            <Text size="sm" tone="primary">
              ↑ Scroll up — the bar, centered rainbow-underline links, the "Components"
              dropdown, and the CTA are the real <code>&lt;Nav /&gt;</code> component. Resize
              narrow to see the mobile frosted overlay.
            </Text>
          </Card>
        </Group>

        {/* ============ 5 · ACCORDIONS & DISCLOSURE ============ */}
        <Group id="accordions" n="05" eyebrow="Disclosure" title="Accordions & overlays">
          <Text size="sm" className="mb-6">
            Accordion, Tabs, Tooltip, Popover and Dialog all ship from the shadcn substrate,
            Prism-skinned. Live in the kit below.
          </Text>
        </Group>

        {/* ============ 6 · DATA & SURFACE ============ */}
        <Group id="data" n="06" eyebrow="Data & surface" title="Cards, badges, stats & dividers">
          <div className="grid gap-6 md:grid-cols-3">
            <Card glow>
              <IconBox icon={Sparkles} tint="violet" className="mb-4" />
              <Heading level={3} className="mb-2">Glow on hover</Heading>
              <Text size="sm">Flat at rest. On hover the border shifts violet and a colored glow blooms — no grey shadow.</Text>
            </Card>
            <Card gradientBorder>
              <IconBox icon={Layers} tint="blue" className="mb-4" />
              <Heading level={3} className="mb-2">Gradient border</Heading>
              <Text size="sm">A 1px prism gradient edge, masked, fading in on hover.</Text>
            </Card>
            <Card variant="feature" tint="regenerative" glow>
              <IconBox icon={Leaf} tint="emerald" className="mb-4" />
              <Heading level={3} className="mb-2">Feature card</Heading>
              <Text size="sm">Color-tinted fill keyed to one named gradient. One meaning per card.</Text>
            </Card>
          </div>

          <Heading level={4} className="mt-12 mb-4">Badges (accent tints)</Heading>
          <div className="flex flex-wrap items-center gap-3">
            <Badge tint="violet">Violet</Badge>
            <Badge tint="blue">Blue</Badge>
            <Badge tint="cyan">Cyan</Badge>
            <Badge tint="emerald">Emerald</Badge>
            <Badge tint="amber">Amber</Badge>
            <Badge tint="red">Red</Badge>
            <Badge tint="neutral">Neutral</Badge>
            <Badge gradient>Gradient</Badge>
            <Badge tint="violet" uppercase size="sm">Label</Badge>
          </div>

          <Heading level={4} className="mt-12 mb-4">Stats</Heading>
          <div className="flex flex-wrap gap-12">
            <Stat value="~50%" label="completed per sprint" />
            <Stat value="12 wks" label="to client-owned OS" />
            <Stat value="20" label="job-family curricula" gradientValue />
          </div>

          <Heading level={4} className="mt-12 mb-4">Divider</Heading>
          <Divider className="my-4" />
          <Divider animated className="my-4" />

          <div className="mt-16 border-t pt-14" style={{ borderColor: 'var(--border-subtle)' }}>
            <MetricProofDemo />
          </div>
        </Group>

        {/* ============ 7 · FORMS ============ */}
        <Group id="forms" n="07" eyebrow="Forms" title="Form controls">
          <div className="grid max-w-xl gap-5">
            <Field label="Work email" htmlFor="lib-email" required hint="We never share it.">
              <Input id="lib-email" type="email" placeholder="you@company.com" />
            </Field>
            <Field label="Job family" htmlFor="lib-family">
              <Select
                id="lib-family"
                options={[
                  { value: 'engineering', label: 'Engineering' },
                  { value: 'product', label: 'Product' },
                  { value: 'growth', label: 'Growth' },
                ]}
              />
            </Field>
            <Field label="What are you hoping to change?" htmlFor="lib-msg" error="This field is required.">
              <Textarea id="lib-msg" rows={3} placeholder="A sentence or two…" />
            </Field>
          </div>
        </Group>

        {/* ============ 8 · BACKGROUNDS & AMBIENT ============ */}
        <Group id="backgrounds" n="08" eyebrow="Backgrounds & ambient" title="Ambient fields, gradients & motion">
          <Text size="sm" tone="tertiary" className="mb-10 max-w-3xl">
            The always-on ambient layer: the mycelium <code>Background</code>, the modular <code>ShaderField</code>{' '}
            gradient-grain surface, the <code>WaveField</code> hairline waves, the <code>AsciiField</code>, and the base motion/decoration utilities. All honour{' '}
            <code>prefers-reduced-motion</code> and pause off-screen.
          </Text>
          <div className="space-y-16">
            <BackgroundDemo />
            <Divider />
            <ShaderFieldDemo />
            <Divider />
            <WaveFieldDemo />
            <Divider />
            <ScrollMotionDemo />
            <Divider />
            <AsciiFieldDemo />
            <Divider />
            <div id="motion" className="scroll-mt-24">
              <Heading level={3} className="mb-1">Motion & decoration</Heading>
              <Text size="sm" tone="tertiary" className="mb-6 max-w-3xl">
                <code>Reveal</code> (scroll fade + slide-up), the mesh background, and the conic prismatic ring — the
                base decorative motion utilities.
              </Text>
              <Reveal>
                <Card>
                  <Text size="sm" tone="primary">
                    This card is wrapped in <code>&lt;Reveal /&gt;</code> — fade + slide-up on
                    scroll into view, honouring <code>prefers-reduced-motion</code>.
                  </Text>
                </Card>
              </Reveal>
              <div className="mt-10 flex flex-wrap items-center gap-12">
                <div className="relative h-32 w-32">
                  <div className="bg-conic-prism animate-prismatic-spin absolute inset-0 rounded-full" />
                  <div
                    className="absolute inset-[3px] flex items-center justify-center rounded-full"
                    style={{ background: 'var(--surface-base)' }}
                  >
                    <Zap size={28} style={{ color: 'var(--violet)' }} />
                  </div>
                </div>
                <Text size="sm" className="min-w-[16rem] flex-1">
                  The conic prism ring spins (8s); the mesh background and animated gradient text
                  slide. All of it honours <code style={{ color: 'var(--violet)' }}>prefers-reduced-motion</code>.
                </Text>
              </div>
            </div>
          </div>
        </Group>

        {/* ============ 9 · MEDIA & IMAGERY ============ */}
        <Group id="media" n="09" eyebrow="Media & imagery" title="Image treatments & film">
          <Text size="sm" tone="tertiary" className="mb-10 max-w-3xl">
            How imagery enters and behaves — the <code>ResolutionLadder</code> pixel-resolve and the{' '}
            <code>FilmRoll</code> strip.
          </Text>
          <div className="space-y-16">
            <ResolutionLadderDemo />
            <Divider />
            <PunkThumbnailDemo />
            <Divider />
            <FilmRollDemo />
          </div>
        </Group>

        {/* ============ 10 · ANNOTATIONS & MARKS ============ */}
        <Group id="marks" n="10" eyebrow="Annotations & marks" title="Hand-drawn marker accents">
          <Text size="sm" tone="tertiary" className="mb-10 max-w-3xl">
            The Permanent Marker family — hand-touched annotations that draw themselves in on scroll{' '}
            (<code>Marker accents</code>) or on hover/focus (<code>MarkerHover</code>).
          </Text>
          <div className="space-y-16">
            <MarkerAccentsDemo />
            <Divider />
            <MarkerHoverDemo />
          </div>
        </Group>

        {/* ============ 11 · FOOTERS & CTAs ============ */}
        <Group id="footers" n="11" eyebrow="Footers & CTAs" title="Newsletter & contact footers">
          <NewsletterFooterDemo />
        </Group>

        {/* ============ SUBSTRATE · shadcn kit ============ */}
        <Group id="kit" n="—" eyebrow="Component architecture" title="shadcn substrate (Tier 1)">
          <Text size="sm" className="mb-8">
            The default substrate: shadcn/ui primitives in <code>src/components/ui/</code>,
            Prism-skinned via token reconciliation. Add more with{' '}
            <code>npx shadcn add &lt;name&gt;</code>. This is the headless layer the Prism
            components sit on top of.
          </Text>
          <ShadcnKit />
        </Group>

        <footer className="mx-auto max-w-6xl px-6 py-16">
          <Divider className="mb-8" />
          <Text size="sm" tone="tertiary">
            Prism Light · vibrana.ai source of truth · see DESIGN.md · mirrored in
            design/vibrana-design → "Component Library"
          </Text>
        </footer>
          </div>
        </div>
      </main>
    </div>
  );
}

/** Group — numbered, labelled board section. Mirrors a Pencil board frame 1:1. */
function Group({
  id, n, eyebrow, title, children,
}: { id: string; n: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16">
      <div className="mb-8 flex items-baseline gap-4">
        <span className="type-sm font-display text-tertiary-token tabular-nums">{n}</span>
        <div>
          <Eyebrow className="mb-2">{eyebrow}</Eyebrow>
          <Heading level={2}>{title}</Heading>
        </div>
      </div>
      {children}
    </section>
  );
}

function GradientBar({ label, v }: { label: string; v: string }) {
  return (
    <div>
      <div className="h-20 rounded-xl" style={{ background: `var(${v})` }} />
      <span className="type-xs text-tertiary-token mt-2 block">{label}</span>
    </div>
  );
}
