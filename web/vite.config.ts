/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const apiUrl = process.env['API_URL'] ?? 'http://localhost:8000';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: { '/api': apiUrl },
    watch: process.env['WATCH_POLL'] === '1' ? { usePolling: true, interval: 300 } : {},
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['src/test/setup.ts'],
  },
});
