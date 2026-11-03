import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { FEEDBACK_FORMS } from '@/src/feedback-content'
import { CONSENT_DB_MIN_SCORE, consentCopy, consentSnapshot } from '@/lib/feedback/submission'

// Consent is only meaningful if the stored wording is what the person saw. Every consent version is
// pinned to a hash of its copy. Edit any consent wording and this fails until you BUMP the version in
// src/feedback-content.ts and add the new version and hash here. Old versions stay listed.
const PINNED: Record<string, string> = {
  'sample-feedback-consent-2026-10-29-v2-sample-v1': 'ff4687a2b42c86832f701b535cf5e04cb1cde8ffb572606132affd075c095ca2',
  'sample-feedback-consent-2026-10-29-v2': '06a0f08d45d59e94f962d24e813e7c377264e9568e460f45237410550e221648',
  'sample-feedback-consent-2026-10-31-v3': 'cd9cef14f353b20e59d2eb0498500b9314f4b69c13d47172aaf0c53bcbaa2498',
  'sample-feedback-consent-2026-11-02-v4': '31a066bb52942529a1598f7926fc612abeac24277c66eeefda82899b6e937ea6',
  'sample-feedback-consent-2026-11-02-v5': '1f05a3737942fbc4f09b5e2ac49bb00c3a947cd0e2aa6981163a3bce917d35e4',
}

const hash = (text: string) => createHash('sha256').update(text).digest('hex')

describe('consent copy is versioned', () => {
  for (const form of Object.values(FEEDBACK_FORMS)) {
    it(`${form.slug}: the version's pinned hash matches the rendered copy (bump the version if copy changed)`, () => {
      const pinned = PINNED[form.consent.version]
      expect(pinned, `no pinned hash for ${form.consent.version}; add it`).toBeDefined()
      expect(hash(consentSnapshot(form))).toBe(pinned)
    })

    it(`${form.slug}: the snapshot contains every consent string the respondent sees`, () => {
      const snapshot = consentSnapshot(form)
      for (const text of consentCopy(form)) expect(snapshot).toContain(text)
    })

    it(`${form.slug}: every string in the consent config is part of the recorded copy`, () => {
      const copy = consentCopy(form)
      const strings = Object.entries(form.consent)
        .filter(([key, value]) => typeof value === 'string' && !['version'].includes(key))
        .map(([, value]) => value as string)
      for (const text of strings) expect(copy).toContain(text)
    })

    it(`${form.slug}: minScore is not below the database gate`, () => {
      expect(form.consent.minScore).toBeGreaterThanOrEqual(CONSENT_DB_MIN_SCORE)
    })
  }

  it('the migration check constraint uses the same threshold as the code', () => {
    const sql = readFileSync('supabase/migrations/20261029000000_client_feedback.sql', 'utf8')
    expect(sql).toContain(`overall_score >= ${CONSENT_DB_MIN_SCORE}`)
  })
})
