import { describe, expect, it } from 'vitest'
import { analyzeCallerText } from './detectionEngine'

describe('detectionEngine', () => {
  it('scores a normal, everyday call as LOW risk', () => {
    const text =
      "Hi, this is Rohan from Bluedart. Your package is out for delivery today between 2 and 5 PM. Please keep someone available at home to receive it."
    const result = analyzeCallerText(text)
    expect(result.level).toBe('LOW')
    expect(result.matchedCategories.length).toBe(0)
  })

  it('scores a genuine bank KYC call as LOW or MEDIUM, never HIGH', () => {
    const text =
      "Good afternoon, this is HDFC Bank calling to confirm your KYC update is complete. No action is needed from your side. Have a nice day."
    const result = analyzeCallerText(text)
    expect(result.level).not.toBe('HIGH')
  })

  it('flags a classic digital-arrest / fake-CBI script as HIGH risk', () => {
    const text = `
      This is Officer Sharma calling from CBI cyber crime cell. There is an
      FIR registered against your Aadhaar number for money laundering. This
      is a non-bailable case. You must not disconnect this call and you must
      not tell anyone about this, it is a confidential investigation. Keep
      your video camera on at all times. If you do not cooperate immediately
      you will be arrested within the hour. To verify your identity and clear
      your name, transfer the amount to the RBI verification account we will
      provide, and share the OTP sent to your phone.
    `
    const result = analyzeCallerText(text)
    expect(result.level).toBe('HIGH')
    expect(result.matchedCategories.length).toBeGreaterThanOrEqual(5)
    expect(result.topCategoryIds).toContain('financialExtraction')
    expect(result.topCategoryIds).toContain('isolation')
  })

  it('flags a remote-access-app scam as HIGH risk even with fewer phrases', () => {
    const text =
      "Sir there is a virus in your bank account, please install AnyDesk immediately and give me the code shown on your screen so I can fix it, otherwise your account will be frozen."
    const result = analyzeCallerText(text)
    expect(result.level).toBe('HIGH')
    expect(result.topCategoryIds[0]).toBe('remoteAccess')
  })

  it('flags a courier/customs parcel scam as at least MEDIUM risk', () => {
    const text =
      "This is Customs department. A parcel under your name contains illegal items and has been seized. This is urgent, you must pay a processing fee immediately or legal action will be taken against you."
    const result = analyzeCallerText(text)
    expect(['MEDIUM', 'HIGH']).toContain(result.level)
  })

  it('does not flag a friendly personal chat', () => {
    const text =
      "Hey! Are we still on for dinner tonight? I was thinking we could try that new place near the station. Let me know what time works for you."
    const result = analyzeCallerText(text)
    expect(result.level).toBe('LOW')
  })

  it('handles empty input safely', () => {
    const result = analyzeCallerText('')
    expect(result.score).toBe(0)
    expect(result.level).toBe('LOW')
    expect(result.matchedCategories).toEqual([])
  })

  it('is case-insensitive and punctuation-tolerant', () => {
    const result = analyzeCallerText('DO NOT HANG UP!!! Share the OTP NOW, this is URGENT.')
    expect(result.matchedCategories.length).toBeGreaterThan(0)
  })
})
