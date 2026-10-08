import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: true,
  reporter: process.env.CI ? 'line' : 'list',
  use: {
    baseURL: process.env.QA_BASE_URL ?? 'http://127.0.0.1:3000',
    ...(process.env.QA_EMAIL || process.env.QA_STORAGE_STATE
      ? { storageState: process.env.QA_STORAGE_STATE ?? 'e2e/test-results/qa-storage.json' }
      : {}),
    trace: 'on-first-retry',
  },
  ...(process.env.QA_BASE_URL ? {} : {
    webServer: {
      command: 'npm run dev -- --hostname 127.0.0.1 --port 3000',
      url: 'http://127.0.0.1:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  }),
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
});
