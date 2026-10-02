import { afterEach, expect, it, vi } from 'vitest'
import { startConsultation } from './consultations'
import { HttpError } from './httpClient'

afterEach(() => vi.restoreAllMocks())

it('相談本文をJSONとして同一originへPOSTする', async () => {
  const response = {
    consultation: { id: '1' },
    firstQuestion: { text: '問い' },
    progress: { label: '進行' },
  }
  const fetchMock = vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(JSON.stringify(response), { status: 201 }))
  expect(await startConsultation({ content: '相談本文' })).toEqual(response)
  const [url, init] = fetchMock.mock.calls[0]!
  expect(url).toBe('/api/consultations')
  expect(init?.method).toBe('POST')
  expect(new Headers(init?.headers).get('Content-Type')).toBe(
    'application/json',
  )
  expect(new Headers(init?.headers).get('Accept')).toBe('application/json')
  expect(init?.body).toBe(JSON.stringify({ content: '相談本文' }))
})

it('失敗した応答の本文を表示せずHTTPエラーを返す', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response('内部情報', { status: 500 }),
  )
  await expect(
    startConsultation({ content: '相談本文' }),
  ).rejects.toBeInstanceOf(HttpError)
})
