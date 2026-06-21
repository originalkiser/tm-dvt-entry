import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      manifest: {
        name: 'DVT-Entry',
        short_name: 'DVT-Entry',
        description: 'Strickland Brothers Daily Value Tracker — multi-location data entry',
        theme_color: '#002745',
        background_color: '#002745',
        display: 'standalone',
        icons: [
          { src: 'src/assets/sb-trademark-logo.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  base: './',
  resolve: {
    alias: { '@': '/src' },
  },
})
