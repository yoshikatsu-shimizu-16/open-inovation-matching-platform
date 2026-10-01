import { defineConfig, devices } from '@playwright/test'

import {
  BACKEND_DIRECTORY,
  LOCAL_RUNTIME_COMMAND,
  LOCAL_RUNTIME_URL,
} from './e2e/support/local-runtime.ts'

export default defineConfig({
  testDir: './e2e',
  // 同じlocal D1を共有するため、保存と件数確認が競合しないよう順番に実行する。
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: LOCAL_RUNTIME_URL,
    trace: 'on-first-retry',
  },
  // 🔵 Intent: vite previewでは `/api/*` が404になるため、本番と同じWorkers + Assets構成で起動する。
  webServer: {
    command: LOCAL_RUNTIME_COMMAND,
    cwd: BACKEND_DIRECTORY,
    url: `${LOCAL_RUNTIME_URL}/api/health`,
    // 🔵 Intent: E2E専用のD1とAssetsを持つサーバーだけを使うため、起動済みサーバーを使い回さない。
    reuseExistingServer: false,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
