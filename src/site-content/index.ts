import emitted from '@/src/site-content/generated.json'

type Runtime = { schema: number; production: boolean; content: Record<string, unknown>; binding?: Record<string, string> }
const generated = emitted as Runtime
// The browser receives only intended public display data. Server consumption
// remains bound to the exact provider deployment that prepared those values.
if (generated.production && typeof window === 'undefined') {
  if (!generated.binding || process.env.VERCEL_ENV !== 'production') throw new Error('Production website content binding missing')
  for (const [name, value] of Object.entries(generated.binding)) {
    if (!value || process.env[name] !== value) throw new Error('Production website content binding mismatch')
  }
}
export const productionSite = generated.production
export function siteContent<T>(key: string, fallback: T): T {
  return Object.prototype.hasOwnProperty.call(generated.content, key) ? generated.content[key] as T : fallback
}
