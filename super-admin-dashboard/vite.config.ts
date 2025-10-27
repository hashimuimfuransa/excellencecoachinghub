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
      
      // Create vercel.json
      const vercelConfig = {
        "rewrites": [
          { "source": "/(.*)", "destination": "/index.html" }
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
  server: {
    port: 3002,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})