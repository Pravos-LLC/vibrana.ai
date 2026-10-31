/**
 * Design-export registry — the single source of truth for the Claude Design
 * (claude.ai/design) sync. Each entry is ONE card in the design system: a real,
 * live Prism / shadcn component rendered in isolation.
 *
 * Consumed by:
 *   - `app/design-export/page.tsx`  — renders every entry as a `<article data-ds-*>`
 *     block inside `.prism-light` (the SSR surface the exporter reads).
 *   - `scripts/export-design-bundle.mjs` — slices each article into a self-contained
 *     HTML preview under `design-bundle/`, tagged with the `@dsCard` marker the
 *     Design System pane indexes.
 *
 * `group` values mirror the /prism board 1:1. Keep this list and /prism in step.
 *
 * SSR note: previews are static HTML, so demos must render meaningfully without
 * JS. Motion wrappers (Reveal) are unwrapped; Radix disclosure that renders inline
 * (Tabs, Accordion) is shown open; portal-only primitives (Dialog, Popover,
 * Tooltip, DropdownMenu, Sheet) show their trigger — the interactive surface.
 */
import * as React from 'react';
import {
  ArrowRight, Sparkles, Layers, Leaf, Zap, Download, Settings, ChevronDown,
} from 'lucide-react';

import {
  Button, Eyebrow, GradientText, Heading, Text, Badge, Card, IconBox,
  Divider, Stat, SectionHeader, Field, Input, Select, Textarea, Nav,
  RoleImage, PolaroidPhoto,
} from '@/src/components/prism';

import { Button as ShButton } from '@/src/components/ui/button';
import { Badge as ShBadge } from '@/src/components/ui/badge';
import { Input as ShInput } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Skeleton } from '@/src/components/ui/skeleton';
import { Separator } from '@/src/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/src/components/ui/toggle-group';
import { Toggle } from '@/src/components/ui/toggle';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/src/components/ui/accordion';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/src/components/ui/table';
import { Card as ShCard, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/src/components/ui/card';

export interface DsEntry {
  /** Board group — mirrors /prism section labels. Becomes the @dsCard group. */
  group: string;
  /** kebab-case id; becomes the preview filename. Unique within the bundle. */
  slug: string;
  /** Human label shown on the card. */
  name: string;
  /** Short "variants shown" subtitle. */
  subtitle: string;
  /** Card width hint (px) for the Design System pane. */
  width?: number;
  render: () => React.ReactNode;
}

/* ------------------------------------------------------------------ *
 * Prism (Tier 2 — brand-strict, owned)                               *
 * ------------------------------------------------------------------ */
const PRISM: DsEntry[] = [
  {
    group: 'Buttons', slug: 'button', name: 'Button', width: 640,
    subtitle: 'Primary / secondary, icon, loading, disabled, link',
    render: () => (
      <div className="flex flex-wrap items-center gap-4">
        <Button showArrow>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button icon={Download}>With icon</Button>
        <Button icon={Settings} variant="secondary">Settings</Button>
        <Button loading>Loading</Button>
        <Button disabled>Disabled</Button>
        <Button href="#">As link</Button>
      </div>
    ),
  },
  {
    group: 'Typography', slug: 'heading', name: 'Heading', width: 640,
    subtitle: 'Levels 1–4, display face, gradient word',
    render: () => (
      <div className="between:mt-3">
        <Heading level={1} gradientWord="components">The Vibrana components</Heading>
        <Heading level={2}>Section heading</Heading>
        <Heading level={3}>Card title</Heading>
        <Heading level={4}>Minor heading</Heading>
      </div>
    ),
  },
  {
    group: 'Typography', slug: 'text', name: 'Text', width: 640,
    subtitle: 'Sizes lg / base / sm, tone primary→tertiary',
    render: () => (
      <div className="space-y-3">
        <Text size="lg" tone="primary">Body lg — supporting copy at a comfortable reading size.</Text>
        <Text size="base" tone="primary">Body base — Hanken Grotesk at relaxed leading.</Text>
        <Text size="sm" tone="secondary">Caption sm — meta and secondary detail.</Text>
        <Text size="sm" tone="tertiary">Tertiary — 0.48 alpha.</Text>
      </div>
    ),
  },
  {
    group: 'Typography', slug: 'eyebrow', name: 'Eyebrow', width: 420,
    subtitle: 'Uppercase tracked label, tertiary or gradient',
    render: () => (
      <div className="between:mt-3">
        <Eyebrow>Uppercase tracked label</Eyebrow>
        <Eyebrow gradient="prism">Gradient eyebrow</Eyebrow>
      </div>
    ),
  },
  {
    group: 'Typography', slug: 'gradient-text', name: 'GradientText', width: 520,
    subtitle: 'prism / warm / regenerative / animated (display only)',
    render: () => (
      <div className="space-y-2 type-3xl font-display leading-tight">
        <p><GradientText gradient="prism">Prismatic</GradientText></p>
        <p><GradientText gradient="warm">Warmth</GradientText></p>
        <p><GradientText gradient="regenerative">Regenerative</GradientText></p>
      </div>
    ),
  },
  {
    group: 'Typography', slug: 'section-header', name: 'SectionHeader', width: 640,
    subtitle: 'Eyebrow + heading + subtitle (composed)',
    render: () => (
      <SectionHeader
        eyebrow="Composed pattern"
        title="Eyebrow + heading + subtitle"
        gradientWord="heading"
        subtitle="The standard section intro — Eyebrow, display Heading, supporting Text."
        reveal={false}
        align="left"
      />
    ),
  },
  {
    group: 'Data & Surface', slug: 'card', name: 'Card', width: 900,
    subtitle: 'Glow, gradient border, feature tint',
    render: () => (
      <div className="grid gap-6 md:grid-cols-3">
        <Card glow>
          <IconBox icon={Sparkles} tint="violet" className="mb-4" />
          <Heading level={3} className="mb-2">Glow on hover</Heading>
          <Text size="sm">Flat at rest; violet border + colored glow on hover.</Text>
        </Card>
        <Card gradientBorder>
          <IconBox icon={Layers} tint="blue" className="mb-4" />
          <Heading level={3} className="mb-2">Gradient border</Heading>
          <Text size="sm">A 1px masked prism gradient edge.</Text>
        </Card>
        <Card variant="feature" tint="regenerative" glow>
          <IconBox icon={Leaf} tint="emerald" className="mb-4" />
          <Heading level={3} className="mb-2">Feature card</Heading>
          <Text size="sm">Color-tinted fill keyed to one named gradient.</Text>
        </Card>
      </div>
    ),
  },
  {
    group: 'Data & Surface', slug: 'icon-box', name: 'IconBox', width: 420,
    subtitle: 'Tinted square — violet / blue / cyan / emerald',
    render: () => (
      <div className="flex flex-wrap gap-4">
        <IconBox icon={Sparkles} tint="violet" />
        <IconBox icon={Layers} tint="blue" />
        <IconBox icon={Zap} tint="cyan" />
        <IconBox icon={Leaf} tint="emerald" />
      </div>
    ),
  },
  {
    group: 'Data & Surface', slug: 'badge', name: 'Badge', width: 640,
    subtitle: 'Accent tints, gradient, uppercase label',
    render: () => (
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
    ),
  },
  {
    group: 'Data & Surface', slug: 'stat', name: 'Stat', width: 640,
    subtitle: 'Value + label, optional gradient value',
    render: () => (
      <div className="flex flex-wrap gap-12">
        <Stat value="~50%" label="completed per sprint" />
        <Stat value="12 wks" label="to client-owned OS" />
        <Stat value="20" label="job-family curricula" gradientValue />
      </div>
    ),
  },
  {
    group: 'Data & Surface', slug: 'divider', name: 'Divider', width: 520,
    subtitle: 'Plain + animated rainbow',
    render: () => (
      <div className="space-y-6">
        <Divider />
        <Divider animated />
      </div>
    ),
  },
  {
    group: 'Forms', slug: 'field-input', name: 'Field + Input', width: 520,
    subtitle: 'Label, hint, required, error states',
    render: () => (
      <div className="grid gap-5">
        <Field label="Work email" htmlFor="dx-email" required hint="We never share it.">
          <Input id="dx-email" type="email" placeholder="you@company.com" />
        </Field>
        <Field label="What are you hoping to change?" htmlFor="dx-msg" error="This field is required.">
          <Textarea id="dx-msg" rows={3} placeholder="A sentence or two…" />
        </Field>
      </div>
    ),
  },
  {
    group: 'Forms', slug: 'select', name: 'Select', width: 420,
    subtitle: 'Prism native select',
    render: () => (
      <Field label="Job family" htmlFor="dx-family">
        <Select
          id="dx-family"
          options={[
            { value: 'engineering', label: 'Engineering' },
            { value: 'product', label: 'Product' },
            { value: 'growth', label: 'Growth' },
          ]}
        />
      </Field>
    ),
  },
  {
    group: 'Menus & Nav', slug: 'nav', name: 'Nav', width: 1100,
    subtitle: 'Frosted bar, rainbow-underline links, dropdown, CTA',
    render: () => (
      <div className="relative h-24 overflow-hidden rounded-xl border border-line-subtle">
        <Nav
          logoText="VIBRANA"
          logoHref="#"
          items={[
            { label: 'Foundations', href: '#' },
            { label: 'Typography', href: '#' },
            { label: 'Components', href: '#', hasDropdown: true },
            { label: 'Forms', href: '#' },
          ]}
          dropdownItems={[
            { label: 'Buttons', sublabel: 'CTAs and actions', href: '#' },
            { label: 'Menus & Nav', sublabel: 'Navigation + side nav', href: '#' },
          ]}
          cta={{ label: 'Source', href: '#' }}
          activeHref="#"
        />
      </div>
    ),
  },
  {
    group: 'Motion & Decoration', slug: 'prismatic-ring', name: 'Prismatic ring', width: 420,
    subtitle: 'Conic prism ring (8s spin) + mesh',
    render: () => (
      <div className="relative h-32 w-32">
        <div className="bg-conic-prism animate-prismatic-spin absolute inset-0 rounded-full" />
        <div
          className="absolute inset-[3px] flex items-center justify-center rounded-full"
          style={{ background: 'var(--surface-base)' }}
        >
          <Zap size={28} style={{ color: 'var(--violet)' }} />
        </div>
      </div>
    ),
  },
  {
    group: 'Media', slug: 'role-image', name: 'RoleImage', width: 640,
    subtitle: 'Role illustration — shared-field bokeh, dot-grid, multiply blend',
    // Real Orchid role illustrations (faceless, AI-generated). The export script
    // copies the referenced /assets into the bundle and rewrites the src.
    render: () => (
      <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(2, minmax(0,1fr))', maxWidth: 560 }}>
        <RoleImage
          src="/assets/roles/product.webp"
          alt="Product role illustration"
          accents={['124,58,237', '59,130,246']}
          seed={3}
          className="rounded-xl"
        />
        <RoleImage
          src="/assets/roles/engineering.webp"
          alt="Engineering role illustration"
          accents={['59,130,246', '45,212,191']}
          seed={7}
          className="rounded-xl"
        />
      </div>
    ),
  },
  {
    group: 'Media', slug: 'polaroid-photo', name: 'PolaroidPhoto', width: 420,
    subtitle: 'Instant-print frame — cream border, marker caption, tilt',
    // Faceless AI-generated people scene (not a real individual); caption is a
    // placeholder to show the component, not an attribution.
    render: () => (
      <div style={{ padding: '1rem' }}>
        <PolaroidPhoto
          src="/assets/imagery/homepage/ppl-professional.webp"
          alt="Polaroid frame demo"
          name="Pod member"
          role="Practitioner"
          angle={-3}
        />
      </div>
    ),
  },
];

/* ------------------------------------------------------------------ *
 * Substrate (Tier 1 — shadcn primitives, Prism-skinned)              *
 * ------------------------------------------------------------------ */
const SHADCN: DsEntry[] = [
  {
    group: 'Substrate', slug: 'sh-button', name: 'Button (shadcn)', width: 720,
    subtitle: 'default / secondary / outline / ghost / destructive / link · 3 sizes',
    render: () => (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <ShButton>Default</ShButton>
          <ShButton variant="secondary">Secondary</ShButton>
          <ShButton variant="outline">Outline</ShButton>
          <ShButton variant="ghost">Ghost</ShButton>
          <ShButton variant="destructive">Destructive</ShButton>
          <ShButton variant="link">Link</ShButton>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ShButton size="sm">Small</ShButton>
          <ShButton>Default</ShButton>
          <ShButton size="lg">Large</ShButton>
        </div>
      </div>
    ),
  },
  {
    group: 'Substrate', slug: 'sh-badge', name: 'Badge (shadcn)', width: 520,
    subtitle: 'default / secondary / outline / destructive',
    render: () => (
      <div className="flex flex-wrap items-center gap-3">
        <ShBadge>Default</ShBadge>
        <ShBadge variant="secondary">Secondary</ShBadge>
        <ShBadge variant="outline">Outline</ShBadge>
        <ShBadge variant="destructive">Destructive</ShBadge>
      </div>
    ),
  },
  {
    group: 'Substrate', slug: 'sh-input', name: 'Input + Label (shadcn)', width: 420,
    subtitle: 'Labelled text input',
    render: () => (
      <div className="grid gap-2">
        <Label htmlFor="sh-in">Email</Label>
        <ShInput id="sh-in" type="email" placeholder="you@company.com" />
      </div>
    ),
  },
  {
    group: 'Substrate', slug: 'sh-select', name: 'Select (shadcn)', width: 420,
    subtitle: 'Trigger + open listbox (static open-state)',
    // Radix Select portals its listbox, so a static preview can't render the open
    // state through the component. This is a faithful facsimile using the real
    // shadcn trigger/content/item class strings.
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', maxWidth: 240 }}>
        <div className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs">
          <span>Engineering</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </div>
        <div className="z-50 min-w-32 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
          <div className="p-1">
            <div className="relative flex w-full cursor-default select-none items-center rounded-sm bg-accent py-1.5 pl-2 pr-8 text-sm text-accent-foreground">Engineering</div>
            <div className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm">Product</div>
            <div className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm">Growth</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    group: 'Substrate', slug: 'sh-tabs', name: 'Tabs (shadcn)', width: 520,
    subtitle: 'Inline tab list + panel',
    render: () => (
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="pt-4">
          <Text size="sm">Overview panel content.</Text>
        </TabsContent>
        <TabsContent value="details" className="pt-4">
          <Text size="sm">Details panel content.</Text>
        </TabsContent>
      </Tabs>
    ),
  },
  {
    group: 'Substrate', slug: 'sh-accordion', name: 'Accordion (shadcn)', width: 520,
    subtitle: 'Disclosure, first item open',
    render: () => (
      <Accordion type="single" collapsible defaultValue="a" className="w-full">
        <AccordionItem value="a">
          <AccordionTrigger>What is Prism Light?</AccordionTrigger>
          <AccordionContent>The light-first variant of the Prism design system.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger>Where do tokens live?</AccordionTrigger>
          <AccordionContent>app/globals.css + src/components/prism/tokens.ts.</AccordionContent>
        </AccordionItem>
      </Accordion>
    ),
  },
  {
    group: 'Substrate', slug: 'sh-toggle-group', name: 'Toggle / ToggleGroup (shadcn)', width: 520,
    subtitle: 'Single + standalone toggle',
    render: () => (
      <div className="flex flex-wrap items-center gap-6">
        <ToggleGroup type="single" defaultValue="all">
          <ToggleGroupItem value="all">All</ToggleGroupItem>
          <ToggleGroupItem value="eng">Eng</ToggleGroupItem>
          <ToggleGroupItem value="prod">Product</ToggleGroupItem>
        </ToggleGroup>
        <Toggle>Bold</Toggle>
      </div>
    ),
  },
  {
    group: 'Substrate', slug: 'sh-table', name: 'Table (shadcn)', width: 640,
    subtitle: 'Header + rows',
    render: () => (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Job family</TableHead>
            <TableHead>Curricula</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow><TableCell>Engineering</TableCell><TableCell>6</TableCell><TableCell className="text-right">Ready</TableCell></TableRow>
          <TableRow><TableCell>Product</TableCell><TableCell>4</TableCell><TableCell className="text-right">Ready</TableCell></TableRow>
          <TableRow><TableCell>Growth</TableCell><TableCell>3</TableCell><TableCell className="text-right">Draft</TableCell></TableRow>
        </TableBody>
      </Table>
    ),
  },
  {
    group: 'Substrate', slug: 'sh-card', name: 'Card (shadcn)', width: 420,
    subtitle: 'Header / content / footer',
    render: () => (
      <ShCard className="w-[340px]">
        <CardHeader>
          <CardTitle>Team plan</CardTitle>
          <CardDescription>Everything in Pro, for the whole pod.</CardDescription>
        </CardHeader>
        <CardContent><Text size="sm">Seats, shared curricula, and admin.</Text></CardContent>
        <CardFooter><ShButton>Choose plan</ShButton></CardFooter>
      </ShCard>
    ),
  },
  {
    group: 'Substrate', slug: 'sh-skeleton', name: 'Skeleton + Separator (shadcn)', width: 420,
    subtitle: 'Loading placeholder + rule',
    render: () => (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[160px]" />
          </div>
        </div>
        <Separator />
      </div>
    ),
  },
  {
    group: 'Substrate', slug: 'sh-dialog', name: 'Dialog (shadcn)', width: 520,
    subtitle: 'Open dialog over dimmed backdrop (static open-state)',
    // Radix Dialog portals its content, so the open state is a faithful facsimile
    // using the real DialogOverlay / DialogContent class strings.
    render: () => (
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '.5rem' }}>
        <div className="bg-black/50" style={{ position: 'absolute', inset: 0 }} />
        <div
          className="grid w-full gap-4 border bg-background p-6 shadow-lg sm:rounded-lg"
          style={{ position: 'relative', maxWidth: '24rem', margin: '2rem auto' }}
        >
          <div className="flex flex-col space-y-1.5 text-center sm:text-left">
            <h2 className="text-lg font-semibold leading-none tracking-tight">Book a slot</h2>
            <p className="text-sm text-muted-foreground">Pick a time that works for your pod.</p>
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <ShButton>Confirm</ShButton>
          </div>
        </div>
      </div>
    ),
  },
  {
    group: 'Substrate', slug: 'sh-dropdown', name: 'DropdownMenu (shadcn)', width: 420,
    subtitle: 'Trigger + open menu (static open-state)',
    // Radix DropdownMenu portals its content; this is a faithful facsimile using
    // the real DropdownMenuContent / Item / Label / Separator class strings.
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', maxWidth: 220 }}>
        <ShButton variant="outline">Options <ChevronDown className="ml-1 h-4 w-4" /></ShButton>
        <div className="z-50 min-w-32 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
          <div className="px-2 py-1.5 text-sm font-semibold">Actions</div>
          <div className="-mx-1 my-1 h-px bg-muted" />
          <div className="relative flex cursor-default select-none items-center gap-2 rounded-sm bg-accent px-2 py-1.5 text-sm text-accent-foreground">Edit</div>
          <div className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm">Duplicate</div>
          <div className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm">Archive</div>
        </div>
      </div>
    ),
  },
];

export const REGISTRY: DsEntry[] = [...PRISM, ...SHADCN];

/** Distinct group labels in registry order (Foundations is added by the exporter). */
export const GROUPS = REGISTRY.reduce<string[]>((acc, e) => {
  if (!acc.includes(e.group)) acc.push(e.group);
  return acc;
}, []);
