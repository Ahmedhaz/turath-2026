import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// The app is served from the bundle root inside Capacitor, so every URL stays relative.
export default defineConfig({
  base: './',
  plugins: [svelte()],
  build: { outDir: 'www', emptyOutDir: true, assetsInlineLimit: 0, target: 'es2020' },
});
