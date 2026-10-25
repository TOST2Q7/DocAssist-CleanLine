/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import pkg from './package.json' with { type: 'json' };

// Modes: default → dist/ (GitHub Pages); `file` → one self-contained HTML in dist-file/.
export default defineConfig(({ mode }) => {
  const isFile = mode === 'file';
  return {
    // Relative base: works under the Pages subpath and from file://.
    base: './',
    define: { __APP_VERSION__: JSON.stringify(pkg.version) },
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    plugins: [
      react(),
      ...(isFile ? [viteSingleFile(), renameHtml(`docassist-cleanline-v${pkg.version}.html`)] : []),
    ],
    build: { outDir: isFile ? 'dist-file' : 'dist' },
    test: { include: ['src/**/*.test.{ts,tsx}'] },
  };
});

function renameHtml(fileName: string): Plugin {
  return {
    name: 'rename-html',
    enforce: 'post',
    generateBundle(_, bundle) {
      const html = bundle['index.html'];
      if (html?.type !== 'asset') return;
      delete bundle['index.html'];
      this.emitFile({ type: 'asset', fileName, source: html.source });
    },
  };
}
