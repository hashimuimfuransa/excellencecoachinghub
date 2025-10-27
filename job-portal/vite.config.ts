import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync, writeFileSync } from 'fs'
import path from 'path'

// Plugin to create deployment files after build
const createDeploymentFilesPlugin = () => {
  return {
    name: 'create-deployment-files',
    writeBundle() {
      const distDir = path.resolve(__dirname, 'dist')
      
      // Copy _redirects file
      const srcPath = path.resolve(__dirname, 'public/_redirects')
      const destPath = path.resolve(__dirname, 'dist/_redirects')
      if (existsSync(srcPath)) {
        copyFileSync(srcPath, destPath)
        console.log('✅ Copied _redirects file to dist/')
      }
      
      // Create web.config for IIS
      const webConfigContent = `<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="React Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/(api)" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>`
      writeFileSync(path.join(distDir, 'web.config'), webConfigContent)
      
      // Create vercel.json with SEO-safe exceptions
      const vercelConfig = {
        rewrites: [
          { source: "/(robots.txt|sitemap.xml|manifest.json)", destination: "/$1" },
          { source: "/assets/(.*)", destination: "/assets/$1" },
          { source: "/(.*)", destination: "/index.html" }
        ],
        headers: [
          { source: "/sitemap.xml", headers: [{ key: "Content-Type", value: "application/xml; charset=utf-8" }] }
        ]
      }
      writeFileSync(path.join(distDir, 'vercel.json'), JSON.stringify(vercelConfig, null, 2))
      
      console.log('✅ Created deployment configuration files')
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), createDeploymentFilesPlugin()],
  build: {
    // Optimize resource loading to prevent preload warnings
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material']
        }
      }
    },
    // Enable module preload polyfill
    modulePreload: {
      polyfill: true
    }
  },
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
