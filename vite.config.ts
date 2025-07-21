import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Aggiungi questa sezione per risolvere il problema dei "Invalid hook call"
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
})

