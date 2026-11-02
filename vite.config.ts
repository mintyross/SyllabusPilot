import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import {defineConfig} from 'vite';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': projectRoot,
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: {
        ignored: [
          '**/plan.ics',
          '**/*.ics',
          '**/*.db',
          '**/*.py',
          '**/*.pyc',
          '**/__pycache__/**',
          '**/.adk/**',
          '**/syllabus_pilot/**',
          '**/samples/**',
          '**/tests/**',
          '**/.env*',
        ],
      },
    },
  };
});
