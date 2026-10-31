import { afterEach, expect, it, vi } from 'vitest'
const { send } = vi.hoisted(() => ({ send: vi.fn() }))
vi.mock('resend', () => ({ Resend: class { emails = { send } } }))
const { sendEmail } = await import('@/lib/resend')
afterEach(() => vi.restoreAllMocks())

it('does not log private provider exception payloads for feedback', async () => {
  const error = new Error('PRIVATE_PROVIDER_CANARY@example.test')
  Object.assign(error, { response: { row: 'PRIVATE_ROW_CANARY' } })
  send.mockRejectedValueOnce(error)
  const log = vi.spyOn(console, 'error').mockImplementation(() => {})
  const result = await sendEmail({ suppressErrorDetails: true, from: 'sender@example.test', to: 'recipient@example.test', subject: 'Sample feedback', html: '<p>Sample</p>' })
  expect(result.error?.name).toBe('sdk_error')
  expect(log).toHaveBeenCalledWith('Resend SDK error')
  expect(JSON.stringify(log.mock.calls)).not.toContain('PRIVATE_')
  expect(send.mock.calls[0][0]).not.toHaveProperty('suppressErrorDetails')
})
