import { defineConfig, devices } from '@playwright/test';

const qaPort = process.env.QA_PORT ?? '3000';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: true,
  reporter: process.env.CI ? 'line' : 'list',
  use: {
    baseURL: process.env.QA_BASE_URL ?? `http://127.0.0.1:${qaPort}`,
    ...(process.env.QA_LOCAL_HTTPS === '1' ? { ignoreHTTPSErrors: true } : {}),
    ...(process.env.QA_EMAIL || process.env.QA_STORAGE_STATE
      ? { storageState: process.env.QA_STORAGE_STATE ?? 'e2e/test-results/qa-storage.json' }
      : {}),
    trace: 'on-first-retry',
  },
  // The self-hosted VPS runner may execute this suite with one worker while
  // Next.js is still hydrating the authenticated dashboard shell. Keep the
  // assertion budget explicit so the test measures the UI instead of runner
  // scheduling jitter.
  expect: {
    timeout: 15_000,
  },
  ...(process.env.QA_BASE_URL ? {} : {
    webServer: {
      command: `npm run dev -- --hostname 127.0.0.1 --port ${qaPort}`,
      url: `http://127.0.0.1:${qaPort}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  }),
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
});
