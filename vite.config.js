import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
export default defineConfig({
    plugins: [
        vue(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg', 'images/*.png', 'images/cards/*.png'],
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
                        src: '/favicon.svg',
                        sizes: '192x192',
                        type: 'image/svg+xml',
                        purpose: 'any maskable'
                    },
                    {
                        src: '/favicon.svg',
                        sizes: '512x512',
                        type: 'image/svg+xml',
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
        port: 3000,
        open: false,
        host: true
    }
});
