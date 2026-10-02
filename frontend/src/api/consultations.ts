import { postJson } from './httpClient'

/** 相談開始APIへ渡す自由記述。入力時の空白も保持する。 */
export type StartConsultationRequest = Readonly<{ content: string }>

/** 相談作成後の公開情報。相談本文や内部の処理構成は含めない。 */
export type StartConsultationResponse = Readonly<{
  consultation: Readonly<{ id: string; status: string; createdAt: string }>
  firstQuestion: Readonly<{ id: string; text: string }>
  progress: Readonly<{ phase: string; label: string }>
}>

/** 同一originの相談開始APIを呼び、保存成功後の初期表示情報を返す。 */
export function startConsultation(request: StartConsultationRequest) {
  return postJson<StartConsultationResponse>('/api/consultations', request)
}
