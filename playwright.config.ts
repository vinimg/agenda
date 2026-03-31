import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://172.20.9.106:4322',
    headless: true,
    viewport: { width: 1440, height: 900 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npx serve dist -p 4322 --single --no-clipboard',
    url: 'http://172.20.9.106:4322',
    reuseExistingServer: true,
    timeout: 10_000,
  },
})
