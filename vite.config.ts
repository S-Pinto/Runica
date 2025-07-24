import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carica le variabili d'ambiente specifiche per la modalità corrente (production, staging, etc.)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        },
        manifest: {
          name: env.VITE_APP_NAME,
          short_name: env.VITE_APP_SHORT_NAME,
          description: 'A dynamic and functional TTRPG character sheet manager with offline access and AI-powered backstory generation.',
          theme_color: '#f59e0b',
          background_color: '#18181b',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: env.VITE_PWA_ICON_192,
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: env.VITE_PWA_ICON_512,
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        'react': path.resolve(__dirname, './node_modules/react'),
        'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
      }
    }
  }
})
