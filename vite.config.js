import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'Isotipo.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'OterCar - Gestión Vehicular',
        short_name: 'OterCar',
        description: 'Gestión inteligente de mantenimiento vehicular',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'Isotipo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'Isotipo.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'Isotipo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'sonner', 'clsx', 'tailwind-merge'],
          'supabase': ['@supabase/supabase-js']
        }
      }
    }
  }
})
