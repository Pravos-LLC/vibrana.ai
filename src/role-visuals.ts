import { productionSite, siteContent } from '@/src/site-content'
/**
 * role-visuals — curriculum job-family → pill category → illustration mapping.
 *
 * The 6 categories are the validated grouping for both the learning-journey nav
 * (pills) and the per-role illustration accents. Each category owns two Prism
 * spectrum accents (rgb triples — NEW palette, guardrail-safe) used for the card
 * glow + bokeh behind each role image. Role names match JOB_FUNCTIONS_DETAILED.
 */

export interface RoleCategory {
  id: string;
  label: string;
  /** Primary accent rgb (for the pill dot). */
  dot: string;
  /** [c1, c2] rgb triples for the image glow + two-tone bokeh. */
  accents: [string, string];
  roles: string[];
}

export const ROLE_CATEGORIES: RoleCategory[] = siteContent("role-visuals.ROLE_CATEGORIES", [
  {
    id: 'ops-finance',
    label: 'Operations & Finance',
    dot: '45,212,191',
    accents: ['45,212,191', '74,222,128'], // cyan / emerald
    roles: ['Accounting', 'Finance', 'Analytics', 'Operations'],
  },
  {
    id: 'eng-data',
    label: 'Engineering & Data',
    dot: '59,130,246',
    accents: ['59,130,246', '45,212,191'], // blue / cyan
    roles: ['Engineering', 'Engineering Management', 'Machine Learning', 'IT Systems'],
  },
  {
    id: 'product-design',
    label: 'Product & Design',
    dot: '124,58,237',
    accents: ['124,58,237', '59,130,246'], // violet / blue
    roles: ['Product', 'Product Design', 'Brand'],
  },
  {
    id: 'growth-marketing',
    label: 'Growth & Marketing',
    dot: '245,158,11',
    accents: ['245,158,11', '239,68,68'], // amber / red
    roles: ['Marketing', 'Advertising', 'Growth', 'Content'],
  },
  {
    id: 'revenue-customer',
    label: 'Revenue & Customer',
    dot: '239,68,68',
    accents: ['239,68,68', '245,158,11'], // red / amber
    roles: ['Sales', 'Revenue Operations', 'Customer Support', 'Customer Success'],
  },
  {
    id: 'people-leadership',
    label: 'People & Leadership',
    dot: '74,222,128',
    accents: ['74,222,128', '45,212,191'], // emerald / cyan
    roles: ['Leadership', 'People Ops', 'Recruiting', 'Legal'],
  },
]);

const FALLBACK: [string, string] = ['124,58,237', '45,212,191'];

const ROLE_TO_CATEGORY = new Map<string, RoleCategory>();
for (const cat of ROLE_CATEGORIES) for (const r of cat.roles) ROLE_TO_CATEGORY.set(r, cat);

/** "Product Design" -> "product_design" (matches public/assets/roles/<key>.webp). */
export function roleImageKey(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_');
}

/** Public path to a role illustration. */
export function roleImageSrc(name: string): string {
  const src = `/assets/roles/${roleImageKey(name)}.webp`;
  if (productionSite) return src;
  return ["/assets/roles/accounting.webp","/assets/roles/advertising.webp","/assets/roles/analytics.webp","/assets/roles/brand.webp","/assets/roles/content.webp","/assets/roles/customer_success.webp","/assets/roles/customer_support.webp","/assets/roles/engineering_management.webp","/assets/roles/finance.webp","/assets/roles/growth.webp","/assets/roles/it_systems.webp","/assets/roles/leadership.webp","/assets/roles/legal.webp","/assets/roles/machine_learning.webp","/assets/roles/marketing.webp","/assets/roles/operations.webp","/assets/roles/people_ops.webp","/assets/roles/product_design.webp","/assets/roles/recruiting.webp","/assets/roles/revenue_operations.webp","/assets/roles/sales.webp"].includes(src) ? '/assets/imagery/homepage/prism-grid-solar.webp' : src;
}

/** [c1, c2] accent rgb triples for a role's glow + bokeh, by category. */
export function roleAccents(name: string): [string, string] {
  return ROLE_TO_CATEGORY.get(name)?.accents ?? FALLBACK;
}

export function roleCategoryId(name: string): string {
  return ROLE_TO_CATEGORY.get(name)?.id ?? 'product-design';
}
