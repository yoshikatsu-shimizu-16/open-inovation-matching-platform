import type { D1Database } from '@cloudflare/workers-types'
import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1'

import * as schema from './schema/consultations'

/** feature repositoryが受け取る型付きDrizzle DB。 */
export type Database = DrizzleD1Database<typeof schema> & {
  $client: D1Database
}

/** D1 bindingを型付きのDrizzle DBへ変換する共通入口。 */
export function createDatabase(binding: D1Database): Database {
  return drizzle(binding, { schema })
}
