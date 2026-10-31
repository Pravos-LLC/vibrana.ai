'use client';

import React from 'react';
import { Nav } from '@/src/components/prism';
import { NAV_ITEMS, NAV_CTA } from '../constants';

/**
 * Navigation — thin adapter over the Prism `Nav`. Kept for pages that mount the
 * nav directly (outside EnterprisePageShell). Note: requires a `.prism-light`
 * ancestor (PageShell, or a wrapped page root) for its DS styles to apply.
 */
export function Navigation() {
  return <Nav items={NAV_ITEMS} cta={NAV_CTA} />;
}
