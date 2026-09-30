import { applyD1Migrations, env, type D1Migration } from 'cloudflare:test'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import type { Bindings } from '../../src/env'
import { Consultation } from '../../src/features/consultations/domain/consultation'
import { createConsultationRepository } from '../../src/features/consultations/repository'
import { createDatabase } from '../../src/shared/database/db'

type TestBindings = Bindings & {
  TEST_MIGRATIONS: D1Migration[]
}

const CREATED_AT = '2026-09-30T00:00:00.000Z'

describe('Consultation repository', () => {
  const bindings = env as unknown as TestBindings

  beforeAll(async () => {
    await applyD1Migrations(bindings.DB, bindings.TEST_MIGRATIONS)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('相談をDrizzle経由でD1のconsultationsテーブルへ保存する', async () => {
    const repository = createConsultationRepository(createDatabase(bindings.DB))
    const consultation = Consultation.create(
      crypto.randomUUID(),
      '自社の技術を活用できる共同研究先を探したい',
      CREATED_AT,
    )

    await repository.create(consultation)

    const row = await bindings.DB.prepare(
      'SELECT id, initial_content, status, created_at, updated_at FROM consultations WHERE id = ?1',
    )
      .bind(consultation.id)
      .first<Record<string, string>>()
    expect(row).toEqual({
      id: consultation.id,
      initial_content: '自社の技術を活用できる共同研究先を探したい',
      status: 'collecting_information',
      created_at: CREATED_AT,
      updated_at: CREATED_AT,
    })
  })

  it('保存時に相談本文を一般ログへ出力しない', async () => {
    const content = `ログに出してはいけない相談本文 ${crypto.randomUUID()}`
    const logSpies = (['log', 'info', 'warn', 'error', 'debug'] as const).map(
      (method) => vi.spyOn(console, method).mockImplementation(() => {}),
    )
    const repository = createConsultationRepository(createDatabase(bindings.DB))

    await repository.create(
      Consultation.create(crypto.randomUUID(), content, CREATED_AT),
    )

    const loggedText = logSpies
      .flatMap((spy) => spy.mock.calls.flat())
      .map((argument) => String(argument))
      .join('\n')
    expect(loggedText).not.toContain(content)
  })

  it('同じidの相談を重複して保存しようとするとエラーにする', async () => {
    const repository = createConsultationRepository(createDatabase(bindings.DB))
    const consultation = Consultation.create(
      crypto.randomUUID(),
      '共同研究先を探したい',
      CREATED_AT,
    )
    await repository.create(consultation)

    await expect(repository.create(consultation)).rejects.toThrow()
  })
})
