import type { D1Database } from '@cloudflare/workers-types'
import { drizzle } from 'drizzle-orm/d1'

import * as schema from './schema/consultations'

/** D1 bindingを型付きのDrizzle DBへ変換する共通入口。 */
export function createDatabase(binding: D1Database) {
  return drizzle(binding, { schema })
}

/** 各featureのrepositoryが受け取るDBの型。 */
export type Database = ReturnType<typeof createDatabase>
