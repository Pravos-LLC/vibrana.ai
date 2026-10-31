import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import LearnRolePage from '@/src/views/LearnRolePage'
import { JsonLd } from '@/src/components/JsonLd'
import { SITE_OG_IMAGE } from '@/src/og/site-og-image'
import { ORGANIZATION_ID, SITE_NAME, absoluteUrl } from '@/src/lib/site'
import { LEARN_ROLES, getLearnRole, learnRoleHref, learnRoleSeo, relatedLearnRoles } from '@/src/learn-role-content'

export const dynamicParams = false

export function generateStaticParams() {
  return LEARN_ROLES.map((r) => ({ role: r.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ role: string }> }): Promise<Metadata> {
  const { role: slug } = await params
  const role = getLearnRole(slug)
  if (!role) return {}
  const seo = learnRoleSeo(role)
  const path = learnRoleHref(role.name)
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      images: [SITE_OG_IMAGE],
      title: seo.ogTitle,
      description: seo.description,
      url: absoluteUrl(path),
    },
  }
}

export default async function Page({ params }: { params: Promise<{ role: string }> }) {
  const { role: slug } = await params
  const role = getLearnRole(slug)
  if (!role) notFound()

  const seo = learnRoleSeo(role)
  const url = absoluteUrl(learnRoleHref(role.name))
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Course',
        '@id': `${url}#course`,
        name: `AI for ${role.name} teams`,
        description: seo.description,
        url,
        provider: { '@type': 'Organization', '@id': ORGANIZATION_ID, name: SITE_NAME },
        teaches: role.topics,
      },
      {
        '@type': 'ItemList',
        name: `More role curricula`,
        itemListElement: relatedLearnRoles(role).map((r, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: `AI for ${r.name} teams`,
          url: absoluteUrl(learnRoleHref(r.name)),
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
          { '@type': 'ListItem', position: 2, name: 'Learn', item: absoluteUrl('/learn') },
          { '@type': 'ListItem', position: 3, name: role.name, item: url },
        ],
      },
    ],
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <LearnRolePage role={role} />
    </>
  )
}
