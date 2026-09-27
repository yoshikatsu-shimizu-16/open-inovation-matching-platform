import type { D1Database } from '@cloudflare/workers-types'
import { describe, expect, it } from 'vitest'

import { createDatabase } from '../../src/shared/database/db'
import { consultations } from '../../src/shared/database/schema/consultations'

describe('consultations Drizzle schema', () => {
  it('設計済みの列名と値でD1向けINSERTを生成する', () => {
    const db = createDatabase({} as D1Database)
    const query = db
      .insert(consultations)
      .values({
        id: 'consultation-1',
        initialContent: '共同研究先を探したい',
        status: 'collecting_information',
        createdAt: '2026-09-27T00:00:00.000Z',
        updatedAt: '2026-09-27T00:00:00.000Z',
      })
      .toSQL()

    expect(query.sql).toContain(
      'insert into "consultations" ("id", "initial_content", "status", "created_at", "updated_at")',
    )
    expect(query.params).toEqual([
      'consultation-1',
      '共同研究先を探したい',
      'collecting_information',
      '2026-09-27T00:00:00.000Z',
      '2026-09-27T00:00:00.000Z',
    ])
  })
})
