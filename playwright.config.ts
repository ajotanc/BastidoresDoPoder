import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  testIgnore: '**/unit/**',
  use: { baseURL: 'http://127.0.0.1:4174', headless: true, serviceWorkers: 'block' },
  webServer: { command: 'pnpm exec vite preview --host 127.0.0.1 --port 4174 --strictPort', url: 'http://127.0.0.1:4174', reuseExistingServer: false },
});
