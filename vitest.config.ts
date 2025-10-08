import { defineConfig } from 'vitest/config';
import path from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    // Use different environments based on test file location
    environmentMatchGlobs: [
      ['test/components/**', 'jsdom'],
      ['test/ui/**', 'jsdom'],
      ['**/*.component.test.{ts,tsx}', 'jsdom'],
      ['test/**', 'node'], // Default to node for API/service tests
    ],
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      exclude: [
        'node_modules/**',
        'test/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
        'dist/**',
        '.next/**',
        'out/**',
        'build/**',
      ],
    },
  },
});
