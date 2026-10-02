import { afterEach, describe, expect, it, vi } from 'vitest'

import { createApp } from '../../src/app'
import type { Consultation } from '../../src/features/consultations/domain/consultation'
import type { ConsultationRepository } from '../../src/features/consultations/repository'

function createFakeConsultationRepository(): ConsultationRepository & {
  saved: Consultation[]
} {
  const saved: Consultation[] = []
  return {
    saved,
    create: vi.fn(async (consultation: Consultation) => {
      saved.push(consultation)
    }),
  }
}

describe('Consultations 開始API integration', () => {
  afterEach(() => vi.restoreAllMocks())

  it('保存失敗時は本文・SQL・stackを応答や一般ログへ出さない', async () => {
    const content = '公開してはいけない相談本文'
    const repository: ConsultationRepository = {
      create: vi
        .fn()
        .mockRejectedValue(new Error(`SQL failure: INSERT ${content}`)),
    }
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map(
      (method) => vi.spyOn(console, method).mockImplementation(() => {}),
    )
    const response = await createApp(undefined, repository).request(
      '/api/consultations',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      },
    )
    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error.' },
    })
    const logged = spies
      .flatMap((spy) => spy.mock.calls.flat())
      .map(String)
      .join('\n')
    expect(logged).not.toContain(content)
    expect(logged).not.toContain('INSERT')
    expect(repository.create).toHaveBeenCalledTimes(1)
  })
  it('自由記述からの相談開始をHTTP境界から実行できる', async () => {
    const repository = createFakeConsultationRepository()
    const app = createApp(undefined, repository)

    const response = await app.request('/api/consultations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: '自社の技術を活用できる共同研究先を探したい',
      }),
    })

    expect(response.status).toBe(201)
    const body = (await response.json()) as Record<string, unknown>

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

    const consultationBody = body['consultation'] as Record<string, unknown>
    expect(consultationBody).not.toHaveProperty('content')
    expect(consultationBody).not.toHaveProperty('initialContent')
    expect(consultationBody).not.toHaveProperty('initial_content')

    expect(repository.saved).toHaveLength(1)
    expect(repository.saved[0]?.initialContent).toBe(
      '自社の技術を活用できる共同研究先を探したい',
    )
  })

  it('空白のみの相談本文を400で拒否し、repositoryを呼ばない', async () => {
    const repository = createFakeConsultationRepository()
    const app = createApp(undefined, repository)

    const response = await app.request('/api/consultations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: '   ' }),
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: {
        code: 'INVALID_CONSULTATION_CONTENT',
        message: 'Consultation content must not be blank.',
      },
    })
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('content が string でない request を400で拒否する', async () => {
    const repository = createFakeConsultationRepository()
    const app = createApp(undefined, repository)

    const response = await app.request('/api/consultations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 42 }),
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: {
        code: 'INVALID_REQUEST',
        message: '"content" must be a string.',
      },
    })
    expect(repository.create).not.toHaveBeenCalled()
  })
})
