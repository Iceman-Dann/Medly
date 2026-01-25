import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load env vars - loadEnv with empty prefix loads all vars
    const env = loadEnv(mode, process.cwd(), '');
    const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
    const base = repoName && process.env.GITHUB_REPOSITORY ? `/${repoName}/` : '/';
    
    // Get API key from env (works in both dev and build)
    // Support both API_KEY (Gemini) and OPENAI_API_KEY for backwards compatibility
    const apiKey = process.env.API_KEY || env.API_KEY || process.env.OPENAI_API_KEY || env.OPENAI_API_KEY || '';
    
    console.log('Building with API key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET');
    
    return {
      base,
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(apiKey),
        'process.env.OPENAI_API_KEY': JSON.stringify(apiKey),
        'import.meta.env.VITE_OPENAI_API_KEY': JSON.stringify(apiKey),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
      }
    };
});
