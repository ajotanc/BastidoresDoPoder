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
      includeAssets: [
        'favicon.ico',
        'images/bdp.webp',
        'images/hero-art.webp',
        'images/pwa/*.png',
        'images/icons/*.webp',
        'images/characters/*.webp',
        'images/coins/*.webp'
      ],
      manifest: {
        name: 'Bastidores do Poder — Manual & Regras',
        short_name: 'Bastidores Poder',
        description: 'Manual e guia de referência completo para o jogo Bastidores do Poder',
        theme_color: '#111d2e',
        background_color: '#0b1219',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'pt-BR',
        icons: [
          {
            src: '/images/pwa/pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png'
          },
          {
            src: '/images/pwa/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/images/pwa/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/images/pwa/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,ico,woff2}'],
        runtimeCaching: [{
          urlPattern: ({ url }) => url.pathname.startsWith('/images/cards/'),
          handler: 'NetworkFirst',
          options: {
            cacheName: 'card-originals-v1',
            networkTimeoutSeconds: 5,
            cacheableResponse: { statuses: [200] },
            expiration: { maxEntries: 12, maxAgeSeconds: 30 * 24 * 60 * 60 }
          }
        }],
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
