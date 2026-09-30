import type { Database } from '../../shared/database/db'
import { consultations } from '../../shared/database/schema/consultations'
import type { Consultation } from './domain/consultation'

/** 相談開始Commandが利用する相談の永続化境界。 */
export interface ConsultationRepository {
  create(consultation: Consultation): Promise<void>
}

/** 共通DBを使い、相談をconsultationsテーブルへ保存するrepositoryを生成する。 */
export function createConsultationRepository(
  db: Database,
): ConsultationRepository {
  return {
    // 🔵 Intent: 相談本文は非公開情報を含み得るため、保存処理ではログを出さない。
    async create(consultation) {
      await db.insert(consultations).values({
        id: consultation.id,
        initialContent: consultation.initialContent,
        status: consultation.status,
        createdAt: consultation.createdAt,
        updatedAt: consultation.updatedAt,
      })
    },
  }
}
