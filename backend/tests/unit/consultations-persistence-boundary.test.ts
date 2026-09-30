import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const FEATURE_DIRECTORY = join(
  import.meta.dirname,
  '../../src/features/consultations',
)

/** consultations feature配下のTypeScriptファイルを再帰的に列挙する。 */
function listSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      return listSourceFiles(path)
    }
    return entry.name.endsWith('.ts') ? [path] : []
  })
}

describe('consultations feature の永続化境界', () => {
  it('D1の低レベルAPIを直接呼ばない', () => {
    const files = listSourceFiles(FEATURE_DIRECTORY)
    expect(files.length).toBeGreaterThan(0)

    const violations = files.filter((file) =>
      /\.(prepare|bind|run)\(|\bD1Database\b/.test(readFileSync(file, 'utf8')),
    )
    expect(violations).toEqual([])
  })
})
