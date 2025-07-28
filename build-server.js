#!/usr/bin/env node

import esbuild from 'esbuild';
import fs from 'fs';

// Build the server with proper externals
esbuild.build({
  entryPoints: ['server/index.ts'],
  platform: 'node',
  packages: 'external',
  bundle: true,
  format: 'esm',
  outdir: 'dist/server',
  external: ['vite', 'drizzle-kit', '@vitejs/plugin-react', '@replit/vite-plugin-runtime-error-modal', '@replit/vite-plugin-cartographer']
}).then(() => {
  // Copy public files to server directory for correct static serving
  if (fs.existsSync('dist/public')) {
    fs.cpSync('dist/public', 'dist/server/public', { recursive: true });
    console.log('Static files copied to server directory');
  }
  console.log('Server build complete');
}).catch((error) => {
  console.error('Server build failed:', error);
  process.exit(1);
});