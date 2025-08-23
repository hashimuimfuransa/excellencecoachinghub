import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync } from 'fs'
import path from 'path'

// Plugin to copy _redirects file after build
const copyRedirectsPlugin = () => {
  return {
    name: 'copy-redirects',
    writeBundle() {
      const srcPath = path.resolve(__dirname, 'public/_redirects')
      const destPath = path.resolve(__dirname, 'dist/_redirects')
      if (existsSync(srcPath)) {
        copyFileSync(srcPath, destPath)
        console.log('✅ Copied _redirects file to dist/')
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copyRedirectsPlugin()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
