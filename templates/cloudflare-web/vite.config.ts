/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // `npm run dev:pages` serves the Functions on 8788 and proxies the page to Vite; `npm run dev` alone sends
    // /api there too, so it works when Wrangler is already running.
    proxy: {
      '/api': { target: 'http://127.0.0.1:8788', changeOrigin: true },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    // Above the 5 s asyncUtilTimeout of tests/setup.ts, so a findBy* that waits in vain reports what it missed.
    testTimeout: 10000,
  },
});
