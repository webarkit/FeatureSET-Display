import { defineConfig, devices } from '@playwright/test';

// Runs against the built artifacts in dist/ and build/. CI sequences
// `npm run build && npm run build-es6 && npm run test:e2e`. Locally
// the same applies.
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:8765',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npx http-server -c-1 -p 8765 --silent',
    url: 'http://127.0.0.1:8765',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
