import { DomainError } from '../../../shared/errors/domain-error'

/** 相談が取り得る状態。F001では作成直後の情報収集中だけを扱う。 */
export type ConsultationStatus = 'collecting_information'

/** 相談開始時点の状態と入力不変条件を保持するドメインモデル。 */
export class Consultation {
  private constructor(
    public readonly id: string,
    public readonly initialContent: string,
    public readonly status: ConsultationStatus,
    public readonly createdAt: string,
    public readonly updatedAt: string,
  ) {}

  // 🔵 Intent: 相談者の入力を起点として残すため、本文は正規化せず空白判定だけを行う。
  static create(
    id: string,
    initialContent: string,
    createdAt: string,
  ): Consultation {
    if (initialContent.trim().length === 0) {
      throw new DomainError(
        'INVALID_CONSULTATION_CONTENT',
        'Consultation content must not be blank.',
      )
    }

    return new Consultation(
      id,
      initialContent,
      'collecting_information',
      createdAt,
      createdAt,
    )
  }
}
