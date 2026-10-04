import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import packageJson from './package.json';

const gameConfig = JSON.parse(readFileSync(new URL('./game.config.json', import.meta.url), 'utf8')) as { name: string; minPlayers: number; maxPlayers: number };
const { name: GAME_NAME, minPlayers: MIN_PLAYERS_TO_START, maxPlayers: MAX_PLAYERS_PER_ROOM } = gameConfig;
export default defineConfig({
  envPrefix: ['VITE_', 'DEVELOPMENT_'],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  plugins: [
    vue(),
    { name: 'game-metadata', transformIndexHtml: (html: string) => html.replaceAll('__GAME_NAME__', GAME_NAME).replaceAll('__MIN_PLAYERS__', String(MIN_PLAYERS_TO_START)).replaceAll('__MAX_PLAYERS__', String(MAX_PLAYERS_PER_ROOM)) },
    VitePWA({
      registerType: 'prompt',
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallbackAllowlist: [/^\/(?!\.netlify(?:\/|$))/]
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
        name: GAME_NAME + ' — Manual & Regras',
        short_name: GAME_NAME,
        description: 'Manual e guia de referência completo para o jogo ' + GAME_NAME,
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
        skipWaiting: false,
        clientsClaim: false,
        // OAuth navigations must reach Functions, never the cached app shell.
        navigateFallbackDenylist: [/^\/\.netlify(?:\/|$)/],
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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('peerjs') || id.includes('webrtc-adapter') || id.includes('sdp')) return 'vendor-peer';
          if (id.includes('radix-vue') || id.includes('@floating-ui') || id.includes('@internationalized')) return 'vendor-ui';
          if (id.includes('html-to-image') || id.includes('vue-confetti') || id.includes('canvas-confetti')) return 'vendor-extras';
          if (['vue', '@vue', 'vue-router', 'pinia'].some((pkg) => id.replaceAll('\\', '/').includes(`/node_modules/${pkg}/`))) return 'vendor-vue';
          return undefined;
        }
      }
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
