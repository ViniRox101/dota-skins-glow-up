import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://esjztlesvoququviasxl.supabase.co/functions/v1',
        changeOrigin: true,
        rewrite: (path) => {
          // Map /api/create-checkout to /create-checkout
          // Map /api/get-session-details to /get-session-details
          return path.replace(/^\/api/, '')
        },
        headers: {
          'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
        },
      },
    },
  },
})