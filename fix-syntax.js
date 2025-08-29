const fs = require('fs');

const filePath = 'c:/Users/Lenovo/excellencecoachinghub-main/job-portal/src/pages/AllJobsPage.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix the template literal issue
content = content.replace(
  'boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`',
  'boxShadow: \'0 6px 16px \' + alpha(theme.palette.primary.main, 0.4)'
);

fs.writeFileSync(filePath, content);
console.log('Fixed syntax error in AllJobsPage.tsx');