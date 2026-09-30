import { expect, test } from '@playwright/test'

import { queryLocalD1 } from './support/local-runtime.ts'

test('local D1にF001の consultations migration が適用されている', () => {
  expect(
    queryLocalD1<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'consultations'",
    ),
  ).toEqual([{ name: 'consultations' }])
})
