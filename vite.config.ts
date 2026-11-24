import { defineConfig } from 'vitest/config' // same as vite's defineConfig, plus the `test` section below
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Lets us write `@/components/ui/Button` instead of '../../../components/ui/Button'
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // Tests cover the pure logic (selectors and city generation), which needs no browser, so a plain Node environment is enough.
  test: { environment: 'node', include: ['src/**/*.test.ts', 'scripts/**/*.test.mjs'] },
})
