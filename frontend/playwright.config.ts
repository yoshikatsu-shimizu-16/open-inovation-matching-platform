import { defineConfig, devices } from '@playwright/test'

import {
  BACKEND_DIRECTORY,
  LOCAL_RUNTIME_COMMAND,
  LOCAL_RUNTIME_URL,
} from './e2e/support/local-runtime.ts'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
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
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
