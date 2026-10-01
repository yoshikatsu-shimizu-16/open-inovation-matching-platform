import { applyD1Migrations, env, SELF, type D1Migration } from 'cloudflare:test'
import { beforeAll, describe, expect, it } from 'vitest'

import type { Bindings } from '../../src/env'

type TestBindings = Bindings & {
  TEST_MIGRATIONS: D1Migration[]
}

type StartConsultationResponse = {
  consultation: { id: string; status: string; createdAt: string }
  firstQuestion: { id: string; text: string }
  progress: { phase: string; label: string }
}

describe('POST /api/consultations (Cloudflare Workers runtime)', () => {
  beforeAll(async () => {
    const bindings = env as unknown as TestBindings
    await applyD1Migrations(bindings.DB, bindings.TEST_MIGRATIONS)
  })

  it('binding経由で相談開始をlocal D1へ永続化し、本文を含まない応答を返す', async () => {
    const content = `Worker経由の相談本文 ${crypto.randomUUID()}`

    const response = await SELF.fetch('http://example.com/api/consultations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })

    expect(response.status).toBe(201)
    const body = (await response.json()) as StartConsultationResponse

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
    expect(JSON.stringify(body)).not.toContain(content)

    const database = (env as unknown as TestBindings).DB
    const row = await database
      .prepare(
        'SELECT id, initial_content, status FROM consultations WHERE id = ?1',
      )
      .bind(body.consultation.id)
      .first<{ id: string; initial_content: string; status: string }>()

    expect(row).toEqual({
      id: body.consultation.id,
      initial_content: content,
      status: 'collecting_information',
    })
  })

  it('空白のみの相談本文は400を返し、D1へ行を追加しない', async () => {
    const database = (env as unknown as TestBindings).DB
    const before = await database
      .prepare('SELECT COUNT(*) as count FROM consultations')
      .first<{ count: number }>()

    const response = await SELF.fetch('http://example.com/api/consultations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: '　\n  ' }),
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: {
        code: 'INVALID_CONSULTATION_CONTENT',
        message: 'Consultation content must not be blank.',
      },
    })

    const after = await database
      .prepare('SELECT COUNT(*) as count FROM consultations')
      .first<{ count: number }>()
    expect(after?.count).toBe(before?.count)
  })
})
