import { expect, test } from '@playwright/test'

import { queryLocalD1 } from './support/local-runtime.ts'

test('POST /api/consultations がHono経由でlocal D1へ保存され、最初の問いと進行状況を返す', async ({
  request,
}) => {
  const content = `E2Eからの相談本文 ${crypto.randomUUID()}`

  const response = await request.post('/api/consultations', {
    data: { content },
  })

  expect(response.status()).toBe(201)
  const body = await response.json()
  expect(body).toEqual({
    consultation: {
      id: expect.any(String),
      status: 'collecting_information',
      createdAt: expect.any(String),
    },
    firstQuestion: {
      id: 'consultation-goal',
      text: 'この相談を通じて、どのような状態を実現したいですか？',
    },
    progress: {
      phase: 'information-collection',
      label: '相談内容の確認を開始しました',
    },
  })

  const rows = queryLocalD1<{ id: string; initial_content: string }>(
    `SELECT id, initial_content FROM consultations WHERE id = '${body.consultation.id}'`,
  )
  expect(rows).toEqual([{ id: body.consultation.id, initial_content: content }])
})

test('空白のみの相談本文はHono経由で400になり、local D1へ保存されない', async ({
  request,
}) => {
  const before = queryLocalD1<{ count: number }>(
    'SELECT COUNT(*) as count FROM consultations',
  )

  const response = await request.post('/api/consultations', {
    data: { content: '   ' },
  })

  expect(response.status()).toBe(400)
  expect(await response.json()).toEqual({
    error: {
      code: 'INVALID_CONSULTATION_CONTENT',
      message: 'Consultation content must not be blank.',
    },
  })

  const after = queryLocalD1<{ count: number }>(
    'SELECT COUNT(*) as count FROM consultations',
  )
  expect(after).toEqual(before)
})
