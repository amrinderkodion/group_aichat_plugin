import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(),react()],
  build: {
    lib: {
      entry: './src/main.jsx',
      name: 'AIChatWidget',
      fileName: 'ai-chat-widget',
      formats: ['iife'], // Best for single-file drop-in script
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
})
