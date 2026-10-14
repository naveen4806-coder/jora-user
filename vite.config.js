import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

// Legacy customer pages are also accessible directly on Vercel.  They cannot
// read Vite's import.meta.env, so publish only the public Supabase runtime
// values into a small generated file in the build output.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      {
        name: 'jora-legacy-supabase-runtime-config',
        closeBundle() {
          const output = resolve(process.cwd(), 'dist/legacy/jora-supabase-runtime-config.js');
          mkdirSync(dirname(output), { recursive: true });
          const config = {
            url: env.VITE_SUPABASE_URL || '',
            key: env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
          };
          writeFileSync(output, `window.__JORA_SUPABASE_CONFIG__=${JSON.stringify(config)};\n`, 'utf8');
        }
      }
    ]
  };
});
