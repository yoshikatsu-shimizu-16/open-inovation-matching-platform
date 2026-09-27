import { applyD1Migrations, env, SELF, type D1Migration } from 'cloudflare:test'
import { beforeAll, describe, expect, it } from 'vitest'

import type { Bindings } from '../../src/env'
import { R2ObjectStorage } from '../../src/features/storage/r2-object-storage'
import { createObjectKey } from '../../src/features/storage/object-key'
import { createDatabase } from '../../src/shared/database/db'
import { consultations } from '../../src/shared/database/schema/consultations'

type TaskResponse = {
  id: string
  title: string
  status: 'open' | 'done'
  createdAt: string
  updatedAt: string
}

type TestBindings = Bindings & {
  TEST_MIGRATIONS: D1Migration[]
}

describe('Cloudflare Workers runtime', () => {
  beforeAll(async () => {
    const bindings = env as unknown as TestBindings
    await applyD1Migrations(bindings.DB, bindings.TEST_MIGRATIONS)
  })

  it('binding経由でTasksの永続化ラウンドトリップを実行できる', async () => {
    const id = crypto.randomUUID()
    const createResponse = await SELF.fetch('http://example.com/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: `Worker task ${id}` }),
    })

    expect(createResponse.status).toBe(201)
    const created = (await createResponse.json()) as TaskResponse

    const getResponse = await SELF.fetch(
      `http://example.com/api/tasks/${created.id}`,
    )
    expect(getResponse.status).toBe(200)
    expect(await getResponse.json()).toEqual(created)

    const database = (env as unknown as TestBindings).DB
    const row = await database
      .prepare('SELECT id, title, status FROM tasks WHERE id = ?1')
      .bind(created.id)
      .first<{ id: string; title: string; status: string }>()
    expect(row).toEqual({
      id: created.id,
      title: created.title,
      status: created.status,
    })
  })

  it('相談テーブルに必要な列と制約が定義される', async () => {
    const bindings = env as unknown as TestBindings
    const columns = await bindings.DB.prepare(
      'PRAGMA table_info(consultations)',
    ).all<{ name: string; type: string; notnull: number; pk: number }>()

    expect(
      columns.results.map(({ name, type, notnull, pk }) => ({
        name,
        type,
        notnull,
        pk,
      })),
    ).toEqual([
      { name: 'id', type: 'TEXT', notnull: 1, pk: 1 },
      { name: 'initial_content', type: 'TEXT', notnull: 1, pk: 0 },
      { name: 'status', type: 'TEXT', notnull: 1, pk: 0 },
      { name: 'created_at', type: 'TEXT', notnull: 1, pk: 0 },
      { name: 'updated_at', type: 'TEXT', notnull: 1, pk: 0 },
    ])
  })

  it('Drizzleで相談を保存すると対応するDB列に値が記録される', async () => {
    const bindings = env as unknown as TestBindings
    const id = crypto.randomUUID()
    await createDatabase(bindings.DB).insert(consultations).values({
      id,
      initialContent: '共同研究先を探したい',
      status: 'collecting_information',
      createdAt: '2026-09-27T00:00:00.000Z',
      updatedAt: '2026-09-27T00:00:00.000Z',
    })

    const row = await bindings.DB.prepare(
      'SELECT id, initial_content, status, created_at, updated_at FROM consultations WHERE id = ?1',
    )
      .bind(id)
      .first<Record<string, string>>()

    expect(row).toEqual({
      id,
      initial_content: '共同研究先を探したい',
      status: 'collecting_information',
      created_at: '2026-09-27T00:00:00.000Z',
      updated_at: '2026-09-27T00:00:00.000Z',
    })
  })

  it('Worker runtimeでhealthとvalidation errorを返す', async () => {
    const healthResponse = await SELF.fetch(
      'http://example.com/api/health?detail=true',
    )
    expect(healthResponse.status).toBe(200)

    const invalidResponse = await SELF.fetch('http://example.com/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '   ' }),
    })
    expect(invalidResponse.status).toBe(400)
    expect(await invalidResponse.json()).toEqual({
      error: {
        code: 'INVALID_TASK_TITLE',
        message: 'Task title must not be blank.',
      },
    })
  })

  it('R2 bindingでmetadata付きオブジェクトを読み書きできる', async () => {
    const storage = new R2ObjectStorage(
      (env as unknown as TestBindings).OBJECTS,
    )
    const key = createObjectKey('worker-test', crypto.randomUUID(), 'test.txt')
    await storage.put(key, 'runtime object', {
      httpMetadata: { contentType: 'text/plain' },
      customMetadata: { source: 'worker-test' },
    })

    const object = await storage.get(key)
    expect(object).not.toBeNull()
    expect(await object?.text()).toBe('runtime object')
    expect(object?.httpMetadata?.contentType).toBe('text/plain')
    expect(object?.customMetadata).toEqual({ source: 'worker-test' })

    await storage.delete(key)
    expect(await storage.get(key)).toBeNull()
  })
})
