'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';

import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/src/components/ui/toggle-group';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/src/components/ui/accordion';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger,
} from '@/src/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/src/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/src/components/ui/table';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/src/components/ui/tooltip';

const CATEGORIES = ['All', 'Engineering', 'Product', 'Growth', 'Revenue', 'Ops', 'People'];

/**
 * Live catalog of the Tier-1 shadcn kit (src/components/ui/*), Prism-skinned via
 * the token reconciliation in app/globals.css + tailwind.config.ts. Copy from here.
 */
export default function ShadcnKit() {
  const [category, setCategory] = React.useState('All');

  return (
    <TooltipProvider>
      <div className="space-y-12">
        {/* Buttons */}
        <div>
          <h4 className="mb-4">Button (shadcn) — variants &amp; sizes</h4>
          <div className="flex flex-wrap items-center gap-3">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button variant="destructive">Destructive</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
          </div>
        </div>

        {/* Pills / filters */}
        <div>
          <h4 className="mb-4">ToggleGroup — category pills (filters)</h4>
          <ToggleGroup
            type="single"
            value={category}
            onValueChange={(v) => v && setCategory(v)}
            className="flex flex-wrap justify-start gap-2"
          >
            {CATEGORIES.map((c) => (
              <ToggleGroupItem key={c} value={c} className="rounded-full px-4">
                {c}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <p className="type-sm mt-3" style={{ color: 'var(--text-secondary)' }}>
            Active filter: <strong>{category}</strong>
          </p>
        </div>

        {/* Badges */}
        <div>
          <h4 className="mb-4">Badge (neutral primitive)</h4>
          <div className="flex flex-wrap items-center gap-3">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
          <p className="type-sm mt-3" style={{ color: 'var(--text-secondary)' }}>
            For accent-tinted brand pills, use the Tier-2 Prism <code>Badge</code>.
          </p>
        </div>

        {/* Tabs */}
        <div>
          <h4 className="mb-4">Tabs</h4>
          <Tabs defaultValue="overview" className="w-full max-w-xl">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
              <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="type-sm pt-4">
              View switching with an underline-style active state.
            </TabsContent>
            <TabsContent value="curriculum" className="type-sm pt-4">
              Each tab content panel mounts on demand.
            </TabsContent>
            <TabsContent value="outcomes" className="type-sm pt-4">
              Keyboard-accessible (Radix) out of the box.
            </TabsContent>
          </Tabs>
        </div>

        {/* Menus + Dialog + Select + Tooltip */}
        <div>
          <h4 className="mb-4">Menu · Dialog · Select · Tooltip</h4>
          <div className="flex flex-wrap items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Menu <ChevronDown size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Edit</DropdownMenuItem>
                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                <DropdownMenuItem>Archive</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog>
              <DialogTrigger asChild>
                <Button>Open dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Book a demo</DialogTitle>
                  <DialogDescription>
                    Modal scrim is Prism-tuned (bg-black/50), not the shadcn default.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button>Confirm</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Select>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Pick a job family" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="engineering">Engineering</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="growth">Growth</SelectItem>
              </SelectContent>
            </Select>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost">Hover me</Button>
              </TooltipTrigger>
              <TooltipContent>Token-driven tooltip</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Form controls */}
        <div className="max-w-sm">
          <h4 className="mb-4">Form controls</h4>
          <div className="between:mt-2">
            <Label htmlFor="demo-email">Work email</Label>
            <Input id="demo-email" type="email" placeholder="you@company.com" />
          </div>
        </div>

        {/* Accordion */}
        <div className="max-w-xl">
          <h4 className="mb-4">Accordion</h4>
          <Accordion type="single" collapsible>
            <AccordionItem value="a">
              <AccordionTrigger>What is a learning journey?</AccordionTrigger>
              <AccordionContent className="type-sm">
                A per-role curriculum mapped to your company graph.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="b">
              <AccordionTrigger>How long is an engagement?</AccordionTrigger>
              <AccordionContent className="type-sm">
                Typically 12 weeks, ending with the client owning the OS.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Table */}
        <div>
          <h4 className="mb-4">Table</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Approach</TableHead>
                <TableHead>Speed</TableHead>
                <TableHead>Client owns the OS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Vibrana</TableCell>
                <TableCell>12 weeks</TableCell>
                <TableCell>Yes</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Big-4</TableCell>
                <TableCell>6–12 months</TableCell>
                <TableCell>No</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </TooltipProvider>
  );
}
