import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
        base: '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify('AIzaSyB8-sRNMg4Qft-LItYeYQmUbzbK7qfUrcE'),
        'process.env.GEMINI_API_KEY': JSON.stringify('AIzaSyB8-sRNMg4Qft-LItYeYQmUbzbK7qfUrcE')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
