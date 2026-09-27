import type { D1Database } from '@cloudflare/workers-types'
import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1'

import * as schema from './schema/consultations'

/** D1 bindingを型付きのDrizzle DBへ変換する共通入口。 */
export function createDatabase(
  binding: D1Database,
): DrizzleD1Database<typeof schema> & { $client: D1Database } {
  return drizzle(binding, { schema })
}
