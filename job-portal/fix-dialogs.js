const fs = require('fs');
const path = require('path');

const srcDir = './src';

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath, fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function fixDialogTransitions() {
  const files = walkDir(srcDir);
  let fixedCount = 0;
  
  files.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Check if file contains Dialog components without TransitionComponent
    const dialogMatches = content.match(/<Dialog[^>]*>/g);
    
    if (dialogMatches) {
      let hasDialogImport = content.includes('import') && content.includes('Dialog');
      let hasSafeTransitionImport = content.includes('SafeSlideUp');
      let needsSafeTransition = false;
      
      dialogMatches.forEach(match => {
        if (!match.includes('TransitionComponent')) {
          // Add TransitionComponent={SafeSlideUp} to Dialog
          const newMatch = match.replace('>', ' TransitionComponent={SafeSlideUp}>');
          content = content.replace(match, newMatch);
          modified = true;
          needsSafeTransition = true;
        }
      });
      
      // Add import for SafeSlideUp if needed
      if (needsSafeTransition && !hasSafeTransitionImport && hasDialogImport) {
        // Find the last import statement
        const importLines = content.split('\n');
        let lastImportIndex = -1;
        
        for (let i = 0; i < importLines.length; i++) {
          if (importLines[i].trim().startsWith('import')) {
            lastImportIndex = i;
          }
        }
        
        if (lastImportIndex >= 0) {
          const relativePath = filePath.split('src')[1].split('/').length - 1;
          const importPath = '../'.repeat(Math.max(1, relativePath)) + 'utils/transitionFix';
          importLines.splice(lastImportIndex + 1, 0, `import { SafeSlideUp } from '${importPath}';`);
          content = importLines.join('\n');
          modified = true;
        }
      }
      
      if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed: ${filePath}`);
        fixedCount++;
      }
    }
  });
  
  console.log(`\nFixed ${fixedCount} files with Dialog transition issues.`);
}

fixDialogTransitions();