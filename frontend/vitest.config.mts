import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Configuration Vitest (recommandation officielle Next.js 16 pour les
// tests unitaires, à la place de Jest).
export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
});
