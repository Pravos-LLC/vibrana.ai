import { describe, expect, it } from 'vitest'
import { assertLocalSupabaseUrl } from '../e2e/support'

describe('E2E Supabase URL guard', () => {
  it.each(['http://localhost:54321', 'http://127.0.0.1:54321'])(
    'accepts local stack URL %s',
    (url) => expect(() => assertLocalSupabaseUrl(url)).not.toThrow(),
  )

  it.each([
    'http://localhost.evil.test:54321',
    'http://127.0.0.1@evil.test:54321',
    'https://localhost:54321',
    'http://localhost',
    'not-a-url',
  ])('rejects unsafe URL %s', (url) => {
    expect(() => assertLocalSupabaseUrl(url)).toThrow('Refusing to run E2E')
  })
})
