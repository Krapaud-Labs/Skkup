import { defineConfig, devices } from '@playwright/test';

const qaPort = process.env.QA_PORT ?? '3000';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: true,
  // The smoke suite starts one Next server shared by both viewport projects.
  // Serialise CI workers so desktop and mobile cannot contend for the same
  // cold-started server during the keyboard pairing flow.
  ...(process.env.CI ? { workers: 1 } : {}),
  // The authenticated accessibility pass can focus every rendered control on
  // a loaded VPS runner. Give that complete keyboard traversal enough budget
  // when the browser process is contending with the self-hosted runner.
  timeout: 60_000,
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
  // Next.js is compiling and hydrating the first authenticated desktop pages.
  // Keep the assertion budget explicit so the test measures the UI instead of
  // cold-start scheduling jitter.
  expect: {
    timeout: 30_000,
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
