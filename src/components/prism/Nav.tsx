'use client';
import { PublicDemoImg } from '@/src/components/PublicDemoImage'

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { cn } from './utils/cn';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './Button';

export interface NavItem {
  label: string;
  href: string;
  hasDropdown?: boolean;
}
export interface NavDropdownItem {
  label: string;
  sublabel?: string;
  href: string;
}
export interface NavProps {
  items: NavItem[];
  dropdownItems?: NavDropdownItem[];
  cta?: { label: string; href: string };
  logoSrc?: string;
  logoText?: string;
  logoHref?: string;
  activeHref?: string;
}

/**
 * Prism Nav — fixed frosted bar (`.site-nav`), centered rainbow-underline links,
 * outline-only violet CTA (fills on hover; DESIGN.md → Buttons), mobile frosted overlay.
 */
export function Nav({
  items,
  dropdownItems = [],
  cta,
  logoSrc = '/assets/vibrana-v-prism-96.webp',
  logoText = 'VIBRANA',
  logoHref = '/',
  activeHref,
}: NavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLearnOpen, setIsLearnOpen] = useState(false);

  return (
    <>
      <nav className="site-nav">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
          {/* Logo */}
          <Link href={logoHref} className="nav-logo flex items-center gap-3 text-lg">
            <PublicDemoImg src={logoSrc} alt={`${logoText} logo`} className="h-8 w-auto" />
            {logoText}
          </Link>

          {/* Centered links (desktop) */}
          <div className="absolute left-1/2 hidden -translate-x-1/2 lg:block">
            <div className="nav-links">
              {items.map((item) =>
                item.hasDropdown ? (
                  <div
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => setIsLearnOpen(true)}
                    onMouseLeave={() => setIsLearnOpen(false)}
                  >
                    <button className="nav-dropdown-trigger flex items-center gap-1" type="button">
                      {item.label}
                      <ChevronDown size={12} />
                    </button>
                    <AnimatePresence>
                      {isLearnOpen && dropdownItems.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute left-0 top-full z-50 mt-3 min-w-[270px] overflow-hidden rounded-xl py-2"
                          style={{
                            background: 'var(--surface-inset)',
                            border: '1px solid var(--border-subtle)',
                            backdropFilter: 'blur(20px)',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
                          }}
                        >
                          {dropdownItems.map((d) => (
                            <Link
                              key={d.label}
                              href={d.href}
                              className="block px-4 py-3 transition-colors hover:bg-[rgba(124,58,237,0.06)]"
                            >
                              <div className="type-sm font-display font-semibold text-primary-token">{d.label}</div>
                              {d.sublabel && <div className="type-xs text-tertiary-token mt-0.5">{d.sublabel}</div>}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(activeHref === item.href && 'active')}
                  >
                    {item.label}
                  </Link>
                ),
              )}
            </div>
          </div>

          {/* Right: CTA + mobile toggle */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            {cta && (
              <Button href={cta.href} size="sm" showArrow className="hidden lg:inline-flex">
                {cta.label}
              </Button>
            )}
            <button
              type="button"
              onClick={() => setIsOpen((v) => !v)}
              className="flex h-11 w-11 items-center justify-center text-ink-secondary lg:hidden"
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: 'var(--surface-nav)', backdropFilter: 'blur(24px) saturate(1.4)' }}
          >
            {/* Visible close button for discoverability */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center text-ink-secondary"
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
            <div className="flex h-full flex-col items-center justify-center gap-6">
              <ThemeToggle />
              {items.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="font-display text-3xl font-semibold text-primary-token"
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              {cta && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: items.length * 0.08 }}
                >
                  <Button href={cta.href} onClick={() => setIsOpen(false)} showArrow className="mt-4">
                    {cta.label}
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
