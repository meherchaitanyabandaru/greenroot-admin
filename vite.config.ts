import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
  // `npm run build:release` (mode "release") is what gets deployed: it must
  // know the production API, or the dashboard would call localhost.
  if (mode === 'release') {
    const api = loadEnv(mode, process.cwd(), 'VITE_').VITE_API_BASE_URL ?? '';
    if (!api.startsWith('https://')) {
      throw new Error('build:release needs VITE_API_BASE_URL=https://api.<domain>');
    }
  }
  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
            redux: ['@reduxjs/toolkit', 'react-redux'],
            charts: ['recharts'],
          },
        },
      },
    },
    server: {
      port: 5173,
    },
    test: {
      environment: 'jsdom',
      globals: true,
      include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
      setupFiles: './tests/unit/setup.ts',
    },
  };
});
