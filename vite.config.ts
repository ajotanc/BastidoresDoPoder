import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import packageJson from './package.json';

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
        type: 'module'
      },
      includeAssets: ['images/bdp.webp', 'images/*.png', 'images/cards/*.png', 'images/icons/*.png'],
      manifest: {
        name: 'Bastidores do Poder — Manual & Regras',
        short_name: 'Bastidores Poder',
        description: 'Manual e guia de referência completo para o jogo Bastidores do Poder',
        theme_color: '#111d2e',
        background_color: '#0b1219',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/images/bdp.webp',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/images/bdp.webp',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: [
      'dev.ajotanc.com.br'
    ]
  }
});
