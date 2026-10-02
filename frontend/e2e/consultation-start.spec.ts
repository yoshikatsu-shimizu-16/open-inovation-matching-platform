import { expect, test } from '@playwright/test'
import { queryLocalD1 } from './support/local-runtime.ts'

test('相談入力からAPIとlocal D1を通って最初の問いを表示する', async ({
  page,
}) => {
  const content = `共同研究先を探したい ${crypto.randomUUID()}`
  await page.goto('/')
  await page.getByRole('textbox', { name: '相談内容' }).fill(content)
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/consultations') &&
      response.request().method() === 'POST',
  )
  await page.getByRole('button', { name: '相談を始める' }).click()
  const response = await responsePromise
  expect(response.status()).toBe(201)
  const result = await response.json()
  await expect(page.getByText(result.firstQuestion.text)).toBeVisible()
  await expect(page.getByRole('status')).toHaveText(result.progress.label)
  expect(
    queryLocalD1<{ initial_content: string }>(
      `SELECT initial_content FROM consultations WHERE id = '${result.consultation.id}'`,
    ),
  ).toEqual([{ initial_content: content }])
})

test('空入力はAPIを呼ばず、相談を保存しない', async ({ page }) => {
  const requests: string[] = []
  page.on('request', (request) => {
    if (request.url().endsWith('/api/consultations'))
      requests.push(request.url())
  })
  const before = queryLocalD1<{ count: number }>(
    'SELECT COUNT(*) as count FROM consultations',
  )
  await page.goto('/')
  await page.getByRole('textbox').fill('   ')
  await page.getByRole('button', { name: '相談を始める' }).click()
  await expect(page.getByRole('alert')).toHaveText(
    '相談内容を入力してください。',
  )
  expect(requests).toEqual([])
  expect(queryLocalD1('SELECT COUNT(*) as count FROM consultations')).toEqual(
    before,
  )
})

test('通信失敗後も入力を保持し、再試行で実APIへ保存する', async ({ page }) => {
  const content = `再試行する相談 ${crypto.randomUUID()}`
  await page.route('**/api/consultations', (route) => route.abort('failed'), {
    times: 1,
  })
  await page.goto('/')
  await page.getByRole('textbox').fill(content)
  await page.getByRole('button', { name: '相談を始める' }).click()
  await expect(page.getByRole('alert')).toContainText('もう一度')
  await expect(page.getByRole('textbox')).toHaveValue(content)
  const responsePromise = page.waitForResponse((response) =>
    response.url().endsWith('/api/consultations'),
  )
  await page.getByRole('button', { name: 'もう一度試す' }).click()
  const result = await (await responsePromise).json()
  await expect(page.getByText(result.firstQuestion.text)).toBeVisible()
  expect(
    queryLocalD1<{ initial_content: string }>(
      `SELECT initial_content FROM consultations WHERE id = '${result.consultation.id}'`,
    ),
  ).toEqual([{ initial_content: content }])
})
