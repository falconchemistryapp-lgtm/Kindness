import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // This allows the use of process.env.API_KEY in the client-side code.
  // Vite replaces this with the actual value at build time, which is necessary for Vercel deployment.
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
})
