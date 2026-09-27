import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

/** F001の相談開始時点で永続化するconsultationsテーブル。 */
export const consultations = sqliteTable('consultations', {
  id: text('id').primaryKey(),
  initialContent: text('initial_content').notNull(),
  status: text('status', { enum: ['collecting_information'] }).notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})
