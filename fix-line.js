const fs = require('fs');

const filePath = 'c:/Users/Lenovo/excellencecoachinghub-main/job-portal/src/pages/AllJobsPage.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Split into lines
const lines = content.split('\n');

// Fix line 1306 (index 1305)
lines[1305] = lines[1305].replace(/boxShadow: `0 6px 16px \$\{alpha\(theme\.palette\.primary\.main, 0\.4\)\}`/, "boxShadow: '0 6px 16px ' + alpha(theme.palette.primary.main, 0.4)");

// Join lines back
content = lines.join('\n');

fs.writeFileSync(filePath, content);
console.log('Fixed line 1306 template literal');
console.log('New line content:', lines[1305].trim());