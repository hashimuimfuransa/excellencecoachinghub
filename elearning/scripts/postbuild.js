const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '..', 'build');

console.log('🔧 Running post-build optimizations...');

// Log build directory contents
console.log('📁 Build directory contents:');
if (fs.existsSync(buildDir)) {
  const files = fs.readdirSync(buildDir);
  files.forEach(file => {
    const filePath = path.join(buildDir, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      console.log(`  📁 ${file}/`);
      const subFiles = fs.readdirSync(filePath);
      subFiles.slice(0, 5).forEach(subFile => {
        console.log(`    📄 ${subFile}`);
      });
      if (subFiles.length > 5) {
        console.log(`    ... and ${subFiles.length - 5} more files`);
      }
    } else {
      console.log(`  📄 ${file}`);
    }
  });
} else {
  console.log('  ❌ Build directory does not exist!');
}

// Ensure _redirects file is in build directory
const redirectsSource = path.join(__dirname, '..', 'public', '_redirects');
const redirectsTarget = path.join(buildDir, '_redirects');

if (fs.existsSync(redirectsSource)) {
  fs.copyFileSync(redirectsSource, redirectsTarget);
  console.log('✅ Copied _redirects file to build directory');
} else {
  // Create _redirects file if it doesn't exist
  const redirectsContent = `# Static assets should not be redirected
/static/*  /static/:splat  200
/manifest.json  /manifest.json  200
/favicon.ico  /favicon.ico  200
/*.js  /:splat.js  200
/*.css  /:splat.css  200
/*.png  /:splat.png  200
/*.jpg  /:splat.jpg  200
/*.svg  /:splat.svg  200
/*.woff  /:splat.woff  200
/*.woff2  /:splat.woff2  200

# Fallback for client-side routing (everything else)
/*    /index.html   200`;
  fs.writeFileSync(redirectsTarget, redirectsContent);
  console.log('✅ Created _redirects file in build directory');
}

// Ensure .htaccess file is in build directory
const htaccessSource = path.join(__dirname, '..', 'public', '.htaccess');
const htaccessTarget = path.join(buildDir, '.htaccess');

if (fs.existsSync(htaccessSource)) {
  fs.copyFileSync(htaccessSource, htaccessTarget);
  console.log('✅ Copied .htaccess file to build directory');
} else {
  // Create .htaccess file if it doesn't exist
  const htaccessContent = `Options -MultiViews
RewriteEngine On

# Handle static assets - don't rewrite if file exists
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule ^ - [L]

# Handle directories - don't rewrite if directory exists
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# Don't rewrite static assets
RewriteRule ^static/ - [L]
RewriteRule \\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico|json)$ - [L]

# Rewrite everything else to index.html
RewriteRule ^ index.html [QSA,L]`;
  fs.writeFileSync(htaccessTarget, htaccessContent);
  console.log('✅ Created .htaccess file in build directory');
}

// Ensure 404.html file is in build directory
const notFoundSource = path.join(__dirname, '..', 'public', '404.html');
const notFoundTarget = path.join(buildDir, '404.html');

if (fs.existsSync(notFoundSource)) {
  fs.copyFileSync(notFoundSource, notFoundTarget);
  console.log('✅ Copied 404.html file to build directory');
}

// Create a web.config file for IIS servers
const webConfigTarget = path.join(buildDir, 'web.config');
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
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <mimeMap fileExtension=".woff" mimeType="application/font-woff" />
      <mimeMap fileExtension=".woff2" mimeType="application/font-woff2" />
    </staticContent>
  </system.webServer>
</configuration>`;

fs.writeFileSync(webConfigTarget, webConfigContent);
console.log('✅ Created web.config file for IIS servers');

// Create a vercel.json file for Vercel deployments
const vercelConfigTarget = path.join(buildDir, 'vercel.json');
const vercelConfigContent = JSON.stringify({
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}, null, 2);

fs.writeFileSync(vercelConfigTarget, vercelConfigContent);
console.log('✅ Created vercel.json file for Vercel deployments');

// Create a _headers file for Netlify
const headersTarget = path.join(buildDir, '_headers');
const headersContent = `/*
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/static/*
  Cache-Control: public, max-age=31536000, immutable

/*.js
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Cache-Control: public, max-age=31536000, immutable

/index.html
  Cache-Control: no-cache, no-store, must-revalidate`;

fs.writeFileSync(headersTarget, headersContent);
console.log('✅ Created _headers file for Netlify');

console.log('🎉 Post-build optimizations completed successfully!');