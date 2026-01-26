
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Aumenta o limite de aviso para 1000kb (1MB) para evitar alertas desnecessários
    chunkSizeWarningLimit: 1000, 
    rollupOptions: {
      output: {
        // Divide bibliotecas pesadas em arquivos separados para carregar mais rápido
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-genai': ['@google/genai'],
          'vendor-icons': ['lucide-react'],
          'vendor-db': ['@supabase/supabase-js'],
          'vendor-utils': ['date-fns', 'html2canvas', 'jspdf']
        },
      },
    },
  },
})
