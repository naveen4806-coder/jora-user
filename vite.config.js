import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

// Legacy pages receive only the public API URL. MongoDB credentials remain
// exclusively in server/.env and are never included in a browser build.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      {
        name: 'jora-legacy-mongo-runtime-config',
        closeBundle() {
          const output = resolve(process.cwd(), 'dist/legacy/jora-mongo-runtime-config.js');
          mkdirSync(dirname(output), { recursive: true });
          const config = {
            url: env.VITE_JORA_API_URL || '/api'
          };
          writeFileSync(output, `window.__JORA_API_CONFIG__=${JSON.stringify(config)};\n`, 'utf8');
        }
      }
    ],
    server: {
      proxy: { '/api': { target: env.VITE_JORA_API_URL || 'http://127.0.0.1:4000', changeOrigin: true } }
    }
  };
});
