import { describe, expect, it } from 'vitest'

import { Consultation } from '../../src/features/consultations/domain/consultation'

const CREATED_AT = '2026-09-30T00:00:00.000Z'

describe('Consultation domain', () => {
  it('空白ではない相談本文から情報収集中の相談を作成する', () => {
    const consultation = Consultation.create(
      'consultation-1',
      '自社の技術を活用できる共同研究先を探したい',
      CREATED_AT,
    )

    expect(consultation).toMatchObject({
      id: 'consultation-1',
      initialContent: '自社の技術を活用できる共同研究先を探したい',
      status: 'collecting_information',
      createdAt: CREATED_AT,
      updatedAt: CREATED_AT,
    })
  })

  it('入力された相談本文を書き換えずに保持する', () => {
    const consultation = Consultation.create(
      'consultation-1',
      '  共同研究先を探したい\n',
      CREATED_AT,
    )

    expect(consultation.initialContent).toBe('  共同研究先を探したい\n')
  })

  it.each(['', '   ', '\n\t　'])(
    '空または空白だけの相談本文 %j を拒否する',
    (content) => {
      expect(() =>
        Consultation.create('consultation-1', content, CREATED_AT),
      ).toThrowError(
        expect.objectContaining({ code: 'INVALID_CONSULTATION_CONTENT' }),
      )
    },
  )
})
