import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { verifyWebhook } from './webhook-signature'

const rawKey = Buffer.from('grip-test-secret-key-0123456789')
const secret = `v1,whsec_${rawKey.toString('base64')}`
const body = JSON.stringify({ user: { phone: '972501234567' }, sms: { otp: '123456' } })
const now = 1_790_000_000_000
const ts = String(now / 1000)
const sign = (b: string, id = 'msg_1') => 'v1,' + createHmac('sha256', rawKey).update(`${id}.${ts}.${b}`).digest('base64')

describe('verifyWebhook', () => {
  it('accepts a correctly signed hook', () => {
    expect(verifyWebhook(body, { id: 'msg_1', timestamp: ts, signature: sign(body) }, secret, now)).toBe(true)
  })
  it('rejects a changed body, a wrong id, and a stale timestamp', () => {
    expect(verifyWebhook(body + ' ', { id: 'msg_1', timestamp: ts, signature: sign(body) }, secret, now)).toBe(false)
    expect(verifyWebhook(body, { id: 'msg_2', timestamp: ts, signature: sign(body) }, secret, now)).toBe(false)
    expect(verifyWebhook(body, { id: 'msg_1', timestamp: ts, signature: sign(body) }, secret, now + 10 * 60_000)).toBe(false)
  })
  it('rejects when headers or the secret are missing', () => {
    expect(verifyWebhook(body, { id: null, timestamp: ts, signature: sign(body) }, secret, now)).toBe(false)
    expect(verifyWebhook(body, { id: 'msg_1', timestamp: ts, signature: sign(body) }, '', now)).toBe(false)
  })
})
