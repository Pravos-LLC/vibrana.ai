import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROLE_CATEGORIES, roleImageSrc } from '@/src/role-visuals'
import { STICKER_THEMES } from '@/src/swag-content'
describe('public demo constructed media', () => {
  it('the learning hero reserves the synthetic SVG intrinsic aspect ratio', () => {
    const page = readFileSync(join(process.cwd(), 'src/views/CurriculumPage.tsx'), 'utf8')
    const declared = page.match(/src="\/assets\/public-demo\/platform-hero\.svg"\s+alt=""\s+width=\{(\d+)\}\s+height=\{(\d+)\}/)
    const svg = readFileSync(join(process.cwd(), 'public/assets/public-demo/platform-hero.svg'), 'utf8')
    const intrinsic = svg.match(/\bwidth="(\d+)" height="(\d+)"/)
    expect(declared).not.toBeNull()
    expect(intrinsic).not.toBeNull()
    expect(declared!.slice(1)).toEqual(intrinsic!.slice(1))
  })
  it('the desktop learning heading keeps one responsive break before the font accent', () => {
    const page = readFileSync(join(process.cwd(), 'src/views/CurriculumPage.tsx'), 'utf8')
    const boundary = /Daily learning for the\{' '\}\s+<br className="hidden lg:block" \/>\s+<GradientText className="font-serif-accent">AI-native<\/GradientText> organization\./g
    expect([...page.matchAll(boundary)]).toHaveLength(1)
  })
  it('every configured role emits an existing cleared image without masking unknown roles', () => {
    for (const role of ROLE_CATEGORIES.flatMap((category) => category.roles)) {
      expect(existsSync(join(process.cwd(), 'public', roleImageSrc(role))), role).toBe(true)
    }
    expect(roleImageSrc('Engineering')).toBe('/assets/roles/engineering.webp')
    expect(roleImageSrc('Product')).toBe('/assets/roles/product.webp')
    expect(roleImageSrc('Unknown role')).toBe('/assets/roles/unknown_role.webp')
  })
  it('the32rendered sticker sources exist and are distinct', () => {
    const stickers = STICKER_THEMES.flatMap((theme) => theme.stickers)
    expect(stickers).toHaveLength(32)
    expect(new Set(stickers.map((sticker) => sticker.slug)).size).toBe(32)
    for (const sticker of stickers) expect(existsSync(join(process.cwd(), 'public/assets/swag/stickers', sticker.slug + '.webp')), sticker.slug).toBe(true)
  })
})
