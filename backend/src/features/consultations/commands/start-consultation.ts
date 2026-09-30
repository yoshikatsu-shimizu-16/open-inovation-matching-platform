import { Consultation } from '../domain/consultation'
import type { ConsultationRepository } from '../repository'

/** 相談開始Command。 */
export type StartConsultationCommand = Readonly<{
  content: string
}>

/** 相談作成直後に表示する最初の問い。 */
export type FirstQuestion = Readonly<{
  id: string
  text: string
}>

/** 相談作成直後に表示する進行状態。 */
export type ConsultationProgress = Readonly<{
  phase: string
  label: string
}>

/** 相談開始Commandの実行結果。相談本文は含めない。 */
export type StartConsultationResult = Readonly<{
  consultation: Readonly<{
    id: string
    status: string
    createdAt: string
  }>
  firstQuestion: FirstQuestion
  progress: ConsultationProgress
}>

// 🔵 Intent: F001は不足情報判定を行わないため、最初の問いと進行状態は決定的な初期値として返す。
const FIRST_QUESTION: FirstQuestion = {
  id: 'consultation-goal',
  text: 'この相談を通じて、どのような状態を実現したいですか？',
}

const INITIAL_PROGRESS: ConsultationProgress = {
  phase: 'information-collection',
  label: '相談内容の確認を開始しました',
}

/** 相談開始Commandを実行し、作成後の相談・最初の問い・進行状態を返す。 */
export async function startConsultation(
  command: StartConsultationCommand,
  repository: ConsultationRepository,
  createId: () => string = () => globalThis.crypto.randomUUID(),
  now: () => string = () => new Date().toISOString(),
): Promise<StartConsultationResult> {
  const consultation = Consultation.create(createId(), command.content, now())
  await repository.create(consultation)

  return {
    consultation: {
      id: consultation.id,
      status: consultation.status,
      createdAt: consultation.createdAt,
    },
    firstQuestion: FIRST_QUESTION,
    progress: INITIAL_PROGRESS,
  }
}
