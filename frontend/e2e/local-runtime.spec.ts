import { expect, test } from '@playwright/test'

import { queryLocalD1 } from './support/local-runtime.ts'

test('browserから同一originの /api/* を通してlocal D1へ保存できる', async ({
  page,
}) => {
  await page.goto('/')
  const title = `E2E runtime ${crypto.randomUUID()}`

  const response = await page.evaluate(async (taskTitle) => {
    const result = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: taskTitle }),
    })
    return { status: result.status, body: (await result.json()) as unknown }
  }, title)

  expect(response.status).toBe(201)
  const { id } = response.body as { id: string }
  // SQLへ埋め込む前に、サーバーが生成したUUIDであることを確認する。
  expect(id).toMatch(/^[0-9a-f-]{36}$/)
  expect(
    queryLocalD1<{ title: string }>(
      `SELECT title FROM tasks WHERE id = '${id}'`,
    ),
  ).toEqual([{ title }])
})

test('local D1にF001の consultations migration が適用されている', () => {
  expect(
    queryLocalD1<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'consultations'",
    ),
  ).toEqual([{ name: 'consultations' }])
})
