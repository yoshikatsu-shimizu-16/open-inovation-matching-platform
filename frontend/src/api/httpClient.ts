/**
 * HTTP応答が成功ステータスではなかったことを表すエラー。
 * 呼び出し側がresponse bodyへ依存せずHTTP statusで分岐できるようにする。
 */
export class HttpError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

/**
 * JSON APIを呼び出し、callerが指定したheaderを保持したままJSON bodyを返す。
 * `Accept` が未指定の場合だけ `application/json` を補完する。
 *
 * @throws HTTP statusが成功範囲でない場合はHttpErrorを送出する。
 */
export async function getJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers)

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  const response = await fetch(input, {
    ...init,
    headers,
  })

  if (!response.ok) {
    throw new HttpError(
      `HTTP request failed with ${response.status}`,
      response.status,
    )
  }

  return (await response.json()) as T
}

/** JSON本文をPOSTし、既存のHTTPエラー処理を通して応答を返す。 */
export function postJson<T>(
  input: RequestInfo | URL,
  body: unknown,
): Promise<T> {
  return getJson<T>(input, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
