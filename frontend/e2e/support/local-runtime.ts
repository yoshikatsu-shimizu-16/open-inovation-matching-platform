import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const HOST = '127.0.0.1'
const PORT = 8787

/** E2Eで起動するWorkers + Assets + Hono + local D1のorigin。 */
export const LOCAL_RUNTIME_URL = `http://${HOST}:${PORT}`

/** wranglerを実行するbackend workspace。 */
export const BACKEND_DIRECTORY = fileURLToPath(
  new URL('../../../backend', import.meta.url),
)

/** 開発用のlocal D1と分けて、E2E専用に永続化するディレクトリ。 */
const PERSIST_DIRECTORY = '.wrangler/e2e-state'

/** migrationを適用してから、SPAと `/api/*` を同一originで配信するコマンド。 */
export const LOCAL_RUNTIME_COMMAND = [
  `npx wrangler d1 migrations apply DB --local --persist-to ${PERSIST_DIRECTORY}`,
  `npx wrangler dev --ip ${HOST} --port ${PORT} --persist-to ${PERSIST_DIRECTORY}`,
].join(' && ')

/** E2Eのlocal D1へSQLを発行し、browser操作の結果が永続化されたかを確認する。 */
export function queryLocalD1<Row>(sql: string): Row[] {
  const output = execFileSync(
    'npx',
    [
      'wrangler',
      'd1',
      'execute',
      'DB',
      '--local',
      '--persist-to',
      PERSIST_DIRECTORY,
      '--json',
      '--command',
      sql,
    ],
    { cwd: BACKEND_DIRECTORY, encoding: 'utf8' },
  )
  const [result] = JSON.parse(output) as [{ results: Row[] }]
  return result.results
}
