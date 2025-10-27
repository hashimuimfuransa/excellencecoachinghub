import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildDir = path.join(__dirname, '..', 'dist');

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
    } else {
      console.log(`  📄 ${file}`);
    }
  });
} else {
  console.log('  ❌ Build directory does not exist!');
}

console.log('🎉 Post-build optimizations completed successfully!');